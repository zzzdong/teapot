# Teapot

Teapot, an API buddy for API debugging and testing.

**Author:** [zzzdong](mailto:kuwater@163.com)

## Features

- ✅ HTTP Request Builder (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- ✅ Request Body Support (Form Data, Raw JSON/XML, Binary, GraphQL)
- ✅ Authentication (Bearer Token, Basic Auth, API Key)
- ✅ Environment Variables (Global, Environment, Local scopes)
- ✅ Dynamic Variables (timestamp, randomInt, guid, etc.)
- ✅ Request History with search and favorites
- ✅ Collections and Folders management
- ✅ Response Viewer (Pretty, Raw, Preview modes)
- ✅ Headers and Cookies management
- ✅ Pre-request and Test Scripts
- ✅ Code Snippets
- ✅ Beautiful UI with Naive UI
- ✅ Cross-platform (Windows, macOS, Linux)
- ✅ Lightweight and fast

## Tech Stack

- **Desktop Runtime**: Tauri 2.x (WebView2 on Windows, WebKit on macOS/Linux)
- **Backend**: Minimal Rust (only for Tauri runtime, no business logic)
- **Frontend Framework**: Vue 3 + Composition API + TypeScript
- **UI Component Library**: Naive UI
- **Build Tool**: Vite
- **State Management**: Pinia
- **HTTP Client**: Browser Fetch API
- **Data Persistence**: Browser localStorage
- **Code Editor**: Monaco Editor (coming soon)

## Why Tauri?

Tauri offers several advantages over Electron:

- **Lightweight**: ~10x smaller bundle size
- **Security**: Sandboxed system access with fine-grained permissions
- **Performance**: Uses system webview, no bundled Chromium
- **Memory**: Lower memory footprint
- **Native Integrations**: Better native OS integration

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Rust and Cargo (required by Tauri runtime, but no Rust code to maintain)

#### Install Rust (for Tauri runtime only)

```bash
# Rust is only needed for Tauri to work, not for application logic
# Tauri will handle the minimal Rust backend automatically

# On macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package application (creates installers)
npm run tauri build
```

## Project Structure

```
teapot/
├── src/
│   ├── renderer/                 # Vue renderer process (frontend)
│   │   ├── assets/              # Static assets
│   │   ├── components/          # Components
│   │   │   ├── layout/          # Layout components
│   │   │   ├── request/         # Request components
│   │   │   └── response/        # Response components
│   │   ├── composables/         # Composable functions
│   │   ├── stores/              # Pinia stores
│   │   ├── styles/             # Global styles
│   │   ├── App.vue              # Root component
│   │   ├── main.ts              # Renderer entry
│   │   └── tauri-api.ts        # Tauri API wrapper (minimal)
│   └── shared/                  # Shared types and utilities
│       └── types/               # TypeScript type definitions
├── src-tauri/                   # Tauri backend (minimal Rust)
│   ├── src/
│   │   ├── main.rs              # Tauri entry point
│   │   └── lib.rs              # Library exports
│   ├── capabilities/            # Tauri permissions configuration
│   ├── icons/                   # Application icons
│   ├── Cargo.toml              # Rust dependencies (minimal)
│   └── tauri.conf.json         # Tauri configuration
├── dist/                        # Built frontend assets (generated)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Usage

### Sending a Request

1. Select HTTP method from dropdown
2. Enter URL
3. Configure parameters, headers, body, and auth as needed
4. Click "Send" button
5. View response in the Response Viewer

### Managing Environments

1. Go to Environment panel in right sidebar
2. Select "Global" or "Environment" scope
3. Click "+" to add variables
4. Use variables in requests with `{{variableName}}` syntax

### Using Collections

1. Go to Collections panel in left sidebar
2. Click "+" to create a new collection
3. Add folders and requests
4. Organize your API requests

## System Architecture

### Core Modules

#### 1. Request Builder Module ✅
**Components:**
- `RequestBuilder.vue` - Main request configuration interface
- `ParamsTab.vue` - URL parameters management
- `HeadersTab.vue` - HTTP headers management
- `BodyTab.vue` - Request body with multiple types (Form Data, Raw, Binary, GraphQL)
- `AuthTab.vue` - Authentication configuration
- `PreRequestScriptTab.vue` - Pre-request script editor with Monaco
- `TestsTab.vue` - Test script editor with Monaco

**Features:**
- Support all HTTP methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- Dynamic body type switching
- Monaco Editor integration for code editing
- Script execution with Postman-compatible API

#### 2. Response Viewer Module ✅
**Components:**
- `ResponseViewer.vue` - Main response container
- `ResponseBody.vue` - Response body with Pretty, Raw, Preview modes
- `ResponseHeaders.vue` - Response headers display
- `ResponseCookies.vue` - Cookies management
- `ResponseTests.vue` - Test results display

**Features:**
- Syntax highlighting (highlight.js) for multiple languages
- Response status visualization (color-coded)
- Response time and size display
- Download and copy response

#### 3. Workspace Management Module ✅
**Components:**
- `MainWorkspace.vue` - Main workspace with tabs
- `LeftSidebar.vue` - Left sidebar with Collections and History
- `RightSidebar.vue` - Right sidebar with Environment and Console
- `AppHeader.vue` - Application header
- `StatusBar.vue` - Status bar display

**Features:**
- Multi-tab support with state management
- Resizable sidebars
- Tab activation/deactivation
- Workspace persistence

#### 4. Collections Management Module ✅
**Components:**
- `CollectionsPanel.vue` - Collections tree view
- `CollectionTreeItem.vue` - Recursive tree item component
- `SaveRequestDialog.vue` - Save request dialog

**Store:**
- `collections.ts` - Collections and requests state

**Features:**
- Create/edit/delete collections
- Nested folder structure
- Save requests to collections
- Import/Export support (planned)

#### 5. History Management Module ✅
**Components:**
- `HistoryPanel.vue` - History list with search

**Store:**
- `history.ts` - Request history state

**Features:**
- Automatic request logging
- Search and filter history
- Favorite requests (star)
- Load historical requests
- Max 100 items with favorited preservation
- Relative time display (dayjs)

#### 6. Environment Variables Module ✅
**Components:**
- `EnvironmentPanel.vue` - Environment and global variables editor

**Store:**
- `environment.ts` - Environment and global variables state

**Features:**
- Global variables
- Environment-specific variables
- Local variables (temporary)
- Dynamic variable support (timestamp, randomInt, guid, etc.)
- Variable resolution in requests
- Import/Export variables

#### 7. Console Module ✅
**Components:**
- `ConsolePanel.vue` - Real-time console logs

**Store:**
- `console.ts` - Console logs state

**Features:**
- Real-time log display
- Multiple log levels (log, info, warn, error)
- Auto-scroll to latest
- Log filtering (planned)
- Clear console

#### 8. HTTP Client Module ✅
**Composable:**
- `useHttpClient.ts` - HTTP request execution

**Features:**
- Tauri HTTP plugin integration
- Variable resolution in requests
- Pre-request script execution
- Test script execution
- Authentication handling
- Error handling

#### 9. Script Execution Module ✅
**Utility:**
- `scriptExecutor.ts` - Script execution engine

**Features:**
- Postman-compatible API (`pm`, `pm.test()`, `pm.expect()`, `pm.response.to.have`)
- Syntax validation
- Variable modification support
- Request modification support
- Test assertions
- Error handling

#### 10. Persistence Module ✅
**API:**
- `tauri-api.ts` - Tauri API wrapper

**Features:**
- Tauri Store v2 integration
- localStorage fallback
- Automatic data persistence
- Store operations: get, set, delete

#### 11. Tauri Backend ✅
**Rust Files:**
- `main.rs` - Tauri entry point
- `lib.rs` - Library exports

**Plugins:**
- `@tauri-apps/plugin-http` - HTTP requests
- `@tauri-apps/plugin-store` - Data persistence

**Features:**
- Minimal Rust backend
- Desktop application wrapper
- Native system integration

### Data Flow

```
Request Flow:
User Input → RequestBuilder → useHttpClient → tauri-api → Tauri HTTP → Response
                              ↓
                        Pre-request Script
                              ↓
                        Environment Resolution

Response Flow:
Tauri HTTP → ResponseViewer → Response Tests
                    ↓
            Response Store
                    ↓
            History Store
```

### Technology Stack

**Frontend:**
- Vue 3 + Composition API
- TypeScript
- Pinia (State Management)
- Naive UI (Component Library)
- Monaco Editor (Code Editor)
- highlight.js (Syntax Highlighting)
- dayjs (Date/Time)
- crypto-js (Cryptography)

**Backend (Tauri):**
- Rust
- Tauri 2.x
- Tauri HTTP Plugin
- Tauri Store Plugin

**Build Tools:**
- Vite
- rolldown-vite

## Development Plan

### Completed Features ✅
- [x] Basic request/response handling
- [x] Environment variables (Global, Environment, Local)
- [x] History management with search and favorites
- [x] Collections and folders management
- [x] Authentication (Bearer, Basic, API Key)
- [x] Pre-request and test scripts execution
- [x] Response viewing (Pretty, Raw, Preview)
- [x] Response headers and cookies
- [x] Test results display
- [x] Console panel with real-time logging
- [x] Workspace tabs management
- [x] Data persistence (Tauri Store)
- [x] Monaco Editor integration
- [x] Syntax highlighting (highlight.js)
- [x] Resizable sidebars

### Planned Features 🚧
- [ ] WebSocket support
- [ ] GraphQL editor with schema support
- [ ] Import/Export (Postman, OpenAPI, cURL)
- [ ] Code generator (multiple languages)
- [ ] Batch request execution
- [ ] Test monitoring and reports
- [ ] Multiple workspaces
- [ ] Dark mode theme
- [ ] Keyboard shortcuts
- [ ] Request/response diffing
- [ ] Proxy configuration
- [ ] SSL certificate management
- [ ] Mock servers
- [ ] API documentation panel

## License

MIT License

Copyright (c) 2025 zzzdong

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
