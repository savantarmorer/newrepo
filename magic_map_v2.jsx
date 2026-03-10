import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const CATEGORIES = {
  ancient:        { label:"Origens Antigas",              color:"#D4A843" },
  classical:      { label:"Clássico / Helenístico",       color:"#A06BC8" },
  medieval:       { label:"Medieval / Islâmico",          color:"#3DBFA8" },
  renaissance:    { label:"Renascimento",                  color:"#5B9ED6" },
  modern_western: { label:"Ocidentalismo Moderno",        color:"#D45B6E" },
  african:        { label:"Afrodiaspórico",                color:"#5BC87A" },
  asian:          { label:"Asiático / Oriental",          color:"#C8C83D" },
  norse:          { label:"Nórdico / Bruxaria Europeia",  color:"#7DC8C8" },
};

const NODES = [
  {
    id:"shaman", label:"Xamanismo Paleolítico", sublabel:"~40.000 aC", category:"ancient", size:19,
    region:"Global (Sibéria, Américas, África)",
    desc:"A forma mais antiga de prática mágica documentada. Baseada em viagem espiritual, estados alterados de consciência, cura e comunicação com espíritos. Evidências em pinturas rupestres de Lascaux e Chauvet. Presente em todos os continentes.",
    figures:["Mircea Eliade (estudioso)","Genghis Khan (legado xamânico)","Don Juan Matus (Castaneda)"],
    texts:["Shamanism: Archaic Techniques of Ecstasy (Eliade, 1951)","The Teachings of Don Juan (Castaneda, 1968)"],
  },
  {
    id:"heka", label:"Heka Egípcia", sublabel:"~4500 aC", category:"ancient", size:21,
    region:"Egito Antigo",
    desc:"Magia egípcia primordial. Heka (ḥkꜣ) era simultaneamente força cósmica e divindade — a energia operativa que tornou a criação possível. Ísis era a 'Grande de Magia' (Weret-Hekau). Quase 5.000 anos de prática contínua.",
    figures:["Ísis","Thoth","Imhotep","Rahotep"],
    texts:["Textos das Pirâmides (~2400 aC)","Textos dos Sarcófagos (~2100 aC)","Livro dos Mortos (~1550 aC)","Papiro de Ani"],
  },
  {
    id:"sumerian", label:"Magia Suméria", sublabel:"~3500 aC", category:"ancient", size:16,
    region:"Mesopotâmia (atual Iraque)",
    desc:"Primeiros registros escritos de magia. 30% das inscrições cuneiformes acadianas tratam de feitiçaria. Āšipu (sacerdote-exorcista) realizava rituais de proteção; Bārû praticava adivinhação por extispicina (leitura de vísceras).",
    figures:["Enheduanna (sacerdotisa de Inanna, ~2285 aC)","Gudea de Lagash"],
    texts:["Enuma Elish (~1700 aC)","Hino a Inanna (Enheduanna, 1ª autora identificada da história)"],
  },
  {
    id:"babylonian", label:"Magia Babilônica", sublabel:"~2000 aC", category:"ancient", size:17,
    region:"Babilônia (atual Iraque)",
    desc:"Sucessora direta da magia suméria. Inventou o zodíaco de 12 signos. Maqlû: série de ~100 encantamentos anti-bruxaria. Šurpu: ritual de purificação dirigido a Marduk.",
    figures:["Marduk (divindade)","Asurbanipal (colecionador de textos mágicos)"],
    texts:["Maqlû (início do 1º milênio aC)","Šurpu (~1350–1050 aC)","Enuma Anu Enlil (~1595–1157 aC, 6.500+ presságios)"],
  },
  {
    id:"vedic", label:"Magia Védica", sublabel:"~1500 aC", category:"ancient", size:14,
    region:"Vale do Indo / Sul da Ásia",
    desc:"Sistema mágico-religioso dos Vedas. Atharva Veda é o mais mágico, contendo encantamentos para cura, proteção e amor. Base do Tantra posterior.",
    figures:["Parashurama","Vishwamitra","Agastya"],
    texts:["Atharva Veda (~1200–1000 aC)","Rigveda (~1500 aC)","Upanishads (~800–400 aC)"],
  },
  {
    id:"greek_magic", label:"Magia Grega", sublabel:"~600 aC", category:"classical", size:17,
    region:"Grécia Antiga / Mediterrâneo",
    desc:"Distinção entre mageia, goeteia, theurgia e pharmakeia. Mais de 1.500 defixiones (tabuletas de maldição em chumbo) catalogadas entre 500 aC e 500 dC.",
    figures:["Circe (mítica)","Medeia (mítica)","Pythagoras","Empédocles","Apolônio de Tiana"],
    texts:["Defixiones (tabuletas de maldição, séc. V aC–V dC)","Hinos Órficos","Papiro de Derveni (~340 aC)"],
  },
  {
    id:"neoplatonism", label:"Neoplatonismo / Teurgia", sublabel:"~250 dC", category:"classical", size:17,
    region:"Alexandria / Roma",
    desc:"Transformou a magia em filosofia. Iâmblico argumentou que os rituais físicos — não o pensamento puro — unem os teurgos aos deuses. Proclo integrou a teurgia ao sistema filosófico completo.",
    figures:["Plotino (205–270)","Porfírio (234–305)","Iâmblico (245–325)","Proclo (412–485)"],
    texts:["Enéadas (Plotino)","De Mysteriis (Iâmblico, ~315 dC)","Oráculos Caldeus (~170 dC)"],
  },
  {
    id:"pgm", label:"Papiros Mágicos Gregos", sublabel:"séc. II aC–V dC", category:"classical", size:16,
    region:"Egito greco-romano",
    desc:"O maior corpus de magia sincrética da antiguidade. Escritos em grego, demótico e copta, invocam deuses egípcios, gregos, judaicos e mesopotâmicos simultaneamente.",
    figures:["Apolônio de Tiana (atribuído)"],
    texts:["PGM I–CXXX (coletânea, séc. II aC–V dC)","Papiro de Londres 46","Papiro de Paris (PGM IV, o mais extenso)"],
  },
  {
    id:"hermetism", label:"Hermetismo", sublabel:"~200 dC", category:"classical", size:21,
    region:"Alexandria, Egito",
    desc:"Corpus Hermeticum: 17 tratados gregos produzidos no Egito greco-romano. Atribuído a Hermes Trismegisto (fusão de Thoth + Hermes). Tábua de Esmeralda: 'O que está embaixo é como o que está em cima'. Isaac Newton fez sua própria tradução.",
    figures:["Hermes Trismegisto (mítico)","Marsilio Ficino (1433–1499, tradutor)","Giordano Bruno (1548–1600)"],
    texts:["Corpus Hermeticum (séc. I–III dC)","Tábua de Esmeralda (fontes árabes séc. VIII–X)","Asclepius","Kybalion (1908)"],
  },
  {
    id:"merkabah", label:"Misticismo Merkabah", sublabel:"~100 dC", category:"classical", size:13,
    region:"Judeia / Palestina",
    desc:"Ascensão mística judaica através de palácios celestiais (Hekhalot) até o trono-carruagem divino (Merkabah). Precursor direto da Kabbalah. Baseado na visão de Ezequiel.",
    figures:["Rabbi Akiva","Rabbi Ishmael","Rabbi Shimon bar Yochai (atribuído)"],
    texts:["Sefer Hekhalot (3 Enoque)","Sefer Yetzirah (séc. III–VI)","Shiur Komah"],
  },
  {
    id:"arabic", label:"Transmissão Árabe", sublabel:"séc. VIII–XII", category:"medieval", size:19,
    region:"Bagdá / al-Andalus / Sicília",
    desc:"Tradutores árabes preservaram e enriqueceram textos gregos, herméticos e persas. Sem esta rota, o Renascimento europeu não teria ocorrido. Centros: Bayt al-Hikma (Bagdá), Toledo, Palermo.",
    figures:["al-Kindi (801–873, teoria dos raios estelares)","Abu Ma'shar (787–886, astrologia)","Ibn Rushd / Averróis"],
    texts:["Picatrix (Ghāyat al-Ḥakīm, ~954)","Secretum Secretorum","Kitab al-Istamatis"],
  },
  {
    id:"picatrix", label:"Picatrix", sublabel:"~954 dC", category:"medieval", size:14,
    region:"al-Andalus (Córdoba)",
    desc:"Ghāyat al-Ḥakīm de Maslama al-Qurtubi. Manual mais completo de magia astral medieval: 400 páginas, 2.323 rituais, compilado de mais de 200 fontes.",
    figures:["Maslama al-Qurtubi (compilador)","Alfonso X de Castela (patrocinador da tradução)"],
    texts:["Picatrix / Ghāyat al-Ḥakīm (~954 dC, 4 livros)"],
  },
  {
    id:"sihr", label:"Sihr / Magia Islâmica", sublabel:"séc. VII dC", category:"medieval", size:12,
    region:"Península Arábica / Norte da África",
    desc:"Magia árabe pré e pós-islâmica. Kahins eram videntes pré-islâmicos que se comunicavam com jinn. Sihr abrange alquimia, talismãs, adivinhação e invocação.",
    figures:["Sulayman / Salomão (controle de jinn)","Al-Buni (séc. XIII, Shams al-Ma'arif)"],
    texts:["Shams al-Ma'arif (al-Buni, séc. XIII)","Kitab al-Falakiyya"],
  },
  {
    id:"grimoires", label:"Grimórios Medievais", sublabel:"séc. XII–XV", category:"medieval", size:15,
    region:"Europa / Oriente Próximo",
    desc:"Manuais de magia prática — evocação de espíritos, fabricação de talismãs, círculos mágicos. A Chave de Salomão é o arquétipo. Circulavam em manuscritos copiados clandestinamente.",
    figures:["Pseudo-Salomão","Pietro d'Abano (atribuído, 1250–1316)"],
    texts:["Clavicula Salomonis / Chave de Salomão (séc. XIV–XV)","Lemegeton / Chave Menor (séc. XVII)","Ars Goetia (72 demônios)","Heptameron","Liber Juratus (séc. XIII)"],
  },
  {
    id:"kabbalah", label:"Kabbalah Judaica", sublabel:"séc. XII–XIII", category:"medieval", size:19,
    region:"Provença / Espanha / Safed",
    desc:"Mística judaica sistematizada. 10 Sefirot na Árvore da Vida, 22 letras hebraicas = 32 caminhos de sabedoria. Isaac Luria (o 'Ari', 1534–1572) em Safed sistematizou tzimtzum, shevirat ha-kelim e tikkun.",
    figures:["Isaac Luria / 'Ari' (1534–1572)","Moses de León (~1250–1305, Zohar)","Abraham Abulafia (1240–1291)","Baal Shem Tov (1698–1760)"],
    texts:["Sefer Yetzirah (séc. III–VI)","Sefer ha-Bahir (1176)","Zohar (1280–1286)","Etz Chaim (Luria/Vital, séc. XVI)"],
  },
  {
    id:"christian_kab", label:"Kabbalah Cristã", sublabel:"Pico, 1486", category:"renaissance", size:15,
    region:"Florença / Renânia",
    desc:"Giovanni Pico della Mirandola declarou que 'a magia e a Kabbalah são as melhores provas da divindade de Cristo'. Johannes Reuchlin sistematizou em De Arte Cabalistica (1517).",
    figures:["Giovanni Pico della Mirandola (1463–1494)","Johannes Reuchlin (1455–1522)","Francesco Giorgi (1466–1540)"],
    texts:["900 Teses (Pico, 1486)","De Arte Cabalistica (Reuchlin, 1517)","De Harmonia Mundi (Giorgi, 1525)"],
  },
  {
    id:"ficino", label:"Hermetismo Renascentista", sublabel:"Ficino, 1463", category:"renaissance", size:19,
    region:"Florença, Itália",
    desc:"Marsilio Ficino traduziu o Corpus Hermeticum em 1463 a pedido de Cosimo de' Medici, que ordenou priorizar Hermes sobre Platão. Seu De Vita Libri Tres incorporou magia astrológica.",
    figures:["Marsilio Ficino (1433–1499)","Cosimo de' Medici (1389–1464, mecenas)","Lorenzo de' Medici"],
    texts:["Corpus Hermeticum (trad. Ficino, 1463)","De Vita Libri Tres (Ficino, 1489)","Theologia Platonica (Ficino, 1482)"],
  },
  {
    id:"agrippa", label:"Filosofia Oculta", sublabel:"Agrippa, 1531", category:"renaissance", size:21,
    region:"Colônia / Europa Central",
    desc:"Heinrich Cornelius Agrippa (1486–1535) produziu a maior síntese renascentista. Três mundos: Livro I (Magia Natural), Livro II (Magia Celestial), Livro III (Magia Cerimonial/Kabbalah). A fonte principal da Golden Dawn.",
    figures:["Heinrich Cornelius Agrippa (1486–1535)","Johannes Trithemius (1462–1516, mentor)","Paracelso (1493–1541)"],
    texts:["Tres Libros de Filosofia Oculta (1531–33)","De Vanitate Scientiarum (1530)"],
  },
  {
    id:"enochian", label:"Magia Enoquiana", sublabel:"John Dee, 1582", category:"renaissance", size:16,
    region:"Londres / Cracóvia",
    desc:"Sistema desenvolvido por John Dee e Edward Kelley a partir de 1582. Linguagem angélica de 21 letras revelada letra por letra. Grande Tábua com quatro Torres de Vigia elementais e 30 Aethyrs.",
    figures:["John Dee (1527–1608/9, matemático e espia da rainha Elizabeth I)","Edward Kelley (1555–1597, vidente)"],
    texts:["Cinco Libros de Mysteriis (diários de Dee)","A True and Faithful Relation (Méric Casaubon, 1659)"],
  },
  {
    id:"rosicrucian", label:"Rosacrucianismo", sublabel:"1614–1616", category:"renaissance", size:18,
    region:"Württemberg, Alemanha",
    desc:"Três manifestos produzidos por grupo luterano liderado por Andreae: Fama Fraternitatis (1614), Confessio (1615), Bodas Químicas (1616). As Bodas abrem com o símbolo de John Dee.",
    figures:["Johann Valentin Andreae (1586–1654)","Robert Fludd (1574–1637)","Michael Maier (1568–1622)","Elias Ashmole (1617–1692)"],
    texts:["Fama Fraternitatis (1614)","Confessio Fraternitatis (1615)","Bodas Químicas de Christian Rosenkreutz (1616)"],
  },
  {
    id:"alchemy", label:"Alquimia", sublabel:"séc. II–XVII", category:"renaissance", size:14,
    region:"Egito / Árabe / Europa",
    desc:"Fusão de metalurgia, filosofia natural e mística. Paracelso revolucionou transformando-a em base da medicina química. Transmutação de metais como metáfora da purificação espiritual.",
    figures:["Jabir ibn Hayyan / Geber (séc. VIII)","Paracelso (1493–1541)","Nicolas Flamel (1330–1418, lendário)","Robert Boyle (1627–1691)"],
    texts:["Tabula Smaragdina","Rosarium Philosophorum (1550)","Atalanta Fugiens (Maier, 1617)"],
  },
  {
    id:"levi", label:"Éliphas Lévi", sublabel:"1855", category:"modern_western", size:17,
    region:"Paris, França",
    desc:"Alphonse Louis Constant (1810–1875) é o arquiteto do ocultismo moderno. Conectou o Tarot à Kabbalah, criou a imagem moderna do Baphomet, introduziu a 'Luz Astral'. Crowley alegava ser sua reencarnação.",
    figures:["Éliphas Lévi (1810–1875)","Papus / Gérard Encausse (1865–1916, discípulo)"],
    texts:["Dogme et Rituel de la Haute Magie (1854–56)","Histoire de la Magie (1860)","La Clef des Grands Mystères (1861)"],
  },
  {
    id:"masonry", label:"Maçonaria", sublabel:"1717", category:"modern_western", size:15,
    region:"Londres, Inglaterra",
    desc:"Grande Loja de Londres fundada em 1717. Incorporou Rosacrucianismo, Kabbalah e Hermetismo. Estrutura de graus e hierarquia secreta influenciou todas as ordens ocultas posteriores.",
    figures:["James Anderson (1679–1739)","John Theophilus Desaguliers (1683–1744)","Albert Pike (1809–1891)","Manly P. Hall (1901–1990)"],
    texts:["Constituições de Anderson (1723)","Morals and Dogma (Pike, 1871)","The Secret Teachings of All Ages (Hall, 1928)"],
  },
  {
    id:"golden_dawn", label:"Golden Dawn", sublabel:"1888", category:"modern_western", size:27,
    region:"Londres, Inglaterra",
    desc:"A ordem mágica mais influente da história ocidental. Fundada por Westcott e Mathers em 1888. Realizou a maior síntese esotérica já tentada: Kabbalah + Hermetismo + Magia Enoquiana + Mitologia Egípcia + Astrologia + Alquimia + Tarot + Rosacrucianismo. Admitia mulheres em igualdade.",
    figures:["William Wynn Westcott (1848–1925)","S.L. MacGregor Mathers (1854–1918)","Aleister Crowley (membro, 1898)","W.B. Yeats (Nobel)","Dion Fortune","A.E. Waite","Israel Regardie (1907–1985, publicou os rituais)"],
    texts:["The Golden Dawn (Israel Regardie, 1937–40)","The Kabbalah Unveiled (Mathers, 1887)","The Tarot (A.E. Waite, 1910)","777 (Crowley, 1909)"],
  },
  {
    id:"thelema", label:"Thelema / OTO", sublabel:"Crowley, 1904", category:"modern_western", size:23,
    region:"Cairo / Londres / Cefalù",
    desc:"Fundada por Aleister Crowley em abril de 1904 no Cairo. Liber AL vel Legis ditado pelo espírito Aiwass. Æon de Hórus. 'Faze o que tu queres há de ser tudo da Lei.' Número sagrado 93.",
    figures:["Aleister Crowley (1875–1947)","Rose Kelly (canal, 1880–1932)","Jack Parsons (1914–1952)","Kenneth Grant (1924–2011)"],
    texts:["Liber AL vel Legis / Livro da Lei (1904)","Magick in Theory and Practice (1929)","The Book of Thoth (1944)","The Vision and the Voice (1909)"],
  },
  {
    id:"wicca", label:"Wicca", sublabel:"Gardner, 1954", category:"modern_western", size:19,
    region:"Inglaterra / Global",
    desc:"Gerald Gardner publicou Witchcraft Today (1954) após a revogação do Witchcraft Act (1951). Síntese de Golden Dawn, OTO e folclore. Doreen Valiente reescreveu o Book of Shadows. Rede Wicca: 'An it harm none, do what ye will.'",
    figures:["Gerald Gardner (1884–1964)","Doreen Valiente (1922–1999, 'Mãe da Bruxaria Moderna')","Alex Sanders","Starhawk (The Spiral Dance, 1979)"],
    texts:["Witchcraft Today (Gardner, 1954)","An ABC of Witchcraft (Valiente, 1973)","The Spiral Dance (Starhawk, 1979)"],
  },
  {
    id:"chaos_magic", label:"Magia do Caos", sublabel:"Carroll, 1978", category:"modern_western", size:19,
    region:"Inglaterra / Global",
    desc:"Austin Osman Spare (sigilos, 1913) é o precursor. Peter Carroll e Ray Sherwin codificaram em 1978. IOT fundado em 1978. Princípio central: crença é ferramenta, não verdade.",
    figures:["Austin Osman Spare (1886–1956)","Peter Carroll (n.1953)","Ray Sherwin","Grant Morrison (quadrinista)","Genesis P-Orridge (1950–2020)","Phil Hine"],
    texts:["The Book of Pleasure (Spare, 1913)","Liber Null (Carroll, 1978)","The Book of Results (Sherwin, 1978)","Condensed Chaos (Hine, 1995)"],
  },
  {
    id:"satanism", label:"Satanismo", sublabel:"LaVey, 1966", category:"modern_western", size:13,
    region:"San Francisco, EUA",
    desc:"Church of Satan fundada por Anton LaVey em 1966. LaVey Satanism é filosofia ateísta e individualista, não adoração literal. Temple of Set (Michael Aquino, 1975) é mais ritualístico.",
    figures:["Anton LaVey (1930–1997)","Michael Aquino (1946–2019, Temple of Set)"],
    texts:["A Bíblia Satânica (LaVey, 1969)","The Satanic Rituals (1972)","The Book of Coming Forth by Night (Aquino, 1975)"],
  },
  {
    id:"vodun_africa", label:"Vodun Africano", sublabel:"Fon / Ewe, ~1000 dC", category:"african", size:18,
    region:"Benim / Togo / Gana",
    desc:"Tradição-matriz dos povos Fon e Ewe no reino de Dahomey. Vodun são forças divinas ligadas à natureza. Inclui ancestrais divinizados. Profundamente deformado pela representação ocidental como 'voodoo'.",
    figures:["Nana Buluku (divindade suprema)","Mawu-Lisa (dualidade criadora)"],
    texts:["Tradição oral (sem textos canônicos)","Fa (sistema divinatório Fon, paralelo ao Ifá Yoruba)"],
  },
  {
    id:"ifa", label:"Ifá / Orixás", sublabel:"Yoruba, ~1000 dC", category:"african", size:18,
    region:"Nigéria / Yorubalândia",
    desc:"Sistema divinatório Ifá reconhecido pela UNESCO como patrimônio imaterial. 256 odus sagrados, cada um com centenas de versos (ese Ifá). Babalawo ('pai dos segredos') passam anos memorizando.",
    figures:["Orunmila / Ifá (divindade da sabedoria)","Xangô","Ogum","Iemanjá","Oxum","Exu"],
    texts:["Odù Ifá (corpus oral de 256 odus)","Tratado Enciclopédico do Ifá (Wande Abimbola)"],
  },
  {
    id:"vodou", label:"Vodou Haitiano", sublabel:"séc. XVII–XVIII", category:"african", size:16,
    region:"Haiti",
    desc:"Fusão de Vodun Fon/Ewe, orixás Yoruba e tradições Kongo com o catolicismo francês. Lwa dividem-se em Rada (temperamento frio) e Petwo (ardente). Cerimônia de Bois Caïman (1791) catalisou a Revolução Haitiana.",
    figures:["Dutty Boukmann (houngan, cerimônia de 1791)","Cécile Fatiman (mambo)","Marie Laveau (1801–1881)","Baron Samedi (lwa da morte)"],
    texts:["Voodoo in Haiti (Alfred Métraux, 1959)","Tell My Horse (Zora Neale Hurston, 1938)"],
  },
  {
    id:"candomble", label:"Candomblé", sublabel:"Brasil, séc. XIX", category:"african", size:16,
    region:"Bahia, Brasil",
    desc:"Desenvolveu-se no Brasil no séc. XIX. Nações: Ketu (Yoruba), Jeje (Fon) e Angola (Bantu). Orixás sincretizados com santos: Yemanjá = Virgem Maria, Ogum = São Jorge. Axé é a força vital sagrada.",
    figures:["Mãe Aninha (1869–1938)","Mãe Menininha do Gantois (1894–1986)","Mãe Stella de Oxóssi (1925–2018)","Pierre Verger (1902–1996)"],
    texts:["Os Nagô e a Morte (Juana Elbein dos Santos)","Candomblé da Bahia (Edison Carneiro)"],
  },
  {
    id:"umbanda", label:"Umbanda", sublabel:"Brasil, 1920s", category:"african", size:15,
    region:"Rio de Janeiro, Brasil",
    desc:"Sincretismo quádruplo único: tradições africanas + práticas indígenas + catolicismo + Espiritismo kardecista. Emergiu no Rio de Janeiro nos anos 1920. Patrimônio cultural do Rio de Janeiro (2016).",
    figures:["Zélio Fernandino de Moraes (1891–1975, fundador simbólico)","Caboclo das Sete Encruzilhadas"],
    texts:["O Livro dos Médiuns (Allan Kardec, influência)","A Umbanda e Seus Fundamentos (Matta e Silva)"],
  },
  {
    id:"santeria", label:"Santería / Lucumí", sublabel:"Cuba, séc. XIX", category:"african", size:13,
    region:"Cuba / Caribe",
    desc:"Tradição cubana que funde orixás Yoruba com catolicismo espanhol e Espiritismo. Também chamada de Lucumí ou Regla de Ocha. Difundiu-se para os EUA e América Latina no séc. XX.",
    figures:["Lydia Cabrera (1899–1991, pesquisadora)","Fernando Ortiz (1881–1969)"],
    texts:["El Monte (Lydia Cabrera, 1954)","Santería: The Religion (Migene González-Wippler)"],
  },
  {
    id:"taoist_magic", label:"Magia Taoísta", sublabel:"séc. III aC", category:"asian", size:15,
    region:"China",
    desc:"Emprega fu (talismãs de papel), magia do trovão (leifa), exorcismo e alquimia interna (neidan). Tradições wu (xamãs/feiticeiros chineses) precedem o taoísmo formal.",
    figures:["Laozi (lendário, séc. V–IV aC)","Zhang Daoling (34–156 dC)","Ge Hong (283–343)","Lu Dongbin (lendário)"],
    texts:["Tao Te Ching (Laozi, séc. IV aC)","Baopuzi (Ge Hong, ~320 dC)","Lingbao Jing (séc. IV–V dC)"],
  },
  {
    id:"tantra", label:"Tantra Hindu", sublabel:"séc. V–VI dC", category:"asian", size:16,
    region:"Sul da Ásia / Índia",
    desc:"Tomou forma por volta do séc. V–VI dC. Distingue mão direita (dakṣiṇācāra) do caminho da mão esquerda (vāmācāra — Cinco M's). Blavatsky introduziu esta dicotomia no esoterismo ocidental em 1877.",
    figures:["Abhinavagupta (séc. X–XI)","Matsyendranath (fundador lendário do Natha)","Gorakhnath (séc. XI)","Helena Blavatsky"],
    texts:["Kularnava Tantra (séc. XI)","Mahanirvana Tantra","Vijnana Bhairava Tantra","The Serpent Power (Woodroffe, 1919)"],
  },
  {
    id:"onmyodo", label:"Onmyōdō", sublabel:"Japão, séc. VI", category:"asian", size:13,
    region:"Japão",
    desc:"Caminho do Yin e Yang. Integrou filosofia chinesa ao Japão no séc. VI. Código Taihō (701) institucionalizou como cargo imperial. Abe no Seimei (921–1005), o 'Merlin japonês', é o onmyōji mais famoso.",
    figures:["Abe no Seimei (921–1005)","Kamo no Yasunori (917–977)"],
    texts:["Senji Ryakketsu (manual de Seimei, atribuído)"],
  },
  {
    id:"vajrayana", label:"Vajrayana", sublabel:"séc. VII dC", category:"asian", size:14,
    region:"Índia / Tibete / Japão",
    desc:"Budismo tântrico. Emergiu no séc. VII dC sob influência hindu. Espalhou-se para o Tibete e Japão (Shingon, Kūkai, séc. IX). Dalai Lama como linha principal tibetana.",
    figures:["Padmasambhava (Guru Rinpoche, séc. VIII)","Kūkai / Kōbō-Daishi (774–835)","Milarepa (1052–1135)","Naropa (1016–1100)"],
    texts:["Bardo Thodol / Livro Tibetano dos Mortos (séc. VIII)","Guhyasamaja Tantra","Mahavairocana Sutra"],
  },
  {
    id:"norse", label:"Magia Rúnica / Nórdica", sublabel:"séc. II–IX dC", category:"norse", size:16,
    region:"Escandinávia / Germânia",
    desc:"Runas = alfabeto e sistema mágico simultâneos. Elder Futhark (24 runas, 3 ættir). Odin pendurou-se em Yggdrasil por 9 noites para receber as runas. Seiðr: feitiçaria nórdica praticada por völvas.",
    figures:["Odin / Wotan","Freyja (mestra do seiðr)","Snorri Sturluson (1179–1241)"],
    texts:["Hávamál (Edda Poética)","Prose Edda (Snorri, 1220)","Galdrabók (grimório islandês, séc. XVII)"],
  },
  {
    id:"folk_witch", label:"Bruxaria Tradicional Europeia", sublabel:"pré-moderna", category:"norse", size:15,
    region:"Europa (especialmente Norte/Centro)",
    desc:"Práticas localizadas de cunning folk (ingleses), benandanti (italianos), stregoneria, Hexerei alemã. Fundamentalmente diferente da Wicca. ~40.000–60.000 execuções na Europa (1450–1750).",
    figures:["Carlo Ginzburg (1939–, historiador dos benandanti)","Cunning Murrell (séc. XIX, Essex)","Margaret Murray (teoria — hoje desacreditada)"],
    texts:["Malleus Maleficarum (Kramer, 1486)","Discoverie of Witchcraft (Scot, 1584)","The Witch Cult in Western Europe (Murray, 1921)"],
  },
];

const LINKS = [
  {source:"shaman",      target:"folk_witch", strength:0.9},
  {source:"shaman",      target:"norse",      strength:0.8},
  {source:"shaman",      target:"heka",       strength:0.5},
  {source:"heka",        target:"pgm",        strength:1.0},
  {source:"heka",        target:"hermetism",  strength:0.9},
  {source:"heka",        target:"greek_magic",strength:0.8},
  {source:"sumerian",    target:"babylonian", strength:1.0},
  {source:"sumerian",    target:"sihr",       strength:0.5},
  {source:"babylonian",  target:"greek_magic",strength:0.8},
  {source:"babylonian",  target:"arabic",     strength:0.9},
  {source:"babylonian",  target:"alchemy",    strength:0.7},
  {source:"vedic",       target:"tantra",     strength:1.0},
  {source:"greek_magic", target:"pgm",        strength:1.0},
  {source:"greek_magic", target:"neoplatonism",strength:1.0},
  {source:"neoplatonism",target:"hermetism",  strength:0.9},
  {source:"pgm",         target:"hermetism",  strength:1.0},
  {source:"merkabah",    target:"kabbalah",   strength:1.0},
  {source:"hermetism",   target:"arabic",     strength:1.0},
  {source:"hermetism",   target:"ficino",     strength:1.0},
  {source:"arabic",      target:"picatrix",   strength:1.0},
  {source:"arabic",      target:"grimoires",  strength:0.9},
  {source:"arabic",      target:"ficino",     strength:0.9},
  {source:"sihr",        target:"picatrix",   strength:0.8},
  {source:"kabbalah",    target:"christian_kab",strength:1.0},
  {source:"kabbalah",    target:"levi",       strength:0.9},
  {source:"kabbalah",    target:"golden_dawn",strength:1.0},
  {source:"grimoires",   target:"agrippa",    strength:0.9},
  {source:"ficino",      target:"agrippa",    strength:1.0},
  {source:"christian_kab",target:"agrippa",   strength:0.9},
  {source:"picatrix",    target:"ficino",     strength:0.9},
  {source:"picatrix",    target:"agrippa",    strength:0.9},
  {source:"alchemy",     target:"agrippa",    strength:0.8},
  {source:"alchemy",     target:"rosicrucian",strength:0.9},
  {source:"agrippa",     target:"enochian",   strength:0.8},
  {source:"agrippa",     target:"rosicrucian",strength:0.9},
  {source:"agrippa",     target:"levi",       strength:0.9},
  {source:"enochian",    target:"rosicrucian",strength:0.7},
  {source:"enochian",    target:"golden_dawn",strength:1.0},
  {source:"rosicrucian", target:"masonry",    strength:0.9},
  {source:"rosicrucian", target:"golden_dawn",strength:1.0},
  {source:"masonry",     target:"golden_dawn",strength:0.9},
  {source:"levi",        target:"golden_dawn",strength:1.0},
  {source:"levi",        target:"umbanda",    strength:0.6},
  {source:"golden_dawn", target:"thelema",    strength:1.0},
  {source:"golden_dawn", target:"wicca",      strength:1.0},
  {source:"golden_dawn", target:"chaos_magic",strength:0.8},
  {source:"thelema",     target:"wicca",      strength:0.9},
  {source:"thelema",     target:"chaos_magic",strength:0.8},
  {source:"thelema",     target:"satanism",   strength:0.6},
  {source:"wicca",       target:"chaos_magic",strength:0.6},
  {source:"folk_witch",  target:"wicca",      strength:0.8},
  {source:"norse",       target:"folk_witch", strength:0.9},
  {source:"vodun_africa",target:"vodou",      strength:1.0},
  {source:"vodun_africa",target:"santeria",   strength:0.8},
  {source:"ifa",         target:"candomble",  strength:1.0},
  {source:"ifa",         target:"santeria",   strength:1.0},
  {source:"ifa",         target:"vodou",      strength:0.7},
  {source:"vodou",       target:"candomble",  strength:0.6},
  {source:"candomble",   target:"umbanda",    strength:0.9},
  {source:"taoist_magic",target:"onmyodo",   strength:1.0},
  {source:"taoist_magic",target:"vajrayana", strength:0.6},
  {source:"tantra",      target:"vajrayana",  strength:1.0},
  {source:"tantra",      target:"thelema",    strength:0.7},
  {source:"tantra",      target:"chaos_magic",strength:0.6},
];

const TABS = ["Visão Geral","Figuras","Textos","Conexões"];

export default function MagicMap() {
  const svgRef  = useRef(null);
  const wrapRef = useRef(null);
  const [sel, setSel]     = useState(null);
  const [tab, setTab]     = useState(0);
  const [dims, setDims]   = useState({w:900,h:600});
  const [query, setQuery] = useState("");
  const [activeCats, setActiveCats] = useState(new Set(Object.keys(CATEGORIES)));
  const [loaded, setLoaded] = useState(false);

  const connCount = useRef({});
  NODES.forEach(n => {
    connCount.current[n.id] = LINKS.filter(l => l.source===n.id || l.target===n.id).length;
  });

  useEffect(() => {
    const fn = () => { if(wrapRef.current) setDims({w:wrapRef.current.offsetWidth, h:wrapRef.current.offsetHeight}); };
    fn(); window.addEventListener("resize",fn); return ()=>window.removeEventListener("resize",fn);
  },[]);

  const toggleCat = useCallback((key) => {
    setActiveCats(prev => {
      const next = new Set(prev);
      if(next.size===1 && next.has(key)) return new Set(Object.keys(CATEGORIES));
      if(next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  },[]);

  useEffect(() => {
    if(!svgRef.current) return;
    const {w,h} = dims;
    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3.select(svgRef.current).attr("width",w).attr("height",h).style("cursor","grab");
    svg.append("rect").attr("width",w).attr("height",h).attr("fill","#050510");
    const sg = svg.append("g");
    for(let i=0;i<280;i++) sg.append("circle").attr("cx",Math.random()*w).attr("cy",Math.random()*h).attr("r",Math.random()*1.3+0.1).attr("fill","white").attr("opacity",Math.random()*0.4+0.04);

    const defs = svg.append("defs");
    ["glow1","glow2","glow3"].forEach((id,i)=>{
      const f=defs.append("filter").attr("id",id).attr("x","-80%").attr("y","-80%").attr("width","260%").attr("height","260%");
      f.append("feGaussianBlur").attr("stdDeviation",[2.5,6,12][i]).attr("result","b");
      const m=f.append("feMerge"); m.append("feMergeNode").attr("in","b"); m.append("feMergeNode").attr("in","SourceGraphic");
    });
    Object.entries(CATEGORIES).forEach(([k,c])=>{
      defs.append("marker").attr("id",`a-${k}`).attr("viewBox","0 -4 8 8").attr("refX",8).attr("refY",0).attr("markerWidth",4).attr("markerHeight",4).attr("orient","auto")
        .append("path").attr("d","M0,-4L8,0L0,4").attr("fill",c.color).attr("opacity",0.7);
    });

    const ld = LINKS.map(l=>({...l})), nd = NODES.map(n=>({...n}));
    const zg = svg.append("g").attr("class","zg");
    svg.call(d3.zoom().scaleExtent([0.2,4]).on("zoom",e=>zg.attr("transform",e.transform)));

    const sim = d3.forceSimulation(nd)
      .force("link", d3.forceLink(ld).id(d=>d.id).distance(d=>150-d.strength*30).strength(d=>d.strength*0.55))
      .force("charge", d3.forceManyBody().strength(-520).distanceMax(520))
      .force("center", d3.forceCenter(w/2, h/2))
      .force("col",    d3.forceCollide().radius(d=>d.size+30));

    const ls = zg.append("g").selectAll("line").data(ld).join("line")
      .attr("stroke", d=>{const s=nd.find(n=>n.id===(d.source.id||d.source)); return s?CATEGORIES[s.category].color:"#555";})
      .attr("stroke-opacity", d=>0.08+d.strength*0.18)
      .attr("stroke-width",   d=>0.8+d.strength*1.4)
      .attr("stroke-dasharray", d=>d.strength<0.65?"4 4":"none")
      .attr("marker-end", d=>{const s=nd.find(n=>n.id===(d.source.id||d.source)); return s?`url(#a-${s.category})`:"none";});

    const ns = zg.append("g").selectAll("g").data(nd).join("g").style("cursor","pointer").attr("opacity",0)
      .call(d3.drag()
        .on("start",(e,d)=>{if(!e.active)sim.alphaTarget(0.3).restart();d.fx=d.x;d.fy=d.y;})
        .on("drag", (e,d)=>{d.fx=e.x;d.fy=e.y;})
        .on("end",  (e,d)=>{if(!e.active)sim.alphaTarget(0);d.fx=null;d.fy=null;}));

    ns.append("circle").attr("r",d=>d.size+18).attr("fill","none").attr("stroke",d=>CATEGORIES[d.category].color).attr("stroke-width",0.5).attr("opacity",0.08).attr("filter","url(#glow3)");
    ns.append("circle").attr("r",d=>d.size+9).attr("fill","none").attr("stroke",d=>CATEGORIES[d.category].color).attr("stroke-width",0.6).attr("opacity",0.14).attr("filter","url(#glow2)");
    ns.append("circle").attr("r",d=>d.size).attr("fill",d=>CATEGORIES[d.category].color).attr("fill-opacity",0.12).attr("stroke",d=>CATEGORIES[d.category].color).attr("stroke-width",1.5).attr("filter","url(#glow1)");
    ns.append("circle").attr("r",d=>Math.min(2+connCount.current[d.id]*0.35,7)).attr("fill",d=>CATEGORIES[d.category].color);
    ns.append("text").attr("dx",d=>d.size-2).attr("dy",d=>-d.size+2).attr("text-anchor","middle").attr("font-family","monospace").attr("font-size","7px").attr("fill",d=>CATEGORIES[d.category].color).attr("opacity",0.7).style("pointer-events","none").text(d=>{const c=connCount.current[d.id];return c>=4?c:"";});
    ns.append("text").attr("dy",d=>d.size+14).attr("text-anchor","middle").attr("font-family","Cinzel,Georgia,serif").attr("font-size",d=>d.size>19?"10px":d.size>14?"8.5px":"7.5px").attr("font-weight",d=>d.size>19?"700":"400").attr("fill",d=>CATEGORIES[d.category].color).attr("filter","url(#glow1)").style("pointer-events","none").text(d=>d.label);
    ns.append("text").attr("dy",d=>d.size+25).attr("text-anchor","middle").attr("font-family","monospace").attr("font-size","6.5px").attr("fill","#4a4a6a").style("pointer-events","none").text(d=>d.sublabel);

    ns.transition().duration(600).delay((_,i)=>i*18).attr("opacity",1).on("end",()=>setLoaded(true));

    ns.on("mouseover",(_,d)=>{
      const relL = ld.filter(l=>{const s=l.source.id||l.source,t=l.target.id||l.target;return s===d.id||t===d.id;});
      const relIds = new Set([d.id,...relL.map(l=>l.source.id||l.source),...relL.map(l=>l.target.id||l.target)]);
      ls.attr("stroke-opacity",l=>{const s=l.source.id||l.source,t=l.target.id||l.target;return(s===d.id||t===d.id)?Math.min(0.9,0.4+l.strength*0.5):0.02;})
        .attr("stroke-width",l=>{const s=l.source.id||l.source,t=l.target.id||l.target;return(s===d.id||t===d.id)?1+l.strength*2:0.8+l.strength*1.4;});
      ns.select("circle:nth-child(3)").attr("fill-opacity",n=>n.id===d.id?0.6:relIds.has(n.id)?0.35:0.03).attr("stroke-opacity",n=>n.id===d.id?1:relIds.has(n.id)?0.8:0.1);
      ns.attr("opacity",n=>relIds.has(n.id)?1:0.3);
    })
    .on("mouseout",()=>{
      ls.attr("stroke-opacity",d=>0.08+d.strength*0.18).attr("stroke-width",d=>0.8+d.strength*1.4);
      ns.select("circle:nth-child(3)").attr("fill-opacity",0.12).attr("stroke-opacity",1);
      ns.attr("opacity",1);
    })
    .on("click",(_,d)=>{ setSel(p=>p?.id===d.id?null:{...d}); setTab(0); });

    sim.on("tick",()=>{
      ls.attr("x1",d=>d.source.x).attr("y1",d=>d.source.y)
        .attr("x2",d=>{const dx=d.target.x-d.source.x,dy=d.target.y-d.source.y,dist=Math.sqrt(dx*dx+dy*dy)||1;return d.source.x+dx-(dx/dist)*(d.target.size+10);})
        .attr("y2",d=>{const dx=d.target.x-d.source.x,dy=d.target.y-d.source.y,dist=Math.sqrt(dx*dx+dy*dy)||1;return d.source.y+dy-(dy/dist)*(d.target.size+10);});
      ns.attr("transform",d=>`translate(${d.x},${d.y})`);
    });
    return ()=>sim.stop();
  },[dims]);

  useEffect(()=>{
    if(!svgRef.current) return;
    const q = query.toLowerCase();
    d3.select(svgRef.current).selectAll(".zg > g:last-child > g").attr("opacity",(_,i,nodes)=>{
      const nd = d3.select(nodes[i]).datum();
      if(!nd) return 1;
      const catOk = activeCats.has(nd.category);
      const searchOk = !q || nd.label.toLowerCase().includes(q) || nd.sublabel.toLowerCase().includes(q) || (nd.region||"").toLowerCase().includes(q);
      return catOk && searchOk ? 1 : 0.06;
    });
  },[query, activeCats, loaded]);

  const selNode  = sel ? NODES.find(n=>n.id===sel.id) : null;
  const selCat   = selNode ? CATEGORIES[selNode.category] : null;
  const selConns = selNode ? {
    inc: LINKS.filter(l=>l.target===selNode.id).map(l=>({...NODES.find(n=>n.id===l.source),strength:l.strength})).filter(n=>n.id),
    out: LINKS.filter(l=>l.source===selNode.id).map(l=>({...NODES.find(n=>n.id===l.target),strength:l.strength})).filter(n=>n.id),
  } : null;

  const Tag = ({n}) => (
    <span style={{display:"inline-flex",alignItems:"center",gap:"4px",fontSize:"7.5px",color:CATEGORIES[n.category].color,
      background:`${CATEGORIES[n.category].color}12`,border:`1px solid ${CATEGORIES[n.category].color}2a`,
      borderRadius:"2px",padding:"2px 6px",margin:"2px"}}>
      {n.label}
      {n.strength && <span style={{opacity:0.5,fontSize:"6px"}}>{n.strength>=0.9?"●":n.strength>=0.7?"◑":"○"}</span>}
    </span>
  );

  return (
    <div ref={wrapRef} style={{width:"100%",height:"100vh",background:"#050510",overflow:"hidden",position:"relative",fontFamily:"Georgia,serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=IM+Fell+English:ital@0;1&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;background:#08081a}
        ::-webkit-scrollbar-thumb{background:#1a1a30}
        .panel-scroll{overflow-y:auto;max-height:calc(100vh - 240px)}
        .tab-btn:hover{opacity:1!important}
        .cat-pill:hover{opacity:1!important;transform:translateY(-1px)}
        input::placeholder{color:#3a3020}
        input:focus{border-color:rgba(212,168,67,0.45)!important}
      `}</style>

      <svg ref={svgRef} style={{display:"block"}}/>

      {/* TITLE */}
      <div style={{position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",textAlign:"center",pointerEvents:"none",zIndex:10,whiteSpace:"nowrap"}}>
        <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:"clamp(10px,1.8vw,19px)",fontWeight:"700",color:"#D4A843",letterSpacing:"5px",textShadow:"0 0 30px rgba(212,168,67,0.85),0 0 80px rgba(212,168,67,0.3)"}}>
          MAPA DOS SISTEMAS MÁGICOS
        </div>
        <div style={{fontSize:"7.5px",color:"#3a3020",letterSpacing:"3.5px",marginTop:"4px",fontFamily:"'Cinzel',serif"}}>
          ORIGENS · CONEXÕES · INFLUÊNCIAS · 40.000 aC — PRESENTE
        </div>
      </div>

      {/* SEARCH */}
      <div style={{position:"absolute",top:14,right:12,zIndex:20}}>
        <div style={{position:"relative"}}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar tradição..."
            style={{background:"rgba(5,5,16,0.9)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:"2px",
              color:"#D4A843",padding:"6px 28px 6px 10px",fontSize:"8.5px",fontFamily:"'Cinzel',serif",
              letterSpacing:"1px",outline:"none",width:"170px",transition:"border-color 0.2s"}}/>
          {query && <button onClick={()=>setQuery("")} style={{position:"absolute",right:"7px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#555",fontSize:"12px",cursor:"pointer",lineHeight:1}}>×</button>}
        </div>
      </div>

      {/* LEFT PANEL */}
      <div style={{position:"absolute",top:78,left:12,background:"rgba(5,5,16,0.92)",border:"1px solid rgba(212,168,67,0.12)",borderRadius:"3px",padding:"11px 13px",zIndex:10,maxWidth:"198px"}}>
        <div style={{fontSize:"7px",color:"#D4A843",letterSpacing:"3px",marginBottom:"10px"}}>TRADIÇÕES</div>
        {Object.entries(CATEGORIES).map(([k,c])=>(
          <div key={k} className="cat-pill" onClick={()=>toggleCat(k)}
            style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px",cursor:"pointer",
              opacity:activeCats.has(k)?1:0.28,transition:"opacity 0.2s,transform 0.15s"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:c.color,flexShrink:0,boxShadow:activeCats.has(k)?`0 0 7px ${c.color}99`:"none",transition:"box-shadow 0.2s"}}/>
            <span style={{fontSize:"7.5px",color:activeCats.has(k)?"#aaa":"#444"}}>{c.label}</span>
          </div>
        ))}
        <div style={{marginTop:"11px",borderTop:"1px solid #0e0e20",paddingTop:"9px",fontSize:"7px",color:"#252535",letterSpacing:"1.2px",lineHeight:"2"}}>
          ⟡ HOVER — acende conexões<br/>⟡ CLIQUE — detalhes / abas<br/>⟡ ARRASTAR — mover nó<br/>⟡ SCROLL — zoom<br/>⟡ LEGENDA — filtrar
        </div>
        <div style={{marginTop:"10px",borderTop:"1px solid #0e0e20",paddingTop:"8px"}}>
          <div style={{fontSize:"7px",color:"#252535",letterSpacing:"1px",marginBottom:"5px"}}>FORÇA DA CONEXÃO</div>
          <div style={{display:"flex",gap:"10px",fontSize:"6.5px",color:"#383848",marginBottom:"6px"}}>
            <span>● forte</span><span>◑ média</span><span>○ fraca</span>
          </div>
          <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#D4A843" strokeWidth="2" strokeOpacity="0.6"/></svg>
            <span style={{fontSize:"6.5px",color:"#383848"}}>direta</span>
            <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#D4A843" strokeWidth="1.2" strokeDasharray="4 3" strokeOpacity="0.45"/></svg>
            <span style={{fontSize:"6.5px",color:"#383848"}}>indireta</span>
          </div>
        </div>
      </div>

      {/* BOTTOM STATS */}
      <div style={{position:"absolute",bottom:12,left:12,fontSize:"7px",color:"#161626",letterSpacing:"2px",zIndex:10}}>
        {NODES.length} TRADIÇÕES · {LINKS.length} CONEXÕES
      </div>
      <div style={{position:"absolute",bottom:12,right:12,fontSize:"7px",color:"#161626",letterSpacing:"1.5px",zIndex:10,display:"flex",gap:"12px",alignItems:"center"}}>
        {activeCats.size < Object.keys(CATEGORIES).length && (
          <span onClick={()=>setActiveCats(new Set(Object.keys(CATEGORIES)))} style={{color:"#D4A84344",cursor:"pointer",textDecoration:"underline"}}>RESET FILTRO</span>
        )}
        <span>nó mais conectado: <span style={{color:"#D4A84355"}}>Golden Dawn (12)</span></span>
      </div>

      {/* DETAIL PANEL */}
      {selNode && selCat && (
        <div style={{position:"absolute",top:78,right:12,width:"clamp(220px,23vw,275px)",
          background:"rgba(4,4,14,0.97)",border:`1px solid ${selCat.color}25`,borderRadius:"3px",
          zIndex:20,boxShadow:`0 0 50px ${selCat.color}12,0 8px 32px rgba(0,0,0,0.85)`}}>

          <div style={{padding:"14px 14px 11px",borderBottom:`1px solid ${selCat.color}15`,position:"relative"}}>
            <button onClick={()=>setSel(null)} style={{position:"absolute",top:"10px",right:"11px",background:"none",border:"none",color:"#2a2a3a",fontSize:"16px",cursor:"pointer",lineHeight:1}}>×</button>
            <div style={{fontSize:"clamp(9px,1.3vw,12px)",fontWeight:"700",color:selCat.color,letterSpacing:"1px",
              textShadow:`0 0 14px ${selCat.color}66`,paddingRight:"20px",fontFamily:"'Cinzel',serif"}}>{selNode.label}</div>
            <div style={{fontSize:"7.5px",color:"#303050",marginTop:"3px",letterSpacing:"1px"}}>{selNode.sublabel}</div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:"6px",alignItems:"center"}}>
              <span style={{fontSize:"6.5px",color:selCat.color,opacity:0.45,letterSpacing:"2px"}}>{selCat.label.toUpperCase()}</span>
              <span style={{fontSize:"6.5px",color:"#252535"}}>{connCount.current[selNode.id]} conexões</span>
            </div>
            {selNode.region && <div style={{fontSize:"6.5px",color:"#252535",marginTop:"4px"}}>📍 {selNode.region}</div>}
          </div>

          <div style={{display:"flex",borderBottom:`1px solid ${selCat.color}12`,padding:"0 12px"}}>
            {TABS.map((t,i)=>(
              <button key={t} className="tab-btn" onClick={()=>setTab(i)} style={{
                background:"none",border:"none",cursor:"pointer",padding:"7px 7px 5px",
                fontSize:"7px",letterSpacing:"1.5px",fontFamily:"'Cinzel',serif",
                color:tab===i?selCat.color:"#252535",
                borderBottom:tab===i?`1px solid ${selCat.color}`:"1px solid transparent",
                opacity:tab===i?1:0.55,transition:"all 0.15s",marginBottom:"-1px",
              }}>{t.toUpperCase()}</button>
            ))}
          </div>

          <div className="panel-scroll" style={{padding:"12px 14px"}}>
            {tab===0 && (
              <p style={{fontSize:"8px",color:"#8080a8",lineHeight:"1.85",margin:0,fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>
                {selNode.desc}
              </p>
            )}
            {tab===1 && selNode.figures?.map((f,i)=>(
              <div key={i} style={{display:"flex",gap:"8px",marginBottom:"8px",alignItems:"flex-start"}}>
                <div style={{width:"2px",height:"2px",borderRadius:"50%",background:selCat.color,marginTop:"6px",flexShrink:0,boxShadow:`0 0 4px ${selCat.color}`}}/>
                <span style={{fontSize:"7.5px",color:"#6868a0",lineHeight:"1.65"}}>{f}</span>
              </div>
            ))}
            {tab===2 && selNode.texts?.map((t,i)=>(
              <div key={i} style={{display:"flex",gap:"8px",marginBottom:"9px",alignItems:"flex-start"}}>
                <span style={{fontSize:"9px",color:selCat.color,opacity:0.35,flexShrink:0}}>◈</span>
                <span style={{fontSize:"7.5px",color:"#6868a0",lineHeight:"1.65",fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>{t}</span>
              </div>
            ))}
            {tab===3 && selConns && (
              <div>
                {selConns.inc.length>0 && (
                  <div style={{marginBottom:"12px"}}>
                    <div style={{fontSize:"6.5px",color:"#252535",letterSpacing:"2px",marginBottom:"7px"}}>← RECEBE INFLUÊNCIA DE ({selConns.inc.length})</div>
                    <div style={{display:"flex",flexWrap:"wrap"}}>{selConns.inc.map(n=><Tag key={n.id} n={n}/>)}</div>
                  </div>
                )}
                {selConns.out.length>0 && (
                  <div>
                    <div style={{fontSize:"6.5px",color:"#252535",letterSpacing:"2px",marginBottom:"7px"}}>→ INFLUENCIA ({selConns.out.length})</div>
                    <div style={{display:"flex",flexWrap:"wrap"}}>{selConns.out.map(n=><Tag key={n.id} n={n}/>)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
