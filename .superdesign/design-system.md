# Iuri Piragibe — Brutalist Investigation

One visual identity for the public site (`iuripiragibe.net`) and the JIP course
desk. The source of truth is the confirmed Superdesign draft
“Iuri Piragibe | Brutalist Investigation”.

## Product

Iuri Piragibe is a Portuguese-language investigative journalist and writer.
Public surfaces sell books, a document library, media kit, and the course
Jornalismo Investigativo na Prática. The course desk is an operational workspace
for paid students — not a generic LMS catalog.

Primary jobs:
- Enter investigations, books, media kit, library and course from the public site.
- Buy and authenticate without leaking the authorized-email list.
- Resume the next investigative action in the course desk.
- Keep private notes via Supabase RLS (not claimed as E2E encryption).

## Information architecture

Public: home, about, course landing, login (A.M.O.Q. / biblioteca), library,
investigation pages, legal pages.
Course public: landing, open LAI lesson, purchase, course login.
Course authorized: onboarding, desk, lessons, notes, bonus files, account.

## Visual direction

Ultra-modern brutalist investigation: sharp geometry, black/white contrast,
surgical gold accent only. Massive uppercase display type, aggressive kerning,
hard edges, 1px borders, rectangular blocks. No gradients, glassmorphism,
soft shadows, rounded “app” cards, neon hacker chrome, fake classified stamps,
or invented evidence.

## Color tokens

```css
--color-bg: #000000;
--color-surface: #0a0a0a;
--color-surface-2: #050505;
--color-accent: #FFB800;
--color-text: #FFFFFF;
--color-muted: #9ca3af;
--color-faint: #6b7280;
--color-border: #1a1a1a;
--color-ok: #22c55e;
--color-danger: #f87171;
```

Gold marks CTAs and selected context. Green is only for a live/synced state.
Red is only for real errors. Never communicate state by color alone.

## Typography

- Display: Archivo Black, uppercase, tracking -0.05em.
- Body / UI: Space Grotesk, 300–700.
- Data labels: Space Grotesk 600, 0.75rem, uppercase, tracking 0.1em.

Scale:
- Hero display: clamp(3rem, 7vw, 8rem), line-height 0.9.
- Section H2: 3–3.75rem Archivo Black.
- Card H3: 1.5rem Archivo Black.
- Body: 1–1.25rem Space Grotesk, muted gray for supporting copy.
- Nav: 0.75rem, weight 600, uppercase, tracking 0.1em.

## Spacing and shape

- Max content: 1440px. Page padding: 32px (2rem).
- Rhythm: 8 / 16 / 24 / 32 / 48 / 80 / 128.
- Radius: 0. Hard rectangles only.
- Borders: 1px `#1a1a1a`. Hover cards: translate(-4px, -4px) + 4px gold square shadow.
- Primary button: gold fill, black text, Archivo Black, uppercase. Hover: same offset + white square shadow.
- Minimum pointer target: 44px desktop, 48px touch.

## Shared chrome

Wordmark is text-only: `IURI` + gold `PIRAGIBE`. No invented logo mark.
Nav links: Investigações, Metodologia, Media Kit, Biblioteca, Contato, Curso.
Footer repeats wordmark, real archive links, Discord / Ágora VIP, and
`iuri@piragibe.com.br`. Legal: Termos, Privacidade.

## Content constraints

- Portuguese (Brazil). Use only copy that already exists in the repository.
- Real public stats from `index.html`: 430K+ Instagram, 200K+ TikTok, 6M+ views/mês,
  100+ investigações, 630 mil seguidores, Discord +5.000 membros.
- Course facts from `jornalismo/index.html`: 31 aulas, ~5h40, 8 módulos,
  R$ 197 pré-venda / R$ 297 cheio, aula aberta LAI (~20 min),
  “Sem documento, é lenda.”
- Login (`login.html`) is A.M.O.Q. (Arquivo Místico): email + password,
  register with min 8 chars, redirect to `/biblioteca`. Keep the functional fields;
  restyle brutally — do not invent occult copy beyond what the page already uses.
- Videos without a real URL: honest “Vídeo ainda não publicado”. No fake player.
- Notes are private via RLS, not “encrypted” unless true E2E exists.
- Never invent cases, docket IDs, deadlines, or placeholder evidence.
- Educational disclaimer: does not replace a lawyer; rules valid September 2026.

## Course desk (same system)

Sidebar and mobile dock use the same black/gold/hard-edge language.
Amber/gold for the next action. Status dots + labels. Lesson workspace:
outline, transcript, private notes. Bonus files if they exist:
`planilha-de-cruzamento.xlsx`, course markdown, Materiais Bônus PDF.
