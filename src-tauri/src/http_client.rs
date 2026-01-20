use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::Duration;
use reqwest::cookie::Jar;
use std::time::{SystemTime, UNIX_EPOCH};

// Cookie 持久化结构
#[derive(Debug, Clone, Serialize, Deserialize)]
struct CookieStorage {
    cookies: Vec<CookieInfo>,
    version: u32,
}

impl Default for CookieStorage {
    fn default() -> Self {
        CookieStorage {
            cookies: Vec::new(),
            version: 1,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProxyConfig {
    pub enabled: bool,
    pub host: String,
    pub port: u16,
    pub protocol: String,
    pub username: Option<String>,
    pub password: Option<String>,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        ProxyConfig {
            enabled: false,
            host: String::new(),
            port: 8080,
            protocol: "http".to_string(),
            username: None,
            password: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientConfig {
    pub timeout: u64,
    pub verify_ssl: bool,
    pub follow_redirects: bool,
    pub user_agent: String,
    pub ca_cert_paths: Vec<String>,
    pub proxy: ProxyConfig,
}

impl Default for ClientConfig {
    fn default() -> Self {
        ClientConfig {
            timeout: 30000,
            verify_ssl: true,
            follow_redirects: true,
            user_agent: "Teapot/1.0".to_string(),
            ca_cert_paths: Vec::new(),
            proxy: ProxyConfig::default(),
        }
    }
}

impl ClientConfig {
    fn from_request(config: &HttpRequestConfig) -> Self {
        ClientConfig {
            timeout: config.timeout.unwrap_or(30000),
            verify_ssl: config.verify_ssl.unwrap_or(true),
            follow_redirects: config.follow_redirects.unwrap_or(true),
            user_agent: config.user_agent.clone().unwrap_or_else(|| "Teapot/1.0".to_string()),
            ca_cert_paths: config.ca_cert_paths.clone().unwrap_or_default(),
            proxy: config.proxy.clone().unwrap_or_default(),
        }
    }

    fn hash(&self) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        self.timeout.hash(&mut hasher);
        self.verify_ssl.hash(&mut hasher);
        self.follow_redirects.hash(&mut hasher);
        self.user_agent.hash(&mut hasher);
        self.ca_cert_paths.hash(&mut hasher);
        self.proxy.enabled.hash(&mut hasher);
        self.proxy.host.hash(&mut hasher);
        self.proxy.port.hash(&mut hasher);
        self.proxy.protocol.hash(&mut hasher);
        self.proxy.username.hash(&mut hasher);
        self.proxy.password.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }
}

type CachedClient = (String, Arc<reqwest::Client>);

static CLIENT_CACHE: OnceLock<Arc<Mutex<Option<CachedClient>>>> = OnceLock::new();
static COOKIE_JAR: OnceLock<Arc<Mutex<Option<Arc<Jar>>>>> = OnceLock::new();
static GLOBAL_CONFIG: OnceLock<Arc<Mutex<ClientConfig>>> = OnceLock::new();
static COOKIE_STORE_PATH: OnceLock<Option<String>> = OnceLock::new();

fn get_client_cache() -> &'static Arc<Mutex<Option<CachedClient>>> {
    CLIENT_CACHE.get_or_init(|| Arc::new(Mutex::new(None)))
}

fn get_cookie_jar() -> Arc<Jar> {
    let jar = COOKIE_JAR.get_or_init(|| Arc::new(Mutex::new(None)));
    let mut jar_guard = jar.lock().unwrap();
    if jar_guard.is_none() {
        *jar_guard = Some(Arc::new(Jar::default()));
    }
    jar_guard.as_ref().unwrap().clone()
}

fn get_global_config() -> Arc<Mutex<ClientConfig>> {
    GLOBAL_CONFIG.get_or_init(|| Arc::new(Mutex::new(ClientConfig::default()))).clone()
}

fn get_cookie_store_path() -> Option<String> {
    COOKIE_STORE_PATH.get().and_then(|p| p.clone())
}

fn init_cookie_store() {
    COOKIE_STORE_PATH.get_or_init(|| {
        // 遵循 XDG 基本目录规范
        // Linux: ~/.local/share/teapot/cookies.json
        // macOS: ~/Library/Application Support/teapot/cookies.json
        // Windows: %APPDATA%\teapot\cookies.json
        if let Some(data_dir) = dirs::data_local_dir() {
            Some(data_dir.join("teapot").join("cookies.json").to_string_lossy().to_string())
        } else if let Ok(home_dir) = std::env::var("HOME") {
            // Fallback: 使用主目录
            Some(format!("{}/.teapot/cookies.json", home_dir))
        } else {
            None
        }
    });

    // 如果路径存在，从文件加载 cookies
    if let Some(path) = get_cookie_store_path() {
        if std::path::Path::new(&path).exists() {
            if let Ok(cookie_data) = std::fs::read_to_string(&path) {
                log::info!("Loading cookies from: {}", path);

                if let Ok(cookie_storage) = serde_json::from_str::<CookieStorage>(&cookie_data) {
                    let storage = get_cookies_storage();
                    let mut storage_guard = storage.lock().unwrap();

                    // 清理过期 cookie
                    let now = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs() as i64;

                    let valid_cookies: Vec<CookieInfo> = cookie_storage.cookies
                        .into_iter()
                        .filter(|c| {
                            if let Some(expires_ts) = c.expires_timestamp {
                                expires_ts > now
                            } else {
                                true
                            }
                        })
                        .collect();

                    *storage_guard = valid_cookies;
                    log::info!("Loaded {} valid cookies from storage", storage_guard.len());
                } else {
                    log::warn!("Failed to parse cookie storage file");
                }
            } else {
                log::warn!("Failed to read cookie storage file");
            }
        } else {
            log::info!("Cookie storage file does not exist, starting with empty storage");
        }
    }
}

/// 异步保存 cookies 到文件（应该在后台线程中调用）
fn save_cookies_to_store() {
    if let Some(path) = get_cookie_store_path() {
        let storage = get_cookies_storage();
        let storage_guard = storage.lock().unwrap();

        // 清理过期 cookie
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        let valid_cookies: Vec<CookieInfo> = storage_guard
            .iter()
            .filter(|c| {
                if let Some(expires_ts) = c.expires_timestamp {
                    expires_ts > now
                } else {
                    true
                }
            })
            .cloned()
            .collect();

        let cookie_storage = CookieStorage {
            cookies: valid_cookies,
            version: 1,
        };

        drop(storage_guard);

        // 确保目录存在
        if let Some(parent) = std::path::Path::new(&path).parent() {
            if let Err(e) = std::fs::create_dir_all(parent) {
                log::error!("Failed to create cookie storage directory: {}", e);
                return;
            }
        }

        // 序列化并保存
        if let Ok(json) = serde_json::to_string_pretty(&cookie_storage) {
            if let Err(e) = std::fs::write(&path, json) {
                log::error!("Failed to save cookies to {}: {}", path, e);
            } else {
                log::debug!("Cookies saved to: {} ({} cookies)", path, cookie_storage.cookies.len());
            }
        } else {
            log::error!("Failed to serialize cookie storage");
        }
    }
}

/// 触发 cookie 保存（设置脏标志）
fn mark_cookies_dirty() {
    let dirty = get_cookie_dirty_flag();
    if let Ok(mut dirty_flag) = dirty.lock() {
        *dirty_flag = true;
    }
}

/// 异步后台任务：定期保存 cookies
pub fn start_cookie_save_task() {
    std::thread::spawn(|| {
        let mut last_count: usize = 0;
        loop {
            std::thread::sleep(Duration::from_secs(30)); // 每 30 秒检查一次

            let dirty = get_cookie_dirty_flag();
            let should_save = if let Ok(mut dirty_flag) = dirty.lock() {
                let is_dirty = *dirty_flag;
                if is_dirty {
                    *dirty_flag = false;
                }
                is_dirty
            } else {
                false
            };

            // 检查 cookie 数量是否变化
            let storage = get_cookies_storage();
            let current_count = if let Ok(storage_guard) = storage.lock() {
                storage_guard.len()
            } else {
                0
            };

            if should_save || current_count != last_count {
                save_cookies_to_store();
                last_count = current_count;
            }
        }
    });
}

// 初始化 cookie store
#[tauri::command]
pub fn init_cookie_storage() -> Result<(), String> {
    init_cookie_store();
    start_cookie_save_task();
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpRequestConfig {
    pub url: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub body: Option<Vec<u8>>,
    pub timeout: Option<u64>,
    pub verify_ssl: Option<bool>,
    pub follow_redirects: Option<bool>,
    pub user_agent: Option<String>,
    pub ca_cert_paths: Option<Vec<String>>,
    pub use_global_config: Option<bool>,
    pub proxy: Option<ProxyConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpResponse {
    pub status: u16,
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
    pub size: usize,
    pub duration: u64,
}

#[tauri::command]
pub async fn send_request(config: HttpRequestConfig) -> Result<HttpResponse, String> {
    use reqwest::Certificate;
    use reqwest::Client;
    use reqwest::header::{HeaderMap, HeaderName, HeaderValue};

    // 根据配置决定使用全局配置还是请求中的配置
    let client_config = if !config.use_global_config.unwrap_or(true) {
        // use_global_config 为 false 时使用请求中的配置
        ClientConfig::from_request(&config)
    } else {
        // 默认使用全局配置
        let global_config = get_global_config();
        let config_guard = global_config.lock().unwrap();
        config_guard.clone()
    };

    let config_hash = client_config.hash();

    // 尝试从缓存获取 client
    let client = {
        let mut cache = get_client_cache().lock().map_err(|e| format!("Failed to acquire lock: {}", e))?;
        match &*cache {
            Some((cached_hash, cached_client)) if cached_hash == &config_hash => {
                // 配置未变化，使用缓存的 client
                cached_client.clone()
            }
            _ => {
                // 配置变化或无缓存，重建 client
                let timeout = Duration::from_millis(client_config.timeout);

                let mut client_builder = Client::builder().timeout(timeout);

                // Configure redirect policy
                if client_config.follow_redirects {
                    client_builder = client_builder.redirect(reqwest::redirect::Policy::limited(10));
                } else {
                    client_builder = client_builder.redirect(reqwest::redirect::Policy::none());
                }

                // Configure SSL verification
                if !client_config.verify_ssl {
                    client_builder = client_builder.danger_accept_invalid_certs(true);
                }

                // Set cookie jar - 所有请求共享 cookie
                client_builder = client_builder.cookie_provider(get_cookie_jar());

                // Support custom CA certificates loading
                if !client_config.ca_cert_paths.is_empty() {
                    let mut certificates = Vec::new();
                    for ca_cert_path in &client_config.ca_cert_paths {
                        let ca_cert_pem = std::fs::read_to_string(ca_cert_path)
                            .map_err(|e| format!("Failed to read CA certificate from {}: {}", ca_cert_path, e))?;
                        let ca_cert = Certificate::from_pem(ca_cert_pem.as_bytes())
                            .map_err(|e| format!("Failed to parse CA certificate from {}: {}", ca_cert_path, e))?;
                        certificates.push(ca_cert);
                    }
                    client_builder = client_builder.tls_certs_merge(certificates);
                }

                // Configure proxy
                if client_config.proxy.enabled {
                    use reqwest::Proxy;
                    let proxy_url = match client_config.proxy.protocol.as_str() {
                        "https" => format!("https://{}:{}", client_config.proxy.host, client_config.proxy.port),
                        "socks5" => format!("socks5://{}:{}", client_config.proxy.host, client_config.proxy.port),
                        _ => format!("http://{}:{}", client_config.proxy.host, client_config.proxy.port),
                    };

                    let mut proxy = Proxy::all(&proxy_url)
                        .map_err(|e| format!("Failed to create proxy: {}", e))?;

                    // Add proxy authentication if provided
                    if let (Some(username), Some(password)) = (&client_config.proxy.username, &client_config.proxy.password) {
                        proxy = proxy.basic_auth(username, password);
                    }

                    client_builder = client_builder.proxy(proxy);
                }

                let new_client = client_builder
                    .build()
                    .map_err(|e| format!("Failed to build client: {}", e))?;

                let arc_client = Arc::new(new_client);
                *cache = Some((config_hash.clone(), arc_client.clone()));
                arc_client
            }
        }
    };

    // Build request
    let mut request = match config.method.to_uppercase().as_str() {
        "GET" => client.get(&config.url),
        "POST" => client.post(&config.url),
        "PUT" => client.put(&config.url),
        "DELETE" => client.delete(&config.url),
        "PATCH" => client.patch(&config.url),
        "HEAD" => client.head(&config.url),
        _ => {
            let method = reqwest::Method::from_bytes(config.method.as_bytes())
                .map_err(|e| format!("Invalid HTTP method: {}", e))?;
            client.request(method, &config.url)
        }
    };

    // Add headers (always present, empty map if no headers)
    let mut header_map = HeaderMap::new();
    for (key, value) in &config.headers {
        if let Ok(header_name) = HeaderName::from_bytes(key.as_bytes())
            && let Ok(header_value) = HeaderValue::from_str(value)
        {
            header_map.insert(header_name, header_value);
        }
    }

    // Add User-Agent - always set a value (cannot be empty)
    let user_agent = config.user_agent.as_deref().unwrap_or("Teapot/1.0");
    if let Ok(ua_header) = HeaderName::from_bytes(b"user-agent")
        && let Ok(ua_value) = HeaderValue::from_str(user_agent)
    {
        header_map.insert(ua_header, ua_value);
    }

    if !header_map.is_empty() {
        request = request.headers(header_map);
    }

    // Add body
    if let Some(body) = &config.body {
        request = request.body(body.clone());
    }

    // Execute request with timing
    let start = std::time::Instant::now();

    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status();
    let status_code = status.as_u16();
    let status_text = status.canonical_reason().unwrap_or("Unknown").to_string();

    // Collect headers and cookies
    let mut response_headers: HashMap<String, String> = HashMap::new();
    for (key, value) in response.headers() {
        if let Ok(value_str) = value.to_str() {
            let key_str = key.as_str().to_string();

            // 处理 Set-Cookie header
            if key_str.eq_ignore_ascii_case("set-cookie") {
                // 解析并保存 cookie
                if let Some(cookie) = parse_cookie_header(value_str) {
                    let storage = get_cookies_storage();
                    let mut storage_guard = storage.lock().unwrap();

                    // 移除同名且同域名的旧 cookie
                    storage_guard.retain(|c| {
                        !(c.name == cookie.name && c.domain == cookie.domain)
                    });

                    storage_guard.push(cookie.clone());
                    drop(storage_guard);

                    // 标记 cookie 需要保存
                    mark_cookies_dirty();
                    log::debug!("Received cookie: {} from {}", cookie.name, cookie.domain);
                }
            }

            response_headers.insert(key_str, value_str.to_string());
        }
    }

    // Get body as bytes
    let body_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read body: {}", e))?;

    let body_vec: Vec<u8> = body_bytes.to_vec();
    let size = body_vec.len();
    let duration = start.elapsed().as_millis() as u64;

    Ok(HttpResponse {
        status: status_code,
        status_text,
        headers: response_headers,
        body: body_vec,
        size,
        duration,
    })
}

#[tauri::command]
pub fn clear_cookies() -> Result<(), String> {
    // 清空全局 Cookie Jar
    let jar = COOKIE_JAR.get().ok_or("Cookie jar not initialized")?;
    let mut jar_guard = jar.lock().map_err(|e| format!("Failed to acquire lock: {}", e))?;
    *jar_guard = Some(Arc::new(Jar::default()));

    // 清空 cookies 存储
    let storage = get_cookies_storage();
    let mut storage_guard = storage.lock().map_err(|e| format!("Failed to acquire lock: {}", e))?;
    storage_guard.clear();
    drop(storage_guard);

    // 标记需要保存
    mark_cookies_dirty();

    // 清空持久化文件
    if let Some(path) = get_cookie_store_path() {
        let _ = std::fs::remove_file(&path);
    }

    log::info!("All cookies cleared");
    Ok(())
}

#[tauri::command]
pub fn delete_cookie(domain: String, name: String) -> Result<(), String> {
    let storage = get_cookies_storage();
    let mut storage_guard = storage.lock().map_err(|e| format!("Failed to acquire lock: {}", e))?;

    let initial_count = storage_guard.len();
    storage_guard.retain(|c| !(c.domain == domain && c.name == name));

    if storage_guard.len() != initial_count {
        mark_cookies_dirty();
        log::info!("Deleted cookie: {} from {}", name, domain);
    }

    Ok(())
}

// 解析 Set-Cookie header
fn parse_cookie_header(header_value: &str) -> Option<CookieInfo> {
    let parts: Vec<&str> = header_value.split(';').collect();

    let first_part = parts.get(0)?;
    let mut name_value = first_part.split('=');
    let name = name_value.next()?.trim().to_string();
    let value = name_value.next().map(|s| s.trim().to_string()).unwrap_or_default();

    let mut cookie = CookieInfo {
        domain: String::new(),
        name,
        value,
        path: None,
        expires: None,
        secure: None,
        http_only: None,
        expires_timestamp: None,
    };

    for part in parts.iter().skip(1) {
        let original_part = part.trim();
        let lower_part = original_part.to_lowercase();

        if lower_part.starts_with("domain=") {
            cookie.domain = original_part[7..].trim().to_string();
        } else if lower_part.starts_with("path=") {
            cookie.path = Some(original_part[5..].trim().to_string());
        } else if lower_part.starts_with("expires=") {
            let expires_str = original_part[8..].trim().to_string();
            cookie.expires = Some(expires_str.clone());

            // 尝试解析过期时间为时间戳
            if let Ok(dt) = chrono::DateTime::parse_from_rfc2822(&expires_str) {
                cookie.expires_timestamp = Some(dt.timestamp());
            } else if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(&expires_str) {
                cookie.expires_timestamp = Some(dt.timestamp());
            }
        } else if lower_part == "secure" {
            cookie.secure = Some(true);
        } else if lower_part == "httponly" {
            cookie.http_only = Some(true);
        } else if lower_part.starts_with("max-age=") {
            let max_age_str = original_part[8..].trim();
            if let Ok(seconds) = max_age_str.parse::<i64>() {
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs() as i64;
                cookie.expires_timestamp = Some(now + seconds);
            }
        }
    }

    Some(cookie)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CookieInfo {
    pub domain: String,
    pub name: String,
    pub value: String,
    pub path: Option<String>,
    pub expires: Option<String>,
    pub secure: Option<bool>,
    pub http_only: Option<bool>,
    #[serde(skip)]
    pub expires_timestamp: Option<i64>,
}

impl CookieInfo {
    /// 检查 cookie 是否已过期
    pub fn is_expired(&self) -> bool {
        if let Some(expires_ts) = self.expires_timestamp {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64;
            expires_ts < now
        } else {
            false
        }
    }
}

// 存储 cookies 以便导出和管理
static COOKIES_STORAGE: OnceLock<Arc<Mutex<Vec<CookieInfo>>>> = OnceLock::new();
// Cookie 自动保存标志
static COOKIE_DIRTY: OnceLock<Arc<Mutex<bool>>> = OnceLock::new();

fn get_cookies_storage() -> Arc<Mutex<Vec<CookieInfo>>> {
    COOKIES_STORAGE.get_or_init(|| Arc::new(Mutex::new(Vec::new()))).clone()
}

fn get_cookie_dirty_flag() -> Arc<Mutex<bool>> {
    COOKIE_DIRTY.get_or_init(|| Arc::new(Mutex::new(false))).clone()
}

#[tauri::command]
pub fn get_all_cookies() -> Result<Vec<CookieInfo>, String> {
    let storage = get_cookies_storage();
    let storage_guard = storage.lock().map_err(|e| format!("Failed to acquire lock: {}", e))?;
    Ok(storage_guard.clone())
}

#[tauri::command]
pub fn save_cookies_now() -> Result<(), String> {
    save_cookies_to_store();

    let dirty = get_cookie_dirty_flag();
    let _ = dirty.lock().map(|mut flag| *flag = false);

    Ok(())
}

#[tauri::command]
pub fn update_config(config: ClientConfig) -> Result<(), String> {
    // 更新全局配置，并清空 client 缓存以便下次重建
    let global_config = get_global_config();
    let mut config_guard = global_config.lock().map_err(|e| format!("Failed to acquire lock: {}", e))?;
    *config_guard = config;

    // 清空 client 缓存，强制下次请求时使用新配置重建
    let cache = get_client_cache();
    let mut cache_guard = cache.lock().map_err(|e| format!("Failed to acquire lock: {}", e))?;
    *cache_guard = None;

    Ok(())
}

#[tauri::command]
pub fn get_config() -> Result<ClientConfig, String> {
    let global_config = get_global_config();
    let config_guard = global_config.lock().map_err(|e| format!("Failed to acquire lock: {}", e))?;
    Ok(config_guard.clone())
}
