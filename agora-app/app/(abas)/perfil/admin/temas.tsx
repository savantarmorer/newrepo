import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { Secao } from '@/components/Secao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { salvarNucleo, salvarTema } from '@/features/admin/services';
import { useTemas } from '@/features/biblioteca/hooks';
import { useBuscaMembros, useNucleos } from '@/features/perfil/hooks';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';

const slugificar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function AdminTemas() {
  const qc = useQueryClient();
  const temas = useTemas();
  const nucleos = useNucleos();
  const [nomeTema, setNomeTema] = useState('');
  const [descTema, setDescTema] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [nucleoEditando, setNucleoEditando] = useState<string | null>(null);
  const [buscaCoord, setBuscaCoord] = useState('');
  const candidatos = useBuscaMembros(buscaCoord);
  const invalidar = () => qc.invalidateQueries();

  return (
    <Tela teclado>
      <Secao titulo="Temas">
        {temas.data?.map((t) => <Texto key={t.id}>• {t.nome} <Texto variante="legenda" cor="sutil">/{t.slug}</Texto></Texto>)}
        <Campo rotulo="Novo tema" value={nomeTema} onChangeText={setNomeTema} />
        <Campo rotulo="Descrição" value={descTema} onChangeText={setDescTema} multiline />
        <Botao titulo="Criar tema" compacto desabilitado={nomeTema.trim().length < 3} onPress={() => salvarTema({ nome: nomeTema.trim(), slug: slugificar(nomeTema), descricao: descTema, ordem: (temas.data?.length ?? 0) + 1 }).then(() => { setNomeTema(''); setDescTema(''); invalidar(); toast.sucesso('Tema criado.'); }).catch((e) => toast.erro(textoDoErro(e)))} />
      </Secao>
      <Secao titulo="Núcleos">
        {nucleos.data?.map((n) => (
          <Card key={n.id} plano onPress={() => setNucleoEditando(nucleoEditando === n.id ? null : n.id)} rotulo={`Núcleo ${n.cidade}`}>
            <Texto variante="corpoForte">{n.cidade} · {n.estado}</Texto>
            {nucleoEditando === n.id ? (
              <View style={{ gap: 8, marginTop: 8 }}>
                <Campo rotulo="Definir coordenação" value={buscaCoord} onChangeText={setBuscaCoord} placeholder="Nome do membro" />
                {candidatos.data?.map((p) => (
                  <Botao key={p.id} titulo={p.nome_publico} compacto variante="secundario" onPress={() => salvarNucleo({ id: n.id, cidade: n.cidade, estado: n.estado, coordenador_id: p.id }).then(() => { invalidar(); toast.sucesso('Coordenação definida. Lembre de dar o papel “Coordenação de núcleo” ao membro.'); }).catch((e) => toast.erro(textoDoErro(e)))} />
                ))}
              </View>
            ) : null}
          </Card>
        ))}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 2 }}><Campo rotulo="Cidade" value={cidade} onChangeText={setCidade} /></View>
          <View style={{ flex: 1 }}><Campo rotulo="UF" value={uf} onChangeText={(t) => setUf(t.toUpperCase())} maxLength={2} /></View>
        </View>
        <Botao titulo="Criar núcleo" compacto desabilitado={cidade.trim().length < 2 || uf.length !== 2} onPress={() => salvarNucleo({ cidade: cidade.trim(), estado: uf }).then(() => { setCidade(''); setUf(''); invalidar(); toast.sucesso('Núcleo criado.'); }).catch((e) => toast.erro(textoDoErro(e)))} />
      </Secao>
    </Tela>
  );
}
