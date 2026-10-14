import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';
import { Botao } from '@/components/Botao';
import { CampoForm } from '@/components/Campo';
import { Card } from '@/components/Card';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useCaixa, useInvalidarMutirao } from '@/features/mutirao/hooks';
import { lancar } from '@/features/mutirao/services';
import { CATEGORIAS_CAIXA } from '@/lib/constantes';
import { hojeISO, lerData, paraEntradaData } from '@/lib/datas';
import { textoDoErro } from '@/lib/erros';
import { formatarMoeda, parseValorBR } from '@/lib/formatos';
import { enviarArquivo, escolherImagem } from '@/lib/upload';
import { toast } from '@/stores/toast';

const esquema = z.object({
  tipo: z.enum(['entrada', 'saida']),
  valor: z.string().refine((v) => parseValorBR(v) > 0, 'Informe um valor maior que zero'),
  descricao: z.string().trim().min(3, 'Descreva o lançamento'),
  categoria: z.string().min(1, 'Escolha a categoria'),
  data: z.string().refine((v) => !!lerData(v), 'Use DD/MM/AAAA'),
});
type Form = z.infer<typeof esquema>;

export default function Lancar() {
  const { projeto, estorno } = useLocalSearchParams<{ projeto: string; estorno?: string }>();
  const caixa = useCaixa(projeto);
  const original = caixa.data?.find((l) => l.id === estorno);
  const invalidar = useInvalidarMutirao();
  const [comprovante, setComprovante] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const { control, handleSubmit, reset, formState } = useForm<Form>({
    resolver: zodResolver(esquema),
    defaultValues: { tipo: 'saida', valor: '', descricao: '', categoria: '', data: paraEntradaData(hojeISO()) },
  });
  useEffect(() => {
    if (original) {
      reset({ tipo: original.tipo === 'entrada' ? 'saida' : 'entrada', valor: String(original.valor).replace('.', ','), descricao: 'Estorno: ', categoria: 'Outra', data: paraEntradaData(hojeISO()) });
    }
  }, [original, reset]);

  async function anexar(camera: boolean) {
    try {
      const img = await escolherImagem({ camera });
      if (!img) return;
      setEnviando(true);
      setComprovante(await enviarArquivo('comprovantes', projeto, img.uri, img.mimeType ?? 'image/jpeg'));
      toast.sucesso('Comprovante anexado.');
    } catch (e) {
      toast.erro(textoDoErro(e));
    } finally {
      setEnviando(false);
    }
  }

  const salvar = handleSubmit(async (v) => {
    if (estorno && v.descricao.trim().length < 20) return toast.erro('Justifique o estorno (mínimo 20 caracteres).');
    try {
      await lancar({ projeto_id: projeto, tipo: v.tipo, valor: parseValorBR(v.valor), descricao: v.descricao.trim(), categoria: v.categoria, data: lerData(v.data)!, comprovante_url: comprovante, estorno_de: estorno ?? null });
      invalidar();
      toast.sucesso('Lançamento registrado no caixa público.');
      router.back();
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  });

  return (
    <Tela teclado>
      {original ? (
        <Card destaque="dourado" plano>
          <Texto variante="corpoForte">Estornando: {original.descricao}</Texto>
          <Texto variante="legenda" cor="secundario">{original.tipo === 'entrada' ? 'Entrada' : 'Saída'} de {formatarMoeda(original.valor)}. O estorno precisa ter o mesmo valor e o tipo oposto. Explique o motivo.</Texto>
        </Card>
      ) : null}
      <Controller control={control} name="tipo" render={({ field }) => (
        <Seletor rotulo="Tipo" opcoes={[{ valor: 'entrada', rotulo: 'Entrada' }, { valor: 'saida', rotulo: 'Saída' }]} valor={field.value} aoMudar={(v) => !original && field.onChange(v)} />
      )} />
      <CampoForm control={control} nome="valor" rotulo="Valor (R$)" keyboardType="decimal-pad" placeholder="0,00" editable={!original} />
      <CampoForm control={control} nome="descricao" rotulo={original ? 'Justificativa do estorno' : 'Descrição'} multiline={!!original} />
      <Controller control={control} name="categoria" render={({ field, fieldState }) => (
        <Seletor rotulo="Categoria" opcoes={CATEGORIAS_CAIXA.map((c) => ({ valor: c, rotulo: c }))} valor={field.value} aoMudar={(v) => field.onChange(v)} erro={fieldState.error?.message} />
      )} />
      <CampoForm control={control} nome="data" rotulo="Data" placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" />
      <View style={{ gap: 8 }}>
        <Texto variante="rotulo" cor="secundario">Comprovante {comprovante ? '✓ anexado' : '(recomendado)'}</Texto>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Botao titulo="Fotografar" icone="camera" compacto variante="secundario" carregando={enviando} onPress={() => anexar(true)} />
          <Botao titulo="Da galeria" icone="image" compacto variante="secundario" carregando={enviando} onPress={() => anexar(false)} />
        </View>
        <Texto variante="legenda" cor="sutil">Comprovantes ficam em armazenamento privado e só abrem por link temporário para membros.</Texto>
      </View>
      <Botao titulo="Registrar lançamento" largura="total" carregando={formState.isSubmitting} onPress={salvar} />
    </Tela>
  );
}
