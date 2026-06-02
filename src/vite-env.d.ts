/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_KEY: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_KAYAN_API_URL: string;
  readonly VITE_KAYAN_API_KEY: string;
  readonly VITE_FINGERPRINT_API_URL: string;
  readonly VITE_FINGERPRINT_API_KEY: string;
  readonly VITE_CLAUDE_API_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}