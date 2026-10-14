import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Segmentos } from '@/components/Segmentos';
import { SkeletonLista } from '@/components/Skeleton';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { conteudoOriginal, filaDenuncias, resolverDenuncia, ROTULO_ITEM, rotaDoItem, type AcaoModeracao, type Denuncia } from '@/features/moderacao/services';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { textoDoErro } from '@/lib/erros';
import { tempoRelativo } from '@/lib/formatos';
import { toast } from '@/stores/toast';

function CardDenuncia({ d, aoResolver, admin }: { d: Denuncia & { denunciante?: { nome_publico: string } }; aoResolver: () => void; admin: boolean }) {
  const [acao, setAcao] = useState<AcaoModeracao | null>(null);
  const [motivo, setMotivo] = useState('');
  const [dias, setDias] = useState('7');
  const original = useQuery({ queryKey: ['moderacao', 'original', d.item_id], queryFn: () => conteudoOriginal(d.tipo_item, d.item_id), enabled: admin && d.status !== 'aberta' });
  const rota = rotaDoItem(d.tipo_item, d.item_id);
  return (
    <Card plano destaque={d.status === 'aberta' ? 'dourado' : undefined}>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <ChipTema rotulo={ROTULO_ITEM[d.tipo_item]} />
        <Texto variante="legenda" cor="sutil">{tempoRelativo(d.created_at)}</Texto>
      </View>
      <Texto style={{ marginTop: 6 }}>“{d.motivo}”</Texto>
      {rota ? <Texto variante="legenda" cor="primaria" onPress={() => router.push(rota as never)}>Ver o conteúdo denunciado ›</Texto> : null}
      {d.resolucao ? <Texto variante="legenda" cor="secundario">Resolução: {d.resolucao}</Texto> : null}
      {original.data ? <Card plano style={{ marginTop: 6 }}><Texto variante="legenda" cor="sutil">Texto original (visível só para admins, para recurso):</Texto><Texto>{original.data.corpo_original}</Texto></Card> : null}
      {d.status === 'aberta' ? (
        <View style={{ gap: 8, marginTop: 10 }}>
          <Seletor opcoes={[{ valor: 'manter', rotulo: 'Manter' }, { valor: 'ocultar', rotulo: 'Ocultar' }, { valor: 'advertir', rotulo: 'Advertir autor' }, { valor: 'suspender', rotulo: 'Suspender autor' }, { valor: 'descartar', rotulo: 'Descartar denúncia' }]} valor={acao} aoMudar={(v) => setAcao(v as AcaoModeracao)} />
          {acao === 'suspender' ? <Campo rotulo="Dias de suspensão" value={dias} onChangeText={setDias} keyboardType="number-pad" /> : null}
          <Campo rotulo="Motivo (vai para o log público)" value={motivo} onChangeText={setMotivo} multiline />
          <Botao titulo="Registrar decisão" compacto desabilitado={!acao || motivo.trim().length < 10} onPress={async () => {
            try {
              await resolverDenuncia(d.id, acao!, motivo.trim(), acao === 'suspender' ? Number(dias) : undefined);
              toast.sucesso('Decisão registrada no log público.');
              aoResolver();
            } catch (e) {
              toast.erro(textoDoErro(e));
            }
          }} />
        </View>
      ) : null}
    </Card>
  );
}

export default function Denuncias() {
  const { data: perfil } = useMeuPerfil();
  const [status, setStatus] = useState<'aberta' | 'resolvida'>('aberta');
  const q = useQuery({ queryKey: ['moderacao', 'fila', status], queryFn: () => filaDenuncias(status) });
  return (
    <Tela aoAtualizar={q.refetch} atualizando={q.isRefetching}>
      <Texto cor="secundario">Moderadores (Guardiões e admins) decidem com motivo registrado no log público. Ninguém modera o próprio conteúdo. Ocultar um conteúdo custa 20 pontos ao autor.</Texto>
      <Segmentos opcoes={[{ valor: 'aberta', rotulo: 'Abertas' }, { valor: 'resolvida', rotulo: 'Resolvidas' }]} valor={status} aoMudar={(v) => setStatus(v as 'aberta' | 'resolvida')} />
      {q.isLoading ? <SkeletonLista /> : q.data?.length ? q.data.map((d) => <CardDenuncia key={d.id} d={d} admin={perfil?.papel === 'admin'} aoResolver={() => q.refetch()} />) : (
        <EstadoVazio titulo={status === 'aberta' ? 'Nenhuma denúncia aberta' : 'Nada resolvido ainda'} descricao="Praça tranquila." />
      )}
    </Tela>
  );
}
