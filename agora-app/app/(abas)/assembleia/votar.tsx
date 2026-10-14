import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { Icone, type NomeIcone } from '@/components/Icone';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useInvalidarAssembleia, useProposta } from '@/features/assembleia/hooks';
import { votar } from '@/features/assembleia/services';
import { ROTULO_VOTO, type OpcaoVoto } from '@/features/assembleia/types';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

const OPCOES: { valor: OpcaoVoto; icone: NomeIcone; descricao: string }[] = [
  { valor: 'favor', icone: 'thumbs-up', descricao: 'Concordo com a proposta como está.' },
  { valor: 'contra', icone: 'thumbs-down', descricao: 'Discordo, mas aceito a decisão da maioria.' },
  { valor: 'abstencao', icone: 'minus-circle', descricao: 'Não tenho posição; conta para o quórum, não para o resultado.' },
  { valor: 'bloqueio', icone: 'octagon', descricao: 'Objeção grave de princípio. 3 bloqueios devolvem a proposta ao debate.' },
];

export default function Votar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, raio, espaco } = useTema();
  const q = useProposta(id);
  const invalidar = useInvalidarAssembleia();
  const [voto, setVoto] = useState<OpcaoVoto | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    if (q.data?.meuVoto) {
      setVoto(q.data.meuVoto.voto);
      setJustificativa(q.data.meuVoto.justificativa ?? '');
    }
  }, [q.data?.meuVoto]);
  const p = q.data?.proposta;
  const bloqueioInvalido = voto === 'bloqueio' && justificativa.trim().length < 200;

  return (
    <Tela teclado>
      <Texto variante="subtitulo">{p?.titulo}</Texto>
      <View style={{ gap: espaco.sm }} accessibilityRole="radiogroup">
        {OPCOES.map((o) => {
          const ativo = voto === o.valor;
          const cor = o.valor === 'bloqueio' ? c.perigo : o.valor === 'favor' ? c.secundaria : c.textoSecundario;
          return (
            <Pressable key={o.valor} accessibilityRole="radio" accessibilityState={{ checked: ativo }} accessibilityLabel={`${ROTULO_VOTO[o.valor]}. ${o.descricao}`} onPress={() => setVoto(o.valor)}
              style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: espaco.md, minHeight: 60, borderRadius: raio.md, borderWidth: ativo ? 2 : 1, borderColor: ativo ? cor : c.borda, backgroundColor: ativo ? c.superficieElevada : c.superficie }}>
              <Icone nome={o.icone} cor={cor} />
              <View style={{ flex: 1 }}>
                <Texto variante="corpoForte">{ROTULO_VOTO[o.valor]}</Texto>
                <Texto variante="legenda" cor="secundario">{o.descricao}</Texto>
              </View>
            </Pressable>
          );
        })}
      </View>
      {voto === 'bloqueio' ? (
        <>
          <Card destaque="perigo" plano><Texto variante="legenda">O bloqueio é público e aparece em destaque na proposta. Explique o problema de princípio e, se possível, o que tornaria a proposta aceitável.</Texto></Card>
          <Campo rotulo="Justificativa do bloqueio" value={justificativa} onChangeText={setJustificativa} multiline contador={200} erro={bloqueioInvalido && justificativa.length > 0 ? `Faltam ${200 - justificativa.trim().length} caracteres` : undefined} />
        </>
      ) : voto === 'contra' ? (
        <Campo rotulo="Justificativa (opcional)" value={justificativa} onChangeText={setJustificativa} multiline />
      ) : null}
      <Botao
        titulo={q.data?.meuVoto ? 'Atualizar voto' : 'Confirmar voto'}
        largura="total"
        carregando={enviando}
        desabilitado={!voto || bloqueioInvalido}
        onPress={async () => {
          if (!voto || !p) return;
          setEnviando(true);
          try {
            await votar(p.id, p.rodada, voto, justificativa);
            invalidar();
            toast.sucesso('Voto registrado. Você pode mudá-lo até o fim da votação.');
            router.back();
          } catch (e) {
            toast.erro(textoDoErro(e));
          } finally {
            setEnviando(false);
          }
        }}
      />
      <Texto variante="legenda" cor="sutil" centro>Votos são nominais e ficam visíveis a todos os membros depois do encerramento.</Texto>
    </Tela>
  );
}
