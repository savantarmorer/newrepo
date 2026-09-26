# Shared UI components

The course is a vanilla JavaScript single-page application. It has no component
library or standalone component files. Shared primitives are HTML strings in
`jornalismo/js/app.js`, styled globally by `jornalismo/css/curso.css`.

## Button

Source: `jornalismo/css/curso.css`

```css
.jip-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 12px;
  padding: 0 18px;
  font-weight: 700;
  text-decoration: none;
}
.jip-btn-primary {
  background: linear-gradient(135deg, #818cf8, #6366f1);
  color: #050508;
  box-shadow: 0 8px 28px rgba(99, 102, 241, 0.35);
}
.jip-btn-ghost {
  background: #18181b;
  color: #fff;
  border: 1px solid var(--jip-line);
}
```

## Card

Source: `jornalismo/css/curso.css`

```css
.jip-card {
  background: var(--jip-card);
  border: 1px solid var(--jip-line);
  border-radius: var(--jip-radius);
  padding: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
}
```

## Form controls

Source: `jornalismo/css/curso.css`

```css
textarea, input, select {
  width: 100%;
  background: #09090b;
  color: #fff;
  border: 1px solid var(--jip-line);
  border-radius: 12px;
  padding: 14px;
  font: inherit;
}
label {
  display: block;
  font-weight: 650;
  margin: 14px 0 6px;
}
```
