import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { Texto } from '@/components/Texto';
import { textoDoErro } from '@/lib/erros';
import { esquecerServidor, salvarServidor, servidorDoBuild, testarServidor } from '@/lib/servidor';
import { useServidor } from '@/stores/servidor';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';
import { ativarServidor, lerConvite } from './ativar';

interface Props {
  /** valores vindos de um link de convite (agora://servidor?url=…&chave=…) */
  inicial?: { url: string; chave: string };
  aoConectar?: () => void;
}

/** Formulário para apontar o app para o servidor Supabase da comunidade. */
export function FormServidor({ inicial, aoConectar }: Props) {
  const { c, raio } = useTema();
  const atual = useServidor((s) => s.servidor);
  const padrao = servidorDoBuild();
  const [url, setUrl] = useState(inicial?.url ?? (atual?.origem === 'app' ? atual.url : ''));
  const [chave, setChave] = useState(inicial?.chave ?? (atual?.origem === 'app' ? atual.chave : ''));
  const [testando, setTestando] = useState(false);
  const [lendoQr, setLendoQr] = useState(false);
  const [permissao, pedirPermissao] = useCameraPermissions();
  const lido = useRef(false);

  const conectar = async (u = url, k = chave) => {
    setTestando(true);
    try {
      await testarServidor(u, k);
      ativarServidor(await salvarServidor(u, k));
      toast.sucesso('Servidor conectado.');
      aoConectar?.();
    } catch (e) {
      toast.erro(textoDoErro(e));
    } finally {
      setTestando(false);
    }
  };

  if (lendoQr) {
    if (!permissao?.granted) {
      return (
        <Card plano>
          <Texto variante="subtitulo">Precisamos da câmera</Texto>
          <Texto cor="secundario" style={{ marginTop: 6 }}>Só para ler o QR Code de convite. Nenhuma imagem é guardada.</Texto>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Botao titulo="Permitir câmera" onPress={pedirPermissao} />
            <Botao titulo="Cancelar" variante="fantasma" onPress={() => setLendoQr(false)} />
          </View>
        </Card>
      );
    }
    return (
      <View style={{ gap: 12 }}>
        <View style={{ height: 320, borderRadius: raio.lg, overflow: 'hidden', borderWidth: 2, borderColor: c.dourado }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (lido.current) return;
              const convite = lerConvite(data);
              if (!convite) return;
              lido.current = true;
              setLendoQr(false);
              setUrl(convite.url);
              setChave(convite.chave);
              conectar(convite.url, convite.chave).finally(() => { lido.current = false; });
            }}
          />
        </View>
        <Texto centro cor="secundario">Aponte para o QR Code de convite (Perfil › Administração › Convidar).</Texto>
        <Botao titulo="Cancelar" variante="fantasma" largura="total" onPress={() => setLendoQr(false)} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {atual ? (
        <Card plano>
          <Texto variante="rotulo" cor="secundario">Conectado a</Texto>
          <Texto selectable style={{ marginTop: 4 }}>{atual.url}</Texto>
          <Texto variante="legenda" cor="sutil" style={{ marginTop: 4 }}>
            {atual.origem === 'app' ? 'Escolhido neste aparelho' : atual.origem === 'build' ? 'Padrão desta versão do app' : 'Supabase local (desenvolvimento)'}
          </Texto>
        </Card>
      ) : null}
      {Platform.OS !== 'web' ? (
        <Botao titulo="Ler QR Code de convite" icone="camera" variante="secundario" largura="total" onPress={() => { lido.current = false; setLendoQr(true); }} />
      ) : null}
      <Campo
        rotulo="Endereço do servidor"
        placeholder="https://seu-projeto.supabase.co"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        ajuda="Project URL do Supabase (Settings › API)."
        testID="campo-servidor-url"
      />
      <Campo
        rotulo="Chave pública (anon)"
        placeholder="eyJhbGciOi…"
        value={chave}
        onChangeText={setChave}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        style={{ minHeight: 88, fontSize: 13 }}
        ajuda="É a chave pública do projeto — nunca use a service_role."
        testID="campo-servidor-chave"
      />
      <Botao titulo="Testar e conectar" icone="link" largura="total" carregando={testando} desabilitado={!url || !chave} onPress={() => conectar()} testID="botao-conectar-servidor" />
      {padrao && atual?.origem === 'app' ? (
        <Botao
          titulo={padrao.origem === 'build' ? 'Voltar ao servidor padrão do app' : 'Usar o Supabase local deste computador'}
          variante="fantasma"
          largura="total"
          onPress={async () => {
            await esquecerServidor();
            ativarServidor(padrao);
            toast.info('Servidor padrão restaurado.');
            aoConectar?.();
          }}
        />
      ) : null}
    </View>
  );
}
