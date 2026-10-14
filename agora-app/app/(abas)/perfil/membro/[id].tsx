import { Stack, useLocalSearchParams } from 'expo-router';
import { abrirDenuncia } from '@/components/BarraAcoes';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { Carregando, Erro } from '@/components/Estados';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { CabecalhoPerfil, Contribuicoes } from '@/features/perfil/componentes';
import { useMeuPerfil, useNucleos, usePerfilPublico } from '@/features/perfil/hooks';
import { formatarDataLonga } from '@/lib/formatos';

/** Perfil de outro membro — mesma visão pública, respeitando o pseudônimo */
export default function PerfilMembro() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = usePerfilPublico(id);
  const { data: eu } = useMeuPerfil();
  const { data: nucleos } = useNucleos();
  if (q.isLoading) return <Carregando />;
  if (!q.data) return <Erro erro={q.error ?? 'Perfil indisponível'} />;
  const p = q.data;
  return (
    <Tela aoAtualizar={q.refetch} atualizando={q.isRefetching}>
      <Stack.Screen options={{ title: p.nome_publico }} />
      <CabecalhoPerfil nome={p.nome_publico} avatar={p.avatar_url} cidade={p.cidade} estado={p.estado} nucleo={nucleos?.find((n) => n.id === p.nucleo_id)?.cidade} nivel={p.nivel} reputacao={p.reputacao_total} papel={p.papel} />
      {p.bio ? <Card plano><Texto variante="leitura" style={{ fontSize: 16, lineHeight: 26 }}>{p.bio}</Texto></Card> : null}
      <Texto variante="legenda" cor="sutil" centro>Na Ágora desde {formatarDataLonga(p.created_at)}</Texto>
      {!p.removido ? <Contribuicoes profileId={p.id} /> : <Texto cor="sutil" centro>Este membro removeu a conta. As contribuições públicas permanecem como “Membro removido”.</Texto>}
      {eu?.id !== p.id && !p.removido ? <Botao titulo="Denunciar perfil" variante="fantasma" compacto onPress={() => abrirDenuncia('perfil', p.id)} /> : null}
    </Tela>
  );
}
