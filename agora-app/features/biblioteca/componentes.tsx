import { router } from 'expo-router';
import { View } from 'react-native';
import { BarraProgresso } from '@/components/BarraProgresso';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { Icone } from '@/components/Icone';
import { Texto } from '@/components/Texto';
import { plural, tempoLeitura, tempoRelativo } from '@/lib/formatos';
import { useTema } from '@/theme/ThemeProvider';
import { ROTULO_DIFICULDADE, ROTULO_STATUS_ARTIGO, type Artigo, type Topico, type Trilha } from './types';

export function CardTopico({ t }: { t: Topico }) {
  const { c } = useTema();
  const respostas = t.respostas?.[0]?.count ?? 0;
  return (
    <Card onPress={() => router.push(`/biblioteca/topico/${t.id}`)} rotulo={`Tópico: ${t.titulo}`} plano>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
        {t.fixado ? <ChipTema rotulo="Fixado" icone="map-pin" tom="dourado" /> : null}
        {t.tema ? <ChipTema rotulo={t.tema.nome} /> : null}
        {t.status === 'resolvido' ? <ChipTema rotulo="Resolvido" icone="check" tom="secundaria" /> : null}
        {t.trancado ? <Icone nome="lock" tamanho={14} cor={c.textoSutil} /> : null}
      </View>
      <Texto variante="corpoForte" numberOfLines={2}>{t.titulo}</Texto>
      <Texto variante="legenda" cor="secundario" style={{ marginTop: 4 }}>
        {t.autor?.nome_publico ?? 'Membro'} · {plural(respostas, 'resposta')} · ativo {tempoRelativo(t.ultima_atividade_em)}
      </Texto>
    </Card>
  );
}

export function CardArtigo({ a, compacto }: { a: Artigo; compacto?: boolean }) {
  return (
    <Card onPress={() => router.push(`/biblioteca/artigo/${a.id}`)} rotulo={`Artigo: ${a.titulo}`} plano>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        {a.tema ? <ChipTema rotulo={a.tema.nome} tom="secundaria" /> : null}
        {a.status !== 'publicado' ? <ChipTema rotulo={ROTULO_STATUS_ARTIGO[a.status]} tom={a.status === 'recusado' ? 'primaria' : 'dourado'} /> : null}
      </View>
      <Texto variante="subtitulo" numberOfLines={2} style={{ fontSize: 21, lineHeight: 26 }}>{a.titulo}</Texto>
      {!compacto && a.resumo ? <Texto cor="secundario" numberOfLines={2} style={{ marginTop: 4 }}>{a.resumo}</Texto> : null}
      <Texto variante="legenda" cor="sutil" style={{ marginTop: 6 }}>
        {a.corpo_md ? tempoLeitura(a.corpo_md) : ''}{a.publicado_em ? ` · publicado ${tempoRelativo(a.publicado_em)}` : ''}
      </Texto>
    </Card>
  );
}

export function CardTrilha({ t, feitos, total }: { t: Trilha; feitos?: number; total?: number }) {
  const { c } = useTema();
  const n = total ?? t.trilha_itens?.[0]?.count ?? 0;
  return (
    <Card onPress={() => router.push(`/biblioteca/trilha/${t.id}`)} rotulo={`Trilha: ${t.titulo}`} destaque={t.destaque ? 'dourado' : undefined} plano>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <Icone nome="map" tamanho={16} cor={c.douradoTexto} />
        <Texto variante="legenda" cor="dourado">{ROTULO_DIFICULDADE[t.nivel_dificuldade]} · {plural(n, 'artigo')}</Texto>
      </View>
      <Texto variante="subtitulo" style={{ fontSize: 21, lineHeight: 26 }}>{t.titulo}</Texto>
      {t.descricao ? <Texto cor="secundario" numberOfLines={2} style={{ marginTop: 4 }}>{t.descricao}</Texto> : null}
      {feitos !== undefined && n > 0 ? (
        <View style={{ marginTop: 10, gap: 4 }}>
          <BarraProgresso valor={feitos / n} rotulo={`${feitos} de ${n} artigos lidos`} />
          <Texto variante="legenda" cor="secundario">{feitos} de {n} lidos</Texto>
        </View>
      ) : null}
    </Card>
  );
}
