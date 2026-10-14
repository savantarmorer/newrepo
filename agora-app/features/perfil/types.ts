export type Papel = 'membro' | 'coordenador' | 'admin';

export interface PerfilPublico {
  id: string;
  nome_publico: string;
  pseudonimo_ativo: boolean;
  avatar_url: string | null;
  bio: string | null;
  cidade: string | null;
  estado: string | null;
  nucleo_id: string | null;
  papel: Papel;
  nivel: number;
  reputacao_total: number;
  removido: boolean;
  created_at: string;
}

export interface MeuPerfil {
  id: string;
  nome_exibicao: string;
  pseudonimo: string | null;
  pseudonimo_ativo: boolean;
  bio: string | null;
  avatar_url: string | null;
  cidade: string | null;
  estado: string | null;
  nucleo_id: string | null;
  papel: Papel;
  status_assinatura: 'ativo' | 'inativo';
  assinatura_valida_ate: string | null;
  reputacao_total: number;
  nivel: number;
  interesses: string[];
  aceitou_codigo_conduta_em: string | null;
  onboarding_concluido_em: string | null;
  suspenso_ate: string | null;
  preferencias_notificacao: Record<string, boolean>;
  excluido_em: string | null;
  created_at: string;
}

export interface Nucleo {
  id: string;
  cidade: string;
  estado: string;
  descricao: string | null;
  coordenador_id: string | null;
}

/** Assinatura ativa e válida (admins sempre ativos) */
export function assinaturaAtiva(p?: MeuPerfil | null): boolean {
  if (!p || p.excluido_em) return false;
  if (p.papel === 'admin') return true;
  return p.status_assinatura === 'ativo' && (!p.assinatura_valida_ate || new Date(p.assinatura_valida_ate) >= new Date());
}

export function suspenso(p?: MeuPerfil | null): boolean {
  return !!p?.suspenso_ate && new Date(p.suspenso_ate) > new Date();
}

/** Permissão por nível (admins têm todas) */
export function podeNivel(p: MeuPerfil | null | undefined, nivel: number): boolean {
  if (!p || suspenso(p) || !assinaturaAtiva(p)) return false;
  return p.papel === 'admin' || p.nivel >= nivel;
}
