import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Erro } from '@/components/Estados';
import { Icone, type NomeIcone } from '@/components/Icone';
import { ListaPaginada } from '@/components/ListaPaginada';
import { SkeletonLista } from '@/components/Skeleton';
import { Texto } from '@/components/Texto';
import { useAcervo, useResumoAcervo } from '@/features/biblioteca/hooks';
import { linkDocumento, ROTULO_TIPO_DOCUMENTO, type DocumentoAcervo, type TipoDocumento } from '@/features/biblioteca/types';
import { useTema } from '@/theme/ThemeProvider';

const ICONE_TIPO: Record<TipoDocumento, NomeIcone> = {
  pdf: 'file-text', documento: 'file-text', apresentacao: 'monitor', planilha: 'grid', livro: 'book',
  imagem: 'image', audio: 'headphones', video: 'film', outro: 'file',
};

function tamanho(bytes: number | null) {
  if (!bytes) return null;
  const u = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i ? 1 : 0).replace('.', ',')} ${u[i]}`;
}

/** Acervo: índice dos documentos da biblioteca do site (os arquivos abrem no Google Drive). */
export default function Acervo() {
  const { c, espaco } = useTema();
  const [termo, setTermo] = useState('');
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [colecao, setColecao] = useState<string | null>(null);
  const [assunto, setAssunto] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setBusca(termo), 350);
    return () => clearTimeout(id);
  }, [termo]);

  const resumo = useResumoAcervo();
  const q = useAcervo({ termo: busca, categoria, colecao, assunto });
  const lista = q.data?.pages.flat() ?? [];

  const { categorias, colecoes, assuntos, total } = useMemo(() => {
    const r = resumo.data ?? [];
    const porCategoria = new Map<string, number>();
    for (const x of r) if (x.grupo === 'colecao' && x.categoria) porCategoria.set(x.categoria, (porCategoria.get(x.categoria) ?? 0) + Number(x.total));
    return {
      categorias: [...porCategoria.entries()].sort((a, b) => b[1] - a[1]),
      colecoes: r.filter((x) => x.grupo === 'colecao' && x.categoria === categoria && x.nome !== '(raiz)').slice(0, 40),
      assuntos: r.filter((x) => x.grupo === 'assunto'),
      total: [...porCategoria.values()].reduce((s, n) => s + n, 0),
    };
  }, [resumo.data, categoria]);

  const escolherCategoria = (nome: string | null) => {
    setCategoria(nome === categoria ? null : nome);
    setColecao(null);
  };

  const cabecalho = (
    <View style={{ gap: espaco.md, marginBottom: espaco.sm }}>
      <Texto cor="secundario">
        {total ? `${total.toLocaleString('pt-BR')} documentos` : 'Documentos'} da biblioteca do site, organizados por coleção e assunto. Os arquivos abrem no Google Drive.
      </Texto>
      <Campo rotulo="Buscar no acervo" value={termo} onChangeText={setTermo} placeholder="Ex.: tarô, Crowley, maçonaria" returnKeyType="search" />
      {categorias.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco.sm }}>
          {categorias.map(([nome, n]) => (
            <ChipTema key={nome} rotulo={`${nome} · ${n.toLocaleString('pt-BR')}`} selecionado={categoria === nome} onPress={() => escolherCategoria(nome)} tom="primaria" />
          ))}
        </ScrollView>
      ) : null}
      {colecoes.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco.sm }}>
          {colecoes.map((x) => (
            <ChipTema key={x.nome} rotulo={`${x.nome} · ${Number(x.total).toLocaleString('pt-BR')}`} selecionado={colecao === x.nome} onPress={() => setColecao(colecao === x.nome ? null : x.nome)} />
          ))}
        </ScrollView>
      ) : null}
      {assuntos.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco.sm }}>
          {assuntos.map((x) => (
            <ChipTema key={x.nome} rotulo={x.nome} icone="tag" tom="dourado" selecionado={assunto === x.nome} onPress={() => setAssunto(assunto === x.nome ? null : x.nome)} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  if (q.error && !lista.length) return <Erro erro={q.error} aoTentar={q.refetch} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.fundo }}>
      <ListaPaginada
        cabecalho={cabecalho}
        dados={lista}
        chave={(d) => d.id}
        render={({ item }) => <CardDocumento d={item} />}
        aoAtualizar={() => {
          resumo.refetch();
          q.refetch();
        }}
        atualizando={q.isRefetching}
        aoFim={() => q.hasNextPage && q.fetchNextPage()}
        carregandoMais={q.isFetchingNextPage}
        vazio={q.isLoading ? <SkeletonLista /> : (
          <EstadoVazio
            ilustracao="livro"
            titulo={busca || categoria || assunto ? 'Nada encontrado' : 'O acervo ainda está vazio'}
            descricao={busca || categoria || assunto ? 'Tente outras palavras ou tire algum filtro.' : 'A administração precisa rodar a sincronização do acervo (GitHub Actions › “Ágora — acervo”).'}
          />
        )}
      />
    </View>
  );
}

function CardDocumento({ d }: { d: DocumentoAcervo }) {
  const { c, espaco } = useTema();
  const detalhes = [ROTULO_TIPO_DOCUMENTO[d.tipo], d.colecao ?? d.categoria, tamanho(d.tamanho)].filter(Boolean).join(' · ');
  return (
    <Card plano onPress={() => WebBrowser.openBrowserAsync(linkDocumento(d.id))} rotulo={`${d.titulo}. ${detalhes}. Abre no Google Drive`}>
      <View style={{ flexDirection: 'row', gap: espaco.md, alignItems: 'flex-start' }}>
        <Icone nome={ICONE_TIPO[d.tipo] ?? 'file'} cor={c.primaria} />
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="corpoForte" numberOfLines={3}>{d.titulo}</Texto>
          <Texto variante="legenda" cor="secundario" numberOfLines={2}>{detalhes}</Texto>
          {d.assunto ? <Texto variante="legenda" cor="sutil">{d.assunto}</Texto> : null}
        </View>
        <Icone nome="external-link" tamanho={16} cor={c.textoSutil} />
      </View>
    </Card>
  );
}
