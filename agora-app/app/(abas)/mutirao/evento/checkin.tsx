import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useInvalidarMutirao } from '@/features/mutirao/hooks';
import { fazerCheckin } from '@/features/mutirao/services';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

export default function Checkin() {
  const { c, raio } = useTema();
  const [permissao, pedir] = useCameraPermissions();
  const [processando, setProcessando] = useState(false);
  const lido = useRef(false);
  const invalidar = useInvalidarMutirao();

  if (!permissao) return <Tela><Texto>Verificando permissão da câmera…</Texto></Tela>;
  if (!permissao.granted) {
    return (
      <Tela>
        <Card plano>
          <Texto variante="subtitulo">Precisamos da câmera</Texto>
          <Texto cor="secundario" style={{ marginTop: 6 }}>A câmera é usada só para ler o QR Code do evento. Nenhuma imagem é guardada.</Texto>
        </Card>
        <Botao titulo="Permitir câmera" largura="total" onPress={pedir} />
      </Tela>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.fundo }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={async ({ data }) => {
          if (lido.current || processando) return;
          lido.current = true;
          setProcessando(true);
          try {
            const eventoId = await fazerCheckin(data);
            invalidar();
            toast.sucesso('Presença confirmada! Bom evento.');
            router.replace(`/mutirao/evento/${eventoId}`);
          } catch (e) {
            toast.erro(textoDoErro(e));
            setTimeout(() => { lido.current = false; }, 2500);
          } finally {
            setProcessando(false);
          }
        }}
      />
      <View pointerEvents="none" style={{ position: 'absolute', top: '25%', alignSelf: 'center', width: 240, height: 240, borderWidth: 3, borderColor: c.dourado, borderRadius: raio.lg }} />
      <View style={{ padding: 16, backgroundColor: c.superficie }}>
        <Texto centro>{processando ? 'Confirmando presença…' : 'Aponte para o QR Code mostrado pela organização.'}</Texto>
      </View>
    </View>
  );
}
