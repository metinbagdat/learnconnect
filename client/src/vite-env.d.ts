/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_MODEL?: string;
  readonly VITE_AI_ENABLED?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly PROD?: boolean;
  readonly DEV?: boolean;
  readonly MODE?: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
