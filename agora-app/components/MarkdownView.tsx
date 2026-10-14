import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { useTema } from '@/theme/ThemeProvider';

/** Renderiza Markdown com a tipografia do tema. `leitura` usa a serifada de artigos. */
export function MarkdownView({ texto, leitura }: { texto: string; leitura?: boolean }) {
  const { c, familias, raio } = useTema();
  const base = leitura ? { fontFamily: familias.leitura, fontSize: 18, lineHeight: 30 } : { fontFamily: familias.ui, fontSize: 15.5, lineHeight: 23 };
  return (
    <Markdown
      onLinkPress={(url) => {
        if (url.startsWith('/')) {
          router.push(url as never);
          return false;
        }
        Linking.openURL(url).catch(() => undefined);
        return false;
      }}
      style={{
        body: { color: c.texto, ...base },
        heading1: { fontFamily: familias.titulo, fontSize: 30, lineHeight: 36, color: c.texto, marginTop: 18, marginBottom: 8 },
        heading2: { fontFamily: familias.titulo, fontSize: 25, lineHeight: 31, color: c.texto, marginTop: 18, marginBottom: 6 },
        heading3: { fontFamily: familias.uiNegrito, fontSize: 17, lineHeight: 24, color: c.texto, marginTop: 14 },
        strong: { fontFamily: leitura ? familias.leituraNegrito : familias.uiNegrito, fontWeight: 'normal' },
        em: { fontFamily: leitura ? familias.leituraItalico : familias.ui, fontStyle: leitura ? 'normal' : 'italic' },
        link: { color: c.primaria, textDecorationLine: 'underline' },
        blockquote: { backgroundColor: c.superficieAfundada, borderLeftColor: c.dourado, borderLeftWidth: 4, paddingHorizontal: 14, paddingVertical: 6, marginVertical: 8, borderRadius: raio.sm },
        code_inline: { backgroundColor: c.superficieAfundada, color: c.texto, borderRadius: 4, paddingHorizontal: 4, fontFamily: undefined },
        fence: { backgroundColor: c.superficieAfundada, color: c.texto, borderRadius: raio.sm, borderColor: c.borda, padding: 10 },
        hr: { backgroundColor: c.borda, height: 1, marginVertical: 16 },
        bullet_list_icon: { color: c.primaria },
        ordered_list_icon: { color: c.primaria, fontFamily: familias.uiNegrito },
        paragraph: { marginTop: 0, marginBottom: leitura ? 14 : 10 },
      }}
    >
      {texto}
    </Markdown>
  );
}
