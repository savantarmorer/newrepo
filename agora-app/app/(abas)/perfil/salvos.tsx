import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Card } from '@/components/Card';
import { ItemLista } from '@/components/ItemLista';
import { Secao } from '@/components/Secao';
import { SkeletonLista } from '@/components/Skeleton';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useSalvos } from '@/features/biblioteca/hooks';
import { formatarData } from '@/lib/formatos';
import { listarArtigosOffline } from '@/lib/offline';

const ICONE = { topico: 'message-square', artigo: 'file-text', trilha: 'map' } as const;
const ROTA = { topico: '/biblioteca/topico/', artigo: '/biblioteca/artigo/', trilha: '/biblioteca/trilha/' } as const;

export default function Salvos() {
  const { data, isLoading, refetch, isRefetching } = useSalvos();
  const offline = useQuery({ queryKey: ['offline', 'lista'], queryFn: listarArtigosOffline });
  return (
    <Tela aoAtualizar={() => { refetch(); offline.refetch(); }} atualizando={isRefetching}>
      {offline.data?.length ? (
        <Card plano destaque="secundaria"><Texto variante="legenda">{offline.data.length} artigo(s) disponível(is) para leitura sem internet neste aparelho.</Texto></Card>
      ) : null}
      {isLoading ? <SkeletonLista /> : data?.length ? (
        (['artigo', 'trilha', 'topico'] as const).map((tipo) => {
          const itens = data.filter((s) => s.tipo === tipo);
          if (!itens.length) return null;
          return (
            <Secao key={tipo} titulo={tipo === 'artigo' ? 'Artigos' : tipo === 'trilha' ? 'Trilhas' : 'Tópicos'}>
              {itens.map((s) => <ItemLista key={s.item_id} icone={ICONE[s.tipo]} titulo={s.titulo} subtitulo={`Salvo em ${formatarData(s.created_at)}`} onPress={() => router.push(`${ROTA[s.tipo]}${s.item_id}` as never)} />)}
            </Secao>
          );
        })
      ) : (
        <EstadoVazio ilustracao="livro" titulo="Nada salvo ainda" descricao="Salve artigos para ler mesmo sem internet." acao={{ titulo: 'Ir à Biblioteca', onPress: () => router.push('/biblioteca') }} />
      )}
    </Tela>
  );
}
