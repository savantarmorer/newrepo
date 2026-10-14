# Tokenomics do Dracma (DRC)

> **Status: provisório.** Todos os números abaixo são parâmetros iniciais para testnet. Valores definitivos
> só depois da revisão jurídica e de aprovação em Assembleia (ver [SECURITY.md](./SECURITY.md)).

O **Dracma (DRC)** é o token de governança e de reconhecimento da Ágora. Ele existe para duas coisas:

1. **Reconhecer contribuições verificadas** (artigos publicados, revisões, horas de voluntariado confirmadas,
   presença em eventos…) — os mesmos eventos que geram reputação no app.
2. **Dar voz nas decisões on-chain** da comunidade: tesouraria, fundo do Mutirão, parâmetros do token, papéis e contratos.

O DRC **não é vendido** pela Ágora. Não há pré-venda, ICO, pool de liquidez, swap, listagem, preço nem cotação no app,
e a interface não usa linguagem de investimento.

## Contratos

| Contrato | Papel |
|---|---|
| `DracmaToken` | ERC-20 + Permit + Votes + Capped + AccessControl + Pausable. Supply máximo **100.000.000 DRC**. Auto-delegação ao receber. |
| `AgoraReputacao` | ERC-721 **soulbound** (ERC-5192), um por membro verificado, guarda o nível 1–4 com histórico por bloco. |
| `AgoraGovernor` | OpenZeppelin Governor + Settings + Votes + QuorumFraction + TimelockControl, com contagem customizada (`GovernorContagemAgora`). |
| `TimelockController` | Atraso de **48 horas**; detém a tesouraria. Só o Governor propõe; Governor e a multisig podem cancelar. |
| `DistribuidorRecompensas` | Épocas semanais com raiz Merkle; claim por prova; tetos por época, por carteira e pool total. |
| `FundoMutirao` | Cofre do fundo filantrópico, de propriedade do Timelock. Cada liberação exige proposta aprovada e referência de projeto. |
| `VestingFundador` | `VestingWalletCliff` da OpenZeppelin: 4 anos lineares, cliff de 1 ano. |

## Distribuição (supply máximo de 100M DRC)

| Fatia | % | DRC | Como existe | Quem controla |
|---|---:|---:|---|---|
| Recompensas à comunidade | 50% | 50.000.000 | **Cunhado sob demanda**, época a época, pelo Distribuidor | Regras do contrato + backend publicador |
| Tesouraria da DAO | 20% | 20.000.000 | Cunhado no deploy para o Timelock | Governor/Timelock |
| Fundadores | 15% | 15.000.000 | Cunhado no deploy para os cofres de vesting (divididos igualmente) | Contratos de vesting |
| Fundo do Mutirão | 10% | 10.000.000 | Cunhado no deploy para o `FundoMutirao` | Governor/Timelock |
| Reserva | 5% | 5.000.000 | **Não cunhado** — fica como folga sob o cap | Só uma proposta aprovada (Timelock é emissor) poderia cunhar; não usar no MVP |

No deploy existem **45.000.000 DRC** (tesouraria + fundadores + fundo). Os demais só nascem por recompensas ou por decisão da DAO.

### Emissão decrescente das recompensas (5 anos, épocas semanais)

| Ano | Orçamento anual | Teto por época (÷52) |
|---|---:|---:|
| 1 | 16.000.000 | ≈ 307.692 |
| 2 | 12.000.000 | ≈ 230.769 |
| 3 | 10.000.000 | ≈ 192.307 |
| 4 | 7.000.000 | ≈ 134.615 |
| 5 | 5.000.000 | ≈ 96.153 |
| **Total** | **50.000.000** | — após a época 260 o teto é zero |

Créditos não resgatados **não são cunhados** e não expiram. O contrato também recusa qualquer publicação que leve o total
publicado acima do pool de 50M (defesa em profundidade).

## Da reputação ao DRC (ponte app → blockchain)

```mermaid
sequenceDiagram
  autonumber
  participant App as App / Postgres
  participant Cron as fechar-epoca (Edge Function)
  participant Dist as DistribuidorRecompensas
  participant M as Membro (smart account)
  App->>App: evento de reputação (+pontos) → crédito DRC pendente (taxa configurável)
  App->>App: evento negativo (moderação) → reduz créditos pendentes
  Cron->>App: preparar_epoca(): elegíveis = assinatura ativa + SBT; teto por carteira e por época
  Cron->>Cron: árvore Merkle (StandardMerkleTree, folhas address+uint256)
  Cron->>App: grava provas (só o dono lê, por RLS)
  Cron->>Dist: publicarEpoca(n, raiz, total) — só após o fim da semana n
  M->>Dist: resgatar(n, conta, valor, prova) — gas patrocinado (paymaster ERC-4337) ou relayer
  Dist->>M: mint(conta, valor)
```

Parâmetros em `configuracoes.drc` (editáveis por admins, sujeitos à Assembleia):

| Chave | Padrão | Significado |
|---|---|---|
| `taxa_conversao` | `1` | DRC por ponto de reputação |
| `teto_por_carteira_epoca` | `2000` | Máximo por membro por semana (o contrato também impõe `tetoPorCarteira`) |
| `teto_por_epoca` | `300000` | Máximo distribuído por semana no backend (abaixo do teto on-chain do ano 1); acima disso o rateio é proporcional e o excedente vira crédito pendente |

**Anti-sybil:** só recebem membros com assinatura ativa **e** SBT de reputação (checado no backend e no contrato);
horas de voluntariado só contam depois de confirmadas por outra pessoa da coordenação.

## Poder de voto

O modo é gravado **por proposta** no momento da criação e só muda por proposta aprovada (`definirModoVoto`, `onlyGovernance`).

| Modo | Fórmula (escala de 18 casas) | Exige SBT? |
|---|---|---|
| Clássico | `poder = DRC` | não |
| Quadrático | `poder = √(DRC)` | não |
| **Híbrido (padrão)** | `poder = √(DRC) × (1,0 · 1,1 · 1,2 · 1,3)` conforme o nível 1–4 **no snapshot** | **sim** — voto sem selo é rejeitado |

- **Snapshot** no bloco de criação da proposta (`votingDelay = 0`): DRC recebidos ou níveis alterados depois não contam.
- **Delegação** via ERC20Votes; toda conta é auto-delegada ao receber DRC (funciona sem passo extra em smart accounts).
- **Quórum**: 4% do supply **em circulação** no snapshot, medido em DRC brutos que participaram (a favor + abstenção).
  Tesouraria, fundo do Mutirão e cofres de vesting ficam fora da base (`definirExcluidosDoQuorum`, máx. 16 contas, só por governança).
- **Resultado**: aprovada se o poder a favor superar o contra.
- **Limiar para propor**: 100 DRC delegados. **Período de votação**: 302.400 blocos (~7 dias em Base/Polygon). **Timelock**: 48h.

### Dois tipos de proposta na Assembleia

| | Comunitária (off-chain) | On-chain (Governor) |
|---|---|---|
| Temas | regras de convivência, debates, decisões de núcleo | tesouraria, fundo do Mutirão, parâmetros do token, papéis, contratos |
| Voto | 1 pessoa = 1 voto | poder de voto em DRC (modo acima) |
| Execução | registro imutável em `decisoes` | automática pelo Timelock após 48h |
| Quem propõe | nível Curador no app | nível Curador no app + 100 DRC delegados |

A descrição on-chain leva o prefixo `[agora:<uuid>]`, que o indexador usa para ligar a proposta ao debate no app.

## Papéis administrativos e descentralização progressiva

Deploy inicial:

| Papel | Titular |
|---|---|
| `DracmaToken.DEFAULT_ADMIN_ROLE`, `PAUSER_ROLE` | Safe 3-de-5 dos sócios |
| `DracmaToken.MINTER_ROLE` | Distribuidor e Timelock — **somente** |
| `DracmaToken.MINTER_ADMIN_ROLE` | Timelock (nem a Safe cria emissores) |
| `AgoraReputacao.DEFAULT_ADMIN_ROLE` / `EMISSOR_ROLE` | Safe / backend |
| `Distribuidor.DEFAULT_ADMIN_ROLE`, `PAUSER_ROLE` / `PUBLICADOR_ROLE` | Safe / backend |
| `Timelock.PROPOSER_ROLE` | Governor |
| `Timelock.CANCELLER_ROLE` | Governor e Safe (veto de emergência) |
| `Timelock` admin | renunciado no deploy |

Plano de transferência (script `TransferirParaGovernanca.s.sol`, executado pela Safe):

1. **Etapa 1** (após 3 meses estáveis na mainnet): administração do SBT e do Distribuidor passa ao Timelock.
2. **Etapa 2** (após 6 meses): administração do token passa ao Timelock; a Safe renuncia.
3. **Etapa 3** (após 12 meses e por proposta aprovada): a Safe renuncia às pausas; o veto de emergência é revisto em Assembleia.

## Riscos conhecidos e decisões

- **Backend como oráculo**: a reputação nasce no Postgres; o backend calcula as árvores. Mitigações: tetos on-chain por época,
  por carteira e no pool; épocas sequenciais; árvore malformada nunca cunha além do total publicado; pausa pela Safe; dados das
  épocas e provas auditáveis no Supabase.
- **Concentração inicial**: fundadores em vesting e tesouraria fora do quórum; modo híbrido limita plutocracia (raiz quadrada).
- **Sem upgrade**: todos os contratos são imutáveis; mudanças exigem novo deploy aprovado em Assembleia.
