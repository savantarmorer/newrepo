import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { abrirDenuncia, BarraAcoes } from '@/components/BarraAcoes';
import { BadgeNivel } from '@/components/BadgeNivel';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { Carregando, Erro } from '@/components/Estados';
import { Icone } from '@/components/Icone';
import { MarkdownView } from '@/components/MarkdownView';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useAlternarSalvo, useEstaSalvo, useRespostas, useTopico, useInvalidarBiblioteca } from '@/features/biblioteca/hooks';
import * as s from '@/features/biblioteca/services';
import type { Resposta } from '@/features/biblioteca/types';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { textoDoErro } from '@/lib/erros';
import { formatarDataHora, tempoRelativo } from '@/lib/formatos';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

function ItemResposta({
  r, nivel, eu, autorTopico, aoResponder, aoAtualizar,
}: { r: Resposta; nivel: 0 | 1; eu?: string; autorTopico: string; aoResponder: (r: Resposta) => void; aoAtualizar: () => void }) {
  const { c, espaco } = useTema();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(r.corpo_md);
  const meu = r.autor_id === eu;
  const removida = r.oculto || !!r.excluido_em;

  async function salvarEdicao() {
    try {
      await s.editarResposta(r.id, texto);
      setEditando(false);
      aoAtualizar();
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  }

  return (
    <View style={{ marginLeft: nivel ? espaco.xl : 0, gap: espaco.sm }}>
      <View style={{ borderLeftWidth: nivel ? 2 : 0, borderLeftColor: c.borda, paddingLeft: nivel ? espaco.md : 0, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Avatar nome={r.autor?.nome_publico} url={r.autor?.avatar_url} tamanho={28} />
          <Pressable accessibilityRole="link" onPress={() => r.autor && router.push(`/perfil/membro/${r.autor.id}`)}>
            <Texto variante="rotulo">{r.autor?.nome_publico ?? 'Membro'}</Texto>
          </Pressable>
          <Texto variante="legenda" cor="sutil">· {tempoRelativo(r.created_at)}</Texto>
          {r.marcada_como_util ? <ChipTema rotulo="Útil" icone="award" tom="dourado" /> : null}
        </View>
        {removida ? (
          <Texto cor="sutil" style={{ fontStyle: 'italic' }}>{r.oculto ? 'Conteúdo removido pela moderação.' : 'Resposta excluída pelo autor.'}</Texto>
        ) : editando ? (
          <View style={{ gap: 8 }}>
            <TextInput value={texto} onChangeText={setTexto} multiline accessibilityLabel="Editar resposta" style={{ minHeight: 90, borderWidth: 1, borderColor: c.bordaForte, borderRadius: 10, padding: 10, color: c.texto, backgroundColor: c.superficieElevada }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Botao titulo="Salvar" compacto onPress={salvarEdicao} />
              <Botao titulo="Cancelar" compacto variante="fantasma" onPress={() => setEditando(false)} />
            </View>
          </View>
        ) : (
          <MarkdownView texto={r.corpo_md} />
        )}
        {r.editado_em && !removida ? <Texto variante="legenda" cor="sutil">editado em {formatarDataHora(r.editado_em)}</Texto> : null}
        {!removida ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            <Botao titulo="Responder" compacto variante="fantasma" onPress={() => aoResponder(r)} />
            {eu === autorTopico && r.autor_id !== eu ? (
              <Botao
                titulo={r.marcada_como_util ? 'Desmarcar útil' : 'Marcar como útil'}
                compacto
                variante="fantasma"
                icone="award"
                onPress={async () => {
                  try {
                    await s.marcarUtil(r.id, !r.marcada_como_util);
                    aoAtualizar();
                  } catch (e) {
                    toast.erro(textoDoErro(e));
                  }
                }}
              />
            ) : null}
            {meu ? <Botao titulo="Editar" compacto variante="fantasma" onPress={() => setEditando(true)} /> : null}
            {meu ? (
              <Botao
                titulo="Excluir"
                compacto
                variante="fantasma"
                onPress={() =>
                  Alert.alert('Excluir resposta?', 'Ela ficará como "resposta excluída" na conversa.', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Excluir', style: 'destructive', onPress: () => s.excluirResposta(r.id).then(aoAtualizar).catch((e) => toast.erro(textoDoErro(e))) },
                  ])
                }
              />
            ) : (
              <Botao titulo="Denunciar" compacto variante="fantasma" onPress={() => abrirDenuncia('resposta', r.id)} />
            )}
          </View>
        ) : null}
      </View>
      {r.filhos?.map((f) => (
        <ItemResposta key={f.id} r={f} nivel={1} eu={eu} autorTopico={autorTopico} aoResponder={aoResponder} aoAtualizar={aoAtualizar} />
      ))}
    </View>
  );
}

export default function TelaTopico() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, espaco, raio } = useTema();
  const { data: perfil } = useMeuPerfil();
  const topico = useTopico(id);
  const respostas = useRespostas(id);
  const salvo = useEstaSalvo('topico', id);
  const alternar = useAlternarSalvo();
  const invalidar = useInvalidarBiblioteca();
  const [texto, setTexto] = useState('');
  const [respondendoA, setRespondendoA] = useState<Resposta | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (topico.isLoading) return <Carregando />;
  if (topico.error || !topico.data) return <Erro erro={topico.error ?? 'Tópico não encontrado'} aoTentar={topico.refetch} />;
  const t = topico.data;
  const souAutor = t.autor_id === perfil?.id;
  const atualizar = () => {
    respostas.refetch();
    topico.refetch();
  };

  async function enviar() {
    if (texto.trim().length < 2) return;
    setEnviando(true);
    try {
      await s.responder({ topico_id: t.id, corpo_md: texto.trim(), resposta_pai_id: respondendoA?.id ?? null });
      setTexto('');
      setRespondendoA(null);
      atualizar();
    } catch (e) {
      toast.erro(textoDoErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela
      teclado
      aoAtualizar={atualizar}
      atualizando={respostas.isRefetching}
      rodape={
        t.trancado || t.oculto ? null : (
          <View style={{ borderTopWidth: 1, borderTopColor: c.borda, backgroundColor: c.superficie, padding: espaco.md, gap: 6 }}>
            {respondendoA ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Texto variante="legenda" cor="secundario" style={{ flex: 1 }}>Respondendo a {respondendoA.autor?.nome_publico}</Texto>
                <Pressable accessibilityLabel="Cancelar resposta direcionada" onPress={() => setRespondendoA(null)} hitSlop={12}><Icone nome="x" tamanho={16} /></Pressable>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
              <TextInput
                value={texto}
                onChangeText={setTexto}
                placeholder="Escreva uma resposta (Markdown)"
                placeholderTextColor={c.textoSutil}
                multiline
                accessibilityLabel="Sua resposta"
                style={{ flex: 1, maxHeight: 140, minHeight: 44, borderWidth: 1, borderColor: c.bordaForte, borderRadius: raio.md, paddingHorizontal: 12, paddingVertical: 10, color: c.texto, backgroundColor: c.superficieElevada }}
              />
              <Botao titulo="Enviar" compacto carregando={enviando} desabilitado={texto.trim().length < 2} onPress={enviar} />
            </View>
          </View>
        )
      }
    >
      <Stack.Screen options={{ title: t.tema?.nome ?? 'Tópico' }} />
      <View style={{ gap: espaco.sm }}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {t.fixado ? <ChipTema rotulo="Fixado" icone="map-pin" tom="dourado" /> : null}
          {t.status === 'resolvido' ? <ChipTema rotulo="Resolvido" icone="check" tom="secundaria" /> : null}
          {t.trancado ? <ChipTema rotulo="Trancado" icone="lock" /> : null}
        </View>
        <Texto variante="titulo">{t.titulo}</Texto>
        <Pressable accessibilityRole="link" onPress={() => t.autor && router.push(`/perfil/membro/${t.autor.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Avatar nome={t.autor?.nome_publico} url={t.autor?.avatar_url} tamanho={32} />
          <View>
            <Texto variante="rotulo">{t.autor?.nome_publico}</Texto>
            <Texto variante="legenda" cor="sutil">{formatarDataHora(t.created_at)}{t.editado_em ? ` · editado em ${formatarDataHora(t.editado_em)}` : ''}</Texto>
          </View>
          {t.autor ? <BadgeNivel nivel={t.autor.nivel} compacto /> : null}
        </Pressable>
      </View>
      {t.oculto ? <Texto cor="sutil" style={{ fontStyle: 'italic' }}>Conteúdo removido pela moderação.</Texto> : <MarkdownView texto={t.corpo_md} />}
      <BarraAcoes
        acoes={[
          { icone: 'bookmark', rotulo: salvo.data ? 'Salvo' : 'Salvar', ativo: !!salvo.data, onPress: () => alternar.mutate({ tipo: 'topico', id: t.id, salvar: !salvo.data }) },
          ...(podeNivel(perfil, 2) && !t.oculto
            ? [{ icone: 'file-plus' as const, rotulo: 'Transformar em artigo', onPress: () => router.push({ pathname: '/biblioteca/artigo/editor', params: { topico: t.id } }) }]
            : []),
          ...(souAutor
            ? [{
                icone: (t.status === 'resolvido' ? 'rotate-ccw' : 'check-circle') as 'rotate-ccw' | 'check-circle',
                rotulo: t.status === 'resolvido' ? 'Reabrir' : 'Marcar resolvido',
                onPress: () => s.editarTopico(t.id, { status: t.status === 'resolvido' ? 'aberto' : 'resolvido' }).then(() => { invalidar(); }).catch((e) => toast.erro(textoDoErro(e))),
              }]
            : [{ icone: 'flag' as const, rotulo: 'Denunciar', onPress: () => abrirDenuncia('topico', t.id) }]),
        ]}
      />
      <Card plano style={{ backgroundColor: c.superficieAfundada }}>
        <Texto variante="secao" cor="secundario">{respostas.data?.length ? 'Respostas' : 'Nenhuma resposta ainda'}</Texto>
        {!respostas.data?.length ? <Texto cor="secundario" style={{ marginTop: 6 }}>Seja a primeira pessoa a contribuir com essa conversa.</Texto> : null}
      </Card>
      {respostas.isLoading ? <Carregando /> : respostas.data?.map((r) => (
        <ItemResposta key={r.id} r={r} nivel={0} eu={perfil?.id} autorTopico={t.autor_id} aoResponder={setRespondendoA} aoAtualizar={atualizar} />
      ))}
      {t.trancado ? <Texto variante="legenda" cor="sutil" centro>Tópico trancado pela moderação — não aceita novas respostas.</Texto> : null}
    </Tela>
  );
}
