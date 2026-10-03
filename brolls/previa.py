#!/usr/bin/env python3
"""Gera brolls/previa/: folhas de contato por parte e um vídeo curto de amostra.
Requer ffmpeg e Pillow. Rode depois de build.mjs."""
import glob
import os
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'previa')
os.makedirs(OUT, exist_ok=True)
FONT = os.path.join(ROOT, 'src', 'fonts')


def dur(f):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f],
                       capture_output=True, text=True)
    return float(r.stdout.strip())


def frame(f, t, out):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', f, '-frames:v', '1', out], check=True)


def contact_sheet(parte):
    files = sorted(glob.glob(os.path.join(ROOT, 'mp4', f'parte-{parte}', '*.mp4')))
    cols, w, h, pad, lab = 4, 480, 270, 12, 34
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (w + pad) + pad, rows * (h + lab + pad) + pad + 70), (14, 13, 11))
    d = ImageDraw.Draw(sheet)
    try:
        f_t = ImageFont.truetype('DejaVuSans-Bold.ttf', 30)
        f_l = ImageFont.truetype('DejaVuSansMono.ttf', 15)
    except OSError:
        f_t = f_l = ImageFont.load_default()
    d.text((pad, 18), f'Ninguém entra numa seita · B-rolls da parte {parte} ({len(files)} clipes)', fill=(236, 228, 211), font=f_t)
    with tempfile.TemporaryDirectory() as tmp:
        for i, f in enumerate(files):
            png = os.path.join(tmp, f'{i}.png')
            frame(f, dur(f) * 0.85, png)
            im = Image.open(png).convert('RGB').resize((w, h), Image.LANCZOS)
            x = pad + (i % cols) * (w + pad)
            y = 70 + pad + (i // cols) * (h + lab + pad)
            sheet.paste(im, (x, y))
            name = os.path.basename(f).replace('.mp4', '')
            d.text((x, y + h + 6), name[:52], fill=(142, 136, 123), font=f_l)
    out = os.path.join(OUT, f'folha-de-contato-parte-{parte}.jpg')
    sheet.save(out, quality=86)
    print(out, sheet.size)


AMOSTRA = ['chale-duas-e-meia', 'mito-x-realidade', 'patrimonio-e-prova', 'lifton-criterio-1', 'love-bombing',
           'funil-visao-geral', 'modelo-bite', 'introducao-depois-do-avancado', 'escolha-limitada',
           'fitas-cassete', 'placar-um-a-um', 'recibo-dissolucao', 'porta-de-entrada-porta-de-saida']


def amostra():
    files = []
    for slug in AMOSTRA:
        m = glob.glob(os.path.join(ROOT, 'mp4', 'parte-*', f'*_TELA_{slug}.mp4'))
        if m:
            files.append(m[0])
    args = ['ffmpeg', '-v', 'error', '-y']
    for f in files:
        args += ['-i', f]
    parts = ''.join(f'[{i}:v]scale=1280:720,setsar=1[v{i}];' for i in range(len(files)))
    parts += ''.join(f'[v{i}]' for i in range(len(files))) + f'concat=n={len(files)}:v=1:a=0[out]'
    out = os.path.join(OUT, 'amostra-720p.mp4')
    args += ['-filter_complex', parts, '-map', '[out]', '-c:v', 'libx264', '-crf', '23', '-preset', 'medium',
             '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]
    subprocess.run(args, check=True)
    print(out, f'{dur(out):.0f}s')


if __name__ == '__main__':
    for p in (1, 2, 3):
        contact_sheet(p)
    amostra()
