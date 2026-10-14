import { chamarFuncao, dados, dadosOuNulo, meuId, rpc, supabase } from '@/lib/supabase';
import { anexarPerfis, perfisPorIds } from '../comum';
import type { CobrancaPix, Evento, Lancamento, Projeto, RegistroHoras, ResumoCaixa, Rsvp, StatusRsvp, Tarefa } from './types';

// ------------------------------------------------------------------ projetos
const COLUNAS_PROJETO = 'id, titulo, descricao_md, causa, nucleo_id, coordenador_id, status, meta_financeira, data_inicio, data_fim, capa_url, oculto, created_at';
const CAMPOS_PROJETO = `${COLUNAS_PROJETO}, nucleo:nucleos(cidade, estado)`;

async function comResumo(projetos: Projeto[]): Promise<Projeto[]> {
  if (!projetos.length) return projetos;
  const resumos = await dados<ResumoCaixa[]>(supabase.from('caixa_resumo').select('*').in('projeto_id', projetos.map((p) => p.id)));
  return projetos.map((p) => ({ ...p, resumo: resumos.find((r) => r.projeto_id === p.id) }));
}

export async function listarProjetos(f: { nucleoId?: string | null; causa?: string | null; status?: string[] }): Promise<Projeto[]> {
  let q = supabase.from('projetos').select(CAMPOS_PROJETO).is('excluido_em', null).order('created_at', { ascending: false });
  q = q.in('status', f.status ?? ['planejamento', 'ativo']);
  if (f.nucleoId) q = q.eq('nucleo_id', f.nucleoId);
  if (f.causa) q = q.eq('causa', f.causa);
  return comResumo(await dados<Projeto[]>(q));
}

export async function buscarProjeto(id: string) {
  const projeto = await dadosOuNulo<Projeto>(supabase.from('projetos').select(CAMPOS_PROJETO).eq('id', id).maybeSingle());
  if (!projeto) return null;
  const [comR] = await comResumo([projeto]);
  const membros = await dados<{ profile_id: string; papel: 'coordenador' | 'voluntario' }[]>(
    supabase.from('projeto_membros').select('profile_id, papel').eq('projeto_id', id),
  );
  const perfis = await perfisPorIds([projeto.coordenador_id, ...membros.map((m) => m.profile_id)]);
  return {
    projeto: { ...comR!, coordenador: perfis[projeto.coordenador_id] },
    membros: membros.map((m) => ({ ...m, perfil: perfis[m.profile_id] })),
  };
}

export async function salvarProjeto(v: Partial<Projeto> & { titulo: string; descricao_md: string; causa: string }) {
  const campos = {
    titulo: v.titulo,
    descricao_md: v.descricao_md,
    causa: v.causa,
    nucleo_id: v.nucleo_id ?? null,
    meta_financeira: v.meta_financeira ?? null,
    data_inicio: v.data_inicio ?? null,
    data_fim: v.data_fim ?? null,
    capa_url: v.capa_url ?? null,
    ...(v.status ? { status: v.status } : {}),
  };
  if (v.id) return dados<Projeto>(supabase.from('projetos').update(campos).eq('id', v.id).select(COLUNAS_PROJETO).single());
  const coordenador_id = await meuId();
  return dados<Projeto>(supabase.from('projetos').insert({ ...campos, coordenador_id }).select(COLUNAS_PROJETO).single());
}

export async function entrarNoProjeto(projetoId: string) {
  const eu = await meuId();
  await dados(supabase.from('projeto_membros').upsert({ projeto_id: projetoId, profile_id: eu, papel: 'voluntario' }, { ignoreDuplicates: true }));
}

export async function sairDoProjeto(projetoId: string) {
  const eu = await meuId();
  await dados(supabase.from('projeto_membros').delete().eq('projeto_id', projetoId).eq('profile_id', eu).eq('papel', 'voluntario'));
}

// ------------------------------------------------------------------ tarefas
export async function tarefasDoProjeto(projetoId: string): Promise<Tarefa[]> {
  const lista = await dados<Tarefa[]>(supabase.from('tarefas').select('*').eq('projeto_id', projetoId).order('prazo', { ascending: true, nullsFirst: false }));
  return anexarPerfis(lista, 'responsavel_id', 'responsavel') as Promise<Tarefa[]>;
}

export async function minhasTarefas(): Promise<Tarefa[]> {
  const eu = await meuId();
  return dados(supabase.from('tarefas').select('*, projeto:projetos(titulo)').eq('responsavel_id', eu).neq('status', 'feito').order('prazo', { nullsFirst: false }));
}

export async function buscarTarefa(id: string): Promise<Tarefa | null> {
  const t = await dadosOuNulo<Tarefa>(supabase.from('tarefas').select('*, projeto:projetos(titulo)').eq('id', id).maybeSingle());
  if (!t) return null;
  const [com] = await anexarPerfis([t], 'responsavel_id', 'responsavel');
  return com as Tarefa;
}

export async function salvarTarefa(v: { id?: string; projeto_id: string; titulo: string; descricao?: string | null; prazo?: string | null; horas_estimadas?: number | null; responsavel_id?: string | null }) {
  if (v.id) {
    const { id, ...campos } = v;
    return dados<Tarefa>(supabase.from('tarefas').update(campos).eq('id', id).select('*').single());
  }
  const criado_por = await meuId();
  return dados<Tarefa>(supabase.from('tarefas').insert({ ...v, criado_por }).select('*').single());
}

export async function atualizarTarefa(id: string, campos: Partial<Pick<Tarefa, 'status' | 'responsavel_id'>>) {
  return dados<Tarefa>(supabase.from('tarefas').update(campos).eq('id', id).select('*').single());
}

// ------------------------------------------------------------------ horas
export async function registrarHoras(v: { projeto_id: string; tarefa_id?: string | null; horas: number; descricao: string }) {
  const profile_id = await meuId();
  return dados(supabase.from('horas_voluntariado').insert({ ...v, profile_id }));
}

export async function horasDoProjeto(projetoId: string): Promise<RegistroHoras[]> {
  const lista = await dados<RegistroHoras[]>(supabase.from('horas_voluntariado').select('*').eq('projeto_id', projetoId).order('created_at', { ascending: false }));
  return anexarPerfis(lista, 'profile_id') as Promise<RegistroHoras[]>;
}

export async function confirmarHoras(id: string, aprovar: boolean) {
  await rpc('confirmar_horas', { p_registro: id, p_aprovar: aprovar });
}

// ------------------------------------------------------------------ caixa
export async function lancamentos(projetoId: string): Promise<Lancamento[]> {
  const lista = await dados<Lancamento[]>(
    supabase.from('caixa_lancamentos').select('*').eq('projeto_id', projetoId).order('data', { ascending: false }).order('created_at', { ascending: false }),
  );
  return anexarPerfis(lista, 'lancado_por') as Promise<Lancamento[]>;
}

export async function caixaMensal(projetoId: string): Promise<{ mes: string; entradas: number; saidas: number }[]> {
  return rpc('caixa_mensal', { p_projeto: projetoId });
}

export async function lancar(v: { projeto_id: string; tipo: 'entrada' | 'saida'; valor: number; descricao: string; categoria: string; data: string; comprovante_url?: string | null; estorno_de?: string | null }) {
  return dados(supabase.from('caixa_lancamentos').insert(v));
}

// ------------------------------------------------------------------ doações (Edge Functions)
export async function criarDoacao(v: { projeto_id: string; valor: number; anonima: boolean }): Promise<CobrancaPix> {
  return chamarFuncao<CobrancaPix>('criar-doacao', v);
}

export async function statusDoacao(id: string): Promise<'pendente' | 'confirmada' | 'falhou'> {
  return chamarFuncao<{ status: 'pendente' | 'confirmada' | 'falhou' }>('criar-doacao', { consultar: id }).then((r) => r.status);
}

/** Só funciona com PAYMENT_PROVIDER=mock (ambiente de desenvolvimento) */
export async function simularPagamento(doacaoId: string) {
  return chamarFuncao('webhook-pagamento', { simular: doacaoId });
}

// ------------------------------------------------------------------ eventos
const COLUNAS_EVENTO = 'id, titulo, descricao, nucleo_id, projeto_id, criado_por, local_nome, endereco, inicio, fim, vagas, created_at';
const CAMPOS_EVENTO = `${COLUNAS_EVENTO}, nucleo:nucleos(cidade, estado), projeto:projetos(titulo)`;

export async function listarEventos(f: { nucleoId?: string | null; projetoId?: string; futuros?: boolean; limite?: number }): Promise<Evento[]> {
  let q = supabase.from('eventos').select(CAMPOS_EVENTO).order('inicio', { ascending: f.futuros !== false });
  if (f.futuros !== false) q = q.gte('fim', new Date().toISOString());
  if (f.nucleoId) q = q.eq('nucleo_id', f.nucleoId);
  if (f.projetoId) q = q.eq('projeto_id', f.projetoId);
  if (f.limite) q = q.limit(f.limite);
  return dados(q);
}

export async function buscarEvento(id: string) {
  const evento = await dadosOuNulo<Evento>(supabase.from('eventos').select(CAMPOS_EVENTO).eq('id', id).maybeSingle());
  if (!evento) return null;
  const rsvps = await anexarPerfis(await dados<Rsvp[]>(supabase.from('rsvps').select('*').eq('evento_id', id)), 'profile_id', 'perfil');
  const eu = await meuId();
  return { evento, rsvps, meu: rsvps.find((r) => r.profile_id === eu) ?? null, confirmados: rsvps.filter((r) => r.status === 'vou').length };
}

export async function salvarEvento(v: Omit<Evento, 'id' | 'criado_por' | 'created_at' | 'nucleo' | 'projeto'> & { id?: string }) {
  if (v.id) {
    const { id, ...campos } = v;
    return dados<Evento>(supabase.from('eventos').update(campos).eq('id', id).select(COLUNAS_EVENTO).single());
  }
  const criado_por = await meuId();
  return dados<Evento>(supabase.from('eventos').insert({ ...v, criado_por }).select(COLUNAS_EVENTO).single());
}

export async function responderRsvp(eventoId: string, status: StatusRsvp) {
  const eu = await meuId();
  return dados(supabase.from('rsvps').upsert({ evento_id: eventoId, profile_id: eu, status }));
}

export async function codigoCheckin(eventoId: string): Promise<string> {
  return rpc('codigo_checkin_evento', { p_evento: eventoId });
}

export async function fazerCheckin(conteudoQr: string): Promise<string> {
  return rpc('fazer_checkin', { p_conteudo_qr: conteudoQr });
}

export async function marcarPresenca(eventoId: string, profileId: string, presente: boolean) {
  await rpc('marcar_presenca', { p_evento: eventoId, p_profile: profileId, p_presente: presente });
}

// ------------------------------------------------------------------ núcleos
export async function buscarNucleo(id: string) {
  const nucleo = await dadosOuNulo<{ id: string; cidade: string; estado: string; descricao: string | null; coordenador_id: string | null }>(
    supabase.from('nucleos').select('*').eq('id', id).maybeSingle(),
  );
  if (!nucleo) return null;
  const [membros, projetos, eventos] = await Promise.all([
    dados<{ id: string }[]>(supabase.from('perfis_publicos').select('id').eq('nucleo_id', id).eq('removido', false)),
    listarProjetos({ nucleoId: id, status: ['planejamento', 'ativo', 'concluido'] }),
    listarEventos({ nucleoId: id }),
  ]);
  const perfis = await perfisPorIds([nucleo.coordenador_id, ...membros.slice(0, 30).map((m) => m.id)]);
  return {
    nucleo,
    coordenador: nucleo.coordenador_id ? perfis[nucleo.coordenador_id] : undefined,
    totalMembros: membros.length,
    membros: membros.slice(0, 30).map((m) => perfis[m.id]).filter(Boolean),
    projetos,
    eventos,
  };
}
