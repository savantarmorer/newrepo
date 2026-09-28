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

Shared by `/styles.css`, `/jornalismo/css/curso.css` and `/jornalismo/css/ops.css`.
Contrast ratios measured against `--bg` (WCAG 2.x).

```css
--bg: #0C0C0D;          /* canvas */
--surface-1: #141416;   /* cards, sidebar */
--surface-2: #1C1C1F;   /* hover, active row */
--border: #2A2A2F;      /* decorative dividers */
--border-ui: #66666F;   /* input / ghost-button outlines, ≥ 3:1 (WCAG 1.4.11) */
--ink: #F4F1EA;         /* 17.3:1 */
--ink-2: #A9A59C;       /* 8.0:1 secondary copy */
--ink-3: #8A867D;       /* ≈ 5:1 on surface-1, metadata floor */
--action: #FFB800;      /* ONLY primary CTA, progress and current lesson */
--link: #8FB8FF;        /* inline/navigation links, 9.8:1 */
--ok: #4ADE80;          /* completed, always with ✓ */
--danger: #FF6B5E;      /* real errors */
--paper: #F5F1E8;       /* reading mode surface */
--paper-ink: #1C1A17;   /* 15.4:1 on paper */
--paper-accent: #7A5400;/* links on paper (gold fails there) */
```

Rules: gold fills at most one element per viewport (the primary CTA).
Eyebrows and kickers are neutral (`--ink-3`), never gold. Links are
`--link`, so "navigate" never looks like "buy". Never communicate state by
color alone.

## Typography

- Display: Archivo Black, uppercase, tracking -0.04em — page H1 and section
  titles only. Never for lesson titles.
- UI / body: Space Grotesk 400–700. Lesson titles: 700, sentence case.
- Long reading (lesson scripts, open lesson): Source Serif 4, 18–19px,
  line-height 1.7, max 68ch.
- Data (lesson numbers, durations, prices meta): JetBrains Mono 500–600.
- Minimum sizes: 12px labels, 14px UI text.

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
