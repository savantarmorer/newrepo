import NetInfo from '@react-native-community/netinfo';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { abrirDenuncia, BarraAcoes } from '@/components/BarraAcoes';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { Carregando, Erro } from '@/components/Estados';
import { MarkdownView } from '@/components/MarkdownView';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useAlternarSalvo, useArtigo, useEstaSalvo, useInvalidarBiblioteca } from '@/features/biblioteca/hooks';
import { marcarLido } from '@/features/biblioteca/services';
import { ROTULO_STATUS_ARTIGO } from '@/features/biblioteca/types';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { textoDoErro } from '@/lib/erros';
import { formatarDataLonga, tempoLeitura } from '@/lib/formatos';
import { artigoOffline } from '@/lib/offline';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

export default function TelaArtigo() {
  const { id, trilha } = useLocalSearchParams<{ id: string; trilha?: string }>();
  const { c, espaco, raio } = useTema();
  const { data: perfil } = useMeuPerfil();
  const q = useArtigo(id);
  const offline = useQuery({ queryKey: ['offline', 'artigo', id], queryFn: () => artigoOffline(id), enabled: !!id });
  const salvo = useEstaSalvo('artigo', id);
  const alternar = useAlternarSalvo();
  const invalidar = useInvalidarBiblioteca();

  if (q.isLoading && !offline.data) return <Carregando />;

  // Sem internet e sem cache: usa a cópia offline dos salvos
  if (!q.data && offline.data) {
    const a = offline.data;
    return (
      <Tela>
        <Card destaque="dourado" plano><Texto variante="legenda">Lendo a cópia salva neste aparelho (off-line).</Texto></Card>
        <Texto variante="display" style={{ fontSize: 34, lineHeight: 40 }}>{a.titulo}</Texto>
        <Texto variante="legenda" cor="secundario">{a.autores.join(', ')} · {tempoLeitura(a.corpo_md)}</Texto>
        <MarkdownView texto={a.corpo_md} leitura />
      </Tela>
    );
  }
  if (q.error || !q.data) return <Erro erro={q.error ?? 'Artigo não encontrado'} aoTentar={q.refetch} />;

  const { artigo: a, autoria } = q.data;
  const autores = autoria.filter((x) => x.papel !== 'revisor');
  const revisores = autoria.filter((x) => x.papel === 'revisor');
  const souAutor = autores.some((x) => x.profile_id === perfil?.id);
  const nomesAutores = autores.map((x) => x.perfil?.nome_publico ?? 'Membro');

  async function lido() {
    try {
      const r = await marcarLido(a.id, trilha ?? null);
      invalidar();
      const concluida = r.find((x) => x.concluida && (!trilha || x.trilha_id === trilha));
      if (concluida) router.push({ pathname: '/biblioteca/trilha/concluida', params: { id: concluida.trilha_id } });
      else toast.sucesso(r.length ? 'Marcado como lido — trilha avançou!' : 'Marcado como lido.');
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  }

  return (
    <Tela>
      <Stack.Screen options={{ title: a.tema?.nome ?? 'Artigo' }} />
      {a.status !== 'publicado' ? (
        <Card destaque={a.status === 'recusado' ? 'perigo' : 'dourado'} plano>
          <Texto variante="corpoForte">{ROTULO_STATUS_ARTIGO[a.status]}</Texto>
          <Texto variante="legenda" cor="secundario">Só autores{a.status === 'em_revisao' ? ' e curadores' : ''} veem este artigo.</Texto>
          {souAutor ? <Botao titulo="Abrir no editor" compacto variante="secundario" style={{ marginTop: 8 }} onPress={() => router.push({ pathname: '/biblioteca/artigo/editor', params: { id: a.id } })} /> : null}
        </Card>
      ) : null}
      {a.capa_url ? <Image source={{ uri: a.capa_url }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: raio.lg }} contentFit="cover" accessibilityLabel="Capa do artigo" /> : null}
      <View style={{ gap: espaco.sm }}>
        {a.tema ? <ChipTema rotulo={a.tema.nome} tom="secundaria" /> : null}
        <Texto variante="display" style={{ fontSize: 34, lineHeight: 40 }}>{a.oculto ? 'Conteúdo removido pela moderação' : a.titulo}</Texto>
        {a.resumo ? <Texto variante="leitura" cor="secundario" style={{ fontFamily: 'Lora_400Regular_Italic' }}>{a.resumo}</Texto> : null}
        <Texto variante="legenda" cor="secundario">
          {tempoLeitura(a.corpo_md)}{a.publicado_em ? ` · publicado em ${formatarDataLonga(a.publicado_em)}` : ''}
        </Texto>
      </View>
      <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.borda, paddingVertical: espaco.md, gap: 6 }}>
        <Texto variante="legenda" cor="secundario">
          {autores.length > 1 ? 'Autoria: ' : 'Autor(a): '}
          {autores.map((x, i) => (
            <Texto key={x.profile_id} variante="legenda" cor="primaria" onPress={() => router.push(`/perfil/membro/${x.profile_id}`)}>
              {x.perfil?.nome_publico}{i < autores.length - 1 ? ', ' : ''}
            </Texto>
          ))}
        </Texto>
        {revisores.length ? (
          <Texto variante="legenda" cor="secundario">
            Revisão por pares: {revisores.map((x) => x.perfil?.nome_publico).join(', ')}
          </Texto>
        ) : null}
        {a.topico_origem_id ? (
          <Pressable accessibilityRole="link" onPress={() => router.push(`/biblioteca/topico/${a.topico_origem_id}`)}>
            <Texto variante="legenda" cor="primaria">↳ Ver a discussão de origem</Texto>
          </Pressable>
        ) : null}
      </View>
      {a.oculto ? null : <MarkdownView texto={a.corpo_md} leitura />}
      {a.status === 'publicado' ? (
        <>
          <Botao titulo="Marcar como lido" icone="check" largura="total" variante="secundario" onPress={lido} />
          <BarraAcoes
            acoes={[
              {
                icone: 'bookmark',
                rotulo: salvo.data ? 'Salvo (disponível off-line)' : 'Salvar para ler off-line',
                ativo: !!salvo.data,
                onPress: () =>
                  alternar.mutate({
                    tipo: 'artigo',
                    id: a.id,
                    salvar: !salvo.data,
                    artigoOffline: { id: a.id, titulo: a.titulo, resumo: a.resumo, corpo_md: a.corpo_md, autores: nomesAutores, publicado_em: a.publicado_em },
                  }),
              },
              { icone: 'flag', rotulo: 'Denunciar', onPress: () => abrirDenuncia('artigo', a.id) },
            ]}
          />
        </>
      ) : null}
      <NetInfoAviso />
    </Tela>
  );
}

function NetInfoAviso() {
  const net = useQuery({ queryKey: ['netinfo'], queryFn: () => NetInfo.fetch(), staleTime: 10_000 });
  if (net.data?.isConnected !== false) return null;
  return <Texto variante="legenda" cor="sutil" centro>Você está off-line: ações ficarão disponíveis quando a conexão voltar.</Texto>;
}
