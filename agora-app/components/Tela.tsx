import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTema } from '@/theme/ThemeProvider';

interface Props {
  children: ReactNode;
  rolavel?: boolean;
  aoAtualizar?: () => void;
  atualizando?: boolean;
  bordas?: Edge[];
  conteudoStyle?: ViewStyle;
  rodape?: ReactNode;
  teclado?: boolean;
}

/** Contêiner padrão: área segura, fundo do tema, rolagem e pull-to-refresh. */
export function Tela({ children, rolavel = true, aoAtualizar, atualizando = false, bordas = ['left', 'right'], conteudoStyle, rodape, teclado }: Props) {
  const { c, espaco } = useTema();
  const conteudo = rolavel ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[{ padding: espaco.lg, paddingBottom: espaco.gigante, gap: espaco.lg }, conteudoStyle]}
      refreshControl={aoAtualizar ? <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={c.primaria} colors={[c.primaria]} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, conteudoStyle]}>{children}</View>
  );
  return (
    <SafeAreaView edges={bordas} style={{ flex: 1, backgroundColor: c.fundo }}>
      {teclado ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          {conteudo}
          {rodape}
        </KeyboardAvoidingView>
      ) : (
        <>
          {conteudo}
          {rodape}
        </>
      )}
    </SafeAreaView>
  );
}
