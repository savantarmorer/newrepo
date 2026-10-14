import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';
import { Botao } from '@/components/Botao';
import { CampoForm } from '@/components/Campo';
import { Card } from '@/components/Card';
import { EditorMarkdown } from '@/components/EditorMarkdown';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useInvalidarAssembleia, useProposta } from '@/features/assembleia/hooks';
import { salvarProposta } from '@/features/assembleia/services';
import type { TipoProposta } from '@/features/assembleia/types';
import { useConfiguracao, useMeuPerfil } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { somarDias } from '@/lib/datas';
import { textoDoErro } from '@/lib/erros';
import { formatarDataHora } from '@/lib/formatos';
import { toast } from '@/stores/toast';

interface CfgAssembleia { debate_min_dias: number; votacao_min_dias: number; limiar_padrao: number; limiar_qualificado: number; quorum_padrao: number }

const esquema = z.object({
  titulo: z.string().trim().min(5, 'Título muito curto').max(200),
  tipo: z.enum(['geral', 'financeira', 'regimento', 'nucleo']),
  contexto_md: z.string().trim().min(20, 'Explique o contexto (mínimo 20 caracteres)'),
  proposta_md: z.string().trim().min(50, 'Escreva o texto da proposta (mínimo 50 caracteres)'),
  diasDebate: z.number(),
  diasVotacao: z.number(),
});
type Form = z.infer<typeof esquema>;

export default function NovaProposta() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: perfil } = useMeuPerfil();
  const { data: cfg } = useConfiguracao<CfgAssembleia>('assembleia');
  const existente = useProposta(id);
  const invalidar = useInvalidarAssembleia();
  const minDebate = cfg?.debate_min_dias ?? 5;
  const minVotacao = cfg?.votacao_min_dias ?? 3;
  const [salvando, setSalvando] = useState(false);
  const { control, handleSubmit, watch, reset } = useForm<Form>({
    resolver: zodResolver(esquema),
    defaultValues: { titulo: '', tipo: 'geral', contexto_md: '', proposta_md: '', diasDebate: minDebate, diasVotacao: minVotacao },
  });
  useEffect(() => {
    const p = existente.data?.proposta;
    if (p) reset({ titulo: p.titulo, tipo: p.tipo, contexto_md: p.contexto_md, proposta_md: p.proposta_md, diasDebate: minDebate, diasVotacao: minVotacao });
  }, [existente.data, reset, minDebate, minVotacao]);

  if (perfil && !podeNivel(perfil, 3)) {
    return <Tela><EstadoVazio ilustracao="urna" titulo="Propostas são abertas por Curadores" descricao="Ao atingir 250 pontos você pode propor. Todos os membros ativos podem debater e votar." /></Tela>;
  }

  const tipo = watch('tipo');
  const diasDebate = watch('diasDebate');
  const diasVotacao = watch('diasVotacao');
  const debateAte = somarDias(diasDebate);
  const votacaoAte = somarDias(diasDebate + diasVotacao);
  const limiar = tipo === 'financeira' || tipo === 'regimento' ? cfg?.limiar_qualificado ?? 0.6667 : cfg?.limiar_padrao ?? 0.6;

  const salvar = (abrirDebate: boolean) =>
    handleSubmit(async (v) => {
      if (v.tipo === 'nucleo' && !perfil?.nucleo_id) return toast.erro('Você precisa pertencer a um núcleo para propor no escopo local.');
      setSalvando(true);
      try {
        const p = await salvarProposta({
          id,
          titulo: v.titulo,
          tipo: v.tipo as TipoProposta,
          contexto_md: v.contexto_md,
          proposta_md: v.proposta_md,
          escopo_nucleo_id: v.tipo === 'nucleo' ? perfil?.nucleo_id ?? null : null,
          debate_ate: somarDias(v.diasDebate).toISOString(),
          votacao_ate: somarDias(v.diasDebate + v.diasVotacao).toISOString(),
          abrirDebate,
        });
        invalidar();
        toast.sucesso(abrirDebate ? 'Debate aberto! Membros já podem comentar.' : 'Rascunho salvo (só você vê).');
        router.replace(`/assembleia/proposta/${p.id}`);
      } catch (e) {
        toast.erro(textoDoErro(e));
      } finally {
        setSalvando(false);
      }
    })();

  const passo = (campo: 'diasDebate' | 'diasVotacao', minimo: number) => (
    <Controller control={control} name={campo} render={({ field }) => (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Botao titulo="−" compacto variante="secundario" desabilitado={field.value <= minimo} onPress={() => field.onChange(Math.max(minimo, field.value - 1))} dica="Diminuir um dia" />
        <Texto variante="corpoForte" accessibilityLiveRegion="polite">{field.value} dias</Texto>
        <Botao titulo="+" compacto variante="secundario" desabilitado={field.value >= 30} onPress={() => field.onChange(field.value + 1)} dica="Aumentar um dia" />
      </View>
    )} />
  );

  return (
    <Tela teclado>
      <CampoForm control={control} nome="titulo" rotulo="Título" />
      <Controller control={control} name="tipo" render={({ field }) => (
        <Seletor rotulo="Tipo" opcoes={[{ valor: 'geral', rotulo: 'Geral' }, { valor: 'financeira', rotulo: 'Financeira' }, { valor: 'regimento', rotulo: 'Regimento' }, { valor: 'nucleo', rotulo: 'Do meu núcleo' }]} valor={field.value} aoMudar={(v) => field.onChange(v)} />
      )} />
      <Card plano>
        <Texto variante="legenda" cor="secundario">
          {tipo === 'nucleo' ? 'Escopo: só membros do seu núcleo votam. ' : 'Escopo: todos os membros ativos. '}
          Quórum de {Math.round((cfg?.quorum_padrao ?? 0.1) * 100)}% · aprovação com {Math.round(limiar * 100)}% dos votos válidos e menos de 3 bloqueios.
        </Texto>
      </Card>
      <Controller control={control} name="contexto_md" render={({ field, fieldState }) => (
        <EditorMarkdown rotulo="Contexto: qual problema isso resolve?" valor={field.value} aoMudar={field.onChange} erro={fieldState.error?.message} alturaMinima={140} />
      )} />
      <Controller control={control} name="proposta_md" render={({ field, fieldState }) => (
        <EditorMarkdown rotulo="Texto da proposta (o que exatamente será decidido)" valor={field.value} aoMudar={field.onChange} erro={fieldState.error?.message} />
      )} />
      <View style={{ gap: 8 }}>
        <Texto variante="rotulo" cor="secundario">Duração do debate (mínimo {minDebate})</Texto>
        {passo('diasDebate', minDebate)}
        <Texto variante="rotulo" cor="secundario">Duração da votação (mínimo {minVotacao})</Texto>
        {passo('diasVotacao', minVotacao)}
        <Texto variante="legenda" cor="sutil">Se abrir agora: debate até {formatarDataHora(debateAte.toISOString())}; votação até {formatarDataHora(votacaoAte.toISOString())}. As transições são automáticas.</Texto>
      </View>
      <Botao titulo="Salvar rascunho" variante="secundario" largura="total" carregando={salvando} onPress={() => salvar(false)} />
      <Botao titulo="Abrir debate" icone="message-circle" largura="total" carregando={salvando} onPress={() => salvar(true)} />
    </Tela>
  );
}
