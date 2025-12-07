/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BREVO_API_KEY: string
  readonly VITE_SENDER_EMAIL: string
  readonly VITE_SENDER_NAME: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_GOOGLE_PLACES_API_KEY: string
  // Add more environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
