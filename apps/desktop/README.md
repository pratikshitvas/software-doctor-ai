# Desktop shell

Start the web/API development servers with `npm run dev`, then in another terminal run `npm run dev:desktop`. The shell loads the local web client. It enables context isolation, disables renderer Node integration, and exposes only notification/external-link IPC operations.

Package Windows with `npm run build:desktop` from a Windows build environment. macOS packaging/signing must run on macOS with an Apple Developer signing identity. Project-folder selection and local Git inspection are not implemented yet.