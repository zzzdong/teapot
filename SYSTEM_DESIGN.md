# Teapot - System Design Document

## Overview

Teapot is a Postman clone built with Tauri 2.x and Vue 3, designed for API testing and debugging. This document provides a comprehensive system design and implementation status.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Tauri Desktop App                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Vue 3)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  UI Layer (Naive UI Components)                     │   │
│  │  ├─ Request Builder                                 │   │
│  │  ├─ Response Viewer                                │   │
│  │  ├─ Workspace & Layout                             │   │
│  │  └─ Sidebar Panels                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Business Logic (Composables & Stores)              │   │
│  │  ├─ useHttpClient (Request Execution)                │   │
│  │  ├─ scriptExecutor (Script Engine)                   │   │
│  │  ├─ Pinia Stores (State Management)                 │   │
│  │  └─ Tauri API (Native Integration)                  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Backend (Tauri/Rust)                                       │
│  ├─ HTTP Plugin (@tauri-apps/plugin-http)                 │
│  ├─ Store Plugin (@tauri-apps/plugin-store)               │
│  └─ System APIs (File system, OS integration)             │
└─────────────────────────────────────────────────────────────┘
```

## Module Details

### 1. Request Builder Module ✅

**Purpose:** Configure and send HTTP requests.

**Components:**
| Component | File | Description |
|-----------|------|-------------|
| RequestBuilder | `request/RequestBuilder.vue` | Main request configuration interface |
| ParamsTab | `request/ParamsTab.vue` | URL query parameters editor |
| HeadersTab | `request/HeadersTab.vue` | HTTP headers editor |
| BodyTab | `request/BodyTab.vue` | Request body type selector |
| FormDataEditor | `request/FormDataEditor.vue` | Multipart form data editor |
| UrlEncodedEditor | `request/UrlEncodedEditor.vue` | URL-encoded form data editor |
| RawEditor | `request/RawEditor.vue` | Raw body editor (JSON, XML, etc.) |
| BinaryEditor | `request/BinaryEditor.vue` | Binary file upload |
| GraphQLEditor | `request/GraphQLEditor.vue` | GraphQL query/mutation editor |
| AuthTab | `request/AuthTab.vue` | Authentication configuration |
| PreRequestScriptTab | `request/PreRequestScriptTab.vue` | Pre-request script editor |
| TestsTab | `request/TestsTab.vue` | Test script editor |
| SaveRequestDialog | `request/SaveRequestDialog.vue` | Save request dialog |

**Features:**
- Support all HTTP methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- Dynamic body type switching
- Monaco Editor for code editing
- Parameter/header management with enable/disable
- File upload for form-data and binary
- GraphQL query + variables

**Data Types:**
```typescript
interface Request {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: RequestParam[];
  headers: RequestHeader[];
  body: RequestBody;
  auth: AuthConfig;
  preRequestScript: PreRequestScript;
  testScript: TestScript;
  createdAt: number;
  updatedAt: number;
}
```

### 2. Response Viewer Module ✅

**Purpose:** Display and analyze HTTP responses.

**Components:**
| Component | File | Description |
|-----------|------|-------------|
| ResponseViewer | `response/ResponseViewer.vue` | Main response container |
| ResponseBody | `response/ResponseBody.vue` | Response body viewer |
| ResponseHeaders | `response/ResponseHeaders.vue` | Response headers display |
| ResponseCookies | `response/ResponseCookies.vue` | Cookies display |
| ResponseTests | `response/ResponseTests.vue` | Test results display |

**Features:**
- Pretty print for JSON/XML
- Raw text view
- Preview mode (HTML rendering)
- Syntax highlighting (JavaScript, TypeScript, JSON, XML, CSS, Bash, Python)
- Status code color-coding
- Response time and size display
- Download response
- Copy to clipboard

**Data Types:**
```typescript
interface Response {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  duration: number;
  cookies?: Cookie[];
}
```

### 3. Workspace Management Module ✅

**Purpose:** Manage tabs and application layout.

**Components:**
| Component | File | Description |
|-----------|------|-------------|
| MainWorkspace | `layout/MainWorkspace.vue` | Main workspace with tabs |
| LeftSidebar | `layout/LeftSidebar.vue` | Left sidebar (Collections, History) |
| RightSidebar | `layout/RightSidebar.vue` | Right sidebar (Environment, Console) |
| AppHeader | `layout/AppHeader.vue` | Application header |
| StatusBar | `layout/StatusBar.vue` | Status bar |

**Store:**
| File | Description |
|------|-------------|
| `stores/workspace.ts` | Workspace tabs and active tab state |

**Features:**
- Multi-tab support
- Tab activation/deactivation
- Tab close (single, all, others)
- Modified state tracking
- Resizable sidebars (200px-500px)
- Workspace persistence

**Data Types:**
```typescript
interface WorkspaceTab {
  id: string;
  request: Request;
  isActive: boolean;
  isModified: boolean;
  name: string;
  createdAt: number;
}
```

### 4. Collections Management Module ✅

**Purpose:** Organize and save requests.

**Components:**
| Component | File | Description |
|-----------|------|-------------|
| CollectionsPanel | `layout/CollectionsPanel.vue` | Collections tree view |
| CollectionTreeItem | `layout/CollectionTreeItem.vue` | Recursive tree item |
| SaveRequestDialog | `request/SaveRequestDialog.vue` | Save dialog |

**Store:**
| File | Description |
|------|-------------|
| `stores/collections.ts` | Collections and requests state |

**Features:**
- Create/edit/delete collections
- Nested folder structure
- Save requests to collections/folders
- Drag & drop reordering (planned)
- Import/Export (planned)

**Data Types:**
```typescript
interface Collection {
  id: string;
  name: string;
  description?: string;
  folders: Folder[];
  requests: CollectionRequest[];
  createdAt: number;
  updatedAt: number;
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  children: Folder[];
  requests: CollectionRequest[];
}

interface CollectionRequest {
  id: string;
  request: Request;
  createdAt: number;
  updatedAt: number;
}
```

### 5. History Management Module ✅

**Purpose:** Track and manage request history.

**Components:**
| Component | File | Description |
|-----------|------|-------------|
| HistoryPanel | `layout/HistoryPanel.vue` | History list |

**Store:**
| File | Description |
|------|-------------|
| `stores/history.ts` | Request history state |

**Features:**
- Automatic request logging
- Search by URL, method, name
- Favorite requests (star)
- Load historical requests
- Max 100 items (non-favorited)
- Favorited items preserved
- Relative time display
- Execution count tracking

**Data Types:**
```typescript
interface HistoryItem {
  id: string;
  name: string;
  request: Request;
  response?: Response;
  timestamp: number;
  favorited: boolean;
  executionCount: number;
  lastExecutionAt?: number;
}
```

### 6. Environment Variables Module ✅

**Purpose:** Manage variables across different scopes.

**Components:**
| Component | File | Description |
|-----------|------|-------------|
| EnvironmentPanel | `layout/EnvironmentPanel.vue` | Variable editor |

**Store:**
| File | Description |
|------|-------------|
| `stores/environment.ts` | Variables state |

**Features:**
- Three scopes: Global, Environment, Local
- Variable enable/disable
- Variable resolution in requests ({{variableName}})
- Dynamic variables (timestamp, randomInt, guid, etc.)
- Import/Export variables

**Data Types:**
```typescript
interface Environment {
  id: string;
  name: string;
  variables: Variable[];
  createdAt: number;
  updatedAt: number;
}

interface Variable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}
```

**Dynamic Variables:**
- `{{$timestamp}}` - Current timestamp
- `{{$randomInt}}` - Random integer
- `{{$guid}}` - Random GUID
- `{{$randomString}}` - Random string

### 7. Console Module ✅

**Purpose:** Display real-time logs during request execution.

**Components:**
| Component | File | Description |
|-----------|------|-------------|
| ConsolePanel | `layout/ConsolePanel.vue` | Console logs |

**Store:**
| File | Description |
|------|-------------|
| `stores/console.ts` | Console logs state |

**Features:**
- Real-time log display
- Multiple log levels: log, info, warn, error
- Auto-scroll to latest
- Max 100 logs
- Clear console
- Color-coded log levels

**Data Types:**
```typescript
interface LogEntry {
  id: string;
  timestamp: number;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}
```

### 8. HTTP Client Module ✅

**Purpose:** Execute HTTP requests with full feature support.

**Composable:**
| File | Description |
|------|-------------|
| `composables/useHttpClient.ts` | HTTP request execution |

**Features:**
- Tauri HTTP plugin integration
- Variable resolution in URLs, headers, body, auth
- Pre-request script execution
- Test script execution
- Multiple authentication types
- Error handling
- Request timeout

**Authentication Types:**
- No Auth
- Bearer Token
- Basic Auth
- API Key
- Digest Auth (planned)
- OAuth 1.0/2.0 (planned)
- AWS Signature (planned)

**Flow:**
```
sendRequest()
  ↓
Validate Input
  ↓
Execute Pre-request Script
  ↓
Resolve Variables (Global → Environment → Local)
  ↓
Build Request (URL, Headers, Body, Auth)
  ↓
Send via Tauri HTTP Plugin
  ↓
Execute Test Script
  ↓
Return Response + Test Results
```

### 9. Script Execution Module ✅

**Purpose:** Execute user scripts with Postman-compatible API.

**Utility:**
| File | Description |
|------|-------------|
| `utils/scriptExecutor.ts` | Script execution engine |

**Features:**
- Postman-compatible API
- Pre-request scripts
- Test scripts
- Variable modification
- Request modification
- Syntax validation
- Error handling

**Postman API:**
```javascript
// Test assertions
pm.test("Status code is 200", function() {
  pm.response.to.have.status(200);
});

// Expect assertions
pm.expect(pm.response.json().name).to.eql("John");

// Variable setting
pm.environment.set("token", "abc123");
pm.globals.set("apiKey", "xyz789");

// Request modification
pm.request.url = "https://api.example.com/v2";
```

**Context Objects:**
```typescript
interface ScriptContext {
  environment: Record<string, any>;
  globals: Record<string, any>;
  request?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
}
```

### 10. Persistence Module ✅

**Purpose:** Persist application data.

**API:**
| File | Description |
|------|-------------|
| `api/tauri-api.ts` | Tauri API wrapper |

**Features:**
- Tauri Store v2 integration
- localStorage fallback for web
- Automatic persistence
- Store operations: get, set, delete

**Stored Data:**
- Workspace tabs
- Active tab ID
- Collections
- Requests
- Environments
- Variables
- History
- Settings

**Persistence Flow:**
```
User Action → Update Store → tauri-api.store.set() → Tauri Store → Disk
```

### 11. Tauri Backend ✅

**Purpose:** Desktop application wrapper with native capabilities.

**Files:**
| File | Description |
|------|-------------|
| `src-tauri/src/main.rs` | Tauri entry point |
| `src-tauri/src/lib.rs` | Library exports |

**Plugins:**
- `@tauri-apps/plugin-http` - HTTP requests
- `@tauri-apps/plugin-store` - Data persistence

**Features:**
- Desktop application wrapper
- Native system integration
- File system access
- Cross-platform (Windows, macOS, Linux)
- Minimal Rust backend (no business logic)

## Data Flow Diagrams

### Request Flow

```
┌──────────────┐
│   User       │
│   Input      │
└──────┬───────┘
       │
       ↓
┌──────────────────┐
│ RequestBuilder   │
│ (Config)         │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ useHttpClient   │
│ (Resolve Vars)   │
└──────┬───────────┘
       │
       ├─→ ┌─────────────────┐
       │   │ Pre-request     │
       │   │ Script          │
       │   └────────┬────────┘
       │            │
       └────────────┘
                    │
                    ↓
         ┌──────────────────┐
         │ Build Request    │
         │ (Headers, Body)  │
         └──────┬───────────┘
                │
                ↓
      ┌──────────────────┐
      │ tauri-api       │
      │ (HTTP Plugin)   │
      └──────┬───────────┘
             │
             ↓
      ┌──────────────────┐
      │ Tauri HTTP       │
      │ (Native)         │
      └──────┬───────────┘
             │
             ↓
      ┌──────────────────┐
      │ Response         │
      └──────┬───────────┘
             │
             ├─→ ┌─────────────────┐
             │   │ Test Script     │
             │   └────────┬────────┘
             │            │
             └────────────┘
                          │
                          ↓
                   ┌──────────────┐
                   │ ResponseViewer│
                   └──────┬───────┘
                          │
                          ├─→ Response Store
                          ├─→ History Store
                          └─→ Test Results
```

### Variable Resolution Flow

```
Request Reference ({{variable}})
       │
       ↓
┌──────────────────┐
│ Local Scope      │ (highest priority)
│ (Modified by     │
│  pre-request)    │
└──────┬───────────┘
       │ Not Found?
       ↓
┌──────────────────┐
│ Environment      │
│ Scope            │
└──────┬───────────┘
       │ Not Found?
       ↓
┌──────────────────┐
│ Global Scope     │ (lowest priority)
└──────┬───────────┘
       │ Not Found?
       ↓
┌──────────────────┐
│ Dynamic Variable │
│ (timestamp, etc) │
└──────────────────┘
```

### State Management Flow

```
User Action
    │
    ↓
Component Event
    │
    ↓
Store Action
    │
    ├─→ Update State (reactive)
    │
    ├─→ Persist (tauri-api.store.set)
    │
    └─→ Component Re-render
```

## Technology Stack

### Frontend
- **Framework:** Vue 3.3+ with Composition API
- **Language:** TypeScript 5.1+
- **State Management:** Pinia 2.1+
- **UI Library:** Naive UI 2.34+
- **Code Editor:** Monaco Editor 0.55+
- **Syntax Highlighting:** highlight.js 11.11+
- **Date/Time:** dayjs 1.11+
- **Cryptography:** crypto-js 4.1+
- **UUID:** uuid 9.0+
- **HTTP:** @tauri-apps/plugin-http 2.5+
- **Storage:** @tauri-apps/plugin-store 2.4+
- **Icons:** @vicons/ionicons5 0.13+
- **Utils:** @vueuse/core 10.0+

### Backend
- **Runtime:** Tauri 2.9+
- **Language:** Rust (minimal)
- **HTTP Plugin:** @tauri-apps/plugin-http
- **Store Plugin:** @tauri-apps/plugin-store

### Build Tools
- **Bundler:** Vite with rolldown-vite 7.0+
- **Type Checking:** vue-tsc 3.2+
- **Tauri CLI:** @tauri-apps/cli 2.9+

## Project Structure

```
teapot/
├── src/
│   ├── api/
│   │   └── tauri-api.ts          # Tauri API wrapper
│   ├── assets/                   # Static assets
│   ├── components/
│   │   ├── common/               # Common components
│   │   │   ├── MonacoEditor.vue
│   │   │   └── SimpleTable.vue
│   │   ├── layout/               # Layout components
│   │   │   ├── AppHeader.vue
│   │   │   ├── CollectionsPanel.vue
│   │   │   ├── CollectionTreeItem.vue
│   │   │   ├── ConsolePanel.vue
│   │   │   ├── DocumentationPanel.vue
│   │   │   ├── EnvironmentPanel.vue
│   │   │   ├── HistoryPanel.vue
│   │   │   ├── LeftSidebar.vue
│   │   │   ├── MainWorkspace.vue
│   │   │   ├── RightSidebar.vue
│   │   │   ├── StatusBar.vue
│   │   │   └── TestsPanel.vue (hidden)
│   │   ├── request/              # Request builder components
│   │   │   ├── AuthTab.vue
│   │   │   ├── BinaryEditor.vue
│   │   │   ├── BodyTab.vue
│   │   │   ├── FormDataEditor.vue
│   │   │   ├── GraphQLEditor.vue
│   │   │   ├── HeadersTab.vue
│   │   │   ├── ParamsTab.vue
│   │   │   ├── PreRequestScriptTab.vue
│   │   │   ├── RawEditor.vue
│   │   │   ├── RequestBuilder.vue
│   │   │   ├── SaveRequestDialog.vue
│   │   │   ├── ScriptLogPanel.vue
│   │   │   ├── TestsTab.vue
│   │   │   └── UrlEncodedEditor.vue
│   │   ├── response/             # Response viewer components
│   │   │   ├── ResponseBody.vue
│   │   │   ├── ResponseCookies.vue
│   │   │   ├── ResponseHeaders.vue
│   │   │   ├── ResponseTests.vue
│   │   │   └── ResponseViewer.vue
│   │   └── settings/             # Settings components
│   │       ├── HttpClientSettingsTab.vue
│   │       └── SettingsDialog.vue
│   ├── composables/              # Composable functions
│   │   ├── index.ts
│   │   ├── useHttpClient.ts
│   │   └── useWorkspace.ts
│   ├── stores/                   # Pinia stores
│   │   ├── collections.ts
│   │   ├── console.ts
│   │   ├── environment.ts
│   │   ├── history.ts
│   │   ├── request.ts
│   │   ├── response.ts
│   │   ├── settings.ts
│   │   └── workspace.ts
│   ├── styles/                   # Global styles
│   │   └── main.css
│   ├── types/                    # TypeScript types
│   │   ├── auth.ts
│   │   ├── collection.ts
│   │   ├── environment.ts
│   │   ├── history.ts
│   │   ├── index.ts
│   │   ├── request.ts
│   │   ├── response.ts
│   │   ├── script.ts
│   │   ├── settings.ts
│   │   ├── test.ts
│   │   ├── websocket.ts
│   │   └── workspace.ts
│   ├── utils/                    # Utilities
│   │   └── scriptExecutor.ts
│   ├── App.vue                   # Root component
│   └── main.ts                   # Application entry
├── src-tauri/                    # Tauri backend
│   ├── capabilities/              # Tauri permissions
│   ├── icons/                    # Application icons
│   ├── src/
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── dist/                         # Build output
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

## Implementation Status

### Completed Features ✅

| Module | Status | Notes |
|--------|--------|-------|
| Request Builder | ✅ Complete | All HTTP methods, body types, auth |
| Response Viewer | ✅ Complete | All view modes, syntax highlighting |
| Workspace | ✅ Complete | Multi-tab, resizable sidebars |
| Collections | ✅ Complete | CRUD operations, folders |
| History | ✅ Complete | Auto-logging, search, favorites |
| Environment | ✅ Complete | Global/Environment/Local scopes |
| Console | ✅ Complete | Real-time logs, auto-scroll |
| HTTP Client | ✅ Complete | Full auth support, scripts |
| Script Engine | ✅ Complete | Postman-compatible API |
| Persistence | ✅ Complete | Tauri Store, fallback |
| Monaco Editor | ✅ Complete | Integrated for scripts |
| Syntax Highlighting | ✅ Complete | Multiple languages |

### Planned Features 🚧

| Feature | Priority | Notes |
|---------|----------|-------|
| WebSocket Support | Medium | Real-time communication |
| GraphQL Schema | Medium | Introspection support |
| Import/Export | High | Postman, OpenAPI, cURL |
| Code Generator | Medium | Multiple languages |
| Batch Execution | Low | Run multiple requests |
| Test Reports | Medium | Test monitoring |
| Multiple Workspaces | Low | Workspace switching |
| Dark Mode | Low | Theme support |
| Keyboard Shortcuts | Medium | Productivity |
| Proxy Config | Medium | Debugging |
| Mock Servers | Low | API mocking |
| Documentation Panel | Low | API docs |

## Performance Considerations

### Optimizations Implemented
- Virtual scrolling for large lists (planned)
- Debounced search (planned)
- Lazy loading of components
- Efficient reactivity with Pinia
- Minimized re-renders

### Performance Targets
- < 100ms response time display
- < 500ms startup time
- < 200MB memory usage
- < 50MB app bundle size

## Security Considerations

### Security Features
- Sandboxed Tauri environment
- No code execution in backend
- Secure credential storage (planned)
- HTTPS validation
- XSS protection (Vue)

### Future Enhancements
- Encrypted storage
- Proxy support
- Certificate pinning
- CSRF protection

## Testing Strategy

### Manual Testing Areas
- Request/response handling
- Script execution
- Variable resolution
- Persistence
- UI interactions

### Future Automated Testing
- Unit tests for utilities
- Integration tests for stores
- E2E tests for critical flows
- Performance benchmarks

## Deployment

### Build Targets
- Windows (MSI, NSIS)
- macOS (DMG, APP)
- Linux (DEB, AppImage)

### Build Commands
```bash
npm run build          # Build frontend
npm run tauri build    # Build desktop app
```

### Release Checklist
- [ ] Update version
- [ ] Test on all platforms
- [ ] Generate changelog
- [ ] Sign executables
- [ ] Create release notes
- [ ] Upload to distribution channels
