import { router } from 'expo-router';
import { View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { BadgeNivel } from '@/components/BadgeNivel';
import { BarraProgresso } from '@/components/BarraProgresso';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { Icone } from '@/components/Icone';
import { ItemLista } from '@/components/ItemLista';
import { Secao } from '@/components/Secao';
import { Texto } from '@/components/Texto';
import { NOMES_NIVEIS } from '@/lib/constantes';
import { formatarData, formatarNumero, plural } from '@/lib/formatos';
import { useTema } from '@/theme/ThemeProvider';
import { useLimiaresNiveis } from '../reputacao/hooks';
import { progressoNivel } from '../reputacao/services';
import { useContribuicoes, useTrilhasConcluidas } from './hooks';

export function CabecalhoPerfil({
  nome, avatar, cidade, estado, nucleo, nivel, reputacao, sbtNivel, papel,
}: { nome: string; avatar?: string | null; cidade?: string | null; estado?: string | null; nucleo?: string | null; nivel: number; reputacao: number; sbtNivel?: number | null; papel?: string }) {
  const { c, espaco } = useTema();
  const { data: limiares } = useLimiaresNiveis();
  const prog = limiares ? progressoNivel(reputacao, nivel, limiares) : null;
  return (
    <View style={{ alignItems: 'center', gap: espaco.sm }}>
      <Avatar nome={nome} url={avatar} tamanho={88} />
      <Texto variante="titulo" centro>{nome}</Texto>
      {cidade ? <Texto variante="legenda" cor="secundario">{cidade}{estado ? ` · ${estado}` : ''}{nucleo ? ` · núcleo ${nucleo}` : ''}</Texto> : null}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <BadgeNivel nivel={nivel} />
        {papel === 'admin' ? <ChipTema rotulo="Administração" icone="shield" tom="primaria" /> : papel === 'coordenador' ? <ChipTema rotulo="Coordenação de núcleo" icone="map-pin" tom="secundaria" /> : null}
        {sbtNivel ? <ChipTema rotulo={`Selo on-chain · ${NOMES_NIVEIS[sbtNivel]}`} icone="hexagon" tom="dourado" /> : null}
      </View>
      {prog ? (
        <Card plano style={{ alignSelf: 'stretch', gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Texto variante="legenda" cor="secundario">{formatarNumero(reputacao)} pontos de contribuição</Texto>
            {prog.proximo ? <Texto variante="legenda" cor="secundario">faltam {formatarNumero(prog.faltam)} para {NOMES_NIVEIS[prog.proximo]}</Texto> : <Texto variante="legenda" cor="dourado">nível máximo</Texto>}
          </View>
          <BarraProgresso valor={prog.pct} cor={c.niveis[Math.min(4, Math.max(1, nivel)) as 1 | 2 | 3 | 4]} rotulo="Progresso até o próximo nível" />
        </Card>
      ) : null}
    </View>
  );
}

/** Histórico de contribuições (não é ranking) */
export function Contribuicoes({ profileId }: { profileId: string }) {
  const { c } = useTema();
  const { data } = useContribuicoes(profileId);
  const trilhas = useTrilhasConcluidas(profileId);
  if (!data) return null;
  const numeros = [
    { icone: 'file-text' as const, rotulo: plural(data.artigos.filter((a) => a.status === 'publicado').length, 'artigo publicado', 'artigos publicados') },
    { icone: 'check-square' as const, rotulo: plural(data.revisoes, 'revisão', 'revisões') },
    { icone: 'map' as const, rotulo: plural(data.trilhas.filter((t) => t.publicada).length, 'trilha curada', 'trilhas curadas') },
    { icone: 'clock' as const, rotulo: `${formatarNumero(data.horasConfirmadas)}h de voluntariado confirmadas` },
    { icone: 'heart' as const, rotulo: plural(data.projetos.length, 'projeto', 'projetos') },
    { icone: 'calendar' as const, rotulo: plural(data.presencas, 'presença em evento', 'presenças em eventos') },
    { icone: 'users' as const, rotulo: plural(data.propostas.length, 'proposta', 'propostas') },
  ];
  return (
    <>
      <Secao titulo="Contribuições">
        <Card plano style={{ gap: 10 }}>
          {numeros.map((n) => (
            <View key={n.rotulo} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Icone nome={n.icone} tamanho={18} cor={c.secundaria} />
              <Texto>{n.rotulo}</Texto>
            </View>
          ))}
        </Card>
        {data.artigos.filter((a) => a.status === 'publicado').slice(0, 5).map((a) => (
          <ItemLista key={a.id} icone="file-text" titulo={a.titulo} subtitulo={`${a.papel === 'coautor' ? 'Coautoria' : 'Autoria'} · ${formatarData(a.publicado_em)}`} onPress={() => router.push(`/biblioteca/artigo/${a.id}`)} />
        ))}
        {data.projetos.slice(0, 5).map((p) => (
          <ItemLista key={p.id} icone="heart" titulo={p.titulo} subtitulo={p.papel === 'coordenador' ? 'Coordenação' : 'Voluntariado'} onPress={() => router.push(`/mutirao/projeto/${p.id}`)} />
        ))}
      </Secao>
      {trilhas.data?.length ? (
        <Secao titulo="Trilhas concluídas">
          {trilhas.data.map((t) => (
            <Card key={t.trilha_id} plano destaque="dourado" onPress={() => router.push(`/biblioteca/trilha/${t.trilha_id}`)} rotulo={`Certificado: ${t.trilha?.titulo}`}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Icone nome="award" cor={c.douradoTexto} />
                <View style={{ flex: 1 }}>
                  <Texto variante="corpoForte">{t.trilha?.titulo}</Texto>
                  <Texto variante="legenda" cor="secundario">Concluída em {formatarData(t.concluida_em)}</Texto>
                </View>
              </View>
            </Card>
          ))}
        </Secao>
      ) : null}
    </>
  );
}
