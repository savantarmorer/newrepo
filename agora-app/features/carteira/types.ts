export interface Carteira {
  profile_id: string;
  endereco: string;
  tipo: 'embutida' | 'externa';
  sbt_token_id: string | null;
  sbt_nivel: number | null;
  sbt_atualizado_em: string | null;
}

export interface CreditoDRC {
  profile_id: string;
  epoca_id: number;
  endereco: string;
  valor: string;
  valor_wei: string;
  prova: string[] | null;
  indice: number | null;
  resgatado_tx: string | null;
  resgatado_em: string | null;
  epoca?: { inicio: string; fim: string; status: string; merkle_root: string | null } | null;
}

export interface MovimentoDRC {
  tx_hash: string;
  log_index: number;
  de: string;
  para: string;
  valor_wei: string;
  bloco: number;
  ocorrido_em: string | null;
}

export interface ConfigOnchain {
  rede: string;
  chain_id: number;
  explorador: string;
  token: string | null;
  reputacao_sbt: string | null;
  governor: string | null;
  timelock: string | null;
  distribuidor: string | null;
  fundo_mutirao: string | null;
}
