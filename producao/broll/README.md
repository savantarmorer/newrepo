# B-rolls e animações das aulas

292 clipes em SVG animado (1920 × 1080) para as 31 aulas do curso *Jornalismo Investigativo na Prática*, mais 9 letterings com fundo transparente. Cada clipe nasce de uma deixa do roteiro (`[TELA: …]`, `[DEMONSTRAÇÃO: …]`, abertura, bloco ou exercício) e leva essa deixa no campo `cue` do `manifest.json` e na galeria.

Esta pasta é material de produção: fica fora do site (`scripts/build-static.mjs` bloqueia `producao/`) e do deploy por FTP.

## Ver

Abra `index.html` no navegador. A galeria mostra os clipes por módulo e aula, com a deixa, a duração e o arquivo; clique numa imagem para tocar de novo. As fontes vêm do Google Fonts: sem internet, o navegador usa fontes substitutas.

Cada arquivo de `svg/` também abre sozinho no navegador e toca a animação.

## Pastas e arquivos

| Caminho | O que é |
| --- | --- |
| `clips/m1.mjs` … `clips/m8.mjs` | A fonte dos clipes de cada módulo. É aqui que se edita texto e posição. |
| `clips/lettering.mjs` | Letterings fixos e sobreposições (fundo transparente). |
| `kit.mjs` | Cores, fontes, animações e componentes (título, lista, tabela, linha do tempo, documento, tarja…). |
| `aulas.mjs` | Nomes curtos das aulas e dos módulos. |
| `metrics.json` | Larguras das letras das três fontes, usadas para quebrar linha sem estourar. |
| `svg/` | Os clipes gerados. **Não edite à mão**: rode o `build.mjs`. |
| `manifest.json` | Lista dos clipes: código, aula, título, deixa do roteiro, arquivo, duração e aviso. |
| `index.html` | Galeria de revisão. |
| `out/` | Saída do `render.mjs` (PNG, MP4, MOV). Não vai para o git. |

## Gerar de novo

```bash
node producao/broll/build.mjs          # todos os clipes, manifesto
node producao/broll/build.mjs 4.6      # só os que começam com 4.6
node producao/broll/galeria.mjs        # refaz o index.html
```

O código do clipe (`4.6-03`) diz a aula e a ordem. O nome do arquivo repete o código e o título.

Marcação de texto dentro dos clipes: `{a|âmbar}`, `{r|vermelho}`, `{g|verde}`, `{b|azul}`, `{d|cinza}`, `{w|negrito}`, `{h|marca-texto}`, `{s|riscado}`, `{k|mono}`.

## Exportar vídeo

Requer `ffmpeg` e o Chromium do Playwright (`npx playwright install chromium`, ou aponte `CHROMIUM_PATH` para um Chromium instalado).

```bash
node producao/broll/render.mjs mp4            # todos → out/mp4/
node producao/broll/render.mjs mp4 7.2        # só a aula 7.2
node producao/broll/render.mjs poster 5.      # PNG do quadro final + folhas de contato out/contato-NN.png
```

- Clipes comuns saem em MP4 H.264, 1080p, 30 quadros por segundo (`FPS=60` muda).
- Letterings saem em MOV ProRes 4444 **com transparência**, para pôr em cima da câmera.
- `FONTES_LOCAIS=1` usa as fontes instaladas na máquina (Archivo Black, Space Grotesk, JetBrains Mono) em vez de baixá-las.
- A duração de cada clipe é o fim da última animação mais uma pausa de 2,4 s. Para segurar mais, congele o último quadro na edição.

## Convenções

- **Exemplos são fictícios**: Cidade Exemplo, Alimentos Modelo, Servidor Exemplo, CPF 123.456.789-00 (inválido de propósito). A fonte de cada tela aparece no rodapé: lei, decisão, órgão ou “Exemplo fictício”.
- Texto de lei entre aspas aparece só em poucos artigos de redação conhecida (CF, art. 5º, XIV e LVII; CPP, arts. 155 e 239; Lei 12.850, art. 4º, §16; Súmula 221 do STJ; LAI, art. 3º, I). No resto, é paráfrase do roteiro. Confira as citações literais na revisão jurídica do curso.
- Os letterings legais do roteiro estão em `clips/lettering.mjs`: aula 1.1 e módulo 5 (“Conteúdo educativo. Não substitui advogado no caso concreto.”), módulo 3 (“… Regras válidas em setembro de 2026.”), módulo 6 (as duas frases) e aula 6.4 (“Regras do período eleitoral de 2026.”).
- Os cartões das 12 etapas da aula 8.1 servem de abertura de cada etapa e de volta ao mapa. Os clipes-modelo da 8.1 têm campos `[PREENCHER]` para os dados do caso escolhido.

## Conferir antes de gravar

Clipes ligados a itens marcados no roteiro como ⚠️ CONFERIR, ou que são modelos:

- `2.2-04` A liminar na ADPF 601: se o mérito já foi julgado.
- `3.4-06` O que a CGU mudou: situação do projeto de lei sobre o art. 31.
- `3.5-02` Estados e municípios: nome e tela atual do sistema federal de pedidos (Fala.BR → InformaBR).
- `4.1-05` Muitos diários, uma busca: número atual de municípios no Querido Diário.
- `4.4-07` A lista dos tribunais de contas: redação atual das regras de inelegibilidade (mudaram em 2025).
- `4.5-05` A matrícula do imóvel: quais buscas o serviço eletrônico dos registradores permite.
- `6.3-03` Programa de Proteção Legal: número de atendidos e canal de pedido.
- `6.3-08` Marco Civil, o regime atual: texto final da tese dos Temas 987 e 533 depois dos embargos.
- `8.1-12`, `8.1-14`, `8.1-16`: modelos; trocar `[PREENCHER]` pelos dados do caso.

A lista completa e atualizada está no campo `warn` do `manifest.json` e no filtro “Só os que pedem conferência” da galeria.
