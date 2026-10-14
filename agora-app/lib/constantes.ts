export const NOMES_NIVEIS: Record<number, string> = {
  1: 'Aprendiz',
  2: 'Colaborador',
  3: 'Curador',
  4: 'Guardião',
};

export const LIMIARES_PADRAO: Record<number, number> = { 1: 0, 2: 50, 3: 250, 4: 800 };

export const PERMISSOES_NIVEL: Record<number, string[]> = {
  1: ['Ler tudo', 'Comentar e responder', 'Inscrever-se em tarefas e eventos', 'Votar'],
  2: ['Criar tópicos', 'Propor artigos', 'Criar tarefas nos seus projetos'],
  3: ['Revisar e aprovar artigos', 'Montar trilhas', 'Abrir propostas na Assembleia'],
  4: ['Criar projetos de Mutirão', 'Moderar conteúdo', 'Lançar no caixa dos projetos que coordena'],
};

export const ROTULOS_ACAO_REPUTACAO: Record<string, string> = {
  resposta_util: 'Resposta marcada como útil',
  resposta_util_estorno: 'Marcação de resposta útil desfeita',
  artigo_publicado: 'Artigo publicado',
  revisao_concluida: 'Revisão concluída',
  trilha_publicada: 'Trilha publicada',
  hora_voluntariado: 'Horas de voluntariado confirmadas',
  presenca_evento: 'Presença confirmada em evento',
  presenca_evento_estorno: 'Presença desfeita',
  aula_ministrada: 'Aula bem avaliada pelos participantes',
  projeto_concluido: 'Projeto concluído',
  proposta_aprovada: 'Proposta aprovada',
  conteudo_removido: 'Conteúdo removido pela moderação',
  conteudo_removido_estorno: 'Remoção revertida em recurso',
  contribuicao_historica: 'Contribuições no Discord (migração)',
};

export const TIPOS_NOTIFICACAO: { tipo: string; rotulo: string; descricao: string }[] = [
  { tipo: 'resposta_topico', rotulo: 'Respostas', descricao: 'Alguém respondeu a um tópico ou comentário seu' },
  { tipo: 'artigo_revisado', rotulo: 'Revisões', descricao: 'Seu artigo recebeu um parecer' },
  { tipo: 'aula_avaliada', rotulo: 'Aulas', descricao: 'Resultado da avaliação de uma aula que você deu' },
  { tipo: 'artigo_publicado', rotulo: 'Publicações', descricao: 'Seu artigo foi publicado' },
  { tipo: 'tarefa_atribuida', rotulo: 'Tarefas', descricao: 'Uma tarefa foi atribuída a você' },
  { tipo: 'horas_confirmadas', rotulo: 'Horas', descricao: 'Suas horas de voluntariado foram analisadas' },
  { tipo: 'evento_24h', rotulo: 'Eventos', descricao: 'Lembrete 24h antes de eventos confirmados' },
  { tipo: 'proposta_votacao', rotulo: 'Votações abertas', descricao: 'Uma proposta do seu escopo entrou em votação' },
  { tipo: 'votacao_24h', rotulo: 'Fim de votação', descricao: 'A votação termina em 24h e você não votou' },
  { tipo: 'proposta_resultado', rotulo: 'Resultados', descricao: 'Resultado de propostas que você criou ou votou' },
  { tipo: 'nivel_subiu', rotulo: 'Nível', descricao: 'Você subiu de nível' },
  { tipo: 'trilha_concluida', rotulo: 'Trilhas', descricao: 'Você concluiu uma trilha' },
  { tipo: 'recompensa', rotulo: 'Recompensas', descricao: 'Créditos de Dracma disponíveis para resgate' },
];

export const CAUSAS = [
  'Assistência social',
  'Educação e cultura',
  'Proteção animal',
  'Meio ambiente',
  'Saúde',
  'Moradia',
  'Segurança alimentar',
  'Outra',
];

export const CATEGORIAS_CAIXA = [
  'Materiais', 'Alimentação', 'Transporte', 'Serviços', 'Equipamentos', 'Saúde', 'Eventos', 'Repasse', 'Outra',
];

export const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const MOTIVOS_DENUNCIA = [
  'Desrespeito ou ataque pessoal',
  'Discurso de ódio ou discriminação',
  'Informação falsa ou perigosa',
  'Spam ou divulgação comercial',
  'Conteúdo fora do tema',
  'Outro',
];
