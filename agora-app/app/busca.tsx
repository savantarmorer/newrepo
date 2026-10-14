import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Campo } from '@/components/Campo';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Carregando } from '@/components/Estados';
import { Secao } from '@/components/Secao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useBusca } from '@/features/busca/hooks';
import { ROTULOS_TIPO, rotaDoResultado, type TipoResultado } from '@/features/busca/services';
import { useTema } from '@/theme/ThemeProvider';

/** Busca global full-text (Postgres, dicionário português) agrupada por tipo */
export default function Busca() {
  const { c, espaco, raio } = useTema();
  const [termo, setTermo] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(termo), 350);
    return () => clearTimeout(id);
  }, [termo]);
  const q = useBusca(debounced);
  const grupos = q.data ? (Object.entries(q.data) as [TipoResultado, NonNullable<typeof q.data>[TipoResultado]][]).filter(([, l]) => l.length) : [];
  return (
    <Tela teclado>
      <Campo rotulo="Buscar em tópicos, artigos, trilhas, projetos, propostas e decisões" value={termo} onChangeText={setTermo} placeholder="Ex.: hermetismo, despejo, mutirão" autoFocus returnKeyType="search" />
      {debounced.trim().length < 3 ? <Texto variante="legenda" cor="sutil">Digite ao menos 3 letras. A busca ignora acentos e entende variações (ex.: “templário” encontra “templários”).</Texto> : null}
      {q.isFetching ? <Carregando /> : null}
      {grupos.map(([tipo, lista]) => (
        <Secao key={tipo} titulo={`${ROTULOS_TIPO[tipo]} (${lista.length})`}>
          {lista.map((r) => (
            <Pressable key={r.id} accessibilityRole="link" accessibilityLabel={r.titulo} onPress={() => router.push(rotaDoResultado(r) as never)}
              style={({ pressed }) => ({ padding: espaco.md, borderRadius: raio.md, backgroundColor: pressed ? c.superficieAfundada : c.superficie, borderWidth: 1, borderColor: c.borda, gap: 4 })}>
              <Texto variante="corpoForte">{r.titulo}</Texto>
              <Texto variante="legenda" cor="secundario" numberOfLines={3}>
                {r.trecho.split(/(«[^»]*»)/).map((parte, i) => parte.startsWith('«') ? <Texto key={i} variante="legenda" style={{ backgroundColor: c.douradoSuave, color: c.texto }}>{parte.slice(1, -1)}</Texto> : parte)}
              </Texto>
            </Pressable>
          ))}
        </Secao>
      ))}
      {q.data && !grupos.length && !q.isFetching ? <EstadoVazio ilustracao="lupa" titulo="Nada encontrado" descricao="Tente outra palavra — ou crie um tópico sobre isso!" /> : null}
      <View style={{ height: 40 }} />
    </Tela>
  );
}
