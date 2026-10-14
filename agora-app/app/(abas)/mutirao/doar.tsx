import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { Contagem } from '@/components/Contagem';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useInvalidarMutirao, useProjeto } from '@/features/mutirao/hooks';
import { criarDoacao, simularPagamento, statusDoacao } from '@/features/mutirao/services';
import type { CobrancaPix } from '@/features/mutirao/types';
import { textoDoErro } from '@/lib/erros';
import { formatarMoeda, parseValorBR } from '@/lib/formatos';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

const ATALHOS = [10, 25, 50, 100];

export default function Doar() {
  const { projeto } = useLocalSearchParams<{ projeto: string }>();
  const { c, espaco } = useTema();
  const q = useProjeto(projeto);
  const invalidar = useInvalidarMutirao();
  const [valor, setValor] = useState('25');
  const [anonima, setAnonima] = useState(false);
  const [cobranca, setCobranca] = useState<CobrancaPix | null>(null);
  const [status, setStatus] = useState<'pendente' | 'confirmada' | 'falhou'>('pendente');
  const [gerando, setGerando] = useState(false);
  const numero = parseValorBR(valor);

  // Acompanha o pagamento (o webhook do gateway confirma no servidor)
  useEffect(() => {
    if (!cobranca || status !== 'pendente') return;
    const id = setInterval(async () => {
      try {
        const s = await statusDoacao(cobranca.doacao_id);
        setStatus(s);
        if (s === 'confirmada') invalidar();
      } catch {
        /* tenta de novo */
      }
    }, 4000);
    return () => clearInterval(id);
  }, [cobranca, status, invalidar]);

  async function gerar() {
    setGerando(true);
    try {
      setCobranca(await criarDoacao({ projeto_id: projeto, valor: numero, anonima }));
      setStatus('pendente');
    } catch (e) {
      toast.erro(textoDoErro(e));
    } finally {
      setGerando(false);
    }
  }

  if (status === 'confirmada') {
    return (
      <Tela>
        <Card destaque="secundaria">
          <Texto variante="titulo">Obrigado! 💚</Texto>
          <Texto style={{ marginTop: 8 }}>Sua doação de {formatarMoeda(cobranca?.valor)} foi confirmada e já aparece no caixa transparente do projeto{anonima ? ' como “doação anônima”' : ''}.</Texto>
        </Card>
        <Botao titulo="Ver o caixa do projeto" largura="total" onPress={() => router.replace({ pathname: '/mutirao/projeto/caixa', params: { id: projeto } })} />
      </Tela>
    );
  }

  if (cobranca) {
    return (
      <Tela>
        <Texto variante="subtitulo">Pague com Pix</Texto>
        <Texto cor="secundario">Abra o app do seu banco e escaneie o QR Code ou use o Pix copia e cola.</Texto>
        <View style={{ alignItems: 'center', padding: espaco.lg, backgroundColor: '#FFFFFF', borderRadius: 16, alignSelf: 'center' }} accessible accessibilityLabel="QR Code do Pix">
          {cobranca.qr_code_base64 ? (
            <Image source={{ uri: `data:image/png;base64,${cobranca.qr_code_base64}` }} style={{ width: 220, height: 220 }} />
          ) : (
            <QRCode value={cobranca.pix_copia_cola} size={220} />
          )}
        </View>
        <Texto variante="numero" centro>{formatarMoeda(cobranca.valor)}</Texto>
        <Contagem ate={cobranca.expira_em} prefixo="Expira em " variante="legenda" cor="secundario" centro />
        <Botao titulo="Copiar código Pix" icone="copy" largura="total" variante="secundario" onPress={async () => { await Clipboard.setStringAsync(cobranca.pix_copia_cola); toast.sucesso('Código copiado!'); }} />
        <Card plano><Texto variante="legenda" cor="secundario">Aguardando confirmação do pagamento… esta tela se atualiza sozinha.</Texto></Card>
        {cobranca.simulado ? (
          <Botao titulo="Simular pagamento (ambiente de testes)" variante="fantasma" largura="total" onPress={async () => {
            try {
              await simularPagamento(cobranca.doacao_id);
              setStatus(await statusDoacao(cobranca.doacao_id));
              invalidar();
            } catch (e) {
              toast.erro(textoDoErro(e));
            }
          }} />
        ) : null}
      </Tela>
    );
  }

  return (
    <Tela teclado>
      <Texto variante="subtitulo">{q.data?.projeto.titulo}</Texto>
      <Texto cor="secundario">100% do valor entra no caixa público do projeto. Você acompanha cada real gasto.</Texto>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {ATALHOS.map((v) => <ChipTema key={v} rotulo={formatarMoeda(v)} selecionado={numero === v} onPress={() => setValor(String(v))} />)}
      </View>
      <Campo rotulo="Outro valor (R$)" value={valor} onChangeText={setValor} keyboardType="decimal-pad" erro={numero < 1 ? 'Valor mínimo de R$ 1,00' : undefined} />
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: anonima }} onPress={() => setAnonima(!anonima)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
        <View style={{ flex: 1 }}>
          <Texto variante="corpoForte">Doar anonimamente</Texto>
          <Texto variante="legenda" cor="secundario">Seu nome não fica registrado nem para a coordenação.</Texto>
        </View>
        <Switch value={anonima} onValueChange={setAnonima} trackColor={{ true: c.secundaria, false: c.bordaForte }} accessibilityLabel="Doar anonimamente" />
      </Pressable>
      <Botao titulo={`Gerar Pix de ${Number.isFinite(numero) ? formatarMoeda(numero) : 'R$ —'}`} icone="zap" largura="total" carregando={gerando} desabilitado={!(numero >= 1)} onPress={gerar} />
    </Tela>
  );
}
