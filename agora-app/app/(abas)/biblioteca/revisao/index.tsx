import { router } from 'expo-router';
import { View } from 'react-native';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Erro } from '@/components/Estados';
import { SkeletonLista } from '@/components/Skeleton';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useFilaRevisao } from '@/features/biblioteca/hooks';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { tempoLeitura, tempoRelativo } from '@/lib/formatos';

export default function FilaRevisao() {
  const { data: perfil } = useMeuPerfil();
  const { data, isLoading, error, refetch, isRefetching } = useFilaRevisao();
  if (perfil && !podeNivel(perfil, 3)) {
    return <Tela><EstadoVazio titulo="Revisão é para Curadores" descricao="Ao atingir 250 pontos você passa a revisar artigos da comunidade." /></Tela>;
  }
  return (
    <Tela aoAtualizar={refetch} atualizando={isRefetching}>
      <Texto cor="secundario">Publicação exige 2 aprovações de curadores diferentes dos autores. Ninguém revisa o próprio artigo.</Texto>
      {isLoading ? <SkeletonLista /> : error ? <Erro erro={error} aoTentar={refetch} /> : data?.length ? (
        data.map((a) => (
          <Card key={a.id} plano onPress={() => router.push(`/biblioteca/revisao/${a.id}`)} rotulo={`Revisar ${a.titulo}`} destaque={a.jaRevisei ? undefined : 'dourado'}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              {a.tema ? <ChipTema rotulo={a.tema.nome} /> : null}
              <ChipTema rotulo={`${a.aprovacoes}/2 aprovações`} tom="secundaria" />
              {a.jaRevisei ? <ChipTema rotulo="Você já revisou" tom="dourado" /> : null}
            </View>
            <Texto variante="subtitulo" style={{ fontSize: 21 }}>{a.titulo}</Texto>
            <Texto variante="legenda" cor="secundario">{tempoLeitura(a.corpo_md)} · enviado {tempoRelativo(a.updated_at)}</Texto>
          </Card>
        ))
      ) : (
        <EstadoVazio titulo="Fila vazia" descricao="Nenhum artigo aguardando revisão agora. Obrigado por cuidar da Biblioteca!" ilustracao="livro" />
      )}
    </Tela>
  );
}
