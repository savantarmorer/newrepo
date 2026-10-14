import { Redirect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { BadgeNivel } from '@/components/BadgeNivel';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useConfiguracao, useMeuPerfil } from '@/features/perfil/hooks';
import { assinaturaAtiva } from '@/features/perfil/types';
import { sair } from '@/lib/auth';
import { formatarData } from '@/lib/formatos';

/** Membro logado sem assinatura ativa: vê o próprio perfil e como reativar. */
export default function Inativo() {
  const { data: perfil, refetch, isRefetching } = useMeuPerfil();
  const { data: cfg } = useConfiguracao<{ url_ativacao: string; texto: string }>('assinatura');
  if (perfil && assinaturaAtiva(perfil)) return <Redirect href="/" />;
  return (
    <Tela aoAtualizar={refetch} atualizando={isRefetching}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Avatar nome={perfil?.pseudonimo_ativo ? perfil.pseudonimo : perfil?.nome_exibicao} url={perfil?.avatar_url} tamanho={72} />
        <Texto variante="subtitulo">{perfil?.pseudonimo_ativo ? perfil.pseudonimo : perfil?.nome_exibicao}</Texto>
        {perfil ? <BadgeNivel nivel={perfil.nivel} /> : null}
      </View>
      <Card destaque="dourado">
        <Texto variante="subtitulo">Sua assinatura está inativa</Texto>
        <Texto cor="secundario" style={{ marginTop: 8 }}>
          {perfil?.assinatura_valida_ate ? `Ela venceu em ${formatarData(perfil.assinatura_valida_ate)}. ` : ''}
          Para ler a Biblioteca, participar do Mutirão e votar na Assembleia, ative sua assinatura. Seu histórico de contribuições continua guardado.
        </Texto>
        {cfg?.texto ? <Texto variante="legenda" cor="sutil" style={{ marginTop: 8 }}>{cfg.texto}</Texto> : null}
      </Card>
      <Botao titulo="Ativar assinatura" icone="external-link" largura="total" onPress={() => cfg?.url_ativacao && WebBrowser.openBrowserAsync(cfg.url_ativacao)} />
      <Botao titulo="Já ativei — verificar de novo" variante="secundario" largura="total" carregando={isRefetching} onPress={() => refetch()} />
      <Botao titulo="Sair" variante="fantasma" largura="total" onPress={sair} />
    </Tela>
  );
}
