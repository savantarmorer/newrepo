import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { Carregando, Erro } from '@/components/Estados';
import { MarkdownView } from '@/components/MarkdownView';
import { Secao } from '@/components/Secao';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useArtigo, useInvalidarBiblioteca, useRevisoes } from '@/features/biblioteca/hooks';
import { revisar } from '@/features/biblioteca/services';
import type { Revisao } from '@/features/biblioteca/types';
import { textoDoErro } from '@/lib/erros';
import { tempoLeitura } from '@/lib/formatos';
import { toast } from '@/stores/toast';

export default function RevisarArtigo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useArtigo(id);
  const revisoes = useRevisoes(id);
  const invalidar = useInvalidarBiblioteca();
  const [parecer, setParecer] = useState<Revisao['parecer'] | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  if (q.isLoading) return <Carregando />;
  if (!q.data) return <Erro erro={q.error ?? 'Artigo indisponível'} />;
  const { artigo: a, autoria } = q.data;
  const daRodada = (revisoes.data ?? []).filter((r) => r.rodada === a.rodada_revisao);

  return (
    <Tela teclado>
      <Texto variante="titulo">{a.titulo}</Texto>
      <Texto variante="legenda" cor="secundario">
        {autoria.filter((x) => x.papel !== 'revisor').map((x) => x.perfil?.nome_publico).join(', ')} · {tempoLeitura(a.corpo_md)} · rodada {a.rodada_revisao}
      </Texto>
      {a.resumo ? <Texto cor="secundario">{a.resumo}</Texto> : null}
      <Card plano><MarkdownView texto={a.corpo_md} leitura /></Card>
      {daRodada.length ? (
        <Secao titulo="Pareceres desta rodada">
          {daRodada.map((r) => (
            <Card key={r.id} plano><Texto variante="corpoForte">{r.revisor?.nome_publico}: {r.parecer === 'aprovar' ? 'aprovou' : r.parecer === 'recusar' ? 'recusou' : 'pediu mudanças'}</Texto><Texto>{r.comentario}</Texto></Card>
          ))}
        </Secao>
      ) : null}
      {a.status === 'em_revisao' ? (
        <Secao titulo="Seu parecer">
          <Seletor
            opcoes={[{ valor: 'aprovar', rotulo: 'Aprovar' }, { valor: 'pedir_mudancas', rotulo: 'Pedir mudanças' }, { valor: 'recusar', rotulo: 'Recusar' }]}
            valor={parecer}
            aoMudar={(v) => setParecer(v as Revisao['parecer'])}
          />
          <Campo rotulo="Comentário para os autores" value={comentario} onChangeText={setComentario} multiline placeholder="Seja específica(o): o que está bom, o que falta, fontes a conferir." ajuda="Mínimo de 10 caracteres. Fica visível para os autores." />
          <View>
            <Botao
              titulo="Enviar parecer"
              largura="total"
              carregando={enviando}
              desabilitado={!parecer || comentario.trim().length < 10}
              onPress={async () => {
                setEnviando(true);
                try {
                  await revisar({ artigo_id: a.id, parecer: parecer!, comentario: comentario.trim() });
                  invalidar();
                  toast.sucesso('Parecer registrado. Obrigado pela revisão!');
                  router.back();
                } catch (e) {
                  toast.erro(textoDoErro(e));
                } finally {
                  setEnviando(false);
                }
              }}
            />
          </View>
        </Secao>
      ) : <Card plano><Texto>Este artigo não está mais em revisão.</Texto></Card>}
    </Tela>
  );
}
