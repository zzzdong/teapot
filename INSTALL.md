# Installation Guide

## Prerequisites

### 1. Install Node.js (18+)
Download from [nodejs.org](https://nodejs.org/) or use nvm:
```bash
nvm install 18
nvm use 18
```

### 2. Install Rust

**Windows:**
Download and run [rustup-init.exe](https://rustup.rs/)

**macOS/Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Verify installation:
```bash
cargo --version
rustc --version
```

### 3. Install WebView2 (Windows Only)

WebView2 is included in Windows 11. For Windows 10:
- Download from [Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

## Installation Steps

```bash
# Clone the repository
git clone <repository-url>
cd teapot

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Build for Production

```bash
# Build the application
npm run build

# Create platform-specific installers
npm run tauri build
```

The installers will be in the `src-tauri/target/release/bundle/` directory.

## Troubleshooting

### "cargo: command not found"
Rust is not installed. See step 2 above.

### "error: linker not found"
**Windows:** Install Visual Studio Build Tools
**macOS:** Install Xcode Command Line Tools: `xcode-select --install`
**Linux:** Install system build tools (e.g., `sudo apt install build-essential`)

### "Failed to install @tauri-apps/cli"
Tauri CLI is optional. The project will work without it.

### "error: failed to run custom build command"
Try cleaning and rebuilding:
```bash
rm -rf node_modules target dist
npm install
npm run dev
```

## Development

- **Run dev server:** `npm run dev`
- **Build frontend only:** `npm run dev:renderer`
- **Build for production:** `npm run build`

## Platform Compatibility

| Platform | Status | Notes |
|----------|--------|-------|
| Windows 10/11 | ✅ Tested | Requires WebView2 |
| macOS 12+ | ✅ Tested | Requires Xcode |
| Linux (Ubuntu 22.04+) | ✅ Tested | Requires webkit2gtk |
