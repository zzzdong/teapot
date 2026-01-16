use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;

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
    pub ca_cert_path: Option<String>,
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

    let timeout = Duration::from_millis(config.timeout.unwrap_or(30000));
    let verify_ssl = config.verify_ssl.unwrap_or(true);
    let follow_redirects = config.follow_redirects.unwrap_or(true);

    // Determine effective SSL verification
    let _ca_cert_path = &config.ca_cert_path;
    let effective_verify_ssl = verify_ssl;

    // Build HTTP client
    let mut client_builder = Client::builder().timeout(timeout);

    // Configure redirect policy
    if follow_redirects {
        client_builder = client_builder.redirect(reqwest::redirect::Policy::limited(10));
    } else {
        client_builder = client_builder.redirect(reqwest::redirect::Policy::none());
    }

    // Configure SSL verification
    if !effective_verify_ssl {
        client_builder = client_builder.danger_accept_invalid_certs(true);
    }

    // Support custom CA certificate loading
    if let Some(ca_cert_path) = &config.ca_cert_path {
        let ca_cert_pem = std::fs::read_to_string(ca_cert_path)
            .map_err(|e| format!("Failed to read CA certificate: {}", e))?;
        let ca_cert = Certificate::from_pem(ca_cert_pem.as_bytes())
            .map_err(|e| format!("Failed to parse CA certificate: {}", e))?;
        client_builder = client_builder.add_root_certificate(ca_cert);
    }

    let client = client_builder
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;

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

    // Collect headers
    let mut response_headers: HashMap<String, String> = HashMap::new();
    for (key, value) in response.headers() {
        if let Ok(value_str) = value.to_str() {
            response_headers.insert(key.as_str().to_string(), value_str.to_string());
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
