-- ============================================================================
-- Ágora · seed.sql — dados de exemplo para o app "parecer vivo" ao abrir.
-- Rodado automaticamente por `supabase db reset`. Executa como postgres:
-- os triggers de validação do cliente não se aplicam, mas os de efeito
-- (pontos, notificações, caixa) rodam de verdade.
--
-- Contas de teste (senha de desenvolvimento — NUNCA use em produção):
--   admin@agora.test   / agora-admin-123   (Administrador, Guardião)
--   membro@agora.test  / agora-membro-123  (Membro comum, Colaborador)
-- Os demais 20 membros usam a senha agora-seed-123.
-- ============================================================================
begin;

-- ---------------------------------------------------------------- utilitários temporários
create function pg_temp.u(n integer) returns uuid language sql immutable as
  $$ select ('a0000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;
create function pg_temp.id(prefixo text, n integer) returns uuid language sql immutable as
  $$ select (prefixo || '0000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;
create function pg_temp.como(p uuid) returns void language sql as
  $$ select set_config('request.jwt.claim.sub', coalesce(p::text, ''), true) $$;
create function pg_temp.tema(p_slug text) returns uuid language sql stable as
  $$ select id from public.temas where slug = p_slug $$;

-- ---------------------------------------------------------------- usuários (auth)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', pg_temp.u(n), 'authenticated', 'authenticated', email,
       extensions.crypt(senha, extensions.gen_salt('bf')), now() - interval '200 days',
       jsonb_build_object('full_name', nome), '{"provider":"email","providers":["email"]}'::jsonb,
       now() - make_interval(days => 200 - n * 3), now()
from (values
  (1,  'admin@agora.test',            'agora-admin-123',  'Administração Ágora'),
  (2,  'membro@agora.test',           'agora-membro-123', 'Membro de Teste'),
  (3,  'helena.duarte@agora.test',    'agora-seed-123',   'Helena Duarte'),
  (4,  'marcos.vieira@agora.test',    'agora-seed-123',   'Marcos Vieira'),
  (5,  'rafael.lima@agora.test',      'agora-seed-123',   'Rafael Lima'),
  (6,  'ana.rocha@agora.test',        'agora-seed-123',   'Ana Beatriz Rocha'),
  (7,  'tiago.nascimento@agora.test', 'agora-seed-123',   'Tiago Nascimento'),
  (8,  'iara.santos@agora.test',      'agora-seed-123',   'Iara Santos'),
  (9,  'juliana.prado@agora.test',    'agora-seed-123',   'Juliana Prado'),
  (10, 'pedro.alcantara@agora.test',  'agora-seed-123',   'Pedro Alcântara'),
  (11, 'luana.ferreira@agora.test',   'agora-seed-123',   'Luana Ferreira'),
  (12, 'bruno.costa@agora.test',      'agora-seed-123',   'Bruno Costa'),
  (13, 'camila.ribeiro@agora.test',   'agora-seed-123',   'Camila Ribeiro'),
  (14, 'otavio.reis@agora.test',      'agora-seed-123',   'Otávio Reis'),
  (15, 'gabriel.moura@agora.test',    'agora-seed-123',   'Gabriel Moura'),
  (16, 'fernanda.lopes@agora.test',   'agora-seed-123',   'Fernanda Lopes'),
  (17, 'rodrigo.teixeira@agora.test', 'agora-seed-123',   'Rodrigo Teixeira'),
  (18, 'patricia.gomes@agora.test',   'agora-seed-123',   'Patrícia Gomes'),
  (19, 'diego.martins@agora.test',    'agora-seed-123',   'Diego Martins'),
  (20, 'sofia.andrade@agora.test',    'agora-seed-123',   'Sofia Andrade'),
  (21, 'vinicius.barros@agora.test',  'agora-seed-123',   'Vinícius Barros'),
  (22, 'renata.campos@agora.test',    'agora-seed-123',   'Renata Campos')
) as t(n, email, senha, nome);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
from auth.users u where u.email like '%@agora.test';

-- ---------------------------------------------------------------- núcleos
insert into public.nucleos (id, cidade, estado, descricao) values
  (pg_temp.id('3', 1), 'Rio de Janeiro', 'RJ', 'Encontros quinzenais no Centro e ações na Zona Norte. Grupo de estudos de Filosofia às quintas.'),
  (pg_temp.id('3', 2), 'São Paulo', 'SP', 'Núcleo mais antigo da Ágora. Biblioteca comunitária no Bixiga e aulões aos sábados.'),
  (pg_temp.id('3', 3), 'Salvador', 'BA', 'Rodas de conversa no Pelourinho, mutirões de agasalho e parceria com abrigos de animais.');

-- ---------------------------------------------------------------- perfis
update public.profiles p set
  nome_exibicao = d.nome, pseudonimo = d.pseud, pseudonimo_ativo = d.pseud is not null,
  bio = d.bio, cidade = d.cidade, estado = d.uf,
  nucleo_id = case d.uf when 'RJ' then pg_temp.id('3', 1) when 'SP' then pg_temp.id('3', 2) else pg_temp.id('3', 3) end,
  papel = d.papel::public.papel_usuario,
  status_assinatura = d.status::public.status_assinatura,
  assinatura_valida_ate = case when d.status = 'ativo' then now() + interval '300 days' else now() - interval '20 days' end,
  interesses = d.interesses,
  aceitou_codigo_conduta_em = now() - interval '150 days',
  onboarding_concluido_em = now() - interval '150 days',
  created_at = now() - make_interval(days => 200 - d.n * 3)
from (values
  (1,  'Administração Ágora', null, 'Conta institucional da administração. Fale conosco pelo canal de suporte.', 'Rio de Janeiro', 'RJ', 'admin', 'ativo', array['organizacao-comunitaria','politica']),
  (2,  'Membro de Teste', null, 'Conta de testes para conhecer a Ágora.', 'Rio de Janeiro', 'RJ', 'membro', 'ativo', array['filosofia','taro','historia-oculta']),
  (3,  'Helena Duarte', null, 'Assistente social, coordena o núcleo do Rio. Gosta de Hannah Arendt e de mutirões que terminam em almoço coletivo.', 'Rio de Janeiro', 'RJ', 'coordenador', 'ativo', array['organizacao-comunitaria','filosofia','politica']),
  (4,  'Marcos Vieira', null, 'Professor de história na rede pública. Coordena o núcleo de São Paulo e a biblioteca comunitária.', 'São Paulo', 'SP', 'coordenador', 'ativo', array['historia-oculta','politica','organizacao-comunitaria']),
  (5,  'Rafael Lima', 'Corvo Branco', 'Estudante de hermetismo há 15 anos. Escrevo sobre Cabala e alquimia com os pés no chão.', 'Salvador', 'BA', 'membro', 'ativo', array['esoterismo','mitologia','historia-oculta']),
  (6,  'Ana Beatriz Rocha', null, 'Advogada popular, atua com direito à moradia. Revisora dos artigos de Direito.', 'São Paulo', 'SP', 'membro', 'ativo', array['direito','politica']),
  (7,  'Tiago Nascimento', null, 'Mestre em filosofia. Organizo o grupo de leitura dos pré-socráticos.', 'Rio de Janeiro', 'RJ', 'membro', 'ativo', array['filosofia','mitologia']),
  (8,  'Iara Santos', null, 'Coordena o núcleo de Salvador. Veterinária e protetora de animais.', 'Salvador', 'BA', 'coordenador', 'ativo', array['organizacao-comunitaria','mitologia']),
  (9,  'Juliana Prado', 'Sibila', 'Taróloga e pesquisadora de iconografia. O tarô como linguagem, não como superstição.', 'Rio de Janeiro', 'RJ', 'membro', 'ativo', array['taro','esoterismo','mitologia']),
  (10, 'Pedro Alcântara', null, 'Cientista político em formação. Interesse em participação popular e orçamento participativo.', 'São Paulo', 'SP', 'membro', 'ativo', array['politica','direito']),
  (11, 'Luana Ferreira', null, 'Pedagoga. Ajudo nos aulões gratuitos de Salvador.', 'Salvador', 'BA', 'membro', 'ativo', array['organizacao-comunitaria','filosofia']),
  (12, 'Bruno Costa', null, 'Programador e leitor de mitologia nórdica.', 'Rio de Janeiro', 'RJ', 'membro', 'ativo', array['mitologia','historia-oculta']),
  (13, 'Camila Ribeiro', null, 'Bibliotecária. Cataloguei os 1.200 livros da biblioteca do Bixiga.', 'São Paulo', 'SP', 'membro', 'ativo', array['historia-oculta','filosofia']),
  (14, 'Otávio Reis', 'Hermes do Catete', 'Astrologia tradicional e história das sociedades secretas.', 'Rio de Janeiro', 'RJ', 'membro', 'ativo', array['esoterismo','historia-oculta']),
  (15, 'Gabriel Moura', null, 'Estudante de direito, chegando agora.', 'São Paulo', 'SP', 'membro', 'ativo', array['direito','politica']),
  (16, 'Fernanda Lopes', null, 'Curiosa por tarô e por histórias de família.', 'Salvador', 'BA', 'membro', 'ativo', array['taro','mitologia']),
  (17, 'Rodrigo Teixeira', null, 'Motorista de aplicativo e leitor voraz.', 'Rio de Janeiro', 'RJ', 'membro', 'ativo', array['filosofia','politica']),
  (18, 'Patrícia Gomes', null, 'Enfermeira. Voluntária nas campanhas de agasalho.', 'São Paulo', 'SP', 'membro', 'ativo', array['organizacao-comunitaria']),
  (19, 'Diego Martins', null, 'Assinatura pausada — volto em breve!', 'Salvador', 'BA', 'membro', 'inativo', array['esoterismo']),
  (20, 'Sofia Andrade', null, 'Designer. Ilustro capas para a Biblioteca.', 'Rio de Janeiro', 'RJ', 'membro', 'ativo', array['mitologia','taro']),
  (21, 'Vinícius Barros', null, 'Contador voluntário: confiro o caixa dos projetos.', 'São Paulo', 'SP', 'membro', 'ativo', array['organizacao-comunitaria','direito']),
  (22, 'Renata Campos', null, 'Cozinheira, organiza os almoços dos mutirões.', 'Salvador', 'BA', 'membro', 'ativo', array['organizacao-comunitaria'])
) as d(n, nome, pseud, bio, cidade, uf, papel, status, interesses)
where p.id = pg_temp.u(d.n);

update public.nucleos set coordenador_id = pg_temp.u(3) where id = pg_temp.id('3', 1);
update public.nucleos set coordenador_id = pg_temp.u(4) where id = pg_temp.id('3', 2);
update public.nucleos set coordenador_id = pg_temp.u(8) where id = pg_temp.id('3', 3);

-- ---------------------------------------------------------------- temas
insert into public.temas (nome, slug, descricao, icone, ordem) values
  ('Esoterismo', 'esoterismo', 'Hermetismo, Cabala, alquimia e as tradições iniciáticas estudadas com rigor histórico.', 'sparkles', 1),
  ('Tarô', 'taro', 'Iconografia, história e leitura simbólica dos arcanos.', 'layers', 2),
  ('Direito', 'direito', 'Direitos fundamentais, direito à cidade, como funciona a Justiça e como acessá-la.', 'scale', 3),
  ('Política', 'politica', 'Teoria política, participação popular, movimentos sociais e instituições.', 'landmark', 4),
  ('História Oculta', 'historia-oculta', 'Sociedades secretas, heresias, bibliotecas perdidas e a história que ficou à margem.', 'scroll', 5),
  ('Filosofia', 'filosofia', 'Dos pré-socráticos aos contemporâneos, com leitura atenta dos textos.', 'book-open', 6),
  ('Mitologia', 'mitologia', 'Mitos gregos, nórdicos, iorubás, tupis e o que eles ainda nos dizem.', 'flame', 7),
  ('Organização Comunitária', 'organizacao-comunitaria', 'Como organizar mutirões, assembleias, finanças transparentes e cuidado coletivo.', 'users', 8);

-- ---------------------------------------------------------------- reconhecimento das contribuições do Discord
-- Decisão da comunidade (ver decisões): importar a reputação construída no
-- Discord como ponto de partida, registrada como evento auditável.
insert into public.reputacao_eventos (profile_id, acao, pontos, referencia_tipo, criado_em)
select pg_temp.u(n), 'contribuicao_historica', pts, 'migracao_discord', now() - interval '120 days'
from (values (1, 900), (2, 20), (3, 850), (4, 820), (5, 400), (6, 300), (7, 280), (8, 810), (9, 330),
             (10, 90), (11, 70), (12, 60), (13, 80), (14, 120), (15, 10), (16, 15), (17, 5), (18, 30),
             (19, 25), (20, 20), (21, 100), (22, 12)) as t(n, pts);

-- ---------------------------------------------------------------- tópicos
insert into public.topicos (id, tema_id, autor_id, titulo, corpo_md, fixado, status, created_at, ultima_atividade_em) values
  (pg_temp.id('c', 1), pg_temp.tema('filosofia'), pg_temp.u(7), 'Por onde começar a ler os pré-socráticos?',
   E'Muita gente me pergunta isso no grupo de leitura. Minha sugestão: começar pelos **fragmentos de Heráclito** na edição bilíngue, depois Parmênides.\n\nQual edição vocês usam? Alguém tem experiência com a tradução da coleção *Os Pensadores*?', true, 'aberto', now() - interval '40 days', now() - interval '2 days'),
  (pg_temp.id('c', 2), pg_temp.tema('taro'), pg_temp.u(16), 'O Tarô de Marselha e o Rider-Waite contam a mesma história?',
   E'Comecei a estudar com o Rider-Waite, mas no grupo usam muito o Marselha. As cartas menores sem cenas me confundem. Vale a pena aprender os dois?', false, 'resolvido', now() - interval '35 days', now() - interval '20 days'),
  (pg_temp.id('c', 3), pg_temp.tema('direito'), pg_temp.u(15), 'Despejo sem ordem judicial é legal?',
   E'Uma vizinha recebeu aviso do proprietário para sair em 5 dias, sem processo. Isso pode? O que ela deve fazer primeiro?', false, 'resolvido', now() - interval '30 days', now() - interval '28 days'),
  (pg_temp.id('c', 4), pg_temp.tema('politica'), pg_temp.u(10), 'Orçamento participativo ainda funciona em alguma cidade?',
   E'Porto Alegre foi referência nos anos 90. Hoje, quais experiências estão vivas? Queria levantar casos para um artigo.', false, 'aberto', now() - interval '25 days', now() - interval '3 days'),
  (pg_temp.id('c', 5), pg_temp.tema('esoterismo'), pg_temp.u(5), 'Corpus Hermeticum: qual tradução em português?',
   E'Estou montando uma trilha de introdução ao hermetismo. Preciso indicar uma tradução confiável do *Corpus Hermeticum*. Sugestões?', false, 'aberto', now() - interval '22 days', now() - interval '5 days'),
  (pg_temp.id('c', 6), pg_temp.tema('historia-oculta'), pg_temp.u(12), 'Os templários no Brasil: mito ou história?',
   E'Vejo muito conteúdo dizendo que a Ordem de Cristo (sucessora dos templários em Portugal) financiou as navegações. Quanto disso é documentado?', false, 'aberto', now() - interval '20 days', now() - interval '1 day'),
  (pg_temp.id('c', 7), pg_temp.tema('mitologia'), pg_temp.u(20), 'Exu e Hermes: aproximação válida ou apropriação?',
   E'Li uma comparação entre Exu e Hermes como mensageiros e senhores das encruzilhadas. Isso faz sentido antropologicamente ou apaga as diferenças?', false, 'aberto', now() - interval '18 days', now() - interval '4 days'),
  (pg_temp.id('c', 8), pg_temp.tema('organizacao-comunitaria'), pg_temp.u(3), 'Como dividir tarefas num mutirão sem sobrecarregar ninguém?',
   E'No último mutirão, três pessoas fizeram quase tudo. Que métodos vocês usam? Rodízio, quadro de tarefas, duplas?', true, 'aberto', now() - interval '16 days', now() - interval '6 hours'),
  (pg_temp.id('c', 9), pg_temp.tema('filosofia'), pg_temp.u(17), 'Hannah Arendt e a banalidade do mal hoje',
   E'Relendo *Eichmann em Jerusalém*. Vocês acham que o conceito se aplica à burocracia digital (algoritmos que decidem sem ninguém "decidir")?', false, 'aberto', now() - interval '14 days', now() - interval '2 days'),
  (pg_temp.id('c', 10), pg_temp.tema('taro'), pg_temp.u(9), 'Iconografia do Arcano XIII: a Morte sem nome',
   E'No Marselha, o Arcano XIII não tem nome. Reuni algumas hipóteses históricas sobre isso. Quem tiver fontes, por favor compartilhe!', false, 'aberto', now() - interval '12 days', now() - interval '12 days'),
  (pg_temp.id('c', 11), pg_temp.tema('direito'), pg_temp.u(6), 'Guia rápido: como acessar a Defensoria Pública',
   E'Fiz um passo a passo para quem nunca procurou a Defensoria. Revisem e me digam o que falta para virar artigo.', false, 'aberto', now() - interval '10 days', now() - interval '1 day'),
  (pg_temp.id('c', 12), pg_temp.tema('mitologia'), pg_temp.u(12), 'Ragnarök como ciclo, não como fim',
   E'A leitura apocalíptica do Ragnarök vem muito da influência cristã nos registradores. O que sobrevive na Völuspá sugere renovação.', false, 'aberto', now() - interval '8 days', now() - interval '8 days'),
  (pg_temp.id('c', 13), pg_temp.tema('politica'), pg_temp.u(21), 'Transparência financeira em coletivos: planilha basta?',
   E'Muitos coletivos usam planilha compartilhada. O caixa transparente da Ágora resolve? O que mais precisamos (conciliação, auditoria)?', false, 'aberto', now() - interval '6 days', now() - interval '1 day'),
  (pg_temp.id('c', 14), pg_temp.tema('esoterismo'), pg_temp.u(14), 'Astrologia tradicional x moderna: diferenças práticas',
   E'Para quem está começando: domicílios, regentes tradicionais e por que Plutão não rege Escorpião na tradição.', false, 'aberto', now() - interval '4 days', now() - interval '4 days'),
  (pg_temp.id('c', 15), pg_temp.tema('historia-oculta'), pg_temp.u(13), 'Livros raros na biblioteca do Bixiga: ajuda para catalogar',
   E'Recebemos uma doação com edições do século XIX sobre maçonaria e espiritismo. Alguém sabe catalogar obras raras?', false, 'aberto', now() - interval '2 days', now() - interval '2 days');

insert into public.respostas (id, topico_id, autor_id, corpo_md, created_at, resposta_pai_id) values
  (pg_temp.id('5', 1),  pg_temp.id('c', 1), pg_temp.u(5),  E'Comece pelo Heráclito, concordo. A edição bilíngue da Odysseus é ótima para quem quer o grego ao lado.', now() - interval '39 days', null),
  (pg_temp.id('5', 2),  pg_temp.id('c', 1), pg_temp.u(2),  E'Estou começando agora. Valeu pela dica!', now() - interval '38 days', pg_temp.id('5', 1)),
  (pg_temp.id('5', 3),  pg_temp.id('c', 1), pg_temp.u(17), E'*Os Pensadores* serve para começar, mas as notas são datadas. Use como porta de entrada.', now() - interval '2 days', null),
  (pg_temp.id('5', 4),  pg_temp.id('c', 2), pg_temp.u(9),  E'Contam histórias **aparentadas**. O Rider-Waite (1909) ilustrou as cartas menores; o Marselha mantém os "pips" numéricos. Aprender o Marselha treina leitura por número e naipe — vale muito.', now() - interval '34 days', null),
  (pg_temp.id('5', 5),  pg_temp.id('c', 2), pg_temp.u(16), E'Isso esclareceu muito, obrigada!', now() - interval '33 days', pg_temp.id('5', 4)),
  (pg_temp.id('5', 6),  pg_temp.id('c', 3), pg_temp.u(6),  E'Não. **Despejo só com ordem judicial** (Lei do Inquilinato, art. 59 e seguintes). Ela deve guardar o aviso por escrito e procurar a Defensoria Pública imediatamente. Trocar fechadura ou cortar água é exercício arbitrário das próprias razões.', now() - interval '29 days', null),
  (pg_temp.id('5', 7),  pg_temp.id('c', 3), pg_temp.u(15), E'Muito obrigado, Ana. Ela já marcou atendimento.', now() - interval '28 days', pg_temp.id('5', 6)),
  (pg_temp.id('5', 8),  pg_temp.id('c', 4), pg_temp.u(4),  E'Há experiências de orçamento participativo escolar muito interessantes. Posso te passar contatos em SP.', now() - interval '24 days', null),
  (pg_temp.id('5', 9),  pg_temp.id('c', 5), pg_temp.u(14), E'Gosto da tradução que acompanha as notas de Brian Copenhaver (em inglês). Em português, compare sempre duas edições.', now() - interval '21 days', null),
  (pg_temp.id('5', 10), pg_temp.id('c', 6), pg_temp.u(4),  E'A Ordem de Cristo existiu e teve papel nas navegações, isso é documentado. A "continuidade secreta" templária é outra história — e muito mais mito.', now() - interval '19 days', null),
  (pg_temp.id('5', 11), pg_temp.id('c', 6), pg_temp.u(12), E'Ótimo ponto. Separar instituição de lenda é exatamente o que eu queria.', now() - interval '1 day', pg_temp.id('5', 10)),
  (pg_temp.id('5', 12), pg_temp.id('c', 7), pg_temp.u(8),  E'Comparar pode ajudar, desde que a gente não reduza Exu a "Hermes africano". São cosmologias distintas, com comunidades vivas.', now() - interval '17 days', null),
  (pg_temp.id('5', 13), pg_temp.id('c', 8), pg_temp.u(22), E'Usamos duplas e um quadro de tarefas visível. E ninguém sai sem almoçar!', now() - interval '15 days', null),
  (pg_temp.id('5', 14), pg_temp.id('c', 8), pg_temp.u(18), E'Rodízio de funções a cada mutirão funcionou bem na campanha de agasalho.', now() - interval '6 hours', null),
  (pg_temp.id('5', 15), pg_temp.id('c', 9), pg_temp.u(7),  E'Arendt insistia na **ausência de pensamento**. Delegar decisões a sistemas sem refletir é um risco parecido.', now() - interval '2 days', null),
  (pg_temp.id('5', 16), pg_temp.id('c', 11), pg_temp.u(10), E'Inclua os documentos que a pessoa deve levar. Isso evita viagem perdida.', now() - interval '1 day', null),
  (pg_temp.id('5', 17), pg_temp.id('c', 13), pg_temp.u(4), E'Planilha não basta: falta trilha de auditoria. Lançamento imutável + comprovante é o mínimo.', now() - interval '1 day', null),
  (pg_temp.id('5', 18), pg_temp.id('c', 4), pg_temp.u(2), E'Acompanhando! Tema importante.', now() - interval '3 days', null);

-- respostas úteis (geram pontos via trigger)
update public.respostas set marcada_como_util = true where id in (pg_temp.id('5', 4), pg_temp.id('5', 6), pg_temp.id('5', 1), pg_temp.id('5', 10), pg_temp.id('5', 13));

-- ---------------------------------------------------------------- artigos (fluxo real de revisão)
insert into public.artigos (id, tema_id, criado_por, titulo, resumo, corpo_md, topico_origem_id, created_at) values
  (pg_temp.id('d', 1), pg_temp.tema('filosofia'), pg_temp.u(7), 'Heráclito para iniciantes: o fogo, o rio e o logos',
   'Uma introdução aos fragmentos de Heráclito e às três imagens que organizam seu pensamento.',
   E'## Por que Heráclito\n\nHeráclito de Éfeso (c. 535–475 a.C.) deixou apenas fragmentos, mas poucos pensadores foram tão citados. Ler Heráclito é treinar a atenção: cada frase é curta, densa e pede releitura.\n\n## O rio\n\n> "Não se pode entrar duas vezes no mesmo rio."\n\nA imagem não diz apenas que *tudo muda*. Diz que a identidade do rio **depende** da mudança: se a água parasse, não haveria rio.\n\n## O fogo\n\nO fogo é medida: "acende-se em medidas e apaga-se em medidas". A transformação tem ordem.\n\n## O logos\n\nO logos é a razão comum que atravessa a mudança. Heráclito reclama que as pessoas vivem "como se tivessem um pensamento próprio", ignorando o que é comum.\n\n## Como ler\n\n1. Leia um fragmento por dia.\n2. Escreva o que entendeu em uma frase.\n3. Compare com a tradução de outra edição.\n\nEste artigo nasceu da discussão no tópico sobre os pré-socráticos.',
   pg_temp.id('c', 1), now() - interval '33 days'),
  (pg_temp.id('d', 2), pg_temp.tema('direito'), pg_temp.u(6), 'Despejo: o que a lei diz e o que fazer na primeira semana',
   'Guia prático sobre o despejo no Brasil: só com ordem judicial, prazos e onde buscar ajuda gratuita.',
   E'## A regra de ouro\n\nNo Brasil, **ninguém pode ser despejado sem ordem judicial**. A Lei do Inquilinato (Lei 8.245/1991) prevê a ação de despejo; fora dela, a retirada forçada é ilegal.\n\n## Sinais de abuso\n\n- Troca de fechadura sem processo\n- Corte de água ou luz para forçar a saída\n- Retirada de móveis\n\n## Primeira semana\n\n1. **Guarde tudo por escrito**: avisos, mensagens, recibos de aluguel.\n2. **Procure a Defensoria Pública** ou um núcleo de prática jurídica.\n3. Se houver violência, registre boletim de ocorrência.\n\n## Prazos comuns\n\nEm alguns casos a lei permite liminar para desocupação em 15 dias, mas sempre **com decisão de juiz**.\n\n*Este artigo não substitui orientação jurídica individual.*',
   pg_temp.id('c', 3), now() - interval '27 days'),
  (pg_temp.id('d', 3), pg_temp.tema('taro'), pg_temp.u(9), 'Marselha e Rider-Waite: duas gramáticas do tarô',
   'Comparação histórica e prática entre os dois baralhos mais usados.',
   E'## Origens\n\nO **Tarô de Marselha** consolida um padrão francês dos séculos XVII–XVIII. O **Rider-Waite-Smith** (1909) foi desenhado por Pamela Colman Smith sob orientação de A. E. Waite.\n\n## A grande diferença: as cartas menores\n\nNo Marselha, as cartas numeradas mostram apenas os símbolos do naipe ("pips"). No Rider-Waite, cada carta tem uma **cena**.\n\n## Consequências para a leitura\n\n- Marselha: leitura por **número + naipe**, mais abstrata e combinatória.\n- Rider-Waite: leitura **narrativa**, mais intuitiva para iniciantes.\n\n## Recomendação\n\nAprenda os arcanos maiores em qualquer um dos dois. Depois, estude os menores do Marselha pela numerologia elementar — isso torna a leitura do Rider-Waite mais rica também.',
   pg_temp.id('c', 2), now() - interval '30 days'),
  (pg_temp.id('d', 4), pg_temp.tema('organizacao-comunitaria'), pg_temp.u(3), 'Mutirão sem sobrecarga: um método em cinco passos',
   'Como dividir tarefas de forma justa e visível num mutirão comunitário.',
   E'## O problema\n\nEm quase todo mutirão, poucas pessoas fazem quase tudo. Isso queima lideranças e afasta quem chega.\n\n## O método\n\n1. **Quadro de tarefas visível** (A fazer / Fazendo / Feito).\n2. **Duplas**: uma pessoa experiente + uma nova.\n3. **Rodízio** de funções a cada edição.\n4. **Horas registradas** e confirmadas — reconhecimento concreto.\n5. **Fechamento com roda de conversa**: o que funcionou, o que mudar.\n\n## Cuidado coletivo\n\nInclua tarefas de cuidado (comida, água, crianças) no quadro. Elas são trabalho e precisam ser divididas.',
   pg_temp.id('c', 8), now() - interval '14 days'),
  (pg_temp.id('d', 5), pg_temp.tema('esoterismo'), pg_temp.u(5), 'Hermetismo: uma introdução honesta',
   'O que é o Corpus Hermeticum, de onde vem e como estudá-lo sem cair em mistificações.',
   E'## O que é\n\nO *Corpus Hermeticum* é um conjunto de tratados gregos escritos provavelmente entre os séculos I e III d.C., atribuídos a Hermes Trismegisto.\n\n## O mito da antiguidade egípcia\n\nNo Renascimento, Marsílio Ficino traduziu os textos acreditando serem anteriores a Moisés. Em 1614, Isaac Casaubon demonstrou pela filologia que eram da era cristã.\n\n## Temas centrais\n\n- O *Nous* (mente divina)\n- A ascensão da alma pelas esferas\n- A correspondência entre macro e microcosmo\n\n## Como estudar\n\nLeia em edições críticas, compare traduções e separe **história das ideias** de **prática espiritual**: as duas são legítimas, mas pedem métodos diferentes.',
   pg_temp.id('c', 5), now() - interval '20 days'),
  (pg_temp.id('d', 6), pg_temp.tema('historia-oculta'), pg_temp.u(4), 'Templários, Ordem de Cristo e as navegações portuguesas',
   'Separando instituição documentada e lenda na história dos templários em Portugal.',
   E'## A extinção dos templários\n\nEm 1312 o papa Clemente V extinguiu a Ordem do Templo. Em Portugal, o rei D. Dinis negociou a criação da **Ordem de Cristo** (1319), que herdou bens templários.\n\n## O que é documentado\n\n- A Ordem de Cristo administrou recursos usados nas navegações.\n- O Infante D. Henrique foi seu administrador.\n- A cruz da Ordem aparece nas velas das caravelas.\n\n## O que é lenda\n\nA ideia de uma continuidade **secreta** e de tesouros templários levados ao Brasil não tem base documental sólida.\n\n## Por que isso importa\n\nHistória oculta não é história inventada: é a história que ficou à margem, recuperada com fontes.',
   pg_temp.id('c', 6), now() - interval '17 days'),
  (pg_temp.id('d', 7), pg_temp.tema('mitologia'), pg_temp.u(12), 'Ragnarök: fim do mundo ou renovação?',
   'Uma leitura da Völuspá que destaca o ciclo de destruição e renascimento.',
   E'## As fontes\n\nConhecemos o Ragnarök principalmente pela *Völuspá* (Edda Poética) e pela *Edda em Prosa* de Snorri Sturluson, ambas registradas por cristãos no século XIII.\n\n## Destruição\n\nOs deuses morrem, o lobo Fenrir devora Odin, Surtr incendeia o mundo.\n\n## Renovação\n\nMas a Völuspá continua: a terra **ressurge verde do mar**, filhos dos deuses sobrevivem, e um casal humano repovoa o mundo.\n\n## Leitura\n\nO Ragnarök é menos "fim" que **passagem**. A ênfase apocalíptica pode refletir o olhar cristão dos registradores.',
   pg_temp.id('c', 12), now() - interval '7 days'),
  (pg_temp.id('d', 8), pg_temp.tema('politica'), pg_temp.u(10), 'Orçamento participativo: o que aprendemos em 30 anos',
   'Balanço das experiências brasileiras de orçamento participativo e lições para coletivos.',
   E'## A origem\n\nPorto Alegre (1989) criou um modelo em que moradores decidiam parte dos investimentos em assembleias regionais.\n\n## O que funcionou\n\n- **Regras claras** e públicas\n- **Ciclo anual previsível**\n- **Prestação de contas** das obras aprovadas\n\n## O que enfraqueceu\n\n- Redução do percentual do orçamento em disputa\n- Captura por lideranças\n- Falta de retorno sobre as decisões\n\n## Lições para coletivos\n\nDecisão sem execução visível gera descrédito. Por isso a Ágora registra decisões de forma imutável e conecta a aprovação de recursos ao caixa transparente.',
   pg_temp.id('c', 4), now() - interval '22 days'),
  -- dois em revisão
  (pg_temp.id('d', 9), pg_temp.tema('direito'), pg_temp.u(6), 'Defensoria Pública: passo a passo para o primeiro atendimento',
   'Quem pode ser atendido, que documentos levar e como acompanhar o caso.',
   E'## Quem pode ser atendido\n\nPessoas que não podem pagar advogado sem prejuízo do próprio sustento. Cada Defensoria define critérios de renda.\n\n## Documentos\n\n- RG e CPF\n- Comprovante de residência\n- Comprovante de renda (ou declaração)\n- Documentos do caso (contratos, mensagens, avisos)\n\n## Agendamento\n\nMuitas Defensorias agendam por telefone ou aplicativo. Chegue cedo e leve cópias.\n\n## Acompanhamento\n\nAnote o número do processo e o nome de quem te atendeu. Pergunte quais os próximos passos e prazos.',
   pg_temp.id('c', 11), now() - interval '5 days'),
  (pg_temp.id('d', 10), pg_temp.tema('esoterismo'), pg_temp.u(14), 'Astrologia tradicional: domicílios e regências',
   'Introdução ao sistema de domicílios planetários da astrologia helenística e medieval.',
   E'## Os sete planetas clássicos\n\nA astrologia tradicional trabalha com Sol, Lua, Mercúrio, Vênus, Marte, Júpiter e Saturno.\n\n## Domicílios\n\nCada planeta "mora" em um ou dois signos. O esquema é simétrico a partir de Câncer (Lua) e Leão (Sol).\n\n## Por que Plutão não rege Escorpião\n\nNa tradição, Escorpião é domicílio noturno de Marte. A atribuição a Plutão é moderna (século XX).\n\n## Na prática\n\nComece identificando o regente do seu ascendente e onde ele está no mapa.',
   pg_temp.id('c', 14), now() - interval '3 days');

-- coautoria
insert into public.artigo_autores (artigo_id, profile_id, papel) values
  (pg_temp.id('d', 4), pg_temp.u(22), 'coautor'),
  (pg_temp.id('d', 8), pg_temp.u(4), 'coautor');

-- todos vão à revisão (rodada 1)
update public.artigos set status = 'em_revisao', rodada_revisao = 1;

-- revisões: 2 aprovações de curadores distintos publicam (os 8 primeiros)
insert into public.revisoes (artigo_id, revisor_id, rodada, parecer, comentario, created_at)
select pg_temp.id('d', a), pg_temp.u(r), 1, 'aprovar', c, now() - interval '1 day'
from (values
  (1, 5, 'Introdução clara e fiel aos fragmentos. Aprovo.'), (1, 9, 'Ótima porta de entrada. Sugiro citar a edição usada.'),
  (2, 7, 'Texto preciso e acessível. Aprovo.'), (2, 3, 'Muito útil para os núcleos. Aprovo.'),
  (3, 5, 'Comparação equilibrada. Aprovo.'), (3, 14, 'Boa contextualização histórica.'),
  (4, 7, 'Método claro e aplicável.'), (4, 4, 'Usaremos no núcleo de SP. Aprovo.'),
  (5, 9, 'Honesto e bem documentado.'), (5, 14, 'Excelente separação entre história e prática.'),
  (6, 3, 'Fontes bem apresentadas.'), (6, 5, 'Desmistifica sem desrespeitar. Aprovo.'),
  (7, 9, 'Leitura bonita da Völuspá.'), (7, 7, 'Aprovo, com elogios à clareza.'),
  (8, 6, 'Bom balanço histórico.'), (8, 3, 'Lições muito pertinentes para nós.')
) as t(a, r, c);

-- artigo 9 tem uma aprovação e aguarda a segunda; artigo 10 aguarda revisores
insert into public.revisoes (artigo_id, revisor_id, rodada, parecer, comentario) values
  (pg_temp.id('d', 9), pg_temp.u(7), 1, 'aprovar', 'Ótimo guia. Falta só um revisor.');

update public.artigos set publicado_em = created_at + interval '3 days' where status = 'publicado';

-- ---------------------------------------------------------------- trilhas
insert into public.trilhas (id, titulo, descricao, tema_id, curador_id, nivel_dificuldade, destaque, created_at) values
  (pg_temp.id('e', 1), 'Primeiros passos na filosofia e no hermetismo', 'Do logos de Heráclito ao Nous hermético: uma ponte entre filosofia grega e tradição esotérica.', pg_temp.tema('filosofia'), pg_temp.u(7), 1, true, now() - interval '10 days'),
  (pg_temp.id('e', 2), 'Direitos na prática', 'O mínimo que todo membro precisa saber para se defender e orientar vizinhos.', pg_temp.tema('direito'), pg_temp.u(6), 1, true, now() - interval '9 days'),
  (pg_temp.id('e', 3), 'Mitos, símbolos e história', 'Tarô, Ragnarök e templários: como ler símbolos com rigor histórico.', pg_temp.tema('mitologia'), pg_temp.u(9), 2, false, now() - interval '5 days');
insert into public.trilha_itens (trilha_id, artigo_id, ordem) values
  (pg_temp.id('e', 1), pg_temp.id('d', 1), 1), (pg_temp.id('e', 1), pg_temp.id('d', 5), 2),
  (pg_temp.id('e', 2), pg_temp.id('d', 2), 1), (pg_temp.id('e', 2), pg_temp.id('d', 8), 2), (pg_temp.id('e', 2), pg_temp.id('d', 4), 3),
  (pg_temp.id('e', 3), pg_temp.id('d', 3), 1), (pg_temp.id('e', 3), pg_temp.id('d', 7), 2), (pg_temp.id('e', 3), pg_temp.id('d', 6), 3);
update public.trilhas set publicada = true;

-- progresso do membro de teste: trilha 1 em andamento, trilha 3 concluída
insert into public.progresso_trilha (profile_id, trilha_id, artigo_id, concluido_em) values
  (pg_temp.u(2), pg_temp.id('e', 1), pg_temp.id('d', 1), now() - interval '3 days'),
  (pg_temp.u(2), pg_temp.id('e', 3), pg_temp.id('d', 3), now() - interval '4 days'),
  (pg_temp.u(2), pg_temp.id('e', 3), pg_temp.id('d', 7), now() - interval '3 days'),
  (pg_temp.u(2), pg_temp.id('e', 3), pg_temp.id('d', 6), now() - interval '2 days'),
  (pg_temp.u(17), pg_temp.id('e', 2), pg_temp.id('d', 2), now() - interval '1 day');
insert into public.trilhas_concluidas (profile_id, trilha_id, concluida_em) values (pg_temp.u(2), pg_temp.id('e', 3), now() - interval '2 days');
insert into public.salvos (profile_id, tipo, item_id) values
  (pg_temp.u(2), 'artigo', pg_temp.id('d', 1)), (pg_temp.u(2), 'artigo', pg_temp.id('d', 2)),
  (pg_temp.u(2), 'topico', pg_temp.id('c', 6)), (pg_temp.u(2), 'trilha', pg_temp.id('e', 2));

-- ---------------------------------------------------------------- projetos do Mutirão
insert into public.projetos (id, titulo, descricao_md, causa, nucleo_id, coordenador_id, status, meta_financeira, data_inicio, data_fim, created_at) values
  (pg_temp.id('f', 1), 'Campanha de agasalhos de inverno', E'Coleta, triagem e entrega de agasalhos e cobertores para pessoas em situação de rua no centro de São Paulo.\n\n**Pontos de coleta:** biblioteca do Bixiga e sede do núcleo.\n\n**Entrega:** rota noturna com equipe de saúde voluntária.', 'Assistência social', pg_temp.id('3', 2), pg_temp.u(4), 'ativo', 3000, current_date - 40, current_date + 30, now() - interval '45 days'),
  (pg_temp.id('f', 2), 'Biblioteca comunitária do Bixiga', E'Manutenção e ampliação da biblioteca comunitária: catalogação, mutirões de leitura e clube do livro infantil.\n\nTodo o acervo é doado e catalogado por voluntárias.', 'Educação e cultura', pg_temp.id('3', 2), pg_temp.u(4), 'ativo', 5000, current_date - 120, null, now() - interval '120 days'),
  (pg_temp.id('f', 3), 'Aulões gratuitos pré-vestibular', E'Aulas gratuitas aos sábados para estudantes de escola pública em Salvador. Professores voluntários da Ágora e parceiros.', 'Educação e cultura', pg_temp.id('3', 3), pg_temp.u(8), 'ativo', 2000, current_date - 60, current_date + 90, now() - interval '60 days'),
  (pg_temp.id('f', 4), 'Apoio ao abrigo de animais Patas do Rio', E'Ração, vacinas e mutirão de reforma do abrigo parceiro na Zona Norte do Rio.\n\nProjeto concluído — obrigada a todas as pessoas que ajudaram!', 'Proteção animal', pg_temp.id('3', 1), pg_temp.u(3), 'ativo', 1500, current_date - 90, current_date - 10, now() - interval '90 days');

insert into public.projeto_membros (projeto_id, profile_id, papel) values
  (pg_temp.id('f', 1), pg_temp.u(18), 'voluntario'), (pg_temp.id('f', 1), pg_temp.u(13), 'voluntario'), (pg_temp.id('f', 1), pg_temp.u(21), 'voluntario'), (pg_temp.id('f', 1), pg_temp.u(15), 'voluntario'),
  (pg_temp.id('f', 2), pg_temp.u(13), 'voluntario'), (pg_temp.id('f', 2), pg_temp.u(10), 'voluntario'),
  (pg_temp.id('f', 3), pg_temp.u(11), 'voluntario'), (pg_temp.id('f', 3), pg_temp.u(22), 'voluntario'), (pg_temp.id('f', 3), pg_temp.u(16), 'voluntario'),
  (pg_temp.id('f', 4), pg_temp.u(2), 'voluntario'), (pg_temp.id('f', 4), pg_temp.u(17), 'voluntario'), (pg_temp.id('f', 4), pg_temp.u(20), 'voluntario'), (pg_temp.id('f', 4), pg_temp.u(12), 'voluntario');

insert into public.tarefas (id, projeto_id, titulo, descricao, responsavel_id, criado_por, status, prazo, horas_estimadas) values
  (pg_temp.id('7', 1),  pg_temp.id('f', 1), 'Triar agasalhos por tamanho', 'Separar adulto/infantil e descartar o que não estiver em condições.', pg_temp.u(18), pg_temp.u(4), 'fazendo', current_date + 5, 6),
  (pg_temp.id('7', 2),  pg_temp.id('f', 1), 'Montar rota de entrega', 'Mapear pontos com a equipe de saúde.', pg_temp.u(15), pg_temp.u(4), 'a_fazer', current_date + 10, 3),
  (pg_temp.id('7', 3),  pg_temp.id('f', 1), 'Divulgar pontos de coleta', 'Cartazes e mensagens para os grupos do bairro.', pg_temp.u(13), pg_temp.u(4), 'feito', current_date - 20, 2),
  (pg_temp.id('7', 4),  pg_temp.id('f', 1), 'Conseguir transporte para a entrega', null, null, pg_temp.u(4), 'a_fazer', current_date + 12, 2),
  (pg_temp.id('7', 5),  pg_temp.id('f', 2), 'Catalogar doação de obras raras', 'Ver tópico na Biblioteca sobre as edições do século XIX.', pg_temp.u(13), pg_temp.u(4), 'fazendo', current_date + 30, 20),
  (pg_temp.id('7', 6),  pg_temp.id('f', 2), 'Clube do livro infantil — sábado', null, null, pg_temp.u(4), 'a_fazer', current_date + 4, 3),
  (pg_temp.id('7', 7),  pg_temp.id('f', 3), 'Montar grade de aulas do semestre', null, pg_temp.u(11), pg_temp.u(8), 'feito', current_date - 30, 4),
  (pg_temp.id('7', 8),  pg_temp.id('f', 3), 'Imprimir apostilas de matemática', 'Orçamento já aprovado no caixa.', pg_temp.u(22), pg_temp.u(8), 'fazendo', current_date + 3, 2),
  (pg_temp.id('7', 9),  pg_temp.id('f', 3), 'Recrutar professor de redação', null, null, pg_temp.u(8), 'a_fazer', current_date + 14, 1),
  (pg_temp.id('7', 10), pg_temp.id('f', 4), 'Comprar ração (3 meses)', null, pg_temp.u(17), pg_temp.u(3), 'feito', current_date - 60, 2),
  (pg_temp.id('7', 11), pg_temp.id('f', 4), 'Mutirão de pintura do canil', null, pg_temp.u(2), pg_temp.u(3), 'feito', current_date - 30, 8),
  (pg_temp.id('7', 12), pg_temp.id('f', 4), 'Campanha de vacinação', null, pg_temp.u(20), pg_temp.u(3), 'feito', current_date - 15, 4),
  (pg_temp.id('7', 13), pg_temp.id('f', 1), 'Lavar cobertores doados', null, pg_temp.u(2), pg_temp.u(4), 'a_fazer', current_date + 7, 4);

insert into public.horas_voluntariado (id, profile_id, projeto_id, tarefa_id, horas, descricao, created_at) values
  (pg_temp.id('8', 1), pg_temp.u(18), pg_temp.id('f', 1), pg_temp.id('7', 1), 4, 'Triagem de 6 sacos de roupas no sábado.', now() - interval '5 days'),
  (pg_temp.id('8', 2), pg_temp.u(13), pg_temp.id('f', 1), pg_temp.id('7', 3), 2, 'Cartazes e divulgação no bairro.', now() - interval '20 days'),
  (pg_temp.id('8', 3), pg_temp.u(13), pg_temp.id('f', 2), pg_temp.id('7', 5), 6, 'Catalogação de 80 volumes.', now() - interval '10 days'),
  (pg_temp.id('8', 4), pg_temp.u(11), pg_temp.id('f', 3), pg_temp.id('7', 7), 4, 'Montagem da grade com os professores.', now() - interval '30 days'),
  (pg_temp.id('8', 5), pg_temp.u(2),  pg_temp.id('f', 4), pg_temp.id('7', 11), 6, 'Pintura do canil com a equipe do abrigo.', now() - interval '30 days'),
  (pg_temp.id('8', 6), pg_temp.u(17), pg_temp.id('f', 4), pg_temp.id('7', 10), 2, 'Compra e transporte da ração.', now() - interval '60 days'),
  (pg_temp.id('8', 7), pg_temp.u(20), pg_temp.id('f', 4), pg_temp.id('7', 12), 3, 'Apoio na campanha de vacinação.', now() - interval '15 days'),
  (pg_temp.id('8', 8), pg_temp.u(22), pg_temp.id('f', 3), pg_temp.id('7', 8), 2, 'Orçamentos de gráfica.', now() - interval '1 day'),
  (pg_temp.id('8', 9), pg_temp.u(18), pg_temp.id('f', 1), null, 3, 'Recebimento de doações no ponto de coleta.', now() - interval '2 days');

-- confirmação pela coordenação (gera reputação); 8.8 e 8.9 ficam pendentes
select pg_temp.como(pg_temp.u(4));
select public.confirmar_horas(pg_temp.id('8', n)) from unnest(array[1, 2, 3]) as n;
select pg_temp.como(pg_temp.u(8));
select public.confirmar_horas(pg_temp.id('8', 4));
select pg_temp.como(pg_temp.u(3));
select public.confirmar_horas(pg_temp.id('8', n)) from unnest(array[5, 6, 7]) as n;
select pg_temp.como(null);

-- ---------------------------------------------------------------- caixa (append-only) e doações
insert into public.caixa_lancamentos (projeto_id, tipo, valor, descricao, categoria, lancado_por, data, created_at) values
  (pg_temp.id('f', 1), 'entrada', 500.00, 'Repasse da assinatura coletiva do núcleo SP', 'Repasse', pg_temp.u(4), current_date - 38, now() - interval '38 days'),
  (pg_temp.id('f', 1), 'saida', 180.00, 'Lavanderia comunitária — 40 cobertores', 'Serviços', pg_temp.u(4), current_date - 15, now() - interval '15 days'),
  (pg_temp.id('f', 1), 'saida', 95.50, 'Sacos e etiquetas para triagem', 'Materiais', pg_temp.u(4), current_date - 12, now() - interval '12 days'),
  (pg_temp.id('f', 2), 'entrada', 1200.00, 'Rifa do sarau de inverno', 'Eventos', pg_temp.u(4), current_date - 90, now() - interval '90 days'),
  (pg_temp.id('f', 2), 'saida', 640.00, 'Duas estantes de aço', 'Equipamentos', pg_temp.u(4), current_date - 70, now() - interval '70 days'),
  (pg_temp.id('f', 2), 'saida', 85.00, 'Material de catalogação (etiquetas, fichas)', 'Materiais', pg_temp.u(4), current_date - 40, now() - interval '40 days'),
  (pg_temp.id('f', 3), 'entrada', 800.00, 'Contribuição dos professores parceiros', 'Repasse', pg_temp.u(8), current_date - 55, now() - interval '55 days'),
  (pg_temp.id('f', 3), 'saida', 320.00, 'Impressão de apostilas — 1º lote', 'Materiais', pg_temp.u(8), current_date - 20, now() - interval '20 days'),
  (pg_temp.id('f', 4), 'entrada', 900.00, 'Bazar beneficente do núcleo RJ', 'Eventos', pg_temp.u(3), current_date - 85, now() - interval '85 days'),
  (pg_temp.id('f', 4), 'saida', 540.00, 'Ração — 3 meses (nota fiscal anexada)', 'Alimentação', pg_temp.u(3), current_date - 60, now() - interval '60 days'),
  (pg_temp.id('f', 4), 'saida', 210.00, 'Tinta e rolos para o canil', 'Materiais', pg_temp.u(3), current_date - 31, now() - interval '31 days'),
  (pg_temp.id('f', 4), 'saida', 120.00, 'Vacinas (lançado em duplicidade)', 'Saúde', pg_temp.u(3), current_date - 16, now() - interval '16 days');
-- correção por estorno justificado (nunca apagamos)
insert into public.caixa_lancamentos (projeto_id, tipo, valor, descricao, categoria, lancado_por, estorno_de, data)
select pg_temp.id('f', 4), 'entrada', 120.00, 'Estorno: a compra de vacinas foi lançada duas vezes; este registro anula a duplicata.', 'Estorno', pg_temp.u(3), id, current_date - 15
from public.caixa_lancamentos where descricao = 'Vacinas (lançado em duplicidade)';
insert into public.caixa_lancamentos (projeto_id, tipo, valor, descricao, categoria, lancado_por, data)
values (pg_temp.id('f', 4), 'saida', 120.00, 'Vacinas V10 para 8 cães', 'Saúde', pg_temp.u(3), current_date - 15);

insert into public.doacoes (id, projeto_id, doador_id, valor, anonima, status, gateway, gateway_ref, created_at) values
  (pg_temp.id('9', 1), pg_temp.id('f', 1), pg_temp.u(2), 50, false, 'pendente', 'mock', 'mock-seed-1', now() - interval '10 days'),
  (pg_temp.id('9', 2), pg_temp.id('f', 1), null, 100, true, 'pendente', 'mock', 'mock-seed-2', now() - interval '8 days'),
  (pg_temp.id('9', 3), pg_temp.id('f', 2), pg_temp.u(10), 25, false, 'pendente', 'mock', 'mock-seed-3', now() - interval '6 days'),
  (pg_temp.id('9', 4), pg_temp.id('f', 3), pg_temp.u(6), 200, false, 'pendente', 'mock', 'mock-seed-4', now() - interval '4 days'),
  (pg_temp.id('9', 5), pg_temp.id('f', 4), null, 75, true, 'pendente', 'mock', 'mock-seed-5', now() - interval '70 days');
update public.doacoes set status = 'confirmada';  -- trigger lança as entradas no caixa

-- projeto 4 concluído (coordenadora pontua)
update public.projetos set status = 'concluido' where id = pg_temp.id('f', 4);

-- ---------------------------------------------------------------- eventos (passados e futuros)
insert into public.eventos (id, titulo, descricao, nucleo_id, projeto_id, criado_por, local_nome, endereco, inicio, fim, vagas) values
  (pg_temp.id('1', 1), 'Mutirão de pintura no abrigo Patas do Rio', 'Traga roupa velha. Almoço coletivo incluso.', pg_temp.id('3', 1), pg_temp.id('f', 4), pg_temp.u(3),
   'Abrigo Patas do Rio', 'Rua Uranos, 1200 — Ramos, Rio de Janeiro - RJ', now() - interval '30 days', now() - interval '30 days' + interval '6 hours', 20),
  (pg_temp.id('1', 2), 'Roda de leitura: Heráclito', 'Leitura comentada dos fragmentos, com o artigo da Biblioteca como guia.', pg_temp.id('3', 1), null, pg_temp.u(3),
   'Biblioteca Parque Estadual', 'Av. Presidente Vargas, 1261 — Centro, Rio de Janeiro - RJ', now() - interval '7 days', now() - interval '7 days' + interval '2 hours', 30),
  (pg_temp.id('1', 3), 'Entrega noturna de agasalhos', 'Ponto de encontro na biblioteca. Equipe de saúde acompanha.', pg_temp.id('3', 2), pg_temp.id('f', 1), pg_temp.u(4),
   'Biblioteca comunitária do Bixiga', 'Rua Treze de Maio, 300 — Bela Vista, São Paulo - SP', now() + interval '20 hours', now() + interval '24 hours', 15),
  (pg_temp.id('1', 4), 'Aulão de redação — tema ENEM', 'Aula aberta para estudantes de escola pública.', pg_temp.id('3', 3), pg_temp.id('f', 3), pg_temp.u(8),
   'Colégio Estadual Central', 'Av. Joana Angélica, 1500 — Nazaré, Salvador - BA', now() + interval '6 days', now() + interval '6 days' + interval '3 hours', 60),
  (pg_temp.id('1', 5), 'Assembleia aberta do núcleo São Paulo', 'Balanço do semestre e planejamento das ações de 2027.', pg_temp.id('3', 2), null, pg_temp.u(4),
   'Sede do núcleo SP', 'Rua Rui Barbosa, 500 — Bela Vista, São Paulo - SP', now() + interval '14 days', now() + interval '14 days' + interval '3 hours', null);

insert into public.rsvps (evento_id, profile_id, status, presente, checkin_em) values
  (pg_temp.id('1', 1), pg_temp.u(2), 'vou', false, null), (pg_temp.id('1', 1), pg_temp.u(17), 'vou', false, null),
  (pg_temp.id('1', 1), pg_temp.u(20), 'vou', false, null), (pg_temp.id('1', 1), pg_temp.u(12), 'talvez', false, null),
  (pg_temp.id('1', 2), pg_temp.u(2), 'vou', false, null), (pg_temp.id('1', 2), pg_temp.u(7), 'vou', false, null), (pg_temp.id('1', 2), pg_temp.u(17), 'vou', false, null),
  (pg_temp.id('1', 3), pg_temp.u(18), 'vou', false, null), (pg_temp.id('1', 3), pg_temp.u(15), 'vou', false, null), (pg_temp.id('1', 3), pg_temp.u(13), 'talvez', false, null),
  (pg_temp.id('1', 4), pg_temp.u(11), 'vou', false, null), (pg_temp.id('1', 4), pg_temp.u(16), 'vou', false, null),
  (pg_temp.id('1', 5), pg_temp.u(10), 'vou', false, null), (pg_temp.id('1', 5), pg_temp.u(21), 'talvez', false, null);
-- presenças confirmadas nos eventos passados (gera reputação)
update public.rsvps set presente = true, checkin_em = (select inicio + interval '20 minutes' from public.eventos e where e.id = rsvps.evento_id)
 where evento_id in (pg_temp.id('1', 1), pg_temp.id('1', 2)) and status = 'vou';

-- ---------------------------------------------------------------- Assembleia (6 propostas, 3 decisões)
insert into public.propostas (id, autor_id, titulo, contexto_md, proposta_md, tipo, escopo_nucleo_id, status, debate_iniciado_em, debate_ate, votacao_ate, quorum_minimo, limiar_aprovacao, created_at) values
  (pg_temp.id('2', 1), pg_temp.u(3), 'Importar a reputação construída no Discord',
   E'Ao sair do Discord, membros antigos perderiam o histórico de contribuições. Precisamos de um ponto de partida justo e auditável.',
   E'Registrar como evento de reputação "contribuição histórica" a pontuação de cada membro no Discord, com base na planilha pública de cargos e contribuições, **uma única vez**. A lista fica anexada a esta decisão para auditoria.',
   'regimento', null, 'votacao', now() - interval '130 days', now() - interval '125 days', now() - interval '121 days', 0.10, 0.6667, now() - interval '131 days'),
  (pg_temp.id('2', 2), pg_temp.u(10), 'Destinar 10% das assinaturas a um fundo de emergência',
   E'Membros em situação de vulnerabilidade às vezes precisam de apoio imediato (aluguel, remédio).',
   E'Criar um fundo de emergência com 10% da receita de assinaturas, gerido por um comitê rotativo de 3 membros sorteados, com prestação de contas mensal no caixa transparente.',
   'financeira', null, 'votacao', now() - interval '60 days', now() - interval '55 days', now() - interval '51 days', 0.10, 0.6667, now() - interval '61 days'),
  (pg_temp.id('2', 3), pg_temp.u(14), 'Permitir anúncios de serviços esotéricos pagos na Biblioteca',
   E'Alguns membros oferecem consultas e gostariam de divulgá-las.',
   E'Criar uma seção na Biblioteca para membros anunciarem serviços pagos (consultas de tarô, astrologia etc.), com destaque nos tópicos dos temas.',
   'regimento', null, 'votacao', now() - interval '20 days', now() - interval '15 days', now() - interval '11 days', 0.10, 0.6667, now() - interval '21 days'),
  (pg_temp.id('2', 4), pg_temp.u(4), 'Calendário fixo de mutirões mensais por núcleo',
   E'Mutirões esporádicos dificultam o planejamento de voluntários.',
   E'Cada núcleo realiza ao menos **um mutirão por mês**, no segundo sábado, com projeto definido até o dia 1º. A coordenação do núcleo publica o evento no app com 10 dias de antecedência.',
   'geral', null, 'votacao', now() - interval '8 days', now() - interval '3 days', now() + interval '2 days', 0.10, 0.60, now() - interval '9 days'),
  (pg_temp.id('2', 5), pg_temp.u(8), 'Parceria do núcleo Salvador com o abrigo Vira-Lata Feliz',
   E'O abrigo procurou o núcleo pedindo apoio recorrente com ração e voluntários.',
   E'Formalizar parceria de 12 meses: um mutirão bimestral no abrigo e campanha permanente de ração, com caixa próprio no Mutirão.',
   'nucleo', pg_temp.id('3', 3), 'debate', now() - interval '2 days', now() + interval '3 days', now() + interval '6 days', 0.10, 0.60, now() - interval '3 days'),
  (pg_temp.id('2', 6), pg_temp.u(9), 'Glossário colaborativo de termos esotéricos',
   E'Novos membros se perdem em termos como "egrégora", "theurgia" e "arcano".',
   E'Criar um glossário colaborativo na Biblioteca, revisado por curadores, com fontes para cada verbete.',
   'geral', null, 'rascunho', null, null, null, 0.10, 0.60, now() - interval '1 day');

update public.propostas set membros_aptos = 20 where status = 'votacao';

-- votos: proposta 1 (aprovada), 2 (rejeitada), 3 (bloqueada), 4 (em votação)
insert into public.votos (proposta_id, profile_id, rodada, voto, justificativa)
select pg_temp.id('2', 1), pg_temp.u(n), 1, 'favor'::public.opcao_voto, null from unnest(array[1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) as n
union all select pg_temp.id('2', 1), pg_temp.u(14), 1, 'contra'::public.opcao_voto, 'Prefiro recomeçar do zero.'
union all select pg_temp.id('2', 1), pg_temp.u(21), 1, 'abstencao'::public.opcao_voto, null;

insert into public.votos (proposta_id, profile_id, rodada, voto, justificativa)
select pg_temp.id('2', 2), pg_temp.u(n), 1, 'favor'::public.opcao_voto, null from unnest(array[10, 11, 18, 22, 16]) as n
union all select pg_temp.id('2', 2), pg_temp.u(n), 1, 'contra'::public.opcao_voto, 'Concordo com o fundo, mas não com o percentual fixo.' from unnest(array[4, 6, 21, 13]) as n
union all select pg_temp.id('2', 2), pg_temp.u(n), 1, 'abstencao'::public.opcao_voto, null from unnest(array[7, 12]) as n;

insert into public.votos (proposta_id, profile_id, rodada, voto, justificativa) values
  (pg_temp.id('2', 3), pg_temp.u(14), 1, 'favor', null),
  (pg_temp.id('2', 3), pg_temp.u(16), 1, 'favor', null),
  (pg_temp.id('2', 3), pg_temp.u(20), 1, 'favor', null),
  (pg_temp.id('2', 3), pg_temp.u(12), 1, 'contra', null),
  (pg_temp.id('2', 3), pg_temp.u(9), 1, 'bloqueio', 'Bloqueio porque a proposta transforma a Biblioteca, que é espaço de conhecimento compartilhado e gratuito, em vitrine comercial. Isso contraria o princípio de que não somos rede social nem mercado e cria incentivo para produzir conteúdo como isca de venda. Proponho discutir um classificado separado e opcional.'),
  (pg_temp.id('2', 3), pg_temp.u(5), 1, 'bloqueio', 'Bloqueio pois o destaque nos tópicos dos temas dá vantagem a quem paga ou vende, quebrando a horizontalidade. Membros que estudam sem fins comerciais perderiam visibilidade. Aceito rever se a divulgação ficar fora da Biblioteca, sem destaque e com regras claras de conduta para evitar promessas enganosas.'),
  (pg_temp.id('2', 3), pg_temp.u(7), 1, 'bloqueio', 'Bloqueio por risco ético: consultas pagas anunciadas num espaço de confiança podem explorar pessoas vulneráveis, e a Ágora passaria a responder por isso. Antes de votar de novo, precisamos de um regulamento com limites de preço, proibição de promessas de resultado e canal de denúncia específico.');

insert into public.votos (proposta_id, profile_id, rodada, voto, justificativa)
select pg_temp.id('2', 4), pg_temp.u(n), 1, 'favor'::public.opcao_voto, null from unnest(array[3, 4, 8, 18, 22]) as n
union all select pg_temp.id('2', 4), pg_temp.u(17), 1, 'contra'::public.opcao_voto, 'Segundo sábado conflita com feiras no RJ.';

-- apuração real (gera as 3 decisões; a 3 volta ao debate na rodada 2)
select public.apurar_proposta(pg_temp.id('2', 1));
select public.apurar_proposta(pg_temp.id('2', 2));
select public.apurar_proposta(pg_temp.id('2', 3));
-- só no seed: retroage a data de registro das decisões históricas
alter table public.decisoes disable trigger decisoes_imutavel;
update public.decisoes d set registrada_em = p.votacao_ate
  from public.propostas p where p.id = d.proposta_id and d.proposta_id in (pg_temp.id('2', 1), pg_temp.id('2', 2));
update public.decisoes set registrada_em = now() - interval '11 days' where proposta_id = pg_temp.id('2', 3);
alter table public.decisoes enable trigger decisoes_imutavel;

insert into public.proposta_comentarios (proposta_id, autor_id, corpo_md, created_at) values
  (pg_temp.id('2', 4), pg_temp.u(17), 'No Rio o segundo sábado coincide com a feira da Glória. Podemos deixar o dia a critério do núcleo?', now() - interval '6 days'),
  (pg_temp.id('2', 4), pg_temp.u(4), 'Boa questão. O texto diz "ao menos um por mês"; o dia pode virar sugestão. Proponho ajustar na próxima rodada se for rejeitada.', now() - interval '5 days'),
  (pg_temp.id('2', 5), pg_temp.u(11), 'Apoio! Já conheço o abrigo, é sério e organizado.', now() - interval '1 day'),
  (pg_temp.id('2', 5), pg_temp.u(16), 'Podemos incluir castração na parceria?', now() - interval '20 hours'),
  (pg_temp.id('2', 3), pg_temp.u(14), 'Entendi os bloqueios. Vou reescrever como classificado opcional, fora da Biblioteca.', now() - interval '10 days');

-- ---------------------------------------------------------------- moderação
insert into public.denuncias (denunciante_id, tipo_item, item_id, motivo, created_at) values
  (pg_temp.u(12), 'resposta', pg_temp.id('5', 18), 'Resposta sem conteúdo, só para marcar presença no tópico.', now() - interval '2 days'),
  (pg_temp.u(20), 'topico', pg_temp.id('c', 14), 'Possível divulgação de consulta paga disfarçada de tópico.', now() - interval '1 day');
insert into public.log_moderacao (moderador_id, acao, item_tipo, item_id, motivo, criado_em) values
  (pg_temp.u(1), 'advertir', 'resposta', pg_temp.id('5', 2), 'Lembrete amigável: respostas devem acrescentar algo à discussão (Código de Conduta, item 3).', now() - interval '37 days'),
  (pg_temp.u(3), 'manter', 'topico', pg_temp.id('c', 7), 'Denúncia de "ofensa religiosa" analisada: o tópico é respeitoso e convida ao debate. Mantido.', now() - interval '16 days');

-- ---------------------------------------------------------------- carteiras de teste (contas públicas de teste do Anvil — só testnet!)
insert into public.carteiras (profile_id, endereco, tipo, conta_dona, sbt_token_id, sbt_nivel, sbt_atualizado_em) values
  (pg_temp.u(2), '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 'embutida', null, 2, 2, now() - interval '9 days'),
  (pg_temp.u(3), '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 'embutida', null, 3, 4, now() - interval '9 days'),
  (pg_temp.u(4), '0x90f79bf6eb2c4f870365e785982e1f101e93b906', 'embutida', null, 4, 4, now() - interval '9 days'),
  (pg_temp.u(9), '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65', 'externa', null, 5, 3, now() - interval '9 days'),
  (pg_temp.u(7), '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc', 'embutida', null, 6, 3, now() - interval '9 days'),
  (pg_temp.u(1), '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 'embutida', null, 1, 4, now() - interval '9 days');

-- ---------------------------------------------------------------- época 1 de recompensas (já fechada)
-- Árvore Merkle no formato StandardMerkleTree (OpenZeppelin) ["address","uint256"].
insert into public.epocas_recompensa (id, inicio, fim, merkle_root, total_drc, total_wei, beneficiarios, status, tx_hash, publicada_em) values
  (1, date_trunc('week', now()) - interval '14 days', date_trunc('week', now()) - interval '7 days',
   '0x3ff219f855323f80319f41aed51c92e5b0e0c354e5577be351aa24e8dc0755f0', 629.5, 629500000000000000000, 5, 'publicada',
   '0x9d1c4b5f0d6c6b8a0f2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b', date_trunc('week', now()) - interval '7 days' + interval '3 hours');
insert into public.drc_pendentes (profile_id, valor, origem, epoca_id, created_at)
select pg_temp.u(n), v, 'distribuicao_inaugural', 1, date_trunc('week', now()) - interval '10 days'
from (values (2, 120), (3, 85.5), (4, 210), (9, 64), (7, 150)) as t(n, v);
insert into public.creditos_drc (profile_id, epoca_id, endereco, valor, valor_wei, indice, prova, resgatado_tx, resgatado_em) values
  (pg_temp.u(2), 1, '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 120, 120000000000000000000, 0,
   '["0x409ecfca4dc233e73fc928801240b9fa7c0b416e24d6131a2dd76cbbeb560d58","0xd9a15e7a70639a8aaebab97548b8531920838768eed10287ed0cb9c3e5440fd9","0x0125796aa6bce7f5ae9c46f6d8fab25fc1df3dc28d0a33eb1929d55e45792c60"]', null, null),
  (pg_temp.u(3), 1, '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 85.5, 85500000000000000000, 1,
   '["0x3a5c54d8e6b92ca8dcd895fc4c3eceb8576cd97b2d35e814cff1946dddd20fd3","0xd9a15e7a70639a8aaebab97548b8531920838768eed10287ed0cb9c3e5440fd9","0x0125796aa6bce7f5ae9c46f6d8fab25fc1df3dc28d0a33eb1929d55e45792c60"]',
   '0x1f2e3d4c5b6a79881726354453627181928374655647382910a0b0c0d0e0f101', now() - interval '6 days'),
  (pg_temp.u(4), 1, '0x90f79bf6eb2c4f870365e785982e1f101e93b906', 210, 210000000000000000000, 2,
   '["0xefeac0c2f33c0188b8a9619599a1eced67bae8794cbbc3982d2e116e341994b7","0x0125796aa6bce7f5ae9c46f6d8fab25fc1df3dc28d0a33eb1929d55e45792c60"]',
   '0x2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f70819', now() - interval '5 days'),
  (pg_temp.u(9), 1, '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65', 64, 64000000000000000000, 3,
   '["0x7bf63701b071e946afc3a2516e51f8cebf297b1ec1e311087824b8eaf890f124","0xe3b0991a2a2086f16f10bad134dd67b6a08b21abb06648c591e753a6008e055c"]', null, null),
  (pg_temp.u(7), 1, '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc', 150, 150000000000000000000, 4,
   '["0xc9c7bc900dcc44141ff76f35334042d94e1b57833bf171727aed186147d5ac06","0xe3b0991a2a2086f16f10bad134dd67b6a08b21abb06648c591e753a6008e055c"]', null, null);

insert into public.movimentos_drc (tx_hash, log_index, de, para, valor_wei, bloco, ocorrido_em) values
  ('0x1f2e3d4c5b6a79881726354453627181928374655647382910a0b0c0d0e0f101', 0, '0x0000000000000000000000000000000000000000', '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 85500000000000000000, 18200100, now() - interval '6 days'),
  ('0x2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f70819', 0, '0x0000000000000000000000000000000000000000', '0x90f79bf6eb2c4f870365e785982e1f101e93b906', 210000000000000000000, 18200400, now() - interval '5 days'),
  ('0x3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a', 1, '0x90f79bf6eb2c4f870365e785982e1f101e93b906', '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 10000000000000000000, 18200900, now() - interval '3 days');
insert into public.delegacoes (delegante, delegado, bloco, tx_hash) values
  ('0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 18200100, '0x1f2e3d4c5b6a79881726354453627181928374655647382910a0b0c0d0e0f101'),
  ('0x90f79bf6eb2c4f870365e785982e1f101e93b906', '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 18200500, '0x4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b');

-- ---------------------------------------------------------------- 2 propostas on-chain (Base Sepolia)
insert into public.propostas (id, autor_id, titulo, contexto_md, proposta_md, tipo, natureza, status, debate_iniciado_em, debate_ate, votacao_ate, created_at) values
  (pg_temp.id('2', 7), pg_temp.u(4), 'Liberar 5.000 DRC do Fundo do Mutirão para a Biblioteca do Bixiga',
   E'A biblioteca comunitária precisa de reconhecimento para as voluntárias que catalogam o acervo raro.',
   E'Executar `FundoMutirao.liberar(0x90F7…b906, 5000 DRC, "projeto:biblioteca-bixiga")` após aprovação e 48h de timelock.',
   'financeira', 'onchain', 'votacao', now() - interval '2 days', now() - interval '2 days', now() + interval '5 days', now() - interval '2 days'),
  (pg_temp.id('2', 8), pg_temp.u(3), 'Excluir a tesouraria e os cofres de vesting do cálculo de quórum',
   E'Tokens travados na tesouraria e nos contratos de vesting não votam e inflam o quórum.',
   E'Chamar `AgoraGovernor.definirExcluidosDoQuorum([timelock, fundoMutirao, vesting…])`.',
   'regimento', 'onchain', 'aprovada', now() - interval '12 days', now() - interval '12 days', now() - interval '3 days', now() - interval '12 days');
insert into public.propostas_onchain (proposal_id, proposta_id_app, proponente, descricao, descricao_hash, acoes, estado, modo_voto, votos_favor, votos_contra, abstencoes, quorum, bloco_snapshot, bloco_fim, eta, tx_criacao) values
  ('48217903328409128812938471029384756102938475610293847561029384756', pg_temp.id('2', 7), '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
   'Liberar 5.000 DRC do Fundo do Mutirão para a Biblioteca do Bixiga', null,
   '[{"alvo":"fundo_mutirao","funcao":"liberar","args":["0x90f79bf6eb2c4f870365e785982e1f101e93b906","5000000000000000000000","projeto:biblioteca-bixiga"]}]',
   'ativa', 'hibrido', 23400000000000000000, 9200000000000000000, 1000000000000000000, 15000000000000000000, 18210000, 18512400, null,
   '0x5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c'),
  ('91827364550192837465019283746501928374650192837465019283746501928', pg_temp.id('2', 8), '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
   'Excluir a tesouraria e os cofres de vesting do cálculo de quórum', null,
   '[{"alvo":"governor","funcao":"definirExcluidosDoQuorum","args":[["timelock","fundo_mutirao"]]}]',
   'na_fila', 'hibrido', 31800000000000000000, 2100000000000000000, 0, 15000000000000000000, 18150000, 18452400, now() + interval '30 hours',
   '0x6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d');

-- ---------------------------------------------------------------- notificações de boas-vindas
insert into public.notificacoes (profile_id, tipo, titulo, corpo, link, created_at) values
  (pg_temp.u(2), 'boas_vindas', 'Bem-vinda(o) à Ágora', 'Comece pela trilha "Primeiros passos" ou apresente-se no tópico do seu núcleo.', '/biblioteca', now() - interval '150 days');

-- limpa marcações de push para as notificações geradas pelo seed
update public.notificacoes set push_enviado_em = now();
select pg_temp.como(null);

commit;
