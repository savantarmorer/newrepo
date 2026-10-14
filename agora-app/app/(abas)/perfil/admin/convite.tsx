import * as Clipboard from 'expo-clipboard';
import { Redirect } from 'expo-router';
import { Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { linkDeConvite } from '@/features/servidor/ativar';
import { useServidor } from '@/stores/servidor';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

/** QR Code que aponta o app de um novo membro para este servidor (endereço + chave pública). */
export default function Convite() {
  const { c } = useTema();
  const { data: perfil } = useMeuPerfil();
  const servidor = useServidor((s) => s.servidor);
  if (perfil && perfil.papel !== 'admin') return <Redirect href="/perfil" />;
  if (!servidor) return null;
  const link = linkDeConvite(servidor);
  return (
    <Tela>
      <Texto cor="secundario">
        Quem instalar o app lê este QR Code na primeira tela e já fica conectado a este servidor. Ele contém apenas o endereço
        e a chave pública do projeto — nada que dê acesso a dados sem login.
      </Texto>
      <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
        <View style={{ padding: 12, backgroundColor: '#FFFFFF', borderRadius: 12 }}>
          <QRCode value={link} size={240} color="#1C1A18" backgroundColor="#FFFFFF" />
        </View>
        <Texto variante="legenda" cor="sutil" centro style={{ marginTop: 12 }} selectable>{servidor.url}</Texto>
      </Card>
      <Botao titulo="Compartilhar link de convite" icone="share-2" largura="total" onPress={() => Share.share({ message: `Entre na Ágora: instale o app e abra este link no celular\n${link}` })} />
      <Botao
        titulo="Copiar link"
        icone="copy"
        variante="secundario"
        largura="total"
        onPress={async () => {
          await Clipboard.setStringAsync(link);
          toast.sucesso('Link copiado.');
        }}
      />
      <Texto variante="legenda" cor="sutil" style={{ color: c.textoSutil }}>
        O acesso continua exigindo conta: o link só diz ao app onde fica a comunidade.
      </Texto>
    </Tela>
  );
}
