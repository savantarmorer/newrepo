import { Switch, View } from 'react-native';
import { Card } from '@/components/Card';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useAtualizarPerfil, useMeuPerfil } from '@/features/perfil/hooks';
import { TIPOS_NOTIFICACAO } from '@/lib/constantes';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

export default function NotificacoesConfig() {
  const { c } = useTema();
  const { data: perfil } = useMeuPerfil();
  const atualizar = useAtualizarPerfil();
  const prefs = perfil?.preferencias_notificacao ?? {};
  return (
    <Tela>
      <Texto cor="secundario">A Ágora nunca envia notificações de “atividade popular” ou “você pode ter perdido”. Só avisos sobre o que é seu ou exige sua ação. Avisos da moderação são sempre enviados.</Texto>
      <Card plano style={{ gap: 4 }}>
        {TIPOS_NOTIFICACAO.map((t) => {
          const ativo = prefs[t.tipo] !== false;
          return (
            <View key={t.tipo} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }}>
              <View style={{ flex: 1 }}>
                <Texto variante="corpoForte">{t.rotulo}</Texto>
                <Texto variante="legenda" cor="secundario">{t.descricao}</Texto>
              </View>
              <Switch
                value={ativo}
                accessibilityLabel={`Notificações de ${t.rotulo}`}
                trackColor={{ true: c.secundaria, false: c.bordaForte }}
                onValueChange={(v) => {
                  atualizar.mutateAsync({ preferencias_notificacao: { ...prefs, [t.tipo]: v } }).catch((e) => toast.erro(textoDoErro(e)));
                }}
              />
            </View>
          );
        })}
      </Card>
    </Tela>
  );
}
