# B-rolls · Ninguém entra numa seita

Pacote de 192 B-rolls animados (155 de tela cheia e 37 sobreposições) para os três episódios.
Cada clipe existe em **SVG animado** (fonte editável, abre e anima no navegador) e em **MP4 1920×1080, 30 fps**.

## Como baixar

- **Tudo de uma vez:** no GitHub, abra o branch deste trabalho, clique em **Code → Download ZIP**. As pastas `brolls/mp4` e `brolls/mov-alfa` trazem os vídeos.
- **Um arquivo só:** clique no arquivo na lista abaixo e use o botão de download (ícone de seta) do GitHub.
- `previa/` tem um vídeo curto de amostra e folhas de contato de cada parte, para escolher sem abrir arquivo por arquivo.

## Pastas

| Pasta | O que tem |
|---|---|
| `mp4/parte-N/` | Todos os clipes em MP4 (H.264). Tela cheia: `*_TELA_*.mp4`. Sobreposições: `*_SOBRE_*_verde.mp4`, com fundo verde #00FF00 para chroma key. |
| `mov-alfa/parte-N/` | As mesmas sobreposições em MOV com canal alfa (codec PNG). Premiere, DaVinci Resolve e Final Cut aceitam direto, sem chroma key. |
| `svg/parte-N/` | Os SVGs animados. Abra no Chrome ou Firefox para ver a animação; edite o texto no fim do arquivo (objeto `window.CLIP`). |
| `src/` | Motor de animação (`runtime.js`, `templates.js`, `templates-ilustra.js`), lista de clipes (`clips.mjs`) e fontes. |
| `previa/` | Amostra e folhas de contato. |

## Como usar na edição

- **Tela cheia (TELA):** corte do talking head para o B-roll no momento indicado na coluna "Entra em". A animação de entrada leva de 0,5 a 2 s e depois o quadro fica parado; corte de volta quando quiser. Se precisar de mais tempo, congele o último quadro.
- **Sobreposição (SOBRE):** fica por cima do talking head. Use o MOV com alfa, ou o MP4 verde com chroma key (no CapCut: *Recorte → Chroma key*, cor verde). Já vêm com entrada e saída animadas.
- **Selos de evidência:** as sobreposições `selo-*` repetem a regra do roteiro: toda afirmação sobre pessoa ou organização nomeada aparece com a categoria da fonte. Cores: vermelho = decisão judicial · azul = documento oficial · âmbar = reportagem · violeta = testemunho · branco = academia · cinza = versão da organização. Os B-rolls de tela cheia que citam fonte já trazem o mesmo selo no rodapé.
- **Clipes sóbrios:** os marcados como "sóbrio" (Abadiânia, Maranhão, Shakahola, Jonestown, Guaratuba) têm animação mais lenta e sem cor de destaque, seguindo a regra de tom do roteiro. Não acrescente trilha cômica neles.
- **Motivos recorrentes:** contador de águias (E1, E2, E3), marcadores de pergunta em aberto/respondida (loops 00, 01 e 02) e a expressão "magia negra" (E1 e E3) amarram os três episódios.

## Antes de publicar

- **Grupo Águia (E3, contador e "duas águias"):** o nome e o papel do grupo nas prisões de 1992 ainda precisam ser confirmados no Projeto Humanos e no acórdão da revisão criminal. Se não se confirmar, não use `contador-aguias-2` nem `duas-aguias`.
- **Trecho opcional:** `nome-lucia-helena-galvao` e `selo-mangue-jornalismo` (Parte 1) acompanham o parágrafo marcado como opcional no roteiro.
- **Ilustrações:** a folha pautada (E2), a fita cassete (E3), o recibo (E3), o jornal (E1) e as fichas são reconstituições gráficas e dizem isso na tela. Não as apresente como documento real.
- **Datas e números:** seguem o roteiro e a lista de checagem da conversa. Se a checagem mudar algum dado, edite `src/clips.mjs` e renderize de novo.

## Como editar e renderizar de novo

Requer Node 18+, Playwright com Chromium e ffmpeg.

```bash
node brolls/build.mjs                    # gera os SVGs e renderiza tudo
node brolls/build.mjs --only E1-05,E3-12  # só alguns clipes
node brolls/build.mjs --svg-only          # só os SVGs
node brolls/gerar-guia.mjs                # atualiza este README
```

Para mudar um texto, altere o clipe em `src/clips.mjs` (os IDs são atribuídos pela ordem da lista) e rode o build daquele ID.

## Planilha de entrada

### Parte 1 — O curso introdutório

69 clipes · 508 s de material

| ID | Tipo | Dur. | Arquivo | Entra em (fala) |
|---|---|---|---|---|
| E1-01 | tela cheia | 10s | [E1-01_TELA_chale-duas-e-meia](mp4/parte-1/E1-01_TELA_chale-duas-e-meia.mp4) | Madrugada de 10 de outubro de 1992... uma sócia acorda com três pessoas na porta. |
| E1-02 | tela cheia | 8s | [E1-02_TELA_etimologia-dissidente](mp4/parte-1/E1-02_TELA_etimologia-dissidente.mp4) | Dissidente vem do latim dissidere: sentar-se à parte. |
| E1-03 | sobreposição | 5s | [E1-03_SOBRE_selo-marie-claire](mp4/parte-1/E1-03_SOBRE_selo-marie-claire_verde.mp4) | O relato está numa reportagem da revista Marie Claire... |
| E1-04 | tela cheia | 8s | [E1-04_TELA_etimologia-liminar](mp4/parte-1/E1-04_TELA_etimologia-liminar.mp4) | Liminar vem do latim limen: soleira, a entrada da porta. |
| E1-05 | tela cheia | 8s | [E1-05_TELA_citacao-nao-damos-entrevista](mp4/parte-1/E1-05_TELA_citacao-nao-damos-entrevista.mp4) | Procurado pela revista, um diretor do movimento respondeu assim... |
| E1-06 | tela cheia | 8s | [E1-06_TELA_numeros-movimento-hoje](mp4/parte-1/E1-06_TELA_numeros-movimento-hoje.mp4) | Esse movimento existe até hoje... O curso de entrada custa 1.600 reais e aceita alunos a partir de nove anos. |
| E1-07 | tela cheia | 8s | [E1-07_TELA_numeros-outra-escola](mp4/parte-1/E1-07_TELA_numeros-outra-escola.mp4) | Em 1957, em Buenos Aires, nasceu outra escola de filosofia. Hoje ela diz estar em 54 países. |
| E1-08 | sobreposição | 5s | [E1-08_SOBRE_selo-el-espanol](mp4/parte-1/E1-08_SOBRE_selo-el-espanol_verde.mp4) | Em 2022, uma ex-integrante contou ao jornal espanhol El Español... |
| E1-09 | sobreposição | 6s | [E1-09_SOBRE_contador-aguias-1](mp4/parte-1/E1-09_SOBRE_contador-aguias-1_verde.mp4) | Diante de uma águia. Guarde essa águia. Ela não é a última. |
| E1-10 | tela cheia | 9s | [E1-10_TELA_nenhuma-condenada](mp4/parte-1/E1-10_TELA_nenhuma-condenada.mp4) | Nenhuma das duas organizações foi condenada, como organização... Não existe nem definição legal de seita. |
| E1-11 | tela cheia | 11s | [E1-11_TELA_mito-x-realidade](mp4/parte-1/E1-11_TELA_mito-x-realidade.mp4) | A maioria das pessoas acha que quem cai em seita é burro, carente ou fanático... A verdade passa por cursos de filosofia com café e biscoito. |
| E1-12 | tela cheia · sóbrio | 7s | [E1-12_TELA_trinta-e-um-anos](mp4/parte-1/E1-12_TELA_trinta-e-um-anos.mp4) | E termina num tribunal do Paraná que levou 31 anos para reconhecer... |
| E1-13 | tela cheia | 9s | [E1-13_TELA_nesta-serie](mp4/parte-1/E1-13_TELA_nesta-serie.mp4) | Esta é a primeira de três partes. No caminho, você vai entender como gente inteligente entra nesses lugares... |
| E1-14 | sobreposição | 6s | [E1-14_SOBRE_marcador-oito-perguntas-aberto](mp4/parte-1/E1-14_SOBRE_marcador-oito-perguntas-aberto_verde.mp4) | E, no fim da terceira parte, eu vou te dar oito perguntas... Inclusive contra este canal. |
| E1-15 | tela cheia | 6s | [E1-15_TELA_titulo-parte-1](mp4/parte-1/E1-15_TELA_titulo-parte-1.mp4) | Logo depois do gancho de abertura (cartela de título). |
| E1-16 | tela cheia | 4s | [E1-16_TELA_capitulo-i](mp4/parte-1/E1-16_TELA_capitulo-i.mp4) | Primeiro, um problema de vocabulário. |
| E1-17 | tela cheia | 10s | [E1-17_TELA_etimologia-seita](mp4/parte-1/E1-17_TELA_etimologia-seita.mp4) | "Seita" vem do latim secta. Os dicionários ligam a palavra a sequi, seguir. |
| E1-18 | sobreposição | 5s | [E1-18_SOBRE_nome-weber-troeltsch](mp4/parte-1/E1-18_SOBRE_nome-weber-troeltsch_verde.mp4) | No começo do século 20, os sociólogos Max Weber e Ernst Troeltsch... |
| E1-19 | tela cheia | 9s | [E1-19_TELA_definicao-sociologica](mp4/parte-1/E1-19_TELA_definicao-sociologica.mp4) | Seita passou a ser um grupo que se separa de uma igreja e vive em tensão com o resto da sociedade. |
| E1-20 | tela cheia | 10s | [E1-20_TELA_citacao-codigo-penal-1890](mp4/parte-1/E1-20_TELA_citacao-codigo-penal-1890.mp4) | O Código Penal de 1890, no artigo 157, punia quem praticasse "o espiritismo, a magia e seus sortilégios". |
| E1-21 | tela cheia | 11s | [E1-21_TELA_linha-do-tempo-colecao](mp4/parte-1/E1-21_TELA_linha-do-tempo-colecao.mp4) | Entre 1890 e a década de 1940, a polícia do Rio de Janeiro apreendia objetos sagrados em terreiros... |
| E1-22 | tela cheia | 10s | [E1-22_TELA_patrimonio-e-prova](mp4/parte-1/E1-22_TELA_patrimonio-e-prova.mp4) | Durante décadas, os mesmos objetos foram, ao mesmo tempo, patrimônio nacional e prova de crime. |
| E1-23 | tela cheia | 9s | [E1-23_TELA_etiqueta-acervo-nosso-sagrado](mp4/parte-1/E1-23_TELA_etiqueta-acervo-nosso-sagrado.mp4) | Os objetos só saíram de lá em 21 de setembro de 2020... Passou a ser "Acervo Nosso Sagrado". |
| E1-24 | sobreposição | 6s | [E1-24_SOBRE_marcador-magia-negra](mp4/parte-1/E1-24_SOBRE_marcador-magia-negra_verde.mp4) | Guarde a expressão "magia negra". Ela volta. Não neste episódio, mas volta. |
| E1-25 | tela cheia | 8s | [E1-25_TELA_crenca-x-comportamento](mp4/parte-1/E1-25_TELA_crenca-x-comportamento.mp4) | Por isso, nesta série, a gente não vai julgar crença... A gente vai olhar comportamento. |
| E1-26 | tela cheia | 4s | [E1-26_TELA_capitulo-ii](mp4/parte-1/E1-26_TELA_capitulo-ii.mp4) | Setembro de 1950, primeiro ano da Guerra da Coreia. |
| E1-27 | tela cheia | 7s | [E1-27_TELA_jornal-brain-washing](mp4/parte-1/E1-27_TELA_jornal-brain-washing.mp4) | O jornalista americano Edward Hunter publica no Miami News um artigo sobre técnicas chinesas de brain-washing. |
| E1-28 | sobreposição | 6s | [E1-28_SOBRE_nome-edward-hunter](mp4/parte-1/E1-28_SOBRE_nome-edward-hunter_verde.mp4) | Antes de virar especialista em Guerra Fria, Hunter tinha passado a Segunda Guerra no OSS... |
| E1-29 | tela cheia | 11s | [E1-29_TELA_linha-do-tempo-lavagem-cerebral](mp4/parte-1/E1-29_TELA_linha-do-tempo-lavagem-cerebral.mp4) | Quando a guerra terminou, em 1953... Em 1956, o próprio Exército americano publicou um relatório chamando a lavagem cerebral de equívoco popular. |
| E1-30 | tela cheia | 9s | [E1-30_TELA_schein-tres-etapas](mp4/parte-1/E1-30_TELA_schein-tres-etapas.mp4) | O psicólogo Edgar Schein... descongelar a identidade antiga, mudar, recongelar a nova. |
| E1-31 | sobreposição | 5s | [E1-31_SOBRE_nome-lifton](mp4/parte-1/E1-31_SOBRE_nome-lifton_verde.mp4) | O psiquiatra Robert Jay Lifton entrevistou ocidentais e chineses... |
| E1-32 | tela cheia | 6s | [E1-32_TELA_lifton-criterio-1](mp4/parte-1/E1-32_TELA_lifton-criterio-1.mp4) | Primeiro, controle do meio. |
| E1-33 | tela cheia | 6s | [E1-33_TELA_lifton-criterio-2](mp4/parte-1/E1-33_TELA_lifton-criterio-2.mp4) | Segundo, manipulação mística. |
| E1-34 | tela cheia | 6s | [E1-34_TELA_lifton-criterio-3](mp4/parte-1/E1-34_TELA_lifton-criterio-3.mp4) | Terceiro, exigência de pureza. |
| E1-35 | tela cheia | 6s | [E1-35_TELA_lifton-criterio-4](mp4/parte-1/E1-35_TELA_lifton-criterio-4.mp4) | Quarto, culto da confissão. |
| E1-36 | tela cheia | 6s | [E1-36_TELA_lifton-criterio-5](mp4/parte-1/E1-36_TELA_lifton-criterio-5.mp4) | Quinto, ciência sagrada. |
| E1-37 | tela cheia | 6s | [E1-37_TELA_lifton-criterio-6](mp4/parte-1/E1-37_TELA_lifton-criterio-6.mp4) | Sexto, linguagem carregada. |
| E1-38 | tela cheia | 6s | [E1-38_TELA_lifton-criterio-7](mp4/parte-1/E1-38_TELA_lifton-criterio-7.mp4) | Sétimo, doutrina acima da pessoa. |
| E1-39 | tela cheia | 6s | [E1-39_TELA_lifton-criterio-8](mp4/parte-1/E1-39_TELA_lifton-criterio-8.mp4) | Oitavo, dispensação da existência. |
| E1-40 | tela cheia | 7s | [E1-40_TELA_lifton-visao-geral](mp4/parte-1/E1-40_TELA_lifton-visao-geral.mp4) | Esses critérios descrevem tendências, não um tipo de organização. |
| E1-41 | tela cheia | 10s | [E1-41_TELA_onde-mais-aparece](mp4/parte-1/E1-41_TELA_onde-mais-aparece.mp4) | Se você ouviu essa lista e pensou no seu antigo emprego, na sua família ou no grupo de WhatsApp do condomínio... |
| E1-42 | tela cheia | 4s | [E1-42_TELA_capitulo-iii](mp4/parte-1/E1-42_TELA_capitulo-iii.mp4) | Antes de seguir, uma correção de rota. |
| E1-43 | tela cheia · sóbrio | 9s | [E1-43_TELA_dateline-toquio-1995](mp4/parte-1/E1-43_TELA_dateline-toquio-1995.mp4) | A Aum Shinrikyo, a seita japonesa que atacou o metrô de Tóquio com gás sarin em 1995... |
| E1-44 | tela cheia | 10s | [E1-44_TELA_quem-entra](mp4/parte-1/E1-44_TELA_quem-entra.mp4) | Quem entra costuma estar numa fase de transição: mudou de cidade, terminou um relacionamento... |
| E1-45 | tela cheia | 7s | [E1-45_TELA_inteligencia-nao-protege](mp4/parte-1/E1-45_TELA_inteligencia-nao-protege.mp4) | Inteligência não protege. Às vezes atrapalha. |
| E1-46 | tela cheia | 8s | [E1-46_TELA_terca-feira-qualquer](mp4/parte-1/E1-46_TELA_terca-feira-qualquer.mp4) | Você é recrutado num anúncio patrocinado. Imagine uma terça-feira. |
| E1-47 | tela cheia | 9s | [E1-47_TELA_love-bombing](mp4/parte-1/E1-47_TELA_love-bombing.mp4) | As pessoas são simpáticas. Muito simpáticas. Lembram do seu nome... love bombing, bombardeio de amor. |
| E1-48 | tela cheia | 11s | [E1-48_TELA_ficha-curso-introdutorio](mp4/parte-1/E1-48_TELA_ficha-curso-introdutorio.mp4) | A palestra é boa. De verdade. No fim, alguém comenta que existe um curso introdutório. Não é caro. É só um começo. |
| E1-49 | tela cheia | 9s | [E1-49_TELA_pe-na-porta](mp4/parte-1/E1-49_TELA_pe-na-porta.mp4) | Psicólogos sociais têm nome para esse "só um começo": a técnica do pé na porta. |
| E1-50 | sobreposição | 5s | [E1-50_SOBRE_nome-cialdini](mp4/parte-1/E1-50_SOBRE_nome-cialdini_verde.mp4) | Robert Cialdini descreveu o mecanismo em 1984... |
| E1-51 | tela cheia | 4s | [E1-51_TELA_capitulo-iv](mp4/parte-1/E1-51_TELA_capitulo-iv.mp4) | A Nova Acrópole foi fundada em 1957, em Buenos Aires... |
| E1-52 | sobreposição | 5s | [E1-52_SOBRE_nome-livraga](mp4/parte-1/E1-52_SOBRE_nome-livraga_verde.mp4) | pelo argentino Jorge Ángel Livraga Rizzi. |
| E1-53 | tela cheia | 8s | [E1-53_TELA_esoterico-exoterico](mp4/parte-1/E1-53_TELA_esoterico-exoterico.mp4) | Esotérico vem do grego esōterikós: de dentro... O ensino para o público de fora se chamava exotérico. |
| E1-54 | tela cheia | 8s | [E1-54_TELA_numeros-nova-acropole](mp4/parte-1/E1-54_TELA_numeros-nova-acropole.mp4) | Segundo ela mesma, hoje está em 54 países e em mais de 400 cidades. No Brasil, diz ter mais de 70 escolas. |
| E1-55 | tela cheia | 8s | [E1-55_TELA_objetivos-oficiais](mp4/parte-1/E1-55_TELA_objetivos-oficiais.mp4) | A proposta pública é a "filosofia à maneira clássica"... Os objetivos oficiais são três. |
| E1-56 | sobreposição | 5s | [E1-56_SOBRE_nome-lucia-helena-galvao](mp4/parte-1/E1-56_SOBRE_nome-lucia-helena-galvao_verde.mp4) | (trecho opcional) O rosto público mais conhecido da Nova Acrópole no Brasil... |
| E1-57 | sobreposição | 5s | [E1-57_SOBRE_selo-mangue-jornalismo](mp4/parte-1/E1-57_SOBRE_selo-mangue-jornalismo_verde.mp4) | (trecho opcional) Em 2025, segundo o site Mangue Jornalismo, a Prefeitura de Aracaju... |
| E1-58 | tela cheia | 11s | [E1-58_TELA_linha-do-tempo-pro-vida](mp4/parte-1/E1-58_TELA_linha-do-tempo-pro-vida.mp4) | Em outubro de 1977, em São Paulo, um ginecologista chamado Celso Charuri reuniu catorze amigos... |
| E1-59 | sobreposição | 5s | [E1-59_SOBRE_nome-celso-charuri](mp4/parte-1/E1-59_SOBRE_nome-celso-charuri_verde.mp4) | um ginecologista chamado Celso Charuri... |
| E1-60 | tela cheia | 7s | [E1-60_TELA_pro-mente-pro-vida](mp4/parte-1/E1-60_TELA_pro-mente-pro-vida.mp4) | A Pró-Mente virou Pró-Vida. A mente continuou envolvida. |
| E1-61 | tela cheia | 9s | [E1-61_TELA_numeros-pro-vida](mp4/parte-1/E1-61_TELA_numeros-pro-vida.mp4) | Hoje, segundo o próprio site... O programa tem nove níveis. A Semana de Básico custa 1.600 reais... |
| E1-62 | tela cheia | 8s | [E1-62_TELA_escolas-doadas](mp4/parte-1/E1-62_TELA_escolas-doadas.mp4) | O movimento também faz ação social. Diz ter doado 16 escolas profissionalizantes, e o SENAI de São Paulo confirma... |
| E1-63 | tela cheia | 9s | [E1-63_TELA_nada-disso-e-ilegal](mp4/parte-1/E1-63_TELA_nada-disso-e-ilegal.mp4) | Nada disso é ilegal, estranho ou necessariamente ruim. Curso pago é legal... |
| E1-64 | tela cheia | 4s | [E1-64_TELA_capitulo-v](mp4/parte-1/E1-64_TELA_capitulo-v.mp4) | Agora, a anomalia. |
| E1-65 | tela cheia | 7s | [E1-65_TELA_se-fosse-cinema](mp4/parte-1/E1-65_TELA_se-fosse-cinema.mp4) | Se lavagem cerebral é aquilo do cinema... Entra quem assiste à palestra. Sai um fiel. |
| E1-66 | sobreposição | 5s | [E1-66_SOBRE_nome-eileen-barker](mp4/parte-1/E1-66_SOBRE_nome-eileen-barker_verde.mp4) | No fim dos anos 1970, a socióloga britânica Eileen Barker resolveu medir isso. |
| E1-67 | tela cheia | 8s | [E1-67_TELA_barker-sete-anos](mp4/parte-1/E1-67_TELA_barker-sete-anos.mp4) | e passou quase sete anos contando quem entrava, quem ficava e quem ia embora. |
| E1-68 | sobreposição | 7s | [E1-68_SOBRE_marcador-anomalia-aberto](mp4/parte-1/E1-68_SOBRE_marcador-anomalia-aberto_verde.mp4) | Guarde essa contradição. Se a técnica não funciona na maioria das pessoas... |
| E1-69 | tela cheia | 10s | [E1-69_TELA_proximo-episodio-parte-2](mp4/parte-1/E1-69_TELA_proximo-episodio-parte-2.mp4) | No próximo episódio, a gente entra. Vai subir os andares, um por um... |

### Parte 2 — Os andares de cima

67 clipes · 517 s de material

| ID | Tipo | Dur. | Arquivo | Entra em (fala) |
|---|---|---|---|---|
| E2-01 | tela cheia · sóbrio | 14s | [E2-01_TELA_folha-respeitar-o-lider](mp4/parte-2/E2-01_TELA_folha-respeitar-o-lider.mp4) | Maranhão, 2026. Numa operação de resgate... folhas de papel com uma única frase, escrita à mão, várias vezes. |
| E2-02 | tela cheia | 6s | [E2-02_TELA_titulo-parte-2](mp4/parte-2/E2-02_TELA_titulo-parte-2.mp4) | Ninguém chega a lugar nenhum de uma vez. Chega por andares. (cartela de título) |
| E2-03 | tela cheia | 10s | [E2-03_TELA_no-episodio-anterior](mp4/parte-2/E2-03_TELA_no-episodio-anterior.mp4) | No primeiro episódio, a gente ficou na porta de entrada. |
| E2-04 | sobreposição | 6s | [E2-04_SOBRE_marcador-anomalia-lembrete](mp4/parte-2/E2-04_SOBRE_marcador-anomalia-lembrete_verde.mp4) | E ficou uma anomalia... E por que alguém acordaria uma sócia às duas e meia da manhã? |
| E2-05 | tela cheia | 4s | [E2-05_TELA_capitulo-i](mp4/parte-2/E2-05_TELA_capitulo-i.mp4) | Quase todo grupo de alta demanda funciona como um funil. |
| E2-06 | tela cheia | 9s | [E2-06_TELA_funil-visao-geral](mp4/parte-2/E2-06_TELA_funil-visao-geral.mp4) | Na boca do funil entra muita gente. Lá embaixo sai pouca. |
| E2-07 | tela cheia | 7s | [E2-07_TELA_modelo-bite](mp4/parte-2/E2-07_TELA_modelo-bite.mp4) | O psicólogo Steven Hassan resumiu o que acontece lá dentro em quatro letras: BITE. |
| E2-08 | sobreposição | 5s | [E2-08_SOBRE_nome-steven-hassan](mp4/parte-2/E2-08_SOBRE_nome-steven-hassan_verde.mp4) | O psicólogo Steven Hassan... |
| E2-09 | tela cheia | 6s | [E2-09_TELA_funil-andar-1](mp4/parte-2/E2-09_TELA_funil-andar-1.mp4) | O primeiro andar você já conhece: o pé na porta. |
| E2-10 | tela cheia | 6s | [E2-10_TELA_funil-andar-2](mp4/parte-2/E2-10_TELA_funil-andar-2.mp4) | O segundo andar é o vocabulário. |
| E2-11 | tela cheia | 9s | [E2-11_TELA_duvida-yoes-bajos](mp4/parte-2/E2-11_TELA_duvida-yoes-bajos.mp4) | as dúvidas dos alunos tinham nome, segundo o Ministério Público argentino: yoes bajos. |
| E2-12 | tela cheia | 6s | [E2-12_TELA_funil-andar-3](mp4/parte-2/E2-12_TELA_funil-andar-3.mp4) | O terceiro andar é o segredo. |
| E2-13 | tela cheia | 9s | [E2-13_TELA_anotar-proibido](mp4/parte-2/E2-13_TELA_anotar-proibido.mp4) | Na Pró-Vida dos anos 1990, segundo a repórter da Marie Claire que se infiltrou no curso, era proibido anotar. |
| E2-14 | tela cheia | 11s | [E2-14_TELA_conteudo-dos-niveis](mp4/parte-2/E2-14_TELA_conteudo-dos-niveis.mp4) | Em 2004, uma dissertação de mestrado no Instituto de Psicologia da USP... descreveu o conteúdo. |
| E2-15 | tela cheia | 9s | [E2-15_TELA_citacao-usp-caracteristicas](mp4/parte-2/E2-15_TELA_citacao-usp-caracteristicas.mp4) | O autor concluiu que a Pró-Vida se reveste das características de seita. Uma ressalva necessária... |
| E2-16 | tela cheia | 7s | [E2-16_TELA_e-igual-mc2](mp4/parte-2/E2-16_TELA_e-igual-mc2.mp4) | E igual a m c ao quadrado é, provavelmente, a equação mais citada por gente que nunca fez a conta. |
| E2-17 | sobreposição | 5s | [E2-17_SOBRE_nome-gerald-bronner](mp4/parte-2/E2-17_SOBRE_nome-gerald-bronner_verde.mp4) | Sobre a Nova Acrópole, o sociólogo francês Gérald Bronner a cita... |
| E2-18 | sobreposição | 5s | [E2-18_SOBRE_selo-nova-acropole-rejeita](mp4/parte-2/E2-18_SOBRE_selo-nova-acropole-rejeita_verde.mp4) | A Nova Acrópole rejeita a classificação de seita. |
| E2-19 | tela cheia | 6s | [E2-19_TELA_funil-andar-4](mp4/parte-2/E2-19_TELA_funil-andar-4.mp4) | O quarto andar: quem sobe é escolhido. |
| E2-20 | tela cheia | 9s | [E2-20_TELA_introducao-depois-do-avancado](mp4/parte-2/E2-20_TELA_introducao-depois-do-avancado.mp4) | Depois do Básico vinham o Avançado 1, a Introdução e os Avançados de 2 a 7. Sim. A Introdução vinha depois do Avançado 1. |
| E2-21 | tela cheia | 6s | [E2-21_TELA_funil-andar-5](mp4/parte-2/E2-21_TELA_funil-andar-5.mp4) | O quinto andar é o dinheiro e o patrimônio. |
| E2-22 | tela cheia | 8s | [E2-22_TELA_etimologia-dizimo](mp4/parte-2/E2-22_TELA_etimologia-dizimo.mp4) | Dízimo vem do latim decimus, a décima parte. |
| E2-23 | tela cheia | 11s | [E2-23_TELA_ficha-chale](mp4/parte-2/E2-23_TELA_ficha-chale.mp4) | Um processo de 2019 no Tribunal de Justiça de São Paulo mostra que o modelo continuava... Traduzindo: se você sai do grupo, você sai do chalé. |
| E2-24 | tela cheia | 6s | [E2-24_TELA_funil-andar-6](mp4/parte-2/E2-24_TELA_funil-andar-6.mp4) | O sexto andar: sair custa caro. |
| E2-25 | tela cheia | 9s | [E2-25_TELA_chale-devolucao-revenda](mp4/parte-2/E2-25_TELA_chale-devolucao-revenda.mp4) | Recebeu cerca de 5 mil dólares pela devolução do chalé. Segundo ela, o chalé foi revendido por 25 mil. |
| E2-26 | tela cheia | 7s | [E2-26_TELA_citacao-nao-agredimos](mp4/parte-2/E2-26_TELA_citacao-nao-agredimos.mp4) | Em 2013, a um jornal de Minas Gerais, a Pró-Vida disse... "não agredimos os que nos contrariam". |
| E2-27 | tela cheia | 4s | [E2-27_TELA_capitulo-ii](mp4/parte-2/E2-27_TELA_capitulo-ii.mp4) | Na Nova Acrópole, o que ex-integrantes de vários países descrevem acontece depois dos cursos. |
| E2-28 | sobreposição | 7s | [E2-28_SOBRE_selo-ex-integrantes](mp4/parte-2/E2-28_SOBRE_selo-ex-integrantes_verde.mp4) | Atenção: daqui em diante, o que vem é testemunho de ex-integrantes... |
| E2-29 | tela cheia | 11s | [E2-29_TELA_organograma-forcas-vivas](mp4/parte-2/E2-29_TELA_organograma-forcas-vivas.mp4) | Eles relatam um círculo interno chamado Forças Vivas... E existiria um Manual do Dirigente. |
| E2-30 | tela cheia | 9s | [E2-30_TELA_citacao-miviludes](mp4/parte-2/E2-30_TELA_citacao-miviludes.mp4) | Em 2018, a Miviludes disse à TV pública France 3 que a organização é "piramidal e militarmente hierarquizada". |
| E2-31 | tela cheia | 11s | [E2-31_TELA_relato-el-espanol](mp4/parte-2/E2-31_TELA_relato-el-espanol.mp4) | Em 2022, o jornal espanhol El Español publicou o relato de uma ex-integrante que passou dez anos no grupo. |
| E2-32 | sobreposição | 5s | [E2-32_SOBRE_contador-aguias-1-lembrete](mp4/parte-2/E2-32_SOBRE_contador-aguias-1-lembrete_verde.mp4) | É a águia do primeiro episódio. |
| E2-33 | tela cheia | 10s | [E2-33_TELA_citacao-relatorio-vivien](mp4/parte-2/E2-33_TELA_citacao-relatorio-vivien.mp4) | Em 1983, um relatório encomendado pelo governo francês, o Relatório Vivien, escreveu... |
| E2-34 | sobreposição | 5s | [E2-34_SOBRE_nome-goodrick-clarke](mp4/parte-2/E2-34_SOBRE_nome-goodrick-clarke_verde.mp4) | O historiador britânico Nicholas Goodrick-Clarke... |
| E2-35 | tela cheia | 12s | [E2-35_TELA_balanca-dois-lados](mp4/parte-2/E2-35_TELA_balanca-dois-lados.mp4) | Agora, o outro lado, que existe. O historiador das religiões Antoine Faivre concluiu, em 1996... |
| E2-36 | sobreposição | 6s | [E2-36_SOBRE_selo-contrapontos](mp4/parte-2/E2-36_SOBRE_selo-contrapontos_verde.mp4) | O historiador das religiões Antoine Faivre... Um centro de pesquisa da Universidade Laval... |
| E2-37 | sobreposição | 5s | [E2-37_SOBRE_selo-humanista-laica](mp4/parte-2/E2-37_SOBRE_selo-humanista-laica_verde.mp4) | E a Nova Acrópole se define como uma associação humanista, laica e apolítica... |
| E2-38 | tela cheia | 4s | [E2-38_TELA_capitulo-iii](mp4/parte-2/E2-38_TELA_capitulo-iii.mp4) | Até aqui, estamos falando de chalés, uniformes e cursos sem caderno. |
| E2-39 | tela cheia | 9s | [E2-39_TELA_esquire-belo-horizonte](mp4/parte-2/E2-39_TELA_esquire-belo-horizonte.mp4) | a revista Esquire tinha publicado uma lista dos nove lugares do mundo mais seguros em caso de guerra nuclear. Belo Horizonte estava na lista. |
| E2-40 | sobreposição | 5s | [E2-40_SOBRE_nome-jim-jones](mp4/parte-2/E2-40_SOBRE_nome-jim-jones_verde.mp4) | Em 1962, o fundador, Jim Jones, se mudou com a família para Belo Horizonte. |
| E2-41 | tela cheia · sóbrio | 7s | [E2-41_TELA_dateline-jonestown](mp4/parte-2/E2-41_TELA_dateline-jonestown.mp4) | Em 1978, na Guiana, mais de 900 seguidores de Jim Jones morreram em Jonestown. |
| E2-42 | tela cheia · sóbrio | 8s | [E2-42_TELA_dateline-buenos-aires-2022](mp4/parte-2/E2-42_TELA_dateline-buenos-aires-2022.mp4) | Agosto de 2022. A polícia argentina, com cooperação dos Estados Unidos, faz cerca de cinquenta buscas... |
| E2-43 | tela cheia · sóbrio | 11s | [E2-43_TELA_acusacao-escola-de-yoga](mp4/parte-2/E2-43_TELA_acusacao-escola-de-yoga.mp4) | A acusação é de associação ilícita, tráfico de pessoas para exploração sexual e lavagem de dinheiro... |
| E2-44 | tela cheia · sóbrio | 10s | [E2-44_TELA_linha-do-tempo-escola-de-yoga](mp4/parte-2/E2-44_TELA_linha-do-tempo-escola-de-yoga.mp4) | O caso tem idas e vindas. Em 2023, uma câmara federal anulou... |
| E2-45 | tela cheia · sóbrio | 4s | [E2-45_TELA_capitulo-iv](mp4/parte-2/E2-45_TELA_capitulo-iv.mp4) | No Brasil, o caso mais brutal de líder espiritual não envolve curso nenhum. |
| E2-46 | tela cheia · sóbrio | 8s | [E2-46_TELA_dateline-abadiania](mp4/parte-2/E2-46_TELA_dateline-abadiania.mp4) | Em dezembro de 2018, mulheres começaram a relatar, em rede nacional, abusos sexuais cometidos pelo médium João de Deus... |
| E2-47 | tela cheia · sóbrio | 10s | [E2-47_TELA_penas-joao-de-deus](mp4/parte-2/E2-47_TELA_penas-joao-de-deus.mp4) | Somadas, as penas chegaram a 489 anos e 4 meses. Em segunda instância, foram readequadas para cerca de 214 anos... |
| E2-48 | tela cheia · sóbrio | 8s | [E2-48_TELA_dateline-paco-do-lumiar](mp4/parte-2/E2-48_TELA_dateline-paco-do-lumiar.mp4) | Abril de 2026. Paço do Lumiar, região metropolitana de São Luís... |
| E2-49 | tela cheia · sóbrio | 9s | [E2-49_TELA_resgate-maranhao](mp4/parte-2/E2-49_TELA_resgate-maranhao.mp4) | Em maio, uma força-tarefa... resgatou cerca de 40 pessoas no local, em condição análoga à de escravo. |
| E2-50 | tela cheia · sóbrio | 9s | [E2-50_TELA_doutrina-acima-da-pessoa](mp4/parte-2/E2-50_TELA_doutrina-acima-da-pessoa.mp4) | É o sétimo critério de Lifton, a doutrina acima da pessoa, no formato de castigo de escola. |
| E2-51 | sobreposição | 5s | [E2-51_SOBRE_selo-o-imparcial](mp4/parte-2/E2-51_SOBRE_selo-o-imparcial_verde.mp4) | parte dos resgatados não se reconhece como vítima. Alguns tentaram voltar para o sítio. |
| E2-52 | tela cheia · sóbrio | 8s | [E2-52_TELA_dateline-shakahola](mp4/parte-2/E2-52_TELA_dateline-shakahola.mp4) | E há o fundo do poço. Em 2023, na floresta de Shakahola, no Quênia... |
| E2-53 | tela cheia | 4s | [E2-53_TELA_capitulo-v](mp4/parte-2/E2-53_TELA_capitulo-v.mp4) | Agora, de volta à anomalia do primeiro episódio. |
| E2-54 | tela cheia | 10s | [E2-54_TELA_barker-retencao](mp4/parte-2/E2-54_TELA_barker-retencao.mp4) | Barker acompanhou quem passava pelos workshops de recrutamento de dois dias... cerca de 5% continuavam membros em tempo integral. |
| E2-55 | tela cheia | 10s | [E2-55_TELA_tese-nos-tribunais](mp4/parte-2/E2-55_TELA_tese-nos-tribunais.mp4) | Em 1987, a Associação Americana de Psicologia rejeitou um relatório coordenado pela psicóloga Margaret Singer... |
| E2-56 | sobreposição | 5s | [E2-56_SOBRE_nome-margaret-singer](mp4/parte-2/E2-56_SOBRE_nome-margaret-singer_verde.mp4) | a psicóloga Margaret Singer, a principal defensora da tese da lavagem cerebral nos tribunais. |
| E2-57 | tela cheia | 7s | [E2-57_TELA_coisa-mais-chata](mp4/parte-2/E2-57_TELA_coisa-mais-chata.mp4) | Então lavagem cerebral não existe? Existe uma coisa mais chata. E, por ser chata, funciona melhor. |
| E2-58 | sobreposição | 5s | [E2-58_SOBRE_nome-janja-lalich](mp4/parte-2/E2-58_SOBRE_nome-janja-lalich_verde.mp4) | A socióloga Janja Lalich chama isso de escolha limitada. |
| E2-59 | tela cheia | 16s | [E2-59_TELA_escolha-limitada](mp4/parte-2/E2-59_TELA_escolha-limitada.mp4) | Assistir a mais uma palestra é razoável. Fazer o próximo nível é razoável... Até que um dia sair significa perder a casa de campo... |
| E2-60 | tela cheia | 7s | [E2-60_TELA_o-chale-e-a-lavagem](mp4/parte-2/E2-60_TELA_o-chale-e-a-lavagem.mp4) | O chalé é a lavagem cerebral. E nem tinha escritura. |
| E2-61 | tela cheia | 11s | [E2-61_TELA_festinger-clarion](mp4/parte-2/E2-61_TELA_festinger-clarion.mp4) | Em 1954, o psicólogo Leon Festinger se infiltrou num grupo da região de Chicago que esperava o fim do mundo... |
| E2-62 | tela cheia | 7s | [E2-62_TELA_dissonancia-cognitiva](mp4/parte-2/E2-62_TELA_dissonancia-cognitiva.mp4) | O nome técnico disso é dissonância cognitiva... O nome popular é "agora que eu já peguei o chalé". |
| E2-63 | tela cheia | 9s | [E2-63_TELA_janela-dissidente](mp4/parte-2/E2-63_TELA_janela-dissidente.mp4) | E isso responde à pergunta das duas e meia da manhã... E janela aberta, numa casa assim, se fecha de madrugada. |
| E2-64 | sobreposição | 6s | [E2-64_SOBRE_marcador-anomalia-respondida](mp4/parte-2/E2-64_SOBRE_marcador-anomalia-respondida_verde.mp4) | Um dissidente é uma janela aberta. |
| E2-65 | tela cheia | 7s | [E2-65_TELA_todos-tinham-titulo](mp4/parte-2/E2-65_TELA_todos-tinham-titulo.mp4) | Até agora, todos os personagens desta série tinham um título. Mestre. Comandante Mundial. Anjo. Médium. |
| E2-66 | sobreposição | 7s | [E2-66_SOBRE_marcador-cacadores-aberto](mp4/parte-2/E2-66_SOBRE_marcador-cacadores-aberto_verde.mp4) | Só que o erro mais grave desta série não foi cometido por um guru. Foi cometido por quem estava caçando seitas. |
| E2-67 | tela cheia | 10s | [E2-67_TELA_proximo-episodio-parte-3](mp4/parte-2/E2-67_TELA_proximo-episodio-parte-3.mp4) | No último episódio, a gente vai até lá... |

### Parte 3 — A segunda águia

56 clipes · 457 s de material

| ID | Tipo | Dur. | Arquivo | Entra em (fala) |
|---|---|---|---|---|
| E3-01 | tela cheia · sóbrio | 11s | [E3-01_TELA_fitas-cassete](mp4/parte-3/E3-01_TELA_fitas-cassete.mp4) | Em 1992, no litoral do Paraná, a polícia gravou em fitas cassete as confissões... Elas diziam outra coisa. |
| E3-02 | tela cheia | 6s | [E3-02_TELA_titulo-parte-3](mp4/parte-3/E3-02_TELA_titulo-parte-3.mp4) | Logo depois do gancho de abertura (cartela de título). |
| E3-03 | tela cheia | 11s | [E3-03_TELA_nos-episodios-anteriores](mp4/parte-3/E3-03_TELA_nos-episodios-anteriores.mp4) | Nos dois primeiros episódios, a gente atravessou a porta de entrada e subiu os andares. |
| E3-04 | tela cheia | 4s | [E3-04_TELA_capitulo-i](mp4/parte-3/E3-04_TELA_capitulo-i.mp4) | Antes do Paraná, uma escala nos Estados Unidos. |
| E3-05 | sobreposição | 5s | [E3-05_SOBRE_nome-ted-patrick](mp4/parte-3/E3-05_SOBRE_nome-ted-patrick_verde.mp4) | O mais famoso foi Ted Patrick. |
| E3-06 | tela cheia | 10s | [E3-06_TELA_desprogramacao](mp4/parte-3/E3-06_TELA_desprogramacao.mp4) | O método era direto. A família pagava. A equipe abordava o filho na rua, colocava num carro... |
| E3-07 | tela cheia | 10s | [E3-07_TELA_leilao-cult-awareness-network](mp4/parte-3/E3-07_TELA_leilao-cult-awareness-network.mp4) | A rede quebrou. No leilão da falência, o nome, o logotipo e a linha telefônica foram arrematados por um membro da Cientologia. |
| E3-08 | tela cheia | 9s | [E3-08_TELA_artigo-148](mp4/parte-3/E3-08_TELA_artigo-148.mp4) | No Brasil, desprogramar alguém à força tem nome no Código Penal: sequestro e cárcere privado, artigo 148. |
| E3-09 | tela cheia · sóbrio | 4s | [E3-09_TELA_capitulo-ii](mp4/parte-3/E3-09_TELA_capitulo-ii.mp4) | Guaratuba, litoral do Paraná. Segunda-feira, 6 de abril de 1992. |
| E3-10 | tela cheia · sóbrio | 9s | [E3-10_TELA_dateline-guaratuba](mp4/parte-3/E3-10_TELA_dateline-guaratuba.mp4) | Evandro Ramos Caetano, de seis anos, desaparece. Cinco dias depois, o corpo é encontrado num matagal. |
| E3-11 | sobreposição | 6s | [E3-11_SOBRE_contador-aguias-2](mp4/parte-3/E3-11_SOBRE_contador-aguias-2_verde.mp4) | No começo de julho, um grupo da Polícia Militar do Paraná entra no caso. O nome dele era Grupo Águia. |
| E3-12 | tela cheia · sóbrio | 10s | [E3-12_TELA_magia-negra-de-volta](mp4/parte-3/E3-12_TELA_magia-negra-de-volta.mp4) | Durante meio século, o Estado brasileiro guardou objetos de terreiro numa coleção chamada Magia Negra... Em 1992, a expressão voltou à primeira página. |
| E3-13 | tela cheia · sóbrio | 13s | [E3-13_TELA_linha-do-tempo-caso-evandro](mp4/parte-3/E3-13_TELA_linha-do-tempo-caso-evandro.mp4) | Vieram cinco júris, entre 1998 e 2011... Em 31 de março de 2026, o STF declarou o trânsito em julgado. |
| E3-14 | sobreposição | 5s | [E3-14_SOBRE_nome-ivan-mizanzuk](mp4/parte-3/E3-14_SOBRE_nome-ivan-mizanzuk_verde.mp4) | Em 2018, o professor Ivan Mizanzuk começou a contar o caso no podcast Projeto Humanos. |
| E3-15 | tela cheia · sóbrio | 11s | [E3-15_TELA_decisao-tjpr](mp4/parte-3/E3-15_TELA_decisao-tjpr.mp4) | Em 9 de novembro de 2023, por três votos a dois, o Tribunal de Justiça do Paraná julgou procedente a revisão criminal. |
| E3-16 | tela cheia · sóbrio | 9s | [E3-16_TELA_trinta-e-um-anos-definitivo](mp4/parte-3/E3-16_TELA_trinta-e-um-anos-definitivo.mp4) | Trinta e um anos depois... O assassinato de um menino de seis anos continua, oficialmente, sem autor. |
| E3-17 | tela cheia | 11s | [E3-17_TELA_duas-aguias](mp4/parte-3/E3-17_TELA_duas-aguias.mp4) | A primeira águia desta série aparece num grupo que ex-integrantes descrevem como seita... A segunda pertencia a quem estava caçando uma seita. |
| E3-18 | sobreposição | 6s | [E3-18_SOBRE_marcador-cacadores-respondido](mp4/parte-3/E3-18_SOBRE_marcador-cacadores-respondido_verde.mp4) | O erro foi achar que a palavra bastava. |
| E3-19 | tela cheia | 4s | [E3-19_TELA_capitulo-iii](mp4/parte-3/E3-19_TELA_capitulo-iii.mp4) | No episódio anterior, eu prometi os tribunais da Nova Acrópole. |
| E3-20 | tela cheia | 11s | [E3-20_TELA_citacao-tgi-paris-1982](mp4/parte-3/E3-20_TELA_citacao-tgi-paris-1982.mp4) | Paris, 1982. A Nova Acrópole processa por difamação o jornalista Alain Woodrow, do Le Monde, e perde. |
| E3-21 | tela cheia | 8s | [E3-21_TELA_placar-um-a-um](mp4/parte-3/E3-21_TELA_placar-um-a-um.mp4) | Placar: um a um. Quem procura um veredito simples sobre a Nova Acrópole na Justiça francesa encontra um empate. |
| E3-22 | tela cheia | 12s | [E3-22_TELA_notas-de-rodape](mp4/parte-3/E3-22_TELA_notas-de-rodape.mp4) | Há mais duas notas de rodapé. A lista parlamentar francesa de 1995... foi declarada obsoleta pelo próprio governo em 2005. |
| E3-23 | tela cheia | 10s | [E3-23_TELA_pro-vida-na-justica](mp4/parte-3/E3-23_TELA_pro-vida-na-justica.mp4) | A Pró-Vida também não tem condenação. E a sócia das duas e meia da manhã? Ela processou o movimento... |
| E3-24 | tela cheia | 11s | [E3-24_TELA_codigo-civil-chale](mp4/parte-3/E3-24_TELA_codigo-civil-chale.mp4) | O artigo 57 do Código Civil diz que um associado só pode ser excluído por justa causa... O Código Civil não sabe o que é Tela Mental. |
| E3-25 | tela cheia | 4s | [E3-25_TELA_capitulo-iv](mp4/parte-3/E3-25_TELA_capitulo-iv.mp4) | Falta um tribunal: o de Tóquio, prometido lá no primeiro episódio. |
| E3-26 | tela cheia · sóbrio | 8s | [E3-26_TELA_dateline-nara-2022](mp4/parte-3/E3-26_TELA_dateline-nara-2022.mp4) | Julho de 2022. O ex-primeiro-ministro japonês Shinzo Abe é morto a tiros durante um comício. |
| E3-27 | sobreposição | 5s | [E3-27_SOBRE_selo-imprensa-japonesa](mp4/parte-3/E3-27_SOBRE_selo-imprensa-japonesa_verde.mp4) | Segundo a imprensa japonesa, a mãe dele tinha doado à igreja cerca de 100 milhões de ienes... |
| E3-28 | tela cheia | 12s | [E3-28_TELA_linha-do-tempo-japao](mp4/parte-3/E3-28_TELA_linha-do-tempo-japao.mp4) | Em dezembro de 2022, o Japão aprovou uma lei contra a solicitação abusiva de doações... |
| E3-29 | tela cheia | 10s | [E3-29_TELA_recibo-dissolucao](mp4/parte-3/E3-29_TELA_recibo-dissolucao.mp4) | Não precisou provar lavagem cerebral... O grupo mais associado a lavagem cerebral no século 20 caiu pelo argumento mais tedioso do Direito: o recibo. |
| E3-30 | sobreposição | 5s | [E3-30_SOBRE_selo-lamentavel-e-injusta](mp4/parte-3/E3-30_SOBRE_selo-lamentavel-e-injusta_verde.mp4) | Sobre a primeira decisão, a igreja disse que ela era "lamentável e injusta". |
| E3-31 | tela cheia | 10s | [E3-31_TELA_lei-francesa-2024](mp4/parte-3/E3-31_TELA_lei-francesa-2024.mp4) | A França chegou ao mesmo lugar por outro caminho. Uma lei de maio de 2024 criou o crime de colocar ou manter alguém em estado de sujeição... |
| E3-32 | tela cheia | 12s | [E3-32_TELA_artigos-brasileiros](mp4/parte-3/E3-32_TELA_artigos-brasileiros.mp4) | No Brasil, não existe crime de seita... Mas existe o estelionato, artigo 171 do Código Penal. |
| E3-33 | tela cheia | 4s | [E3-33_TELA_capitulo-v](mp4/parte-3/E3-33_TELA_capitulo-v.mp4) | Se você chegou até aqui esperando que eu dissesse qual desses grupos é uma seita... |
| E3-34 | tela cheia | 12s | [E3-34_TELA_tese-comportamentos](mp4/parte-3/E3-34_TELA_tese-comportamentos.mp4) | Seita não é um tipo de organização. É um conjunto de comportamentos. Engano na entrada... |
| E3-35 | tela cheia | 8s | [E3-35_TELA_miviludes-denuncias](mp4/parte-3/E3-35_TELA_miviludes-denuncias.mp4) | Segundo o relatório de atividade da Miviludes, as denúncias... passaram de 2.160 em 2015 para 4.571 em 2024. |
| E3-36 | tela cheia | 8s | [E3-36_TELA_miviludes-categorias](mp4/parte-3/E3-36_TELA_miviludes-categorias.mp4) | E a primeira categoria já não é religião. É saúde e bem-estar, com 37% das denúncias... |
| E3-37 | tela cheia | 9s | [E3-37_TELA_curso-introdutorio-de-hoje](mp4/parte-3/E3-37_TELA_curso-introdutorio-de-hoje.mp4) | O curso introdutório não precisa mais de sala. Tem link na bio, contagem regressiva e grupo VIP. |
| E3-38 | tela cheia | 4s | [E3-38_TELA_capitulo-vi](mp4/parte-3/E3-38_TELA_capitulo-vi.mp4) | Prometi oito perguntas no primeiro episódio. Aqui estão. |
| E3-39 | sobreposição | 5s | [E3-39_SOBRE_marcador-oito-perguntas-respondido](mp4/parte-3/E3-39_SOBRE_marcador-oito-perguntas-respondido_verde.mp4) | Prometi oito perguntas no primeiro episódio. Aqui estão. |
| E3-40 | tela cheia | 6s | [E3-40_TELA_pergunta-1](mp4/parte-3/E3-40_TELA_pergunta-1.mp4) | A primeira: posso conversar com ex-integrantes... |
| E3-41 | tela cheia | 6s | [E3-41_TELA_pergunta-2](mp4/parte-3/E3-41_TELA_pergunta-2.mp4) | A segunda: o que acontece se eu sair? |
| E3-42 | tela cheia | 6s | [E3-42_TELA_pergunta-3](mp4/parte-3/E3-42_TELA_pergunta-3.mp4) | A terceira: para onde vai o dinheiro? |
| E3-43 | tela cheia | 6s | [E3-43_TELA_pergunta-4](mp4/parte-3/E3-43_TELA_pergunta-4.mp4) | A quarta: a quem o líder presta contas? |
| E3-44 | tela cheia | 6s | [E3-44_TELA_pergunta-5](mp4/parte-3/E3-44_TELA_pergunta-5.mp4) | A quinta: o que se ensina nos níveis de cima? |
| E3-45 | tela cheia | 6s | [E3-45_TELA_pergunta-6](mp4/parte-3/E3-45_TELA_pergunta-6.mp4) | A sexta: quanto custa o programa inteiro? |
| E3-46 | tela cheia | 6s | [E3-46_TELA_pergunta-7](mp4/parte-3/E3-46_TELA_pergunta-7.mp4) | A sétima: a organização já foi citada em relatório oficial ou em processo? |
| E3-47 | tela cheia | 6s | [E3-47_TELA_pergunta-8](mp4/parte-3/E3-47_TELA_pergunta-8.mp4) | A oitava: posso anotar, gravar e mostrar o material a quem eu quiser? |
| E3-48 | tela cheia | 8s | [E3-48_TELA_perguntas-visao-geral](mp4/parte-3/E3-48_TELA_perguntas-visao-geral.mp4) | Repare que nenhuma pergunta é sobre crença. |
| E3-49 | tela cheia | 9s | [E3-49_TELA_grupo-que-nao-responde](mp4/parte-3/E3-49_TELA_grupo-que-nao-responde.mp4) | Um grupo saudável responde às oito sem levantar a voz. Um grupo que não responde já respondeu. |
| E3-50 | tela cheia | 12s | [E3-50_TELA_teste-do-canal](mp4/parte-3/E3-50_TELA_teste-do-canal.mp4) | Eu disse que elas funcionavam contra este canal. Vamos lá. |
| E3-51 | tela cheia | 11s | [E3-51_TELA_como-ajudar](mp4/parte-3/E3-51_TELA_como-ajudar.mp4) | Não ridicularize. Não dê ultimato. Não corte contato. A família é a ponte de volta... |
| E3-52 | tela cheia | 9s | [E3-52_TELA_perguntas-abertas](mp4/parte-3/E3-52_TELA_perguntas-abertas.mp4) | Faça perguntas abertas e ouça as respostas. "O que você mais gosta lá?" |
| E3-53 | tela cheia | 12s | [E3-53_TELA_canais-de-ajuda](mp4/parte-3/E3-53_TELA_canais-de-ajuda.mp4) | E, se houver violência, exploração ou risco, existem canais que não cobram curso introdutório... |
| E3-54 | tela cheia | 9s | [E3-54_TELA_por-que-ela-foi-acordada](mp4/parte-3/E3-54_TELA_por-que-ela-foi-acordada.mp4) | Lembra da sócia das duas e meia da manhã? Ela não foi acordada por acreditar em pirâmides... (antes, reaproveite E1-01) |
| E3-55 | tela cheia | 10s | [E3-55_TELA_porta-de-entrada-porta-de-saida](mp4/parte-3/E3-55_TELA_porta-de-entrada-porta-de-saida.mp4) | A seita, quando existe, não fica na porta de entrada. Fica na de saída. A de entrada tem café. |
| E3-56 | tela cheia | 7s | [E3-56_TELA_fim-da-serie](mp4/parte-3/E3-56_TELA_fim-da-serie.mp4) | Encerramento (depois da última frase). |

