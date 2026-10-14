import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Botao } from '@/components/Botao';
import { CampoForm } from '@/components/Campo';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useInvalidarMutirao } from '@/features/mutirao/hooks';
import { salvarTarefa } from '@/features/mutirao/services';
import { lerData } from '@/lib/datas';
import { textoDoErro } from '@/lib/erros';
import { parseValorBR } from '@/lib/formatos';
import { toast } from '@/stores/toast';

const esquema = z.object({
  titulo: z.string().trim().min(3, 'Dê um título à tarefa'),
  descricao: z.string().optional(),
  prazo: z.string().refine((v) => !v || !!lerData(v), 'Use DD/MM/AAAA'),
  horas: z.string().refine((v) => !v || parseValorBR(v) > 0, 'Número inválido'),
});
type Form = z.infer<typeof esquema>;

export default function NovaTarefa() {
  const { projeto } = useLocalSearchParams<{ projeto: string }>();
  const invalidar = useInvalidarMutirao();
  const { control, handleSubmit, formState } = useForm<Form>({ resolver: zodResolver(esquema), defaultValues: { titulo: '', descricao: '', prazo: '', horas: '' } });
  const salvar = handleSubmit(async (v) => {
    try {
      await salvarTarefa({ projeto_id: projeto, titulo: v.titulo, descricao: v.descricao || null, prazo: v.prazo ? lerData(v.prazo) : null, horas_estimadas: v.horas ? parseValorBR(v.horas) : null });
      invalidar();
      router.back();
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  });
  return (
    <Tela teclado>
      <Texto cor="secundario">Tarefas claras e pequenas são assumidas mais rápido. Colaboradores que participam do projeto também podem criar tarefas.</Texto>
      <CampoForm control={control} nome="titulo" rotulo="Título" />
      <CampoForm control={control} nome="descricao" rotulo="Detalhes" multiline />
      <CampoForm control={control} nome="prazo" rotulo="Prazo (opcional)" placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" />
      <CampoForm control={control} nome="horas" rotulo="Horas estimadas (opcional)" keyboardType="decimal-pad" />
      <Botao titulo="Criar tarefa" largura="total" carregando={formState.isSubmitting} onPress={salvar} />
    </Tela>
  );
}
