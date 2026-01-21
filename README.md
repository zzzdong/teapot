# Teapot

<div align="center">
  <img src="teapot-icon.svg" alt="Teapot Logo" width="128" height="128">
</div>

Teapot is an API testing and debugging tool.

## Features

- HTTP Request Builder (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- Request Body Support (Form Data, Raw JSON/XML, Binary, GraphQL)
- Authentication (Bearer Token, Basic Auth, API Key)
- Environment Variables (Global, Environment, Local scopes)
- Dynamic Variables (timestamp, randomInt, guid, etc.)
- Request History with search and favorites
- Collections and Folders management
- Response Viewer (Pretty, Raw, Preview modes)
- Headers and Cookies management
- Pre-request and Test Scripts
- Code Snippets
- Import/Export (Teapot, Postman Collection v2.1, cURL)
- Step-by-step Import Modal
- Code Generator
- Beautiful UI with Naive UI
- Cross-platform (Windows, macOS, Linux)

## Tech Stack

- **Desktop Runtime**: Tauri 2.x (WebView2 on Windows, WebKit on macOS/Linux)
- **Frontend Framework**: Vue 3 + Composition API + TypeScript
- **UI Component Library**: Naive UI
- **Build Tool**: Vite
- **State Management**: Pinia
- **HTTP Client**: Browser Fetch API
- **Data Persistence**: Browser localStorage
- **Code Editor**: Monaco Editor

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Rust and Cargo

#### Install Rust

```bash
# On macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev


# Package application (creates installers)
npm run build
```

## Project Structure

```
teapot/
├── src/
│   ├── components/          # Vue components
│   ├── composables/         # Composable functions
│   ├── stores/              # Pinia stores
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── App.vue              # Root component
│   └── main.ts              # Application entry
├── src-tauri/               # Tauri backend
├── package.json
├── vite.config.ts
└── tsconfig.json
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
4. Import from Teapot/Postman/cURL formats

### Importing Data

1. Click "Import" button in Collections panel
2. Choose file upload or text input
3. Supported formats: Teapot (.json), Postman Collection v2.1 (.json), cURL
4. Preview and confirm import

## License

MIT License

Copyright (c) 2025 zzzdong
