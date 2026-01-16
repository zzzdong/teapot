# Tauri Migration Guide

## Overview

This project has been migrated from **Electron** to **Tauri** for better performance and smaller bundle sizes.

## Key Changes

### What Changed

1. **Desktop Runtime**
   - Before: Electron 25+ (Node.js + Chromium)
   - After: Tauri (Rust + System WebView)

2. **Backend**
   - Before: Node.js in Electron main process
   - After: Rust in `src-tauri/`

3. **Communication**
   - Before: Electron IPC (preload script)
   - After: Tauri invoke API

4. **Dependencies**
   - Removed: electron, electron-builder, electron-store
   - Added: @tauri-apps/api, @tauri-apps/cli (optional)

### Project Structure

```
teapot/
├── src/
│   ├── main/           # Legacy Electron files (kept for reference)
│   ├── renderer/       # Vue frontend (unchanged)
│   └── shared/         # Shared types (unchanged)
└── src-tauri/        # NEW: Rust backend
    ├── src/
    │   ├── main.rs        # Entry point
    │   ├── commands.rs    # Command handlers
    │   └── store.rs       # Data persistence
    └── Cargo.toml        # Rust dependencies
```

## Compatibility

### Windows
- Uses **WebView2** (Microsoft Edge)
- Included in Windows 11, installable on Windows 10
- Better performance than Electron's bundled Chromium

### macOS
- Uses **WebKit** (Safari engine)
- Smaller app bundle size
- Better integration with macOS

### Linux
- Uses **WebKitGTK**
- Standard webkit2gtk package

## Benefits

✅ **10x Smaller**: ~50MB vs ~500MB for Electron
✅ **Less Memory**: ~100MB vs ~500MB for Electron
✅ **Faster Startup**: No bundled Chromium to load
✅ **Better Security**: Fine-grained permissions system
✅ **Native Feel**: Better OS integration

## Development

### Installing Dependencies

```bash
# Node.js dependencies
npm install

# Rust is required for Tauri backend
# Install from https://rustup.rs/
```

### Running the App

```bash
npm run dev
```

This starts:
1. Vite dev server (http://localhost:5173)
2. Tauri window with system webview

### Building

```bash
npm run build
```

Creates installers in `src-tauri/target/release/bundle/`

## Frontend Changes

### API Calls

**Before (Electron):**
```typescript
await window.electronAPI.store.get('key');
```

**After (Tauri):**
```typescript
import * as tauriApi from '@/renderer/tauri-api';
await tauriApi.store.get('key');
```

The `tauri-api.ts` wrapper provides a consistent interface that works with both Tauri and Electron (for backward compatibility).

### Stores

All Pinia stores have been updated to use the new API:
- `useHttpClient` - Uses Tauri for HTTP requests
- `useEnvironmentStore` - Uses Tauri for data persistence
- `useHistoryStore` - Uses Tauri for history storage
- `useCollectionsStore` - Uses Tauri for collection storage

## Backend (Rust)

### Commands

All backend functionality is implemented as Tauri commands in `src-tauri/src/commands.rs`:

- `store_get`, `store_set`, `store_delete`, `store_clear`, `store_has`
- `send_request` - HTTP requests
- `ws_connect`, `ws_send`, `ws_close` - WebSocket (placeholder)
- `file_read`, `file_write`, `file_select` - File operations
- `script_execute` - Script execution (placeholder)
- `env_get`, `env_set` - Environment variables

### Storage

Data is stored in JSON files:
- **Windows**: `%APPDATA%\teapot\store.json`
- **macOS**: `~/Library/Application Support/teapot/store.json`
- **Linux**: `~/.config/teapot/store.json`

## Migration Checklist

If you're migrating your own Electron app to Tauri:

- [ ] Install Rust and Cargo
- [ ] Create `src-tauri/` directory
- [ ] Convert Electron IPC handlers to Tauri commands
- [ ] Replace `electron-store` with file-based storage
- [ ] Update frontend API calls
- [ ] Test on all target platforms
- [ ] Update build configuration

## Future Enhancements

With Tauri, we can now:

- 🚀 Use native OS APIs more efficiently
- 🔒 Implement better security with permissions
- 📦 Reduce bundle size dramatically
- ⚡ Improve startup time and performance
- 🎨 Better native theming support
- 🔌 Access more system features

## Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Tauri + Vue Guide](https://tauri.app/v1/guides/getting-started/setup/vite/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [WebView2 Documentation](https://learn.microsoft.com/en-us/microsoft-edge/webview2/)

## Support

For issues or questions:
- Check [Tauri Docs](https://tauri.app/v1/guides/)
- Search [Tauri GitHub Issues](https://github.com/tauri-apps/tauri/issues)
- Refer to Rust error messages for build issues
