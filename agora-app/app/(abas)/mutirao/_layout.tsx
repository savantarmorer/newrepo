import { PilhaAba } from '@/components/PilhaAba';

export default function MutiraoLayout() {
  return (
    <PilhaAba
      tituloInicial="Mutirão"
      telas={[
        { nome: 'projeto/[id]', titulo: 'Projeto' },
        { nome: 'projeto/novo', titulo: 'Novo projeto' },
        { nome: 'projeto/caixa', titulo: 'Caixa transparente' },
        { nome: 'projeto/lancar', titulo: 'Novo lançamento', modal: true },
        { nome: 'projeto/horas', titulo: 'Horas a confirmar' },
        { nome: 'tarefa/[id]', titulo: 'Tarefa' },
        { nome: 'tarefa/nova', titulo: 'Nova tarefa', modal: true },
        { nome: 'horas/registrar', titulo: 'Registrar horas', modal: true },
        { nome: 'doar', titulo: 'Doar', modal: true },
        { nome: 'nucleos/index', titulo: 'Núcleos' },
        { nome: 'nucleos/[id]', titulo: 'Núcleo' },
        { nome: 'evento/[id]', titulo: 'Evento' },
        { nome: 'evento/novo', titulo: 'Novo evento' },
        { nome: 'evento/presenca', titulo: 'Lista de presença' },
        { nome: 'evento/checkin', titulo: 'Check-in', modal: true },
      ]}
    />
  );
}
