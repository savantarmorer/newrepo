import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { Carregando, Erro } from '@/components/Estados';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useAtualizarTarefa, useProjeto, useTarefa } from '@/features/mutirao/hooks';
import { ROTULO_STATUS_TAREFA, type StatusTarefa } from '@/features/mutirao/types';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { textoDoErro } from '@/lib/erros';
import { formatarData, formatarNumero } from '@/lib/formatos';
import { toast } from '@/stores/toast';

export default function TelaTarefa() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: perfil } = useMeuPerfil();
  const q = useTarefa(id);
  const projeto = useProjeto(q.data?.projeto_id);
  const atualizar = useAtualizarTarefa();
  if (q.isLoading) return <Carregando />;
  if (!q.data) return <Erro erro={q.error ?? 'Tarefa não encontrada'} aoTentar={q.refetch} />;
  const t = q.data;
  const minha = t.responsavel_id === perfil?.id;
  const coordeno = projeto.data?.projeto.coordenador_id === perfil?.id || perfil?.papel === 'admin';

  const mudar = async (campos: { status?: StatusTarefa; responsavel_id?: string | null }, msg: string) => {
    try {
      await atualizar.mutateAsync({ id: t.id, campos });
      q.refetch();
      toast.sucesso(msg);
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  };

  return (
    <Tela aoAtualizar={q.refetch} atualizando={q.isRefetching}>
      <Texto variante="legenda" cor="primaria" onPress={() => router.push(`/mutirao/projeto/${t.projeto_id}`)}>{t.projeto?.titulo} ›</Texto>
      <Texto variante="titulo">{t.titulo}</Texto>
      {t.descricao ? <Texto variante="leitura" style={{ fontSize: 17 }}>{t.descricao}</Texto> : null}
      <Card plano style={{ gap: 4 }}>
        <Texto>Status: <Texto variante="corpoForte">{ROTULO_STATUS_TAREFA[t.status]}</Texto></Texto>
        <Texto>Responsável: <Texto variante="corpoForte">{t.responsavel?.nome_publico ?? 'ninguém ainda'}</Texto></Texto>
        {t.prazo ? <Texto>Prazo: {formatarData(t.prazo)}</Texto> : null}
        {t.horas_estimadas ? <Texto>Estimativa: {formatarNumero(t.horas_estimadas)}h</Texto> : null}
      </Card>
      {!t.responsavel_id ? <Botao titulo="Assumir esta tarefa" icone="user-check" largura="total" onPress={() => mudar({ responsavel_id: perfil?.id, status: t.status === 'a_fazer' ? 'fazendo' : t.status }, 'Tarefa assumida. Mãos à obra!')} /> : null}
      {minha || coordeno ? (
        <View style={{ gap: 12 }}>
          <Seletor rotulo="Mudar status" opcoes={(['a_fazer', 'fazendo', 'feito'] as StatusTarefa[]).map((s) => ({ valor: s, rotulo: ROTULO_STATUS_TAREFA[s] }))} valor={t.status} aoMudar={(v) => mudar({ status: v as StatusTarefa }, 'Status atualizado.')} />
          {minha ? <Botao titulo="Registrar horas nesta tarefa" icone="clock" variante="secundario" largura="total" onPress={() => router.push({ pathname: '/mutirao/horas/registrar', params: { projeto: t.projeto_id, tarefa: t.id } })} /> : null}
          {minha ? <Botao titulo="Liberar tarefa" variante="fantasma" largura="total" onPress={() => mudar({ responsavel_id: null, status: 'a_fazer' }, 'Tarefa liberada para outra pessoa.')} /> : null}
        </View>
      ) : null}
    </Tela>
  );
}
