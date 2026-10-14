import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { entrarComCodigoDiscord } from '@/lib/auth';
import { textoDoErro } from '@/lib/erros';

/** "abcd efgh" → "ABCD-EFGH" enquanto a pessoa digita */
function formatar(texto: string) {
  const limpo = texto.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  return limpo.length > 4 ? `${limpo.slice(0, 4)}-${limpo.slice(4)}` : limpo;
}

/** Entrar com a conta criada na prévia pelo Discord, usando o código que o bot gera. */
export default function EntrarComDiscord() {
  const params = useLocalSearchParams<{ codigo?: string }>();
  const [codigo, setCodigo] = useState(formatar(params.codigo ?? ''));
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const completo = codigo.replace('-', '').length === 8;

  const entrar = async () => {
    setErro(null);
    setCarregando(true);
    try {
      await entrarComCodigoDiscord(codigo);
      // o layout público redireciona sozinho quando a sessão aparece
    } catch (e) {
      setErro(textoDoErro(e));
    } finally {
      setCarregando(false);
    }
  };

  // Veio de um link com o código: entra direto
  useEffect(() => {
    if (params.codigo && completo) entrar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tela teclado>
      <View style={{ gap: 6 }}>
        <Texto variante="titulo">Entrar com o Discord</Texto>
        <Texto cor="secundario">
          Já participa da prévia pelo Discord? Use a mesma conta aqui — com sua reputação, artigos, votos e Dracmas.
        </Texto>
      </View>
      <Card>
        <Texto variante="corpoForte">Como pegar o código</Texto>
        <Texto cor="secundario" style={{ marginTop: 6 }}>
          1. No servidor do Discord, digite <Texto variante="corpoForte">/agora app</Texto> (ou abra o <Texto variante="corpoForte">/menu</Texto> e toque em “Entrar no app”).{'\n'}
          2. O bot mostra um código como ABCD-EFGH, só para você.{'\n'}
          3. Digite o código abaixo. Ele vale 15 minutos e uma vez só.
        </Texto>
      </Card>
      <Campo
        rotulo="Código do Discord"
        value={codigo}
        onChangeText={(t) => {
          setCodigo(formatar(t));
          setErro(null);
        }}
        placeholder="ABCD-EFGH"
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        returnKeyType="go"
        onSubmitEditing={() => completo && entrar()}
        erro={erro ?? undefined}
        testID="campo-codigo-discord"
        style={{ fontSize: 24, letterSpacing: 4, textAlign: 'center' }}
      />
      <Botao titulo="Entrar" icone="log-in" largura="total" carregando={carregando} desabilitado={!completo} onPress={entrar} testID="botao-entrar-codigo" />
      <Texto variante="legenda" cor="sutil" centro>
        Não mostre o código a ninguém: quem tiver o código entra na sua conta.
      </Texto>
    </Tela>
  );
}
