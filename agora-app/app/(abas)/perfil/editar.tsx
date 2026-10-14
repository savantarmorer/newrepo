import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Switch, View } from 'react-native';
import { z } from 'zod';
import { Avatar } from '@/components/Avatar';
import { Botao } from '@/components/Botao';
import { CampoForm } from '@/components/Campo';
import { Card } from '@/components/Card';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useAtualizarPerfil, useMeuPerfil, useNucleos, useTemasSimples } from '@/features/perfil/hooks';
import { textoDoErro } from '@/lib/erros';
import { enviarArquivo, escolherImagem } from '@/lib/upload';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

const esquema = z
  .object({
    nome_exibicao: z.string().trim().min(2).max(60),
    pseudonimo_ativo: z.boolean(),
    pseudonimo: z.string().trim().max(40).optional(),
    bio: z.string().max(500, 'Até 500 caracteres').optional(),
    cidade: z.string().trim().max(80).optional(),
    estado: z.string().max(2).optional(),
    nucleo_id: z.string().nullable(),
    interesses: z.array(z.string()),
  })
  .refine((v) => !v.pseudonimo_ativo || (v.pseudonimo?.length ?? 0) >= 2, { path: ['pseudonimo'], message: 'Escolha um pseudônimo' });
type Form = z.infer<typeof esquema>;

export default function EditarPerfil() {
  const { c } = useTema();
  const { data: perfil } = useMeuPerfil();
  const { data: nucleos } = useNucleos();
  const { data: temas } = useTemasSimples();
  const atualizar = useAtualizarPerfil();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const { control, handleSubmit, reset, watch } = useForm<Form>({ resolver: zodResolver(esquema) });
  useEffect(() => {
    if (perfil) {
      reset({ nome_exibicao: perfil.nome_exibicao, pseudonimo_ativo: perfil.pseudonimo_ativo, pseudonimo: perfil.pseudonimo ?? '', bio: perfil.bio ?? '', cidade: perfil.cidade ?? '', estado: perfil.estado ?? '', nucleo_id: perfil.nucleo_id, interesses: perfil.interesses });
      setAvatar(perfil.avatar_url);
    }
  }, [perfil, reset]);

  const salvar = handleSubmit(async (v) => {
    try {
      await atualizar.mutateAsync({ ...v, pseudonimo: v.pseudonimo || null, bio: v.bio || null, estado: (v.estado || '').toUpperCase() || null, cidade: v.cidade || null, avatar_url: avatar });
      toast.sucesso('Perfil atualizado.');
      router.back();
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  });

  return (
    <Tela teclado>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Avatar nome={watch('pseudonimo_ativo') ? watch('pseudonimo') : watch('nome_exibicao')} url={avatar} tamanho={88} />
        <Botao titulo="Trocar foto" compacto variante="secundario" carregando={enviando} onPress={async () => {
          try {
            const img = await escolherImagem({ quadrada: true });
            if (!img || !perfil) return;
            setEnviando(true);
            setAvatar(await enviarArquivo('avatares', perfil.id, img.uri, img.mimeType ?? 'image/jpeg'));
          } catch (e) {
            toast.erro(textoDoErro(e));
          } finally {
            setEnviando(false);
          }
        }} />
        {avatar ? <Botao titulo="Remover foto" compacto variante="fantasma" onPress={() => setAvatar(null)} /> : null}
      </View>
      <CampoForm control={control} nome="nome_exibicao" rotulo="Nome" ajuda="Visível só para admins se o pseudônimo estiver ativo." />
      <Card plano>
        <Controller control={control} name="pseudonimo_ativo" render={({ field }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Texto variante="corpoForte" style={{ flex: 1 }}>Usar pseudônimo</Texto>
            <Switch value={field.value} onValueChange={field.onChange} accessibilityLabel="Usar pseudônimo" trackColor={{ true: c.secundaria, false: c.bordaForte }} />
          </View>
        )} />
        {watch('pseudonimo_ativo') ? <View style={{ marginTop: 12 }}><CampoForm control={control} nome="pseudonimo" rotulo="Pseudônimo" /></View> : null}
      </Card>
      <CampoForm control={control} nome="bio" rotulo="Sobre você" multiline />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 2 }}><CampoForm control={control} nome="cidade" rotulo="Cidade" /></View>
        <View style={{ flex: 1 }}><CampoForm control={control} nome="estado" rotulo="UF" maxLength={2} autoCapitalize="characters" /></View>
      </View>
      <Controller control={control} name="nucleo_id" render={({ field }) => (
        <Seletor rotulo="Núcleo" opcoes={[{ valor: 'nenhum', rotulo: 'Nenhum' }, ...(nucleos ?? []).map((n) => ({ valor: n.id, rotulo: `${n.cidade} · ${n.estado}` }))]} valor={field.value ?? 'nenhum'} aoMudar={(v) => field.onChange(v === 'nenhum' ? null : v)} />
      )} />
      <Controller control={control} name="interesses" render={({ field }) => (
        <Seletor rotulo="Temas de interesse" multiplo opcoes={(temas ?? []).map((t) => ({ valor: t.slug, rotulo: t.nome }))} valor={field.value ?? []} aoMudar={(v) => field.onChange(v)} />
      )} />
      <Botao titulo="Salvar" largura="total" carregando={atualizar.isPending} onPress={salvar} />
    </Tela>
  );
}
