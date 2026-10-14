import { PilhaAba } from '@/components/PilhaAba';

export default function PerfilLayout() {
  return (
    <PilhaAba
      tituloInicial="Perfil"
      telas={[
        { nome: 'membro/[id]', titulo: 'Membro' },
        { nome: 'salvos', titulo: 'Salvos' },
        { nome: 'reputacao', titulo: 'Histórico de reputação' },
        { nome: 'configuracoes', titulo: 'Configurações' },
        { nome: 'editar', titulo: 'Editar perfil' },
        { nome: 'notificacoes-config', titulo: 'Notificações' },
        { nome: 'conduta', titulo: 'Código de Conduta' },
        { nome: 'moderacao', titulo: 'Log de moderação' },
        { nome: 'carteira/index', titulo: 'Carteira' },
        { nome: 'carteira/enviar', titulo: 'Enviar DRC', modal: true },
        { nome: 'carteira/delegar', titulo: 'Delegar votos', modal: true },
        { nome: 'carteira/avancado', titulo: 'Opções avançadas' },
        { nome: 'admin/index', titulo: 'Administração' },
        { nome: 'admin/membros', titulo: 'Membros' },
        { nome: 'admin/temas', titulo: 'Temas e núcleos' },
        { nome: 'admin/configuracoes', titulo: 'Configurações globais' },
        { nome: 'admin/denuncias', titulo: 'Moderação' },
        { nome: 'admin/metricas', titulo: 'Métricas' },
      ]}
    />
  );
}
