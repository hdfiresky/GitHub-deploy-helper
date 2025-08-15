// This file provides TypeScript definitions for Vite's environment variables.
// The original line `/// <reference types="vite/client" />` was causing an
// error, likely due to a misconfiguration in `tsconfig.json` which is outside
// the scope of files I can edit.
// To fix the compilation errors, we are manually defining the properties on
// `import.meta.env` that are used in the app and provided by Vite.

interface ImportMetaEnv {
  /** The base public path when served in production. */
  readonly BASE_URL: string;
  /** The mode the app is running in. */
  readonly MODE: string;
  /** Whether the app is running in development. */
  readonly DEV: boolean;
  /** Whether the app is running in production. */
  readonly PROD: boolean;
  /** Whether the app is running as part of a server-side render. */
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
