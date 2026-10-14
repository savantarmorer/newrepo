import { assinaturaAtiva, type MeuPerfil } from '@/features/perfil/types';

/** Para onde a pessoa deve ir, dado o estado da sessão e do perfil. */
export function destinoInicial(temSessao: boolean, perfil: MeuPerfil | null | undefined): string {
  if (!temSessao) return '/boas-vindas';
  if (!perfil) return '/carregando';
  if (perfil.excluido_em) return '/entrar';
  if (!perfil.onboarding_concluido_em) return '/onboarding-perfil';
  if (!perfil.aceitou_codigo_conduta_em) return '/onboarding-conduta';
  if (!assinaturaAtiva(perfil)) return '/inativo';
  return '/biblioteca';
}
