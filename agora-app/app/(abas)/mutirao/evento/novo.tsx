import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';
import { Botao } from '@/components/Botao';
import { CampoForm } from '@/components/Campo';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useEvento, useInvalidarMutirao } from '@/features/mutirao/hooks';
import { salvarEvento } from '@/features/mutirao/services';
import { lerDataHora, paraEntradaDataHora } from '@/lib/datas';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';

const esquema = z
  .object({
    titulo: z.string().trim().min(5, 'Título muito curto'),
    descricao: z.string().optional(),
    local_nome: z.string().optional(),
    endereco: z.string().optional(),
    inicio: z.string().refine((v) => !!lerDataHora(v), 'Use DD/MM/AAAA HH:mm'),
    fim: z.string().refine((v) => !!lerDataHora(v), 'Use DD/MM/AAAA HH:mm'),
    vagas: z.string().refine((v) => !v || Number(v) > 0, 'Número inválido'),
  })
  .refine((v) => !lerDataHora(v.inicio) || !lerDataHora(v.fim) || lerDataHora(v.fim)! > lerDataHora(v.inicio)!, { path: ['fim'], message: 'O fim precisa ser depois do início' });
type Form = z.infer<typeof esquema>;

export default function NovoEvento() {
  const { id, projeto, nucleo } = useLocalSearchParams<{ id?: string; projeto?: string; nucleo?: string }>();
  const existente = useEvento(id);
  const invalidar = useInvalidarMutirao();
  const { control, handleSubmit, reset, formState } = useForm<Form>({
    resolver: zodResolver(esquema),
    defaultValues: { titulo: '', descricao: '', local_nome: '', endereco: '', inicio: '', fim: '', vagas: '' },
  });
  useEffect(() => {
    const e = existente.data?.evento;
    if (e) reset({ titulo: e.titulo, descricao: e.descricao ?? '', local_nome: e.local_nome ?? '', endereco: e.endereco ?? '', inicio: paraEntradaDataHora(e.inicio), fim: paraEntradaDataHora(e.fim), vagas: e.vagas ? String(e.vagas) : '' });
  }, [existente.data, reset]);

  const salvar = handleSubmit(async (v) => {
    try {
      const e = existente.data?.evento;
      const ev = await salvarEvento({
        id,
        titulo: v.titulo,
        descricao: v.descricao || null,
        local_nome: v.local_nome || null,
        endereco: v.endereco || null,
        inicio: lerDataHora(v.inicio)!,
        fim: lerDataHora(v.fim)!,
        vagas: v.vagas ? Number(v.vagas) : null,
        projeto_id: e?.projeto_id ?? (projeto || null),
        nucleo_id: e?.nucleo_id ?? (nucleo || null),
      });
      invalidar();
      router.replace(`/mutirao/evento/${ev.id}`);
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  });

  return (
    <Tela teclado>
      <Texto cor="secundario">Eventos podem ser criados pela coordenação do núcleo ou do projeto e por Guardiões.</Texto>
      <CampoForm control={control} nome="titulo" rotulo="Título" />
      <CampoForm control={control} nome="descricao" rotulo="Descrição" multiline />
      <CampoForm control={control} nome="local_nome" rotulo="Local" placeholder="Ex.: Biblioteca Parque" />
      <CampoForm control={control} nome="endereco" rotulo="Endereço" placeholder="Rua, número, bairro, cidade" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><CampoForm control={control} nome="inicio" rotulo="Início" placeholder="DD/MM/AAAA HH:mm" keyboardType="numbers-and-punctuation" /></View>
        <View style={{ flex: 1 }}><CampoForm control={control} nome="fim" rotulo="Fim" placeholder="DD/MM/AAAA HH:mm" keyboardType="numbers-and-punctuation" /></View>
      </View>
      <CampoForm control={control} nome="vagas" rotulo="Vagas (opcional)" keyboardType="number-pad" />
      <Botao titulo={id ? 'Salvar alterações' : 'Criar evento'} largura="total" carregando={formState.isSubmitting} onPress={salvar} />
    </Tela>
  );
}
