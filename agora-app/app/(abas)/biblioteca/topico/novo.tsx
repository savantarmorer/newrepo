import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Botao } from '@/components/Botao';
import { CampoForm } from '@/components/Campo';
import { EditorMarkdown } from '@/components/EditorMarkdown';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { useInvalidarBiblioteca, useTemas } from '@/features/biblioteca/hooks';
import { criarTopico } from '@/features/biblioteca/services';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';

const esquema = z.object({
  tema_id: z.string({ message: 'Escolha um tema' }).min(1, 'Escolha um tema'),
  titulo: z.string().trim().min(5, 'Título muito curto (mínimo 5 caracteres)').max(200),
  corpo_md: z.string().trim().min(20, 'Conte um pouco mais (mínimo 20 caracteres)'),
});
type Form = z.infer<typeof esquema>;

export default function NovoTopico() {
  const params = useLocalSearchParams<{ tema?: string }>();
  const { data: temas } = useTemas();
  const { data: perfil } = useMeuPerfil();
  const invalidar = useInvalidarBiblioteca();
  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(esquema),
    defaultValues: { tema_id: params.tema ?? '', titulo: '', corpo_md: '' },
  });

  if (perfil && !podeNivel(perfil, 2)) {
    return (
      <Tela>
        <EstadoVazio titulo="Quase lá!" descricao="Criar tópicos é liberado no nível Colaborador (50 pontos). Responda tópicos e participe do Mutirão para chegar lá." acao={{ titulo: 'Ver meu progresso', onPress: () => router.push('/perfil') }} />
      </Tela>
    );
  }

  const enviar = handleSubmit(async (v) => {
    try {
      const t = await criarTopico(v);
      invalidar();
      router.replace(`/biblioteca/topico/${t.id}`);
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  });

  return (
    <Tela teclado>
      <Controller control={control} name="tema_id" render={({ field, fieldState }) => (
        <Seletor rotulo="Tema" opcoes={(temas ?? []).map((t) => ({ valor: t.id, rotulo: t.nome }))} valor={field.value} aoMudar={(v) => field.onChange(v)} erro={fieldState.error?.message} />
      )} />
      <CampoForm control={control} nome="titulo" rotulo="Título" placeholder="Uma pergunta ou tema claro" maxLength={200} />
      <Controller control={control} name="corpo_md" render={({ field, fieldState }) => (
        <EditorMarkdown rotulo="Texto" valor={field.value} aoMudar={field.onChange} erro={fieldState.error?.message} placeholder="Contextualize, cite fontes, diga o que você já sabe…" />
      )} />
      <Botao titulo="Publicar tópico" largura="total" carregando={formState.isSubmitting} onPress={enviar} />
    </Tela>
  );
}
