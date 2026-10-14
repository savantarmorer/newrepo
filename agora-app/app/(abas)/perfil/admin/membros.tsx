import { useState } from 'react';
import { View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { BadgeNivel } from '@/components/BadgeNivel';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { SkeletonLista } from '@/components/Skeleton';
import { Seletor } from '@/components/Seletor';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useMembrosAdmin } from '@/features/admin/hooks';
import { atualizarMembro } from '@/features/admin/services';
import type { MeuPerfil, Papel } from '@/features/perfil/types';
import { assinaturaAtiva } from '@/features/perfil/types';
import { lerData, paraEntradaData } from '@/lib/datas';
import { textoDoErro } from '@/lib/erros';
import { formatarData } from '@/lib/formatos';
import { toast } from '@/stores/toast';

function CardMembro({ m, aoMudar }: { m: MeuPerfil; aoMudar: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [validade, setValidade] = useState(paraEntradaData(m.assinatura_valida_ate));
  const salvar = async (campos: Parameters<typeof atualizarMembro>[1], msg: string) => {
    try {
      await atualizarMembro(m.id, campos);
      toast.sucesso(msg);
      aoMudar();
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  };
  return (
    <Card plano onPress={() => setAberto(!aberto)} rotulo={`Membro ${m.nome_exibicao}`}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Avatar nome={m.nome_exibicao} url={m.avatar_url} />
        <View style={{ flex: 1 }}>
          <Texto variante="corpoForte">{m.nome_exibicao}{m.pseudonimo_ativo ? ` (“${m.pseudonimo}”)` : ''}</Texto>
          <Texto variante="legenda" cor="secundario">{m.cidade ?? '—'} · {m.reputacao_total} pts</Texto>
        </View>
        <ChipTema rotulo={assinaturaAtiva(m) ? 'Ativa' : 'Inativa'} tom={assinaturaAtiva(m) ? 'secundaria' : 'primaria'} />
      </View>
      {aberto ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <BadgeNivel nivel={m.nivel} />
          <Seletor rotulo="Papel" opcoes={[{ valor: 'membro', rotulo: 'Membro' }, { valor: 'coordenador', rotulo: 'Coordenação de núcleo' }, { valor: 'admin', rotulo: 'Administração' }]} valor={m.papel} aoMudar={(v) => salvar({ papel: v as Papel }, 'Papel atualizado.')} />
          <Seletor rotulo="Assinatura" opcoes={[{ valor: 'ativo', rotulo: 'Ativa' }, { valor: 'inativo', rotulo: 'Inativa' }]} valor={m.status_assinatura} aoMudar={(v) => salvar({ status_assinatura: v as 'ativo' | 'inativo' }, 'Assinatura atualizada.')} />
          <Campo rotulo={`Válida até (atual: ${formatarData(m.assinatura_valida_ate)})`} value={validade} onChangeText={setValidade} placeholder="DD/MM/AAAA" />
          <Botao titulo="Salvar validade" compacto variante="secundario" onPress={() => {
            const d = lerData(validade);
            if (validade && !d) return toast.erro('Data inválida');
            salvar({ assinatura_valida_ate: d ? `${d}T23:59:59-03:00` : null }, 'Validade atualizada.');
          }} />
          {m.suspenso_ate && new Date(m.suspenso_ate) > new Date() ? <Botao titulo={`Encerrar suspensão (até ${formatarData(m.suspenso_ate)})`} compacto variante="fantasma" onPress={() => salvar({ suspenso_ate: null }, 'Suspensão encerrada.')} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

export default function AdminMembros() {
  const [termo, setTermo] = useState('');
  const q = useMembrosAdmin(termo);
  return (
    <Tela aoAtualizar={q.refetch} atualizando={q.isRefetching} teclado>
      <Campo rotulo="Buscar membro" value={termo} onChangeText={setTermo} placeholder="Nome, pseudônimo ou cidade" />
      <Texto variante="legenda" cor="sutil">Somente administradores veem nomes reais de quem usa pseudônimo.</Texto>
      {q.isLoading ? <SkeletonLista /> : q.data?.map((m) => <CardMembro key={m.id} m={m} aoMudar={() => q.refetch()} />)}
    </Tela>
  );
}
