import { useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';
import { Icone, type NomeIcone } from './Icone';
import { MarkdownView } from './MarkdownView';
import { Segmentos } from './Segmentos';
import { Texto } from './Texto';

interface Props {
  rotulo: string;
  valor: string;
  aoMudar: (t: string) => void;
  placeholder?: string;
  erro?: string;
  minimo?: number;
  alturaMinima?: number;
  leitura?: boolean;
}

type Acao = { icone: NomeIcone; rotulo: string; antes: string; depois?: string; linha?: boolean };

const ACOES: Acao[] = [
  { icone: 'bold', rotulo: 'Negrito', antes: '**', depois: '**' },
  { icone: 'italic', rotulo: 'Itálico', antes: '*', depois: '*' },
  { icone: 'hash', rotulo: 'Título', antes: '## ', linha: true },
  { icone: 'list', rotulo: 'Lista', antes: '- ', linha: true },
  { icone: 'message-square', rotulo: 'Citação', antes: '> ', linha: true },
  { icone: 'link', rotulo: 'Link', antes: '[', depois: '](https://)' },
];

/** Editor Markdown com barra de formatação e pré-visualização. */
export function EditorMarkdown({ rotulo, valor, aoMudar, placeholder, erro, minimo, alturaMinima = 220, leitura }: Props) {
  const { c, raio, espaco, familias } = useTema();
  const [modo, setModo] = useState<'escrever' | 'ver'>('escrever');
  const sel = useRef({ start: valor.length, end: valor.length });

  function aplicar(a: Acao) {
    const { start, end } = sel.current;
    const trecho = valor.slice(start, end);
    let novo: string;
    if (a.linha) {
      const inicioLinha = valor.lastIndexOf('\n', start - 1) + 1;
      novo = valor.slice(0, inicioLinha) + a.antes + valor.slice(inicioLinha);
    } else {
      novo = valor.slice(0, start) + a.antes + (trecho || 'texto') + (a.depois ?? '') + valor.slice(end);
    }
    aoMudar(novo);
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Texto variante="rotulo" cor="secundario">{rotulo}</Texto>
        <Segmentos
          compacto
          opcoes={[{ valor: 'escrever', rotulo: 'Escrever' }, { valor: 'ver', rotulo: 'Pré-visualizar' }]}
          valor={modo}
          aoMudar={(v) => setModo(v as 'escrever' | 'ver')}
        />
      </View>
      {modo === 'escrever' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
            {ACOES.map((a) => (
              <Pressable
                key={a.rotulo}
                accessibilityRole="button"
                accessibilityLabel={`Inserir ${a.rotulo.toLowerCase()}`}
                onPress={() => aplicar(a)}
                style={({ pressed }) => ({ width: 44, height: 40, borderRadius: raio.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.superficieAfundada : c.superficie, borderWidth: 1, borderColor: c.borda })}
              >
                <Icone nome={a.icone} tamanho={17} />
              </Pressable>
            ))}
          </ScrollView>
          <TextInput
            accessibilityLabel={rotulo}
            multiline
            value={valor}
            onChangeText={aoMudar}
            onSelectionChange={(e) => (sel.current = e.nativeEvent.selection)}
            placeholder={placeholder}
            placeholderTextColor={c.textoSutil}
            textAlignVertical="top"
            maxFontSizeMultiplier={1.6}
            style={{ minHeight: alturaMinima, borderWidth: 1, borderColor: erro ? c.perigo : c.bordaForte, borderRadius: raio.md, backgroundColor: c.superficieElevada, color: c.texto, padding: espaco.md, fontFamily: leitura ? familias.leitura : familias.ui, fontSize: 16, lineHeight: 24 }}
          />
        </>
      ) : (
        <View style={{ minHeight: alturaMinima, borderWidth: 1, borderColor: c.borda, borderRadius: raio.md, padding: espaco.md, backgroundColor: c.superficie }}>
          {valor.trim() ? <MarkdownView texto={valor} leitura={leitura} /> : <Texto cor="sutil">Nada para pré-visualizar ainda.</Texto>}
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {erro ? <Texto variante="legenda" cor="perigo">{erro}</Texto> : <Texto variante="legenda" cor="sutil">Markdown: **negrito**, *itálico*, ## título, - lista, &gt; citação</Texto>}
        {minimo ? <Texto variante="legenda" cor={valor.length >= minimo ? 'sucesso' : 'sutil'}>{valor.length}/{minimo}</Texto> : null}
      </View>
    </View>
  );
}
