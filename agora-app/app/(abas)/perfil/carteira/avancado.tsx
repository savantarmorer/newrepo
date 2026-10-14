import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { Secao } from '@/components/Secao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useQueryClient } from '@tanstack/react-query';
import { registrarCarteira } from '@/features/carteira/services';
import { assinarMensagem, carteiraDisponivel, conectarCarteiraExterna } from '@/features/carteira/wallet';
import { env } from '@/lib/env';
import { textoDoErro } from '@/lib/erros';
import { meuId } from '@/lib/supabase';
import { toast } from '@/stores/toast';

export default function Avancado() {
  const qc = useQueryClient();
  const [conectando, setConectando] = useState(false);
  return (
    <Tela>
      <Card plano destaque="dourado">
        <Texto variante="legenda">Opções para quem já conhece carteiras cripto. Para a maioria das pessoas, a carteira embutida é suficiente e mais segura.</Texto>
      </Card>
      <Secao titulo="Conectar carteira externa (WalletConnect)">
        <Texto cor="secundario">Use sua própria carteira (MetaMask, Rainbow, Safe…). Ela passa a receber suas recompensas e o selo de reputação. Você paga o gas das suas transações nela.</Texto>
        <Botao titulo="Conectar e vincular" icone="link" carregando={conectando} desabilitado={!carteiraDisponivel()} onPress={async () => {
          setConectando(true);
          try {
            const { endereco } = await conectarCarteiraExterna();
            const mensagem = `Ágora: vincular a carteira ${endereco} à minha conta ${await meuId()} em ${new Date().toISOString()}`;
            await registrarCarteira({ endereco, mensagem, assinatura: await assinarMensagem(mensagem), tipo: 'externa' });
            qc.invalidateQueries({ queryKey: ['carteira'] });
            toast.sucesso('Carteira externa vinculada.');
          } catch (e) {
            toast.erro(textoDoErro(e));
          } finally {
            setConectando(false);
          }
        }} />
      </Secao>
      <Secao titulo="Exportar a chave da carteira embutida">
        <Texto cor="secundario">A chave é exportada pelo provedor da carteira (thirdweb) numa página segura, fora do app. Guarde-a offline: quem tiver a chave controla seus DRC.</Texto>
        <Botao titulo="Abrir página de exportação" icone="key" variante="secundario" desabilitado={!env.urlExportarChave} onPress={() => WebBrowser.openBrowserAsync(env.urlExportarChave)} />
        {!env.urlExportarChave ? <Texto variante="legenda" cor="sutil">Página de exportação ainda não configurada (EXPO_PUBLIC_URL_EXPORTAR_CHAVE).</Texto> : null}
      </Secao>
    </Tela>
  );
}
