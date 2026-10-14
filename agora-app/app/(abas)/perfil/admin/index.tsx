import { Redirect, router } from 'expo-router';
import { Card } from '@/components/Card';
import { Divisor, ItemLista } from '@/components/ItemLista';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useMeuPerfil } from '@/features/perfil/hooks';

export default function AdminInicio() {
  const { data: perfil } = useMeuPerfil();
  if (perfil && perfil.papel !== 'admin') return <Redirect href="/perfil" />;
  return (
    <Tela>
      <Texto cor="secundario">Toda ação administrativa sobre conteúdo fica no log público de moderação. Admins não alteram reputação, votos, decisões nem lançamentos de caixa.</Texto>
      <Card plano style={{ paddingVertical: 4 }}>
        <ItemLista icone="users" titulo="Membros" subtitulo="Papéis, assinaturas e validade" onPress={() => router.push('/perfil/admin/membros')} />
        <Divisor />
        <ItemLista icone="grid" titulo="Temas e núcleos" onPress={() => router.push('/perfil/admin/temas')} />
        <Divisor />
        <ItemLista icone="sliders" titulo="Configurações globais" subtitulo="Pontos, níveis, quórum, limiares, contratos" onPress={() => router.push('/perfil/admin/configuracoes')} />
        <Divisor />
        <ItemLista icone="flag" titulo="Moderação" subtitulo="Fila de denúncias" onPress={() => router.push('/perfil/admin/denuncias')} />
        <Divisor />
        <ItemLista icone="bar-chart-2" titulo="Métricas" onPress={() => router.push('/perfil/admin/metricas')} />
      </Card>
    </Tela>
  );
}
