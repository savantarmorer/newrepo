import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Icone } from '@/components/Icone';
import { MarkdownView } from '@/components/MarkdownView';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useAtualizarPerfil } from '@/features/perfil/hooks';
import { CODIGO_DE_CONDUTA, VERSAO_CODIGO } from '@/lib/codigoConduta';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

export default function OnboardingConduta() {
  const { c } = useTema();
  const [concordo, setConcordo] = useState(false);
  const atualizar = useAtualizarPerfil();
  return (
    <Tela>
      <Texto variante="titulo">Código de Conduta</Texto>
      <Texto variante="legenda" cor="sutil">Versão {VERSAO_CODIGO} · leitura obrigatória</Texto>
      <MarkdownView texto={CODIGO_DE_CONDUTA} leitura />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: concordo }}
        onPress={() => setConcordo(!concordo)}
        style={{ flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 48 }}
      >
        <View style={{ width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: c.secundaria, backgroundColor: concordo ? c.secundaria : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {concordo ? <Icone nome="check" tamanho={16} cor={c.textoSobreSecundaria} /> : null}
        </View>
        <Texto style={{ flex: 1 }}>Li e me comprometo a seguir o Código de Conduta da Ágora.</Texto>
      </Pressable>
      <Botao
        titulo="Aceitar e entrar"
        largura="total"
        desabilitado={!concordo}
        carregando={atualizar.isPending}
        onPress={async () => {
          try {
            await atualizar.mutateAsync({ aceitou_codigo_conduta_em: new Date().toISOString() });
            router.replace('/');
          } catch (e) {
            toast.erro(textoDoErro(e));
          }
        }}
      />
    </Tela>
  );
}
