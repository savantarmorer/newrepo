import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { EstadoVazio } from '@/components/EstadoVazio';
import { ItemLista } from '@/components/ItemLista';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useInvalidarAssembleia } from '@/features/assembleia/hooks';
import { useCarteirasPorNome, useConfigOnchain, useMinhaCarteira } from '@/features/carteira/hooks';
import { useCarteiraConectada } from '@/features/carteira/useCarteiraConectada';
import { codificarLiberacaoFundo, proporOnchain } from '@/features/carteira/wallet';
import { useProjetos } from '@/features/mutirao/hooks';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { textoDoErro } from '@/lib/erros';
import { dados, meuId, supabase } from '@/lib/supabase';
import { toast } from '@/stores/toast';

/**
 * Cria uma proposta on-chain do tipo "Liberação do Fundo do Mutirão". O registro do app
 * guarda o debate; a descrição on-chain leva o prefixo [agora:<uuid>] para o indexador ligar os dois.
 */
export default function NovaPropostaOnchain() {
  const { data: perfil } = useMeuPerfil();
  const { data: cfg } = useConfigOnchain();
  const { data: carteira } = useMinhaCarteira();
  const { disponivel, conectar } = useCarteiraConectada();
  const projetos = useProjetos({ status: ['ativo', 'planejamento'] });
  const invalidar = useInvalidarAssembleia();
  const [projeto, setProjeto] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const destinatarios = useCarteirasPorNome(busca);
  const [destino, setDestino] = useState<{ nome: string; endereco: string } | null>(null);
  const [valor, setValor] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (perfil && !podeNivel(perfil, 3)) return <Tela><EstadoVazio ilustracao="urna" titulo="Restrito a Curadores" descricao="Propostas on-chain também exigem nível Curador no app e o limiar de DRC do Governor." /></Tela>;
  if (!disponivel) return <Tela><EstadoVazio ilustracao="urna" titulo="Disponível no app instalado" descricao="Criar propostas on-chain exige a carteira embutida (build EAS com EXPO_PUBLIC_THIRDWEB_CLIENT_ID)." /></Tela>;
  if (!cfg?.governor || !cfg.fundo_mutirao || !cfg.token) return <Tela><EstadoVazio titulo="Contratos não configurados" descricao="Um admin precisa preencher os endereços em Configurações globais → onchain." /></Tela>;

  const projetoSel = projetos.data?.find((p) => p.id === projeto);
  const valorNum = Number(valor.replace(',', '.'));

  async function criar() {
    if (!projetoSel || !destino || !(valorNum > 0) || justificativa.trim().length < 50) return toast.erro('Preencha projeto, destinatário, valor e uma justificativa (mín. 50 caracteres).');
    setEnviando(true);
    try {
      await conectar.mutateAsync({});
      const titulo = `Liberar ${valorNum.toLocaleString('pt-BR')} DRC do Fundo do Mutirão para "${projetoSel.titulo}"`;
      const autor_id = await meuId();
      const registro = await dados<{ id: string }>(
        supabase.from('propostas').insert({ autor_id, titulo, contexto_md: justificativa, proposta_md: `Executar \`FundoMutirao.liberar\` para ${destino.nome} (${destino.endereco}), ${valorNum} DRC, referência projeto:${projetoSel.id}.`, tipo: 'financeira', natureza: 'onchain', status: 'rascunho' }).select('id').single(),
      );
      const wei = BigInt(Math.round(valorNum * 1e6)) * 10n ** 12n;
      const calldata = await codificarLiberacaoFundo(cfg!.fundo_mutirao!, cfg!.token!, destino.endereco, wei, `projeto:${projetoSel.id}`);
      await proporOnchain(cfg!.governor!, [cfg!.fundo_mutirao!], [0n], [calldata], `[agora:${registro.id}] ${titulo}`);
      invalidar();
      toast.sucesso('Proposta enviada à blockchain. O indexador a mostrará em instantes.');
      router.replace(`/assembleia/proposta/${registro.id}`);
    } catch (e) {
      toast.erro(textoDoErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela teclado>
      <Card destaque="dourado" plano>
        <Texto variante="legenda">Propostas on-chain movimentam a tesouraria ou o fundo do Mutirão e são executadas automaticamente pelo Timelock 48h após aprovação. Você precisa ter pelo menos o limiar de DRC do Governor (100 DRC) delegado à sua carteira.</Texto>
      </Card>
      {!carteira ? <Botao titulo="Ativar minha carteira primeiro" onPress={() => router.push('/perfil/carteira')} /> : null}
      <Seletor rotulo="Projeto beneficiado" opcoes={(projetos.data ?? []).map((p) => ({ valor: p.id, rotulo: p.titulo }))} valor={projeto} aoMudar={(v) => setProjeto(v as string)} />
      <Campo rotulo="Destinatário (membro com carteira)" value={busca} onChangeText={setBusca} placeholder="Busque pelo nome" />
      {destino ? <Texto variante="corpoForte">→ {destino.nome}</Texto> : null}
      <View>
        {destinatarios.data?.map((d) => <ItemLista key={d.profile_id} titulo={d.nome_publico} subtitulo={d.endereco} onPress={() => { setDestino({ nome: d.nome_publico, endereco: d.endereco }); setBusca(''); }} />)}
      </View>
      <Campo rotulo="Valor (DRC)" value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
      <Campo rotulo="Justificativa" value={justificativa} onChangeText={setJustificativa} multiline contador={50} />
      <Botao titulo="Assinar e enviar proposta" icone="send" largura="total" carregando={enviando} onPress={criar} />
    </Tela>
  );
}
