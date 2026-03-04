/**
 * Declarações de tipo para pacotes opcionais do pipeline de PDF.
 * @sparticuz/chromium é instalado apenas no ambiente serverless (Vercel).
 * Em ambiente local/Docker, o Puppeteer completo é usado como fallback.
 */

declare module '@sparticuz/chromium' {
  const chromium: {
    args: string[];
    defaultViewport: { width: number; height: number };
    executablePath: (path?: string) => Promise<string>;
    headless: boolean | 'shell';
  };
  export default chromium;
}
