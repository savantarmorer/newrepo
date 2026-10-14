import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Card } from '@/components/Card';
import { Divisor, ItemLista } from '@/components/ItemLista';
import { Secao } from '@/components/Secao';
import { Segmentos } from '@/components/Segmentos';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { exportarMeusDados, excluirMinhaConta } from '@/features/perfil/services';
import { sair } from '@/lib/auth';
import { textoDoErro } from '@/lib/erros';
import { limparOffline } from '@/lib/offline';
import { removerPushDoAparelho } from '@/lib/push';
import { usePreferencias, type PreferenciaTema } from '@/stores/preferencias';
import { useServidor } from '@/stores/servidor';
import { toast } from '@/stores/toast';

export default function Configuracoes() {
  const tema = usePreferencias((s) => s.tema);
  const definirTema = usePreferencias((s) => s.definirTema);
  const [exportando, setExportando] = useState(false);
  const servidor = useServidor((s) => s.servidor);

  async function exportar() {
    setExportando(true);
    try {
      const dadosJson = JSON.stringify(await exportarMeusDados(), null, 2);
      if (Platform.OS === 'web') {
        toast.info('Exportação gerada. Use o app no celular para salvar o arquivo.');
        return;
      }
      const arquivo = new File(Paths.cache, `agora-meus-dados-${new Date().toISOString().slice(0, 10)}.json`);
      if (arquivo.exists) arquivo.delete();
      arquivo.create();
      arquivo.write(dadosJson);
      await Sharing.shareAsync(arquivo.uri, { mimeType: 'application/json', dialogTitle: 'Meus dados da Ágora' });
    } catch (e) {
      toast.erro(textoDoErro(e));
    } finally {
      setExportando(false);
    }
  }

  function excluir() {
    Alert.alert(
      'Excluir sua conta?',
      'Seu perfil será anonimizado e seu acesso encerrado. Conteúdos públicos ficam como “Membro removido”; votos e lançamentos de caixa são preservados para a integridade da comunidade. Isso não pode ser desfeito.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir definitivamente',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerPushDoAparelho();
              await excluirMinhaConta();
              await limparOffline();
              await sair();
            } catch (e) {
              toast.erro(textoDoErro(e));
            }
          },
        },
      ],
    );
  }

  return (
    <Tela>
      <Secao titulo="Aparência">
        <Segmentos opcoes={[{ valor: 'sistema', rotulo: 'Sistema' }, { valor: 'claro', rotulo: 'Claro' }, { valor: 'escuro', rotulo: 'Escuro' }]} valor={tema} aoMudar={(v) => definirTema(v as PreferenciaTema)} />
      </Secao>
      <Card plano style={{ paddingVertical: 4 }}>
        <ItemLista icone="user" titulo="Editar perfil e pseudônimo" onPress={() => router.push('/perfil/editar')} />
        <Divisor />
        <ItemLista icone="bell" titulo="Notificações" subtitulo="Escolha o que quer receber" onPress={() => router.push('/perfil/notificacoes-config')} />
        <Divisor />
        <ItemLista icone="book" titulo="Código de Conduta" onPress={() => router.push('/perfil/conduta')} />
        <Divisor />
        <ItemLista icone="server" titulo="Servidor da comunidade" subtitulo={servidor?.url.replace(/^https?:\/\//, '')} onPress={() => router.push('/servidor')} />
      </Card>
      <Secao titulo="Seus dados (LGPD)">
        <Card plano style={{ paddingVertical: 4 }}>
          <ItemLista icone="download" titulo={exportando ? 'Gerando arquivo…' : 'Exportar meus dados (JSON)'} subtitulo="Tudo o que a Ágora guarda sobre você" onPress={exportando ? undefined : exportar} />
          <Divisor />
          <ItemLista icone="trash-2" titulo="Excluir minha conta" perigo onPress={excluir} />
        </Card>
        <Texto variante="legenda" cor="sutil">A Ágora não usa SDKs de rastreamento ou analytics de terceiros.</Texto>
      </Secao>
      <Card plano style={{ paddingVertical: 4 }}>
        <ItemLista icone="log-out" titulo="Sair" onPress={async () => { await removerPushDoAparelho(); await sair(); }} />
      </Card>
    </Tela>
  );
}
