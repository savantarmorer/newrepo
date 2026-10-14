import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, View } from 'react-native';
import { z } from 'zod';
import { Avatar } from '@/components/Avatar';
import { Botao } from '@/components/Botao';
import { Campo, CampoForm } from '@/components/Campo';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { EditorMarkdown } from '@/components/EditorMarkdown';
import { Carregando } from '@/components/Estados';
import { ItemLista } from '@/components/ItemLista';
import { Secao } from '@/components/Secao';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useArtigo, useInvalidarBiblioteca, useRespostas, useRevisoes, useTemas, useTopico } from '@/features/biblioteca/hooks';
import * as s from '@/features/biblioteca/services';
import { ROTULO_STATUS_ARTIGO } from '@/features/biblioteca/types';
import { useBuscaMembros, useMeuPerfil } from '@/features/perfil/hooks';
import { textoDoErro } from '@/lib/erros';
import { formatarDataHora } from '@/lib/formatos';
import { enviarArquivo, escolherImagem } from '@/lib/upload';
import { toast } from '@/stores/toast';

const esquema = z.object({
  tema_id: z.string().min(1, 'Escolha um tema'),
  titulo: z.string().trim().min(5, 'Título muito curto').max(200),
  resumo: z.string().trim().max(400, 'Resumo de até 400 caracteres').optional(),
  corpo_md: z.string(),
  capa_url: z.string().nullable().optional(),
});
type Form = z.infer<typeof esquema>;

const PARECER: Record<string, string> = { aprovar: 'Aprovou', pedir_mudancas: 'Pediu mudanças', recusar: 'Recusou' };

export default function EditorArtigo() {
  const params = useLocalSearchParams<{ id?: string; topico?: string; tema?: string }>();
  const [id, setId] = useState<string | undefined>(params.id);
  const { data: temas } = useTemas();
  const { data: perfil } = useMeuPerfil();
  const existente = useArtigo(id);
  const revisoes = useRevisoes(id);
  const topico = useTopico(params.topico);
  const respostasTopico = useRespostas(params.topico);
  const invalidar = useInvalidarBiblioteca();
  const [buscaCoautor, setBuscaCoautor] = useState('');
  const candidatos = useBuscaMembros(buscaCoautor);
  const [enviandoCapa, setEnviandoCapa] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState } = useForm<Form>({
    resolver: zodResolver(esquema),
    defaultValues: { tema_id: params.tema ?? '', titulo: '', resumo: '', corpo_md: '', capa_url: null },
  });

  // Edição de artigo existente
  useEffect(() => {
    const a = existente.data?.artigo;
    if (a) reset({ tema_id: a.tema_id, titulo: a.titulo, resumo: a.resumo ?? '', corpo_md: a.corpo_md, capa_url: a.capa_url });
  }, [existente.data, reset]);

  // "Transformar em artigo": pré-preenche a partir do tópico e das respostas úteis
  useEffect(() => {
    const t = topico.data;
    if (!id && t && respostasTopico.data) {
      const uteis = respostasTopico.data.flatMap((r) => [r, ...(r.filhos ?? [])]).filter((r) => r.marcada_como_util && !r.oculto);
      const corpo = [
        `## Contexto\n\n${t.corpo_md}`,
        ...uteis.map((r) => `## Contribuição de ${r.autor?.nome_publico ?? 'membro'}\n\n${r.corpo_md}`),
        '## Síntese\n\n',
      ].join('\n\n');
      reset({ tema_id: t.tema_id, titulo: t.titulo, resumo: '', corpo_md: corpo, capa_url: null });
    }
  }, [id, topico.data, respostasTopico.data, reset]);

  const artigo = existente.data?.artigo;
  const editavel = !artigo || artigo.status === 'rascunho' || artigo.status === 'recusado';
  const coautores = existente.data?.autoria.filter((x) => x.papel === 'coautor') ?? [];
  const corpo = watch('corpo_md');
  const capa = watch('capa_url');

  const salvar = (depois?: (artigoId: string) => Promise<void>) =>
    handleSubmit(async (v) => {
      try {
        const salvo = await s.salvarArtigo({ id, ...v, resumo: v.resumo || null, topico_origem_id: id ? undefined : params.topico ?? null });
        setId(salvo.id);
        if (depois) await depois(salvo.id);
        else toast.sucesso('Rascunho salvo.');
        invalidar();
      } catch (e) {
        toast.erro(textoDoErro(e));
      }
    })();

  if (id && existente.isLoading) return <Carregando />;

  return (
    <Tela teclado>
      {artigo ? (
        <Card plano destaque={artigo.status === 'recusado' ? 'perigo' : artigo.status === 'em_revisao' ? 'dourado' : undefined}>
          <Texto variante="corpoForte">Status: {ROTULO_STATUS_ARTIGO[artigo.status]}</Texto>
          {artigo.status === 'em_revisao' ? <Texto variante="legenda" cor="secundario">Aguardando 2 aprovações de curadores diferentes de você. Para editar, retire da revisão.</Texto> : null}
        </Card>
      ) : (
        <Texto cor="secundario">Seu artigo passa por revisão de pares: 2 curadores precisam aprovar antes da publicação. Autores e revisores são creditados.</Texto>
      )}
      <Controller control={control} name="tema_id" render={({ field, fieldState }) => (
        <Seletor rotulo="Tema" opcoes={(temas ?? []).map((t) => ({ valor: t.id, rotulo: t.nome }))} valor={field.value} aoMudar={(v) => editavel && field.onChange(v)} erro={fieldState.error?.message} />
      )} />
      <CampoForm control={control} nome="titulo" rotulo="Título" editable={editavel} />
      <CampoForm control={control} nome="resumo" rotulo="Resumo" multiline editable={editavel} ajuda="Duas ou três frases que aparecem na listagem." />
      <View style={{ gap: 8 }}>
        <Texto variante="rotulo" cor="secundario">Capa (opcional)</Texto>
        {capa ? <Image source={{ uri: capa }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }} accessibilityLabel="Capa escolhida" /> : null}
        {editavel ? (
          <Botao
            titulo={capa ? 'Trocar capa' : 'Escolher imagem'}
            icone="image"
            compacto
            variante="secundario"
            carregando={enviandoCapa}
            onPress={async () => {
              try {
                const img = await escolherImagem();
                if (!img || !perfil) return;
                setEnviandoCapa(true);
                setValue('capa_url', await enviarArquivo('capas', perfil.id, img.uri, img.mimeType ?? 'image/jpeg'));
              } catch (e) {
                toast.erro(textoDoErro(e));
              } finally {
                setEnviandoCapa(false);
              }
            }}
          />
        ) : null}
      </View>
      <Controller control={control} name="corpo_md" render={({ field }) => (
        <EditorMarkdown rotulo="Texto do artigo" valor={field.value} aoMudar={(t) => editavel && field.onChange(t)} minimo={300} alturaMinima={320} leitura />
      )} />

      {id ? (
        <Secao titulo="Coautoria">
          {coautores.map((x) => (
            <ItemLista
              key={x.profile_id}
              titulo={x.perfil?.nome_publico ?? 'Membro'}
              direita={editavel ? <Botao titulo="Remover" compacto variante="fantasma" onPress={() => s.removerCoautor(id, x.profile_id).then(() => existente.refetch()).catch((e) => toast.erro(textoDoErro(e)))} /> : undefined}
            />
          ))}
          {editavel ? (
            <>
              <Campo rotulo="Adicionar coautor(a)" value={buscaCoautor} onChangeText={setBuscaCoautor} placeholder="Busque pelo nome público" />
              {candidatos.data?.filter((p) => p.id !== perfil?.id).map((p) => (
                <ItemLista
                  key={p.id}
                  titulo={p.nome_publico}
                  subtitulo={p.cidade ?? undefined}
                  direita={<Avatar nome={p.nome_publico} url={p.avatar_url} tamanho={28} />}
                  onPress={() =>
                    s.adicionarCoautor(id, p.id).then(() => { setBuscaCoautor(''); existente.refetch(); }).catch((e) => toast.erro(textoDoErro(e)))
                  }
                />
              ))}
            </>
          ) : null}
        </Secao>
      ) : null}

      {revisoes.data?.length ? (
        <Secao titulo="Pareceres">
          {revisoes.data.map((r) => (
            <Card key={r.id} plano destaque={r.parecer === 'aprovar' ? 'secundaria' : r.parecer === 'recusar' ? 'perigo' : 'dourado'}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <ChipTema rotulo={PARECER[r.parecer] ?? r.parecer} />
                <Texto variante="legenda" cor="secundario">{r.revisor?.nome_publico} · rodada {r.rodada} · {formatarDataHora(r.created_at)}</Texto>
              </View>
              <Texto style={{ marginTop: 6 }}>{r.comentario}</Texto>
            </Card>
          ))}
        </Secao>
      ) : null}

      {editavel ? (
        <View style={{ gap: 10 }}>
          <Botao titulo="Salvar rascunho" variante="secundario" largura="total" carregando={formState.isSubmitting} onPress={() => salvar()} />
          <Botao
            titulo="Enviar para revisão"
            icone="send"
            largura="total"
            desabilitado={(corpo?.length ?? 0) < 300}
            onPress={() =>
              salvar(async (artigoId) => {
                await s.mudarStatusArtigo(artigoId, 'em_revisao');
                toast.sucesso('Enviado! Curadores serão avisados pela fila de revisão.');
                router.back();
              })
            }
          />
        </View>
      ) : artigo?.status === 'em_revisao' ? (
        <Botao
          titulo="Retirar da revisão para editar"
          variante="secundario"
          largura="total"
          onPress={() =>
            Alert.alert('Retirar da revisão?', 'As aprovações desta rodada serão descartadas quando você reenviar.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Retirar', onPress: () => s.mudarStatusArtigo(artigo.id, 'rascunho').then(() => { invalidar(); existente.refetch(); }).catch((e) => toast.erro(textoDoErro(e))) },
            ])
          }
        />
      ) : null}
    </Tela>
  );
}
