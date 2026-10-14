import { router } from 'expo-router';
import { useState } from 'react';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { ItemLista } from '@/components/ItemLista';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useCarteirasPorNome, useConfigOnchain } from '@/features/carteira/hooks';
import { useCarteiraConectada } from '@/features/carteira/useCarteiraConectada';
import { transferir } from '@/features/carteira/wallet';
import { textoDoErro } from '@/lib/erros';
import { encurtarEndereco } from '@/lib/formatos';
import { toast } from '@/stores/toast';

export default function EnviarDRC() {
  const { data: cfg } = useConfigOnchain();
  const { conectar } = useCarteiraConectada();
  const [busca, setBusca] = useState('');
  const resultados = useCarteirasPorNome(busca);
  const [destino, setDestino] = useState<{ nome: string; endereco: string } | null>(null);
  const [valor, setValor] = useState('');
  const [enviando, setEnviando] = useState(false);
  const numero = Number(valor.replace(',', '.'));
  return (
    <Tela teclado>
      <Texto cor="secundario">Envie DRC para outro membro pelo nome público. A transação é gratuita para você.</Texto>
      {destino ? (
        <Card plano destaque="secundaria"><Texto variante="corpoForte">Para: {destino.nome}</Texto><Texto variante="legenda" cor="secundario">{encurtarEndereco(destino.endereco)}</Texto></Card>
      ) : (
        <>
          <Campo rotulo="Membro" value={busca} onChangeText={setBusca} placeholder="Nome ou pseudônimo" />
          {resultados.data?.map((r) => <ItemLista key={r.profile_id} titulo={r.nome_publico} subtitulo={encurtarEndereco(r.endereco)} onPress={() => setDestino({ nome: r.nome_publico, endereco: r.endereco })} />)}
        </>
      )}
      <Campo rotulo="Quantidade (DRC)" value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
      <Botao titulo="Enviar" icone="send" largura="total" carregando={enviando} desabilitado={!destino || !(numero > 0) || !cfg?.token} onPress={async () => {
        setEnviando(true);
        try {
          await conectar.mutateAsync({});
          await transferir(cfg!.token!, destino!.endereco, BigInt(Math.round(numero * 1e6)) * 10n ** 12n);
          toast.sucesso('DRC enviados!');
          router.back();
        } catch (e) {
          toast.erro(textoDoErro(e));
        } finally {
          setEnviando(false);
        }
      }} />
    </Tela>
  );
}
