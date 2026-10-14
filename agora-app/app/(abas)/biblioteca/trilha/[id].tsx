import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { BarraAcoes } from '@/components/BarraAcoes';
import { BarraProgresso } from '@/components/BarraProgresso';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { Carregando, Erro } from '@/components/Estados';
import { Icone } from '@/components/Icone';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useAlternarSalvo, useEstaSalvo, useTrilha } from '@/features/biblioteca/hooks';
import { ROTULO_DIFICULDADE } from '@/features/biblioteca/types';
import { usePerfilPublico } from '@/features/perfil/hooks';
import { tempoLeitura } from '@/lib/formatos';
import { useTema } from '@/theme/ThemeProvider';

export default function TelaTrilha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, espaco, raio } = useTema();
  const q = useTrilha(id);
  const curador = usePerfilPublico(q.data?.trilha.curador_id);
  const salvo = useEstaSalvo('trilha', id);
  const alternar = useAlternarSalvo();
  if (q.isLoading) return <Carregando />;
  if (!q.data) return <Erro erro={q.error ?? 'Trilha não encontrada'} aoTentar={q.refetch} />;
  const { trilha: t, itens, feitos, concluida } = q.data;
  const pct = itens.length ? feitos.length / itens.length : 0;
  const proximo = itens.find((i) => !feitos.includes(i.artigo_id));

  return (
    <Tela aoAtualizar={q.refetch} atualizando={q.isRefetching}>
      <Stack.Screen options={{ title: 'Trilha' }} />
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {t.tema ? <ChipTema rotulo={t.tema.nome} tom="secundaria" /> : null}
          <ChipTema rotulo={ROTULO_DIFICULDADE[t.nivel_dificuldade] ?? ''} tom="dourado" />
        </View>
        <Texto variante="titulo">{t.titulo}</Texto>
        {t.descricao ? <Texto variante="leitura" cor="secundario" style={{ fontSize: 17 }}>{t.descricao}</Texto> : null}
        <Texto variante="legenda" cor="sutil">Curadoria de {curador.data?.nome_publico ?? '…'}</Texto>
      </View>
      {concluida ? (
        <Card destaque="dourado">
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icone nome="award" cor={c.douradoTexto} />
            <Texto variante="corpoForte" style={{ flex: 1 }}>Trilha concluída! O certificado está no seu perfil.</Texto>
          </View>
        </Card>
      ) : (
        <View style={{ gap: 6 }}>
          <BarraProgresso valor={pct} rotulo={`Progresso: ${feitos.length} de ${itens.length}`} cor={c.dourado} altura={10} />
          <Texto variante="legenda" cor="secundario">{feitos.length} de {itens.length} artigos lidos</Texto>
        </View>
      )}
      <View style={{ gap: espaco.sm }}>
        {itens.map((i, idx) => {
          const lido = feitos.includes(i.artigo_id);
          const atual = proximo?.artigo_id === i.artigo_id;
          return (
            <Pressable
              key={i.artigo_id}
              accessibilityRole="button"
              accessibilityLabel={`${idx + 1}. ${i.artigo?.titulo}${lido ? ', lido' : atual ? ', próximo' : ''}`}
              onPress={() => router.push({ pathname: '/biblioteca/artigo/[id]', params: { id: i.artigo_id, trilha: t.id } })}
              style={({ pressed }) => ({ flexDirection: 'row', gap: 12, padding: espaco.md, borderRadius: raio.md, borderWidth: 1, borderColor: atual ? c.primaria : c.borda, backgroundColor: pressed ? c.superficieAfundada : c.superficie })}
            >
              <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: lido ? c.secundaria : c.superficieAfundada }}>
                {lido ? <Icone nome="check" tamanho={16} cor={c.textoSobreSecundaria} /> : <Texto variante="corpoForte">{idx + 1}</Texto>}
              </View>
              <View style={{ flex: 1 }}>
                <Texto variante="corpoForte">{i.artigo?.titulo}</Texto>
                {i.artigo?.resumo ? <Texto variante="legenda" cor="secundario" numberOfLines={2}>{i.artigo.resumo}</Texto> : null}
                <Texto variante="legenda" cor="sutil">{i.artigo ? tempoLeitura(i.artigo.corpo_md) : ''}{atual ? ' · comece por aqui' : ''}</Texto>
              </View>
            </Pressable>
          );
        })}
      </View>
      <BarraAcoes acoes={[{ icone: 'bookmark', rotulo: salvo.data ? 'Salva' : 'Salvar trilha', ativo: !!salvo.data, onPress: () => alternar.mutate({ tipo: 'trilha', id: t.id, salvar: !salvo.data }) }]} />
    </Tela>
  );
}
