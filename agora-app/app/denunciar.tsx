import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { denunciar, ROTULO_ITEM, type TipoItem } from '@/features/moderacao/services';
import { MOTIVOS_DENUNCIA } from '@/lib/constantes';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';

export default function Denunciar() {
  const { tipo, id } = useLocalSearchParams<{ tipo: TipoItem; id: string }>();
  const [categoria, setCategoria] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState('');
  const [enviando, setEnviando] = useState(false);
  const motivo = [categoria, detalhe.trim()].filter(Boolean).join(': ');
  return (
    <Tela teclado>
      <Texto cor="secundario">Denunciando: {ROTULO_ITEM[tipo] ?? 'conteúdo'}. Sua identidade não aparece para quem foi denunciado nem no log público.</Texto>
      <Seletor rotulo="Motivo" opcoes={MOTIVOS_DENUNCIA.map((m) => ({ valor: m, rotulo: m }))} valor={categoria} aoMudar={(v) => setCategoria(v as string)} />
      <Campo rotulo="Detalhes" value={detalhe} onChangeText={setDetalhe} multiline placeholder="Ajude a moderação a entender o problema." />
      <Botao titulo="Enviar denúncia" icone="flag" largura="total" carregando={enviando} desabilitado={motivo.length < 10} onPress={async () => {
        setEnviando(true);
        try {
          await denunciar(tipo, id, motivo);
          toast.sucesso('Denúncia enviada. Obrigado por cuidar da praça.');
          router.back();
        } catch (e) {
          toast.erro(textoDoErro(e));
        } finally {
          setEnviando(false);
        }
      }} />
    </Tela>
  );
}
