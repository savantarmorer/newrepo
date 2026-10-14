import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';
import { Botao } from '@/components/Botao';
import { CampoForm } from '@/components/Campo';
import { EditorMarkdown } from '@/components/EditorMarkdown';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useInvalidarMutirao, useProjeto } from '@/features/mutirao/hooks';
import { salvarProjeto } from '@/features/mutirao/services';
import { useMeuPerfil, useNucleos } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { CAUSAS } from '@/lib/constantes';
import { lerData, paraEntradaData } from '@/lib/datas';
import { textoDoErro } from '@/lib/erros';
import { parseValorBR } from '@/lib/formatos';
import { enviarArquivo, escolherImagem } from '@/lib/upload';
import { toast } from '@/stores/toast';

const dataOpcional = z.string().refine((v) => !v || !!lerData(v), 'Use DD/MM/AAAA');
const esquema = z.object({
  titulo: z.string().trim().min(5, 'Título muito curto').max(160),
  causa: z.string().min(1, 'Escolha a causa'),
  nucleo_id: z.string().nullable(),
  descricao_md: z.string().trim().min(30, 'Descreva o projeto (mínimo 30 caracteres)'),
  meta: z.string().refine((v) => !v || parseValorBR(v) >= 0, 'Valor inválido'),
  inicio: dataOpcional,
  fim: dataOpcional,
  capa_url: z.string().nullable(),
});
type Form = z.infer<typeof esquema>;

export default function NovoProjeto() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: perfil } = useMeuPerfil();
  const { data: nucleos } = useNucleos();
  const existente = useProjeto(id);
  const invalidar = useInvalidarMutirao();
  const [enviandoCapa, setEnviandoCapa] = useState(false);
  const { control, handleSubmit, reset, setValue, watch, formState } = useForm<Form>({
    resolver: zodResolver(esquema),
    defaultValues: { titulo: '', causa: '', nucleo_id: perfil?.nucleo_id ?? null, descricao_md: '', meta: '', inicio: '', fim: '', capa_url: null },
  });
  useEffect(() => {
    const p = existente.data?.projeto;
    if (p) reset({ titulo: p.titulo, causa: p.causa, nucleo_id: p.nucleo_id, descricao_md: p.descricao_md, meta: p.meta_financeira ? String(p.meta_financeira).replace('.', ',') : '', inicio: paraEntradaData(p.data_inicio), fim: paraEntradaData(p.data_fim), capa_url: p.capa_url });
  }, [existente.data, reset]);

  if (!id && perfil && !podeNivel(perfil, 4)) {
    return <Tela><EstadoVazio ilustracao="maos" titulo="Projetos são criados por Guardiões" descricao="Ao atingir 800 pontos de contribuição você pode coordenar projetos. Enquanto isso, ajude nos projetos existentes!" /></Tela>;
  }

  const capa = watch('capa_url');
  const enviar = handleSubmit(async (v) => {
    try {
      const p = await salvarProjeto({
        id,
        titulo: v.titulo,
        causa: v.causa,
        nucleo_id: v.nucleo_id,
        descricao_md: v.descricao_md,
        meta_financeira: v.meta ? parseValorBR(v.meta) : null,
        data_inicio: v.inicio ? lerData(v.inicio) : null,
        data_fim: v.fim ? lerData(v.fim) : null,
        capa_url: v.capa_url,
        ...(id ? {} : { status: 'ativo' as const }),
      });
      invalidar();
      router.replace(`/mutirao/projeto/${p.id}`);
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  });

  return (
    <Tela teclado>
      <CampoForm control={control} nome="titulo" rotulo="Nome do projeto" />
      <Controller control={control} name="causa" render={({ field, fieldState }) => (
        <Seletor rotulo="Causa" opcoes={CAUSAS.map((c) => ({ valor: c, rotulo: c }))} valor={field.value} aoMudar={(v) => field.onChange(v)} erro={fieldState.error?.message} />
      )} />
      <Controller control={control} name="nucleo_id" render={({ field }) => (
        <Seletor rotulo="Núcleo (opcional)" opcoes={[{ valor: 'nacional', rotulo: 'Nacional / sem núcleo' }, ...(nucleos ?? []).map((n) => ({ valor: n.id, rotulo: `${n.cidade} · ${n.estado}` }))]} valor={field.value ?? 'nacional'} aoMudar={(v) => field.onChange(v === 'nacional' ? null : v)} />
      )} />
      <Controller control={control} name="descricao_md" render={({ field, fieldState }) => (
        <EditorMarkdown rotulo="Descrição" valor={field.value} aoMudar={field.onChange} erro={fieldState.error?.message} placeholder="Objetivo, público beneficiado, como ajudar, como o dinheiro será usado…" />
      )} />
      <CampoForm control={control} nome="meta" rotulo="Meta financeira (R$, opcional)" keyboardType="decimal-pad" placeholder="3.000,00" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><CampoForm control={control} nome="inicio" rotulo="Início" placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" /></View>
        <View style={{ flex: 1 }}><CampoForm control={control} nome="fim" rotulo="Fim (opcional)" placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" /></View>
      </View>
      <View style={{ gap: 8 }}>
        <Texto variante="rotulo" cor="secundario">Capa</Texto>
        {capa ? <Image source={{ uri: capa }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }} accessibilityLabel="Capa" /> : null}
        <Botao titulo={capa ? 'Trocar capa' : 'Escolher imagem'} icone="image" compacto variante="secundario" carregando={enviandoCapa} onPress={async () => {
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
        }} />
      </View>
      <Botao titulo={id ? 'Salvar alterações' : 'Criar projeto'} largura="total" carregando={formState.isSubmitting} onPress={enviar} />
    </Tela>
  );
}
