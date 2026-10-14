import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Divisor, ItemLista } from '@/components/ItemLista';
import { Carregando } from '@/components/Estados';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useMinhaCarteira } from '@/features/carteira/hooks';
import { CabecalhoPerfil, Contribuicoes } from '@/features/perfil/componentes';
import { useMeuPerfil, useNucleos } from '@/features/perfil/hooks';
import { suspenso } from '@/features/perfil/types';
import { PERMISSOES_NIVEL } from '@/lib/constantes';
import { formatarData } from '@/lib/formatos';

export default function MeuPerfilTela() {
  const { data: perfil, refetch, isRefetching } = useMeuPerfil();
  const { data: nucleos } = useNucleos();
  const { data: carteira } = useMinhaCarteira();
  if (!perfil) return <Carregando />;
  const nome = perfil.pseudonimo_ativo ? perfil.pseudonimo ?? '' : perfil.nome_exibicao;
  const nucleo = nucleos?.find((n) => n.id === perfil.nucleo_id);
  return (
    <Tela aoAtualizar={refetch} atualizando={isRefetching}>
      <CabecalhoPerfil nome={nome} avatar={perfil.avatar_url} cidade={perfil.cidade} estado={perfil.estado} nucleo={nucleo?.cidade} nivel={perfil.nivel} reputacao={perfil.reputacao_total} sbtNivel={carteira?.sbt_nivel} papel={perfil.papel} />
      {perfil.pseudonimo_ativo ? <Texto variante="legenda" cor="sutil" centro>Você aparece como “{perfil.pseudonimo}”. Seu nome real só é visível para a administração.</Texto> : null}
      {suspenso(perfil) ? (
        <Card destaque="perigo" plano><Texto>Sua participação está suspensa até {formatarData(perfil.suspenso_ate)}. Você continua podendo ler. Veja o log de moderação.</Texto></Card>
      ) : null}
      <Card plano>
        <Texto variante="secao" cor="secundario">O que você pode fazer</Texto>
        {Object.entries(PERMISSOES_NIVEL).filter(([n]) => Number(n) <= perfil.nivel || perfil.papel === 'admin').flatMap(([, l]) => l).map((p) => <Texto key={p} variante="legenda">• {p}</Texto>)}
      </Card>
      <Card plano style={{ paddingVertical: 4 }}>
        <ItemLista icone="bookmark" titulo="Salvos" subtitulo="Tópicos, artigos (off-line) e trilhas" onPress={() => router.push('/perfil/salvos')} />
        <Divisor />
        <ItemLista icone="hexagon" titulo="Carteira" subtitulo="Dracma (DRC), recompensas e votos" onPress={() => router.push('/perfil/carteira')} />
        <Divisor />
        <ItemLista icone="activity" titulo="Histórico de reputação" onPress={() => router.push('/perfil/reputacao')} />
        <Divisor />
        <ItemLista icone="eye" titulo="Log público de moderação" onPress={() => router.push('/perfil/moderacao')} />
        <Divisor />
        <ItemLista icone="settings" titulo="Configurações" onPress={() => router.push('/perfil/configuracoes')} />
        {perfil.papel === 'admin' || perfil.nivel >= 4 ? (
          <>
            <Divisor />
            <ItemLista icone="shield" titulo={perfil.papel === 'admin' ? 'Painel de administração' : 'Moderação'} onPress={() => router.push(perfil.papel === 'admin' ? '/perfil/admin' : '/perfil/admin/denuncias')} />
          </>
        ) : null}
      </Card>
      <Contribuicoes profileId={perfil.id} />
    </Tela>
  );
}
