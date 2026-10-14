import { useEffect, useState } from 'react';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { Carregando } from '@/components/Estados';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useConfiguracoesAdmin } from '@/features/admin/hooks';
import { salvarConfiguracao } from '@/features/admin/services';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';

function EditorConfig({ chave, valor, descricao, aoSalvar }: { chave: string; valor: unknown; descricao: string | null; aoSalvar: () => void }) {
  const [texto, setTexto] = useState(JSON.stringify(valor, null, 2));
  const [erro, setErro] = useState<string | undefined>();
  useEffect(() => setTexto(JSON.stringify(valor, null, 2)), [valor]);
  return (
    <Card plano style={{ gap: 8 }}>
      <Texto variante="corpoForte">{chave}</Texto>
      {descricao ? <Texto variante="legenda" cor="secundario">{descricao}</Texto> : null}
      <Campo rotulo={`Valor de ${chave} (JSON)`} value={texto} onChangeText={(t) => { setTexto(t); setErro(undefined); }} multiline autoCapitalize="none" autoCorrect={false} erro={erro} style={{ fontFamily: undefined, fontSize: 13 }} />
      <Botao titulo="Salvar" compacto onPress={async () => {
        let novo: unknown;
        try {
          novo = JSON.parse(texto);
        } catch {
          return setErro('JSON inválido');
        }
        try {
          await salvarConfiguracao(chave, novo);
          toast.sucesso(`“${chave}” atualizada.`);
          aoSalvar();
        } catch (e) {
          toast.erro(textoDoErro(e));
        }
      }} />
    </Card>
  );
}

export default function AdminConfiguracoes() {
  const q = useConfiguracoesAdmin();
  if (q.isLoading) return <Carregando />;
  return (
    <Tela teclado aoAtualizar={q.refetch} atualizando={q.isRefetching}>
      <Texto cor="secundario">Mudanças valem para novos eventos: pontos já registrados não são recalculados. Mudanças de regimento devem ser aprovadas antes em Assembleia.</Texto>
      {q.data?.map((cfg) => <EditorConfig key={cfg.chave} chave={cfg.chave} valor={cfg.valor} descricao={cfg.descricao} aoSalvar={() => q.refetch()} />)}
    </Tela>
  );
}
