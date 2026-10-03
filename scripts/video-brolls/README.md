# B-rolls animados para vídeos (talking head)

Overlays verticais (1080x1920, 30 fps) no visual do site: preto, amarelo `#FFB800`,
Archivo Black + JetBrains Mono. O primeiro conjunto é do vídeo
"Quantos João de Deus temos no Brasil?".

- `brolls.html`: cada `<section class="clip">` é um B-roll. Abra no navegador com
  `?clip=b01` para ver um deles. Os textos e tempos ficam no próprio HTML.
- `render.mjs`: captura quadro a quadro com fundo transparente e gera os vídeos.

```bash
node scripts/video-brolls/render.mjs ./saida            # todos
node scripts/video-brolls/render.mjs ./saida b06 b12    # só alguns
node scripts/video-brolls/render.mjs ./saida --stills   # 1 PNG por clipe, para conferir
```

Saída:

- `mp4-chroma/*.mp4`: H.264 sobre verde `#00FF00`. MP4 não guarda transparência,
  então use chroma key no editor (no CapCut: Recortar > Chroma key).
- `mov-alpha/*.mov`: QuickTime Animation com canal alpha (transparência real).

Precisa de Node, Playwright (Chromium) e ffmpeg.
