import { View } from 'react-native';
import { ChipTema } from './ChipTema';
import { Texto } from './Texto';

/** Escolha única ou múltipla com chips */
export function Seletor<T extends string>({
  rotulo, opcoes, valor, aoMudar, multiplo, erro,
}: {
  rotulo?: string;
  opcoes: { valor: T; rotulo: string }[];
  valor: T | T[] | null | undefined;
  aoMudar: (v: T | T[]) => void;
  multiplo?: boolean;
  erro?: string;
}) {
  const selecionados = Array.isArray(valor) ? valor : valor ? [valor] : [];
  return (
    <View style={{ gap: 8 }} accessibilityRole={multiplo ? undefined : 'radiogroup'}>
      {rotulo ? <Texto variante="rotulo" cor="secundario">{rotulo}</Texto> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {opcoes.map((o) => {
          const ativo = selecionados.includes(o.valor);
          return (
            <ChipTema
              key={o.valor}
              rotulo={o.rotulo}
              selecionado={ativo}
              onPress={() => {
                if (!multiplo) return aoMudar(o.valor);
                aoMudar(ativo ? selecionados.filter((s) => s !== o.valor) : [...selecionados, o.valor]);
              }}
            />
          );
        })}
      </View>
      {erro ? <Texto variante="legenda" cor="perigo">{erro}</Texto> : null}
    </View>
  );
}
