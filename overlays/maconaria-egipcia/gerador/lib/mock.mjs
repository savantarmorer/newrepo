// Fundo de teste que simula um "talking head" — só para prévias.
export function mockBackground(kind = 'escuro') {
  const dark = kind === 'escuro';
  const wallA = dark ? '#3b3029' : '#e9e4dc';
  const wallB = dark ? '#100c0a' : '#b9b1a6';
  const shelf = dark ? '#21180f' : '#a39684';
  const books = dark
    ? ['#5a2a22', '#2c3e57', '#6b5a2e', '#3d2a45', '#7a4b27']
    : ['#8c4a3c', '#4a6487', '#b19447', '#6d5478', '#c27a45'];
  let shelves = '';
  for (const side of [0, 1]) {
    const x0 = side ? 1430 : 90;
    for (let r = 0; r < 4; r++) {
      const y = 140 + r * 230;
      shelves += `<rect x="${x0}" y="${y + 170}" width="400" height="16" fill="${shelf}"/>`;
      let x = x0 + 10;
      let k = r * 3 + side;
      while (x < x0 + 380) {
        const w = 18 + ((k * 37) % 22);
        const hh = 110 + ((k * 53) % 55);
        shelves += `<rect x="${x}" y="${y + 170 - hh}" width="${w}" height="${hh}" fill="${books[k % books.length]}"/>`;
        x += w + 3;
        k += 1;
      }
    }
  }
  const skin = dark ? '#b58466' : '#c99272';
  const shirt = dark ? '#1d2430' : '#263247';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
<defs><radialGradient id="w" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="${wallA}"/><stop offset="1" stop-color="${wallB}"/></radialGradient>
<radialGradient id="f" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="${skin}"/><stop offset="1" stop-color="#6e4a37"/></radialGradient></defs>
<rect width="1920" height="1080" fill="url(#w)"/>${shelves}
<path d="M520 1080C540 900 640 800 800 770L860 730H1060L1120 770C1280 800 1380 900 1400 1080Z" fill="${shirt}"/>
<rect x="890" y="600" width="140" height="170" rx="40" fill="url(#f)"/>
<ellipse cx="960" cy="440" rx="165" ry="205" fill="url(#f)"/>
<path d="M795 410C790 260 880 210 960 210C1050 210 1135 260 1125 410C1110 330 1060 300 960 300C870 300 815 330 795 410Z" fill="#2a1d16"/>
</svg>`;
}
