import { router } from 'expo-router';
import { useState } from 'react';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { ItemLista } from '@/components/ItemLista';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useCarteirasPorNome, useConfigOnchain, useMinhaCarteira } from '@/features/carteira/hooks';
import { useCarteiraConectada } from '@/features/carteira/useCarteiraConectada';
import { delegar } from '@/features/carteira/wallet';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';

export default function Delegar() {
  const { data: cfg } = useConfigOnchain();
  const { data: carteira } = useMinhaCarteira();
  const { conectar } = useCarteiraConectada();
  const [busca, setBusca] = useState('');
  const resultados = useCarteirasPorNome(busca);
  const [enviando, setEnviando] = useState(false);

  async function para(endereco: string, nome: string) {
    if (!cfg?.token) return;
    setEnviando(true);
    try {
      await conectar.mutateAsync({});
      await delegar(cfg.token, endereco);
      toast.sucesso(`Seus votos agora são de ${nome}. Você pode mudar quando quiser.`);
      router.back();
    } catch (e) {
      toast.erro(textoDoErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela teclado>
      <Card plano>
        <Texto variante="legenda">Delegar transfere seu poder de voto on-chain (não seus DRC) para alguém em quem você confia. No modo híbrido, quem recebe a delegação também precisa ter o selo de reputação para votar.</Texto>
      </Card>
      {carteira ? <Botao titulo="Votar eu mesma(o) (autodelegação)" largura="total" carregando={enviando} onPress={() => para(carteira.endereco, 'você')} /> : null}
      <Campo rotulo="Delegar para outro membro" value={busca} onChangeText={setBusca} placeholder="Nome ou pseudônimo" />
      {resultados.data?.filter((r) => r.endereco !== carteira?.endereco).map((r) => <ItemLista key={r.profile_id} titulo={r.nome_publico} subtitulo={r.sbt_nivel ? 'Tem selo de reputação' : 'Sem selo — não vota no modo híbrido'} onPress={() => para(r.endereco, r.nome_publico)} />)}
    </Tela>
  );
}
