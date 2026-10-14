import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { Icone, type NomeIcone } from '@/components/Icone';
import { Secao } from '@/components/Secao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { formatarNumero } from '@/lib/formatos';
import { rpc } from '@/lib/supabase';
import { useTema } from '@/theme/ThemeProvider';

interface Estatisticas {
  membros_ativos: number;
  artigos_publicados: number;
  horas_voluntariado: number;
  projetos_concluidos: number;
  decisoes: number;
  nucleos: { cidade: string; estado: string }[];
}

const PRINCIPIOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: 'slash', titulo: 'Não é rede social', texto: 'Sem feed algorítmico, curtidas públicas, seguidores ou rolagem viciante.' },
  { icone: 'book', titulo: 'Conhecimento guardado', texto: 'Discussões viram artigos revisados e trilhas de estudo encontráveis.' },
  { icone: 'git-merge', titulo: 'Horizontalidade mecânica', texto: 'Permissões vêm de contribuição verificável, não de cargo ou popularidade.' },
  { icone: 'eye', titulo: 'Transparência no dinheiro', texto: 'Todo real que entra ou sai de um projeto é público, com comprovante.' },
  { icone: 'lock', titulo: 'Privacidade por padrão', texto: 'Pseudônimo opcional, nenhum rastreador, exportação e exclusão dos seus dados.' },
];

export default function Sobre() {
  const { c, espaco } = useTema();
  const { data, refetch, isRefetching } = useQuery({ queryKey: ['publico', 'estatisticas'], queryFn: () => rpc<Estatisticas>('estatisticas_publicas') });
  const numeros = data
    ? [
        { rotulo: 'membros ativos', valor: data.membros_ativos },
        { rotulo: 'artigos publicados', valor: data.artigos_publicados },
        { rotulo: 'horas de voluntariado', valor: Number(data.horas_voluntariado) },
        { rotulo: 'decisões registradas', valor: data.decisoes },
      ]
    : [];
  return (
    <Tela aoAtualizar={refetch} atualizando={isRefetching}>
      <View style={{ gap: 8 }}>
        <Texto variante="display" cor="primaria">Ágora</Texto>
        <Texto variante="leitura" cor="secundario">
          Uma comunidade brasileira, financiada pelos próprios membros, para trocar conhecimento de forma horizontal e organizar ações comunitárias no mundo real.
        </Texto>
      </View>
      {numeros.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.md }}>
          {numeros.map((n) => (
            <Card key={n.rotulo} style={{ flexBasis: '47%', flexGrow: 1 }} plano>
              <Texto variante="numero" cor="primaria">{formatarNumero(n.valor)}</Texto>
              <Texto variante="legenda" cor="secundario">{n.rotulo}</Texto>
            </Card>
          ))}
        </View>
      ) : null}
      <Secao titulo="Princípios">
        {PRINCIPIOS.map((p) => (
          <View key={p.titulo} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.secundariaSuave, alignItems: 'center', justifyContent: 'center' }}>
              <Icone nome={p.icone} cor={c.secundaria} tamanho={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Texto variante="corpoForte">{p.titulo}</Texto>
              <Texto cor="secundario">{p.texto}</Texto>
            </View>
          </View>
        ))}
      </Secao>
      {data?.nucleos.length ? (
        <Secao titulo="Núcleos locais">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {data.nucleos.map((n) => <ChipTema key={n.cidade} rotulo={`${n.cidade} · ${n.estado}`} tom="secundaria" />)}
          </View>
        </Secao>
      ) : null}
      <Secao titulo="Como participar">
        <Texto cor="secundario">
          A Ágora é sustentada por assinaturas. Depois de entrar, você escolhe nome ou pseudônimo, sua cidade e seus temas de interesse, e lê nosso Código de Conduta.
        </Texto>
      </Secao>
      <Botao titulo="Entrar ou criar conta" largura="total" onPress={() => router.push('/entrar')} />
    </Tela>
  );
}
