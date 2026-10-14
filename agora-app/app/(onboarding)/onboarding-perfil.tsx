import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Switch, View } from 'react-native';
import { z } from 'zod';
import { Botao } from '@/components/Botao';
import { CampoForm } from '@/components/Campo';
import { Card } from '@/components/Card';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useAtualizarPerfil, useMeuPerfil, useNucleos, useTemasSimples } from '@/features/perfil/hooks';
import { ESTADOS_BR } from '@/lib/constantes';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

const esquema = z
  .object({
    nome_exibicao: z.string().trim().min(2, 'Como podemos te chamar?').max(60),
    pseudonimo_ativo: z.boolean(),
    pseudonimo: z.string().trim().max(40).optional(),
    cidade: z.string().trim().min(2, 'Informe sua cidade').max(80),
    estado: z.string().length(2, 'Escolha o estado'),
    nucleo_id: z.string().nullable(),
    interesses: z.array(z.string()).min(1, 'Escolha pelo menos um tema'),
  })
  .refine((v) => !v.pseudonimo_ativo || (v.pseudonimo?.length ?? 0) >= 2, { path: ['pseudonimo'], message: 'Escolha um pseudônimo' });
type Form = z.infer<typeof esquema>;

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export default function OnboardingPerfil() {
  const { c } = useTema();
  const { data: perfil } = useMeuPerfil();
  const { data: nucleos } = useNucleos();
  const { data: temas } = useTemasSimples();
  const atualizar = useAtualizarPerfil();
  const { control, handleSubmit, watch, setValue, reset } = useForm<Form>({
    resolver: zodResolver(esquema),
    defaultValues: { nome_exibicao: '', pseudonimo_ativo: false, pseudonimo: '', cidade: '', estado: '', nucleo_id: null, interesses: [] },
  });

  useEffect(() => {
    if (perfil) {
      reset({
        nome_exibicao: perfil.nome_exibicao ?? '',
        pseudonimo_ativo: perfil.pseudonimo_ativo,
        pseudonimo: perfil.pseudonimo ?? '',
        cidade: perfil.cidade ?? '',
        estado: perfil.estado ?? '',
        nucleo_id: perfil.nucleo_id,
        interesses: perfil.interesses ?? [],
      });
    }
  }, [perfil, reset]);

  const cidade = watch('cidade');
  const estado = watch('estado');
  const pseudonimoAtivo = watch('pseudonimo_ativo');
  const sugestao = useMemo(
    () => nucleos?.find((n) => normalizar(n.cidade) === normalizar(cidade ?? '') && n.estado === estado) ?? null,
    [nucleos, cidade, estado],
  );
  useEffect(() => {
    if (sugestao) setValue('nucleo_id', sugestao.id);
  }, [sugestao, setValue]);

  const salvar = handleSubmit(async (v) => {
    try {
      await atualizar.mutateAsync({
        ...v,
        pseudonimo: v.pseudonimo_ativo ? v.pseudonimo ?? null : v.pseudonimo || null,
        onboarding_concluido_em: new Date().toISOString(),
      });
      router.replace('/onboarding-conduta');
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  });

  return (
    <Tela teclado>
      <Texto variante="titulo">Como você quer aparecer?</Texto>
      <CampoForm control={control} nome="nome_exibicao" rotulo="Seu nome" placeholder="Nome e sobrenome" autoComplete="name" />
      <Card plano>
        <Controller
          control={control}
          name="pseudonimo_ativo"
          render={({ field }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Texto variante="corpoForte">Usar pseudônimo</Texto>
                <Texto variante="legenda" cor="secundario">Seu nome real nunca aparece para outros membros — só para a administração.</Texto>
              </View>
              <Switch value={field.value} onValueChange={field.onChange} accessibilityLabel="Usar pseudônimo" trackColor={{ true: c.secundaria, false: c.bordaForte }} />
            </View>
          )}
        />
        {pseudonimoAtivo ? <View style={{ marginTop: 12 }}><CampoForm control={control} nome="pseudonimo" rotulo="Pseudônimo" placeholder="Ex.: Corvo Branco" /></View> : null}
      </Card>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 2 }}><CampoForm control={control} nome="cidade" rotulo="Cidade" autoComplete="postal-address-locality" /></View>
        <View style={{ flex: 1 }}><CampoForm control={control} nome="estado" rotulo="UF" autoCapitalize="characters" maxLength={2} placeholder="RJ" /></View>
      </View>
      {estado && !ESTADOS_BR.includes(estado.toUpperCase()) ? <Texto variante="legenda" cor="perigo">UF inválida</Texto> : null}
      <Controller
        control={control}
        name="nucleo_id"
        render={({ field }) => (
          <View style={{ gap: 8 }}>
            {sugestao ? (
              <Card destaque="secundaria" plano>
                <Texto variante="corpoForte">Há um núcleo da Ágora em {sugestao.cidade}!</Texto>
                <Texto variante="legenda" cor="secundario">Você foi incluída(o) no núcleo local. Pode mudar quando quiser.</Texto>
              </Card>
            ) : null}
            <Seletor
              rotulo="Núcleo local (opcional)"
              opcoes={[{ valor: 'nenhum', rotulo: 'Nenhum por enquanto' }, ...(nucleos ?? []).map((n) => ({ valor: n.id, rotulo: `${n.cidade} · ${n.estado}` }))]}
              valor={field.value ?? 'nenhum'}
              aoMudar={(v) => field.onChange(v === 'nenhum' ? null : v)}
            />
          </View>
        )}
      />
      <Controller
        control={control}
        name="interesses"
        render={({ field, fieldState }) => (
          <Seletor
            rotulo="Temas de interesse"
            multiplo
            opcoes={(temas ?? []).map((t) => ({ valor: t.slug, rotulo: t.nome }))}
            valor={field.value}
            aoMudar={(v) => field.onChange(v)}
            erro={fieldState.error?.message}
          />
        )}
      />
      <Botao titulo="Continuar" largura="total" carregando={atualizar.isPending} onPress={() => { setValue('estado', (estado ?? '').toUpperCase()); salvar(); }} />
    </Tela>
  );
}
