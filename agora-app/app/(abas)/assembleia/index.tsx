import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Erro } from '@/components/Estados';
import { Secao } from '@/components/Secao';
import { Segmentos } from '@/components/Segmentos';
import { SkeletonLista } from '@/components/Skeleton';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { CardProposta, CardPropostaOnchain } from '@/features/assembleia/componentes';
import { usePropostas, usePropostasOnchain } from '@/features/assembleia/hooks';
import type { Aba } from '@/features/assembleia/services';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { usePreferencias } from '@/stores/preferencias';
import { useTema } from '@/theme/ThemeProvider';

export default function AssembleiaInicio() {
  const { espaco } = useTema();
  const { data: perfil } = useMeuPerfil();
  const [aba, setAba] = useState<Aba>('votacao');
  const escopo = usePreferencias((s) => s.filtroAssembleia);
  const definirEscopo = usePreferencias((s) => s.definirFiltroAssembleia);
  const nucleoId = escopo === 'meu_nucleo' ? perfil?.nucleo_id ?? null : null;
  const q = usePropostas(aba, nucleoId);
  const onchain = usePropostasOnchain();
  const ativasOnchain = (onchain.data ?? []).filter((p) => ['pendente', 'ativa', 'aprovada', 'na_fila'].includes(p.estado));

  const vazios: Record<Aba, { titulo: string; descricao: string }> = {
    debate: { titulo: 'Nenhuma proposta em debate', descricao: 'Curadores podem abrir propostas. Toda ideia começa aqui.' },
    votacao: { titulo: 'Nada em votação agora', descricao: 'Quando um debate termina, a votação abre automaticamente.' },
    decididas: { titulo: 'Nenhuma decisão ainda', descricao: 'Decisões ficam guardadas para sempre no arquivo.' },
    minhas: { titulo: 'Você ainda não propôs nada', descricao: 'Propostas bem fundamentadas mudam a comunidade.' },
  };

  return (
    <Tela aoAtualizar={() => { q.refetch(); onchain.refetch(); }} atualizando={q.isRefetching}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco.sm }}>
        {podeNivel(perfil, 3) ? <Botao titulo="Nova proposta" icone="plus" variante="secundario" compacto onPress={() => router.push('/assembleia/proposta/nova')} /> : null}
        <Botao titulo="Arquivo de decisões" icone="archive" variante="secundario" compacto onPress={() => router.push('/assembleia/decisoes')} />
        {podeNivel(perfil, 3) ? <Botao titulo="Proposta on-chain" icone="link" variante="secundario" compacto onPress={() => router.push('/assembleia/onchain/nova')} /> : null}
      </ScrollView>
      <Segmentos
        opcoes={[{ valor: 'debate', rotulo: 'Em debate' }, { valor: 'votacao', rotulo: 'Em votação' }, { valor: 'decididas', rotulo: 'Decididas' }, ...(podeNivel(perfil, 3) ? [{ valor: 'minhas', rotulo: 'Minhas' }] : [])]}
        valor={aba}
        aoMudar={(v) => setAba(v as Aba)}
      />
      <Segmentos compacto opcoes={[{ valor: 'geral', rotulo: 'Geral' }, { valor: 'meu_nucleo', rotulo: 'Meu núcleo' }]} valor={escopo} aoMudar={(v) => definirEscopo(v as 'geral' | 'meu_nucleo')} />
      {q.isLoading ? <SkeletonLista /> : q.error ? <Erro erro={q.error} aoTentar={q.refetch} /> : q.data?.length ? (
        q.data.map((p) => <CardProposta key={p.id} p={p} />)
      ) : (
        <EstadoVazio
          ilustracao="urna"
          titulo={vazios[aba].titulo}
          descricao={vazios[aba].descricao}
          acao={podeNivel(perfil, 3) && aba !== 'decididas' ? { titulo: 'Escrever proposta', onPress: () => router.push('/assembleia/proposta/nova') } : undefined}
        />
      )}
      {aba !== 'minhas' && ativasOnchain.length ? (
        <Secao titulo="Governança on-chain (Dracma)">
          <Texto variante="legenda" cor="secundario">Tesouraria, fundo do Mutirão e parâmetros do token. Executadas pelo Timelock 48h após aprovação.</Texto>
          {ativasOnchain.map((p) => <CardPropostaOnchain key={p.proposal_id} p={p} />)}
        </Secao>
      ) : null}
      <View style={{ height: 8 }} />
    </Tela>
  );
}
