/// <reference types="vite/client" />

declare module "*.html?raw" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  /** Опционально: абсолютный origin API (без завершающего /), если UI открыт не с оркестратора. */
  readonly VITE_API_BASE_URL?: string;
}

export {};

declare global {
  interface Window {
    /** Префикс API для legacy ui.js (совпадает с VITE_API_BASE_URL без слеша в конце). */
    __SWARM_API_BASE__?: string;
    /** Legacy orchestrator/static/ui.js (markdown в Events). */
    marked?: unknown;
    DOMPurify?: unknown;
    Sortable?: unknown;
  }
}
