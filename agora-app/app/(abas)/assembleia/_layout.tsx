import { PilhaAba } from '@/components/PilhaAba';

export default function AssembleiaLayout() {
  return (
    <PilhaAba
      tituloInicial="Assembleia"
      telas={[
        { nome: 'proposta/[id]', titulo: 'Proposta' },
        { nome: 'proposta/nova', titulo: 'Nova proposta' },
        { nome: 'votar', titulo: 'Seu voto', modal: true },
        { nome: 'decisoes', titulo: 'Decisões' },
        { nome: 'onchain/[id]', titulo: 'Proposta on-chain' },
        { nome: 'onchain/nova', titulo: 'Nova proposta on-chain' },
      ]}
    />
  );
}
