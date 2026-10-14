import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';
import { BarraProgresso } from '@/components/BarraProgresso';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { Icone } from '@/components/Icone';
import { Texto } from '@/components/Texto';
import { formatarEvento, formatarMoeda } from '@/lib/formatos';
import { useTema } from '@/theme/ThemeProvider';
import { ROTULO_STATUS_PROJETO, type Evento, type Projeto, type Tarefa } from './types';

export function MetaFinanceira({ p }: { p: Projeto }) {
  const { c } = useTema();
  if (!p.meta_financeira) return null;
  const arrecadado = Number(p.resumo?.total_entradas ?? 0);
  const pct = arrecadado / Number(p.meta_financeira);
  return (
    <View style={{ gap: 4 }}>
      <BarraProgresso valor={pct} cor={c.dourado} rotulo={`Arrecadado ${formatarMoeda(arrecadado)} de ${formatarMoeda(p.meta_financeira)}`} />
      <Texto variante="legenda" cor="secundario">
        {formatarMoeda(arrecadado)} de {formatarMoeda(p.meta_financeira)} · {Math.min(999, Math.round(pct * 100))}%
      </Texto>
    </View>
  );
}

export function CardProjeto({ p }: { p: Projeto }) {
  const { raio } = useTema();
  return (
    <Card onPress={() => router.push(`/mutirao/projeto/${p.id}`)} rotulo={`Projeto ${p.titulo}`} plano>
      {p.capa_url ? <Image source={{ uri: p.capa_url }} style={{ height: 120, borderRadius: raio.md, marginBottom: 10 }} contentFit="cover" accessibilityLabel="" /> : null}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <ChipTema rotulo={p.causa} tom="secundaria" />
        {p.nucleo ? <ChipTema rotulo={`${p.nucleo.cidade} · ${p.nucleo.estado}`} icone="map-pin" /> : <ChipTema rotulo="Nacional" icone="globe" />}
        {p.status !== 'ativo' ? <ChipTema rotulo={ROTULO_STATUS_PROJETO[p.status]} tom="dourado" /> : null}
      </View>
      <Texto variante="subtitulo" style={{ fontSize: 21, lineHeight: 26 }}>{p.titulo}</Texto>
      <View style={{ marginTop: 8 }}><MetaFinanceira p={p} /></View>
    </Card>
  );
}

export function CardEvento({ e }: { e: Evento }) {
  const { c, raio } = useTema();
  const d = new Date(e.inicio);
  const passado = new Date(e.fim) < new Date();
  return (
    <Card onPress={() => router.push(`/mutirao/evento/${e.id}`)} rotulo={`Evento ${e.titulo}, ${formatarEvento(e.inicio)}`} plano>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', opacity: passado ? 0.7 : 1 }}>
        <View style={{ width: 54, paddingVertical: 6, borderRadius: raio.md, backgroundColor: c.primariaSuave, alignItems: 'center' }}>
          <Texto variante="numero" cor="primaria" style={{ fontSize: 24, lineHeight: 26 }}>{d.getDate()}</Texto>
          <Texto variante="legenda" cor="primaria">{d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</Texto>
        </View>
        <View style={{ flex: 1 }}>
          <Texto variante="corpoForte" numberOfLines={2}>{e.titulo}</Texto>
          <Texto variante="legenda" cor="secundario">{formatarEvento(e.inicio)}{e.local_nome ? ` · ${e.local_nome}` : ''}</Texto>
          {e.projeto ? <Texto variante="legenda" cor="sutil">{e.projeto.titulo}</Texto> : null}
        </View>
        <Icone nome="chevron-right" cor={c.textoSutil} />
      </View>
    </Card>
  );
}

export function CardTarefa({ t, mostrarProjeto }: { t: Tarefa; mostrarProjeto?: boolean }) {
  const { c } = useTema();
  const atrasada = t.prazo && t.status !== 'feito' && new Date(`${t.prazo}T23:59:59`) < new Date();
  return (
    <Card onPress={() => router.push(`/mutirao/tarefa/${t.id}`)} rotulo={`Tarefa ${t.titulo}`} plano style={{ padding: 12 }}>
      <Texto variante="corpoForte" numberOfLines={2}>{t.titulo}</Texto>
      {mostrarProjeto && t.projeto ? <Texto variante="legenda" cor="secundario">{t.projeto.titulo}</Texto> : null}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {t.responsavel ? <Texto variante="legenda" cor="secundario">👤 {t.responsavel.nome_publico}</Texto> : <Texto variante="legenda" cor="primaria">Livre — assuma!</Texto>}
        {t.prazo ? (
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Icone nome="calendar" tamanho={12} cor={atrasada ? c.perigo : c.textoSutil} />
            <Texto variante="legenda" cor={atrasada ? 'perigo' : 'sutil'}>{new Date(`${t.prazo}T12:00:00`).toLocaleDateString('pt-BR')}</Texto>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
