import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { Botao } from '@/components/Botao';
import { Campo, CampoForm } from '@/components/Campo';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Icone } from '@/components/Icone';
import { Secao } from '@/components/Secao';
import { Seletor } from '@/components/Seletor';
import { Texto } from '@/components/Texto';
import { useArtigosPublicados, useInvalidarBiblioteca, useTemas, useTrilha } from '@/features/biblioteca/hooks';
import * as s from '@/features/biblioteca/services';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

const esquema = z.object({
  titulo: z.string().trim().min(5, 'Título muito curto').max(120),
  descricao: z.string().trim().min(20, 'Explique o objetivo da trilha (mín. 20 caracteres)'),
  tema_id: z.string().nullable(),
  nivel_dificuldade: z.number().min(1).max(3),
});
type Form = z.infer<typeof esquema>;
type Item = { id: string; titulo: string };

export default function MontarTrilha() {
  const { id: idParam } = useLocalSearchParams<{ id?: string }>();
  const { c, espaco, raio } = useTema();
  const { data: perfil } = useMeuPerfil();
  const { data: temas } = useTemas();
  const existente = useTrilha(idParam);
  const [busca, setBusca] = useState('');
  const disponiveis = useArtigosPublicados(busca);
  const [itens, setItens] = useState<Item[]>([]);
  const [salvando, setSalvando] = useState(false);
  const invalidar = useInvalidarBiblioteca();
  const { control, handleSubmit, reset } = useForm<Form>({
    resolver: zodResolver(esquema),
    defaultValues: { titulo: '', descricao: '', tema_id: null, nivel_dificuldade: 1 },
  });

  useEffect(() => {
    if (existente.data) {
      const t = existente.data.trilha;
      reset({ titulo: t.titulo, descricao: t.descricao ?? '', tema_id: t.tema_id, nivel_dificuldade: t.nivel_dificuldade });
      setItens(existente.data.itens.map((i) => ({ id: i.artigo_id, titulo: i.artigo?.titulo ?? '' })));
    }
  }, [existente.data, reset]);

  if (perfil && !podeNivel(perfil, 3)) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: c.fundo }}><EstadoVazio titulo="Trilhas são montadas por Curadores" descricao="Ao atingir 250 pontos, você poderá montar trilhas com artigos publicados." /></SafeAreaView>;
  }

  const salvar = (publicar: boolean) =>
    handleSubmit(async (v) => {
      if (publicar && itens.length < 2) return toast.erro('Uma trilha precisa de pelo menos 2 artigos.');
      setSalvando(true);
      try {
        const t = await s.salvarTrilha({ id: idParam, ...v });
        await s.definirItensTrilha(t.id, itens.map((i) => i.id));
        if (publicar) await s.publicarTrilha(t.id);
        invalidar();
        toast.sucesso(publicar ? 'Trilha publicada!' : 'Rascunho salvo.');
        router.replace(`/biblioteca/trilha/${t.id}`);
      } catch (e) {
        toast.erro(textoDoErro(e));
      } finally {
        setSalvando(false);
      }
    })();

  const cabecalho = (
    <View style={{ gap: espaco.lg, padding: espaco.lg }}>
      <CampoForm control={control} nome="titulo" rotulo="Título da trilha" />
      <CampoForm control={control} nome="descricao" rotulo="Descrição" multiline />
      <Controller control={control} name="tema_id" render={({ field }) => (
        <Seletor rotulo="Tema principal" opcoes={(temas ?? []).map((t) => ({ valor: t.id, rotulo: t.nome }))} valor={field.value} aoMudar={(v) => field.onChange(v)} />
      )} />
      <Controller control={control} name="nivel_dificuldade" render={({ field }) => (
        <Seletor rotulo="Dificuldade" opcoes={[{ valor: '1', rotulo: 'Introdutória' }, { valor: '2', rotulo: 'Intermediária' }, { valor: '3', rotulo: 'Avançada' }]} valor={String(field.value)} aoMudar={(v) => field.onChange(Number(v))} />
      )} />
      <Secao titulo={`Ordem dos artigos (${itens.length}) — segure e arraste para reordenar`}>
        {!itens.length ? <Texto cor="sutil">Adicione artigos publicados abaixo.</Texto> : null}
      </Secao>
    </View>
  );

  const rodape = (
    <View style={{ gap: espaco.lg, padding: espaco.lg }}>
      <Secao titulo="Adicionar artigos publicados">
        <Campo rotulo="Buscar artigo" value={busca} onChangeText={setBusca} placeholder="Título do artigo" />
        {(disponiveis.data ?? []).filter((a) => !itens.some((i) => i.id === a.id)).slice(0, 12).map((a) => (
          <Pressable key={a.id} accessibilityRole="button" accessibilityLabel={`Adicionar ${a.titulo}`} onPress={() => setItens([...itens, { id: a.id, titulo: a.titulo }])}
            style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 48, paddingHorizontal: 12, borderRadius: raio.md, borderWidth: 1, borderColor: c.borda, backgroundColor: c.superficie }}>
            <Icone nome="plus-circle" cor={c.secundaria} />
            <Texto style={{ flex: 1 }}>{a.titulo}</Texto>
          </Pressable>
        ))}
      </Secao>
      <Botao titulo="Salvar rascunho" variante="secundario" largura="total" carregando={salvando} onPress={() => salvar(false)} />
      <Botao titulo="Publicar trilha" largura="total" carregando={salvando} desabilitado={itens.length < 2} onPress={() => salvar(true)} />
    </View>
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: c.fundo }}>
      <DraggableFlatList
        data={itens}
        keyExtractor={(i) => i.id}
        onDragEnd={({ data }) => setItens(data)}
        ListHeaderComponent={cabecalho}
        ListFooterComponent={rodape}
        renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<Item>) => (
          <ScaleDecorator>
            <Pressable
              onLongPress={drag}
              disabled={isActive}
              accessibilityRole="button"
              accessibilityLabel={`${(getIndex() ?? 0) + 1}. ${item.titulo}. Toque longo para arrastar.`}
              accessibilityActions={[{ name: 'increment', label: 'Mover para cima' }, { name: 'decrement', label: 'Mover para baixo' }]}
              onAccessibilityAction={(e) => {
                const i = getIndex() ?? 0;
                const novo = [...itens];
                const alvo = e.nativeEvent.actionName === 'increment' ? i - 1 : i + 1;
                if (alvo < 0 || alvo >= novo.length) return;
                [novo[i], novo[alvo]] = [novo[alvo]!, novo[i]!];
                setItens(novo);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: espaco.lg, marginBottom: 8, minHeight: 52, paddingHorizontal: 12, borderRadius: raio.md, backgroundColor: isActive ? c.primariaSuave : c.superficie, borderWidth: 1, borderColor: c.borda }}
            >
              <Icone nome="menu" cor={c.textoSutil} />
              <Texto variante="corpoForte">{(getIndex() ?? 0) + 1}.</Texto>
              <Texto style={{ flex: 1 }} numberOfLines={2}>{item.titulo}</Texto>
              <Pressable accessibilityLabel={`Remover ${item.titulo}`} hitSlop={12} onPress={() => setItens(itens.filter((i) => i.id !== item.id))}>
                <Icone nome="x" cor={c.perigo} />
              </Pressable>
            </Pressable>
          </ScaleDecorator>
        )}
      />
    </SafeAreaView>
  );
}
