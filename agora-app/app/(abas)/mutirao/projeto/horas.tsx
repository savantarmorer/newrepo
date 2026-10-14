import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Carregando } from '@/components/Estados';
import { Secao } from '@/components/Secao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useHorasProjeto, useInvalidarMutirao } from '@/features/mutirao/hooks';
import { confirmarHoras } from '@/features/mutirao/services';
import type { RegistroHoras } from '@/features/mutirao/types';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { textoDoErro } from '@/lib/erros';
import { formatarData, formatarNumero } from '@/lib/formatos';
import { toast } from '@/stores/toast';

export default function HorasProjeto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: perfil } = useMeuPerfil();
  const q = useHorasProjeto(id);
  const invalidar = useInvalidarMutirao();
  if (q.isLoading) return <Carregando />;
  const pendentes = (q.data ?? []).filter((h) => !h.confirmado_em && !h.recusado_em);
  const analisadas = (q.data ?? []).filter((h) => h.confirmado_em || h.recusado_em);

  async function decidir(h: RegistroHoras, aprovar: boolean) {
    try {
      await confirmarHoras(h.id, aprovar);
      invalidar();
      q.refetch();
      toast.sucesso(aprovar ? `${formatarNumero(h.horas)}h confirmadas — reputação creditada.` : 'Registro não confirmado.');
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  }

  return (
    <Tela aoAtualizar={q.refetch} atualizando={q.isRefetching}>
      <Texto cor="secundario">Só horas confirmadas pela coordenação geram reputação (8 pontos por hora). Ninguém confirma as próprias horas.</Texto>
      <Secao titulo={`Aguardando confirmação (${pendentes.length})`}>
        {pendentes.length ? pendentes.map((h) => (
          <Card key={h.id} plano destaque="dourado">
            <Texto variante="corpoForte">{h.autor?.nome_publico} · {formatarNumero(h.horas)}h</Texto>
            <Texto>{h.descricao}</Texto>
            <Texto variante="legenda" cor="sutil">Registrado em {formatarData(h.created_at)}</Texto>
            {h.profile_id !== perfil?.id ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Botao titulo="Confirmar" compacto icone="check" onPress={() => decidir(h, true)} />
                <Botao titulo="Não confirmar" compacto variante="fantasma" onPress={() => decidir(h, false)} />
              </View>
            ) : <Texto variante="legenda" cor="sutil">Suas horas: outra pessoa da coordenação precisa confirmar.</Texto>}
          </Card>
        )) : <EstadoVazio titulo="Tudo em dia" descricao="Nenhum registro de horas aguardando." ilustracao="maos" />}
      </Secao>
      {analisadas.length ? (
        <Secao titulo="Histórico">
          {analisadas.map((h) => (
            <Card key={h.id} plano style={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Texto variante="corpoForte">{h.autor?.nome_publico} · {formatarNumero(h.horas)}h</Texto>
                <ChipTema rotulo={h.confirmado_em ? 'Confirmadas' : 'Não confirmadas'} tom={h.confirmado_em ? 'secundaria' : 'primaria'} />
              </View>
              <Texto variante="legenda" cor="secundario">{h.descricao}</Texto>
            </Card>
          ))}
        </Secao>
      ) : null}
    </Tela>
  );
}
