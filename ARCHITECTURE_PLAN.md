# Notepress Frontend Redesign — Architecture Plan

## Stack Decisions

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Estilos | Tailwind CSS v4 (já presente) + tailwind-merge | Glassmorphism puro via classes |
| Componentes UI | Radix UI Primitives + shadcn/ui patterns | Acessibilidade + invisível até estilizar |
| Popups/Editor | Floating UI | Ancoragem sem bugs de scroll no Lexical |
| Ícones | Lucide React (já presente) | Minimalista, padrão indústria |
| Animações | Framer Motion | Micro-interações suaves |
| Clima | Open-Meteo API (free, no key) + ipapi.co (geoloc) | Fundo dinâmico |
| Música | Spotify Embed iFrame API | Widget nativo sem SDK pesado |

## Novos Sistemas

### 1. Weather Atmosphere System
- `useWeatherAtmosphere()` hook
- Geoloc via `ipapi.co/json` → lat/lon
- Clima via `api.open-meteo.com/v1/forecast?current_weather=true`
- Mapeia condição climática → gradiente de fundo + partículas
- Condições: clear_day, clear_night, cloudy, rain, storm, snow, fog
- Cache em localStorage (15min TTL)

### 2. Focus Mode System
- `useFocusMode()` hook + Context Provider
- Modos: `flow` (padrão), `deep` (foco profundo), `ultra` (zero distração), `creative` (brainstorm)
- Cada modo altera: paleta, sidebar visibility, animações, playlist sugerida
- Persistência em localStorage

### 3. Glassmorphism Design Tokens
- Novas CSS variables para glass effects
- `--glass-bg`, `--glass-border`, `--glass-blur`, `--glass-shadow`
- Classe utilitária `.glass-panel` refatorada

### 4. Spotify Widget
- Componente `SpotifyWidget` com iframe embed
- Playlists pré-configuradas por modo de foco
- Mini player flutuante no canto inferior

## Componentes a Criar/Refatorar

### Novos
- `src/components/atmosphere/WeatherBackground.tsx` — fundo animado
- `src/components/atmosphere/WeatherProvider.tsx` — context + hook
- `src/components/focus/FocusModeProvider.tsx` — context
- `src/components/focus/FocusModeSwitcher.tsx` — seletor de modo
- `src/components/spotify/SpotifyWidget.tsx` — player embed
- `src/components/spotify/SpotifyMiniPlayer.tsx` — mini flutuante
- `src/components/ui/GlassCard.tsx` — card glassmorphism
- `src/components/ui/GlassPanel.tsx` — painel genérico
- `src/components/ui/GlassModal.tsx` — modal com backdrop blur
- `src/components/ui/GlassButton.tsx` — botão translúcido
- `src/components/ui/GlassInput.tsx` — input translúcido
- `src/components/ui/GlassBadge.tsx` — badge translúcido

### Refatorar
- `src/app/globals.css` — novo design system completo
- `src/lib/design-system.ts` — tokens atualizados
- `src/components/layout/Layout.tsx` — integrar weather + focus
- `src/components/layout/DashboardSidebar.tsx` — glassmorphism
- `src/components/layout/DashboardHeader.tsx` — glassmorphism
- `src/components/layout/FloatingChat.tsx` — glass style
- `src/app/page.tsx` — landing page Apple-like
- `src/app/dashboard/page.tsx` — dashboard com atmosfera
- `src/app/pricing/page.tsx` — pricing glassmorphism
- `src/components/dashboard/*` — todos com glass
- `src/components/ThemeProvider.tsx` — integrar providers
