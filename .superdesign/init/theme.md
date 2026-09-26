# Theme

## Compact token summary

- Background: `#050508`; elevated surfaces: `rgba(18,18,24,.92)`
- Text: `#fafafa`; muted: `#a1a1aa`
- Current accent: indigo `#818cf8`; gold `#eab308`; success `#34d399`
- Border: `#27272a`
- Radius: `18px`; minimum tap target: `48px`; max content: `1120px`
- Sans: Inter; mono: Space Mono
- Desktop breakpoint: `860px`
- Current cards use subtle borders and a `0 12px 40px rgba(0,0,0,.28)` shadow.
- Motion honors `prefers-reduced-motion`.

## Raw source

Source: `jornalismo/css/curso.css`

```css
:root {
  --jip-bg: #050508;
  --jip-card: rgba(18, 18, 24, 0.92);
  --jip-line: #27272a;
  --jip-text: #fafafa;
  --jip-muted: #a1a1aa;
  --jip-accent: #818cf8;
  --jip-gold: #eab308;
  --jip-ok: #34d399;
  --jip-radius: 18px;
  --jip-tap: 48px;
  --jip-max: 1120px;
  --jip-sans: Inter, system-ui, sans-serif;
  --jip-mono: "Space Mono", ui-monospace, monospace;
}

body.jip {
  margin: 0;
  font-family: var(--jip-sans);
  background:
    radial-gradient(1200px 500px at 10% -10%, rgba(99, 102, 241, 0.18), transparent 55%),
    radial-gradient(900px 400px at 100% 0%, rgba(234, 179, 8, 0.08), transparent 50%),
    var(--jip-bg);
  color: var(--jip-text);
  line-height: 1.6;
  min-height: 100dvh;
}

@media (min-width: 860px) {
  .jip-grid-3 { grid-template-columns: repeat(3, 1fr); }
  .jip-grid-2 { grid-template-columns: 1.15fr 0.85fr; }
  .jip-split { display: grid; grid-template-columns: 1.35fr 0.75fr; gap: 20px; }
}

@media (prefers-reduced-motion: reduce) {
  * { scroll-behavior: auto !important; transition: none !important; }
}
```
