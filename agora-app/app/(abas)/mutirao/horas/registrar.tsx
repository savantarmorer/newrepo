import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Botao } from '@/components/Botao';
import { CampoForm } from '@/components/Campo';
import { Card } from '@/components/Card';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useInvalidarMutirao } from '@/features/mutirao/hooks';
import { registrarHoras } from '@/features/mutirao/services';
import { textoDoErro } from '@/lib/erros';
import { parseValorBR } from '@/lib/formatos';
import { toast } from '@/stores/toast';

const esquema = z.object({
  horas: z.string().refine((v) => { const n = parseValorBR(v); return n > 0 && n <= 24; }, 'Entre 0,5 e 24 horas'),
  descricao: z.string().trim().min(5, 'Descreva o que foi feito'),
});
type Form = z.infer<typeof esquema>;

export default function RegistrarHoras() {
  const { projeto, tarefa } = useLocalSearchParams<{ projeto: string; tarefa?: string }>();
  const invalidar = useInvalidarMutirao();
  const { control, handleSubmit, formState } = useForm<Form>({ resolver: zodResolver(esquema), defaultValues: { horas: '', descricao: '' } });
  const salvar = handleSubmit(async (v) => {
    try {
      await registrarHoras({ projeto_id: projeto, tarefa_id: tarefa ?? null, horas: parseValorBR(v.horas), descricao: v.descricao });
      invalidar();
      toast.sucesso('Horas registradas! A coordenação vai confirmar.');
      router.back();
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  });
  return (
    <Tela teclado>
      <Card plano destaque="dourado">
        <Texto variante="legenda">As horas ficam pendentes até a coordenação confirmar. Só horas confirmadas geram reputação (e créditos de Dracma).</Texto>
      </Card>
      <CampoForm control={control} nome="horas" rotulo="Horas dedicadas" keyboardType="decimal-pad" placeholder="Ex.: 2,5" />
      <CampoForm control={control} nome="descricao" rotulo="O que você fez" multiline placeholder="Ex.: triagem de 6 sacos de roupas" />
      <Botao titulo="Registrar" largura="total" carregando={formState.isSubmitting} onPress={salvar} />
    </Tela>
  );
}
