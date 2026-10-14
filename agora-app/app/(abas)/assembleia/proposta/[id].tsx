import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { abrirDenuncia } from '@/components/BarraAcoes';
import { BarraProgresso } from '@/components/BarraProgresso';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { Contagem } from '@/components/Contagem';
import { Carregando, Erro } from '@/components/Estados';
import { Icone } from '@/components/Icone';
import { LinhaDoTempo } from '@/components/LinhaDoTempo';
import { MarkdownView } from '@/components/MarkdownView';
import { Secao } from '@/components/Secao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { ChipNatureza, etapasProposta } from '@/features/assembleia/componentes';
import { useComentarios, useInvalidarAssembleia, usePodeVotar, useProposta, usePropostaOnchainDoApp } from '@/features/assembleia/hooks';
import { comentar, retirarProposta } from '@/features/assembleia/services';
import { ROTULO_TIPO, ROTULO_VOTO, type Comentario } from '@/features/assembleia/types';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { textoDoErro } from '@/lib/erros';
import { formatarDataHora, tempoRelativo } from '@/lib/formatos';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

function ItemComentario({ c: com, aoResponder, nivel = 0 }: { c: Comentario; aoResponder: (c: Comentario) => void; nivel?: number }) {
  const { c } = useTema();
  return (
    <View style={{ marginLeft: nivel ? 20 : 0, borderLeftWidth: nivel ? 2 : 0, borderLeftColor: c.borda, paddingLeft: nivel ? 12 : 0, gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Avatar nome={com.autor?.nome_publico} url={com.autor?.avatar_url} tamanho={26} />
        <Texto variante="rotulo">{com.autor?.nome_publico}</Texto>
        <Texto variante="legenda" cor="sutil">· {tempoRelativo(com.created_at)}{com.editado_em ? ' · editado' : ''}</Texto>
      </View>
      {com.oculto ? <Texto cor="sutil">Conteúdo removido pela moderação.</Texto> : <MarkdownView texto={com.corpo_md} />}
      {!com.oculto ? (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {nivel === 0 ? <Botao titulo="Responder" compacto variante="fantasma" onPress={() => aoResponder(com)} /> : null}
          <Botao titulo="Denunciar" compacto variante="fantasma" onPress={() => abrirDenuncia('proposta_comentario', com.id)} />
        </View>
      ) : null}
      {com.filhos?.map((f) => <ItemComentario key={f.id} c={f} aoResponder={aoResponder} nivel={1} />)}
    </View>
  );
}

export default function TelaProposta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, espaco, raio } = useTema();
  const { data: perfil } = useMeuPerfil();
  const q = useProposta(id);
  const comentarios = useComentarios(id);
  const pode = usePodeVotar(id);
  const onchain = usePropostaOnchainDoApp(q.data?.proposta.natureza === 'onchain' ? id : undefined);
  const invalidar = useInvalidarAssembleia();
  const [texto, setTexto] = useState('');
  const [respondendo, setRespondendo] = useState<Comentario | null>(null);

  if (q.isLoading) return <Carregando />;
  if (!q.data) return <Erro erro={q.error ?? 'Proposta não encontrada'} aoTentar={q.refetch} />;
  const { proposta: p, placar, meuVoto, bloqueios, votosNominais, decisoes } = q.data;
  const souAutor = p.autor_id === perfil?.id;
  const abertaComentarios = p.status === 'debate' || p.status === 'votacao';
  const participacao = placar && p.membros_aptos ? placar.total / p.membros_aptos : 0;

  return (
    <Tela
      teclado
      aoAtualizar={() => { q.refetch(); comentarios.refetch(); }}
      atualizando={q.isRefetching}
      rodape={abertaComentarios ? (
        <View style={{ borderTopWidth: 1, borderTopColor: c.borda, backgroundColor: c.superficie, padding: espaco.md, gap: 6 }}>
          {respondendo ? <Texto variante="legenda" cor="secundario" onPress={() => setRespondendo(null)}>Respondendo a {respondendo.autor?.nome_publico} (toque para cancelar)</Texto> : null}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <TextInput value={texto} onChangeText={setTexto} multiline placeholder="Comente com argumentos" placeholderTextColor={c.textoSutil} accessibilityLabel="Seu comentário"
              style={{ flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderColor: c.bordaForte, borderRadius: raio.md, paddingHorizontal: 12, paddingVertical: 10, color: c.texto, backgroundColor: c.superficieElevada }} />
            <Botao titulo="Enviar" compacto desabilitado={texto.trim().length < 2} onPress={async () => {
              try {
                await comentar(p.id, texto.trim(), respondendo?.id);
                setTexto('');
                setRespondendo(null);
                comentarios.refetch();
              } catch (e) {
                toast.erro(textoDoErro(e));
              }
            }} />
          </View>
        </View>
      ) : null}
    >
      <Stack.Screen options={{ title: 'Proposta' }} />
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <ChipNatureza natureza={p.natureza} />
          <ChipTema rotulo={ROTULO_TIPO[p.tipo]} />
          {p.escopo ? <ChipTema rotulo={`Núcleo ${p.escopo.cidade}`} icone="map-pin" /> : <ChipTema rotulo="Escopo geral" icone="globe" />}
        </View>
        <Texto variante="titulo">{p.titulo}</Texto>
        <Pressable accessibilityRole="link" onPress={() => router.push(`/perfil/membro/${p.autor_id}`)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Avatar nome={p.autor?.nome_publico} url={p.autor?.avatar_url} tamanho={28} />
          <Texto variante="legenda" cor="secundario">Proposta de {p.autor?.nome_publico} · {formatarDataHora(p.created_at)}</Texto>
        </Pressable>
      </View>

      {p.natureza === 'onchain' ? (
        <Card destaque="dourado" plano>
          <Texto variante="corpoForte">Votação on-chain</Texto>
          <Texto variante="legenda" cor="secundario">O voto acontece no contrato AgoraGovernor, com poder de voto em DRC e execução automática pelo Timelock.</Texto>
          {onchain.data ? <Botao titulo="Abrir votação on-chain" icone="link" compacto style={{ marginTop: 8 }} onPress={() => router.push(`/assembleia/onchain/${onchain.data!.proposal_id}`)} /> : <Texto variante="legenda" cor="sutil" style={{ marginTop: 6 }}>Aguardando o indexador registrar a proposta na blockchain…</Texto>}
        </Card>
      ) : null}

      <Card plano>
        <LinhaDoTempo etapas={etapasProposta(p)} />
        {p.status === 'debate' ? <Contagem ate={p.debate_ate} prefixo="Votação abre em " variante="corpoForte" cor="primaria" /> : null}
        {p.status === 'votacao' ? <Contagem ate={p.votacao_ate} prefixo="Votação encerra em " variante="corpoForte" cor="primaria" /> : null}
      </Card>

      <Secao titulo="Contexto"><MarkdownView texto={p.contexto_md || '_Sem contexto._'} /></Secao>
      <Secao titulo="Proposta"><Card plano destaque="secundaria"><MarkdownView texto={p.proposta_md} leitura /></Card></Secao>

      {p.natureza === 'comunitaria' && (p.status === 'votacao' || placar?.encerrada) && placar ? (
        <Secao titulo="Participação">
          <BarraProgresso valor={participacao} rotulo={`${placar.total} votos de ${p.membros_aptos ?? '?'} membros aptos`} cor={placar.total >= placar.quorum_exigido ? c.secundaria : c.dourado} altura={10} />
          <Texto variante="legenda" cor="secundario">
            {placar.total} votos · quórum: {placar.quorum_exigido} ({Math.round(Number(p.quorum_minimo) * 100)}% dos aptos) · aprovação exige {Math.round(Number(p.limiar_aprovacao) * 100)}% dos votos válidos e menos de 3 bloqueios
          </Texto>
          {placar.encerrada ? (
            <Texto variante="corpoForte">A favor {placar.favor} · Contra {placar.contra} · Abstenções {placar.abstencao} · Bloqueios {placar.bloqueio}</Texto>
          ) : <Texto variante="legenda" cor="sutil">O placar detalhado aparece quando a votação encerra.</Texto>}
        </Secao>
      ) : null}

      {bloqueios.length ? (
        <Secao titulo={`Bloqueios (${bloqueios.length}/3)`}>
          {bloqueios.map((b) => (
            <Card key={b.profile_id} destaque="perigo" plano>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Icone nome="octagon" cor={c.perigo} tamanho={16} />
                <Texto variante="corpoForte">{b.perfil?.nome_publico}</Texto>
              </View>
              <Texto style={{ marginTop: 6 }}>{b.justificativa}</Texto>
            </Card>
          ))}
        </Secao>
      ) : null}

      {p.natureza === 'comunitaria' && p.status === 'votacao' ? (
        pode.data ? (
          <Card plano destaque={meuVoto ? 'secundaria' : 'primaria'}>
            <Texto variante="corpoForte">{meuVoto ? `Seu voto: ${ROTULO_VOTO[meuVoto.voto]}` : 'Você ainda não votou'}</Texto>
            <Texto variante="legenda" cor="secundario">1 pessoa = 1 voto. Você pode mudar até o fim da votação.</Texto>
            <Botao titulo={meuVoto ? 'Mudar meu voto' : 'Votar'} icone="check-square" style={{ marginTop: 8 }} onPress={() => router.push({ pathname: '/assembleia/votar', params: { id: p.id } })} />
          </Card>
        ) : <Card plano><Texto variante="legenda" cor="secundario">Esta votação é para membros ativos do escopo da proposta.</Texto></Card>
      ) : null}

      {decisoes.length ? (
        <Secao titulo="Registro de decisões">
          {decisoes.map((d) => (
            <Card key={d.id} plano destaque={d.resultado === 'aprovada' ? 'secundaria' : d.resultado === 'bloqueada' ? 'perigo' : undefined}>
              <Texto variante="legenda" cor="secundario">Rodada {d.rodada} · {formatarDataHora(d.registrada_em)}</Texto>
              <MarkdownView texto={d.resumo_md} />
              <Texto variante="legenda">Placar: {d.votos_favor} a favor · {d.votos_contra} contra · {d.abstencoes} abstenções · {d.bloqueios} bloqueios · quórum {d.quorum_atingido ? 'atingido' : 'não atingido'} ({d.total_votos}/{d.quorum_exigido})</Texto>
            </Card>
          ))}
        </Secao>
      ) : null}

      {votosNominais.length ? (
        <Secao titulo="Votos nominais">
          {votosNominais.map((v) => (
            <View key={`${v.profile_id}-${v.rodada}`} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 36 }}>
              <Texto style={{ flex: 1 }}>{v.perfil?.nome_publico}{v.rodada < p.rodada ? ` (rodada ${v.rodada})` : ''}</Texto>
              <ChipTema rotulo={ROTULO_VOTO[v.voto]} tom={v.voto === 'favor' ? 'secundaria' : v.voto === 'bloqueio' ? 'primaria' : 'neutro'} />
            </View>
          ))}
        </Secao>
      ) : null}

      {souAutor && (p.status === 'rascunho' || p.status === 'debate') ? (
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {p.status === 'rascunho' ? <Botao titulo="Editar e abrir debate" icone="edit-2" onPress={() => router.push({ pathname: '/assembleia/proposta/nova', params: { id: p.id } })} /> : null}
          <Botao titulo="Retirar proposta" variante="fantasma" onPress={() => Alert.alert('Retirar a proposta?', 'Ela sai do debate e fica registrada como retirada.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Retirar', style: 'destructive', onPress: () => retirarProposta(p.id).then(() => { invalidar(); }).catch((e) => toast.erro(textoDoErro(e))) },
          ])} />
        </View>
      ) : null}

      <Secao titulo={`Comentários (${comentarios.data?.length ?? 0})`}>
        {comentarios.data?.length ? comentarios.data.map((cm) => <ItemComentario key={cm.id} c={cm} aoResponder={setRespondendo} />) : <Texto cor="sutil">{abertaComentarios ? 'Nenhum comentário ainda. O debate é o coração da Assembleia.' : 'Comentários fechados.'}</Texto>}
      </Secao>
      {!souAutor ? <Botao titulo="Denunciar proposta" variante="fantasma" compacto onPress={() => abrirDenuncia('proposta', p.id)} /> : null}
    </Tela>
  );
}
