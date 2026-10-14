# Segurança dos contratos da Ágora

## Estado atual

| Verificação | Resultado |
|---|---|
| Testes Foundry | **68 testes** — unitários, fuzz (512 execuções) e invariantes (96 × 48 chamadas) — todos passando |
| Cobertura (`forge coverage`, só `src/`) | **99,6% linhas · 99,6% instruções · 98% ramos · 100% funções** |
| Slither 0.11 | **0 achados de severidade alta ou média** (ver abaixo) |
| Compilador | solc 0.8.28, EVM Cancun, otimizador 200 runs |
| Dependências | OpenZeppelin Contracts **v5.6.1** e forge-std v1.17 (submódulos fixados por tag) |

Invariantes verificados por fuzzing com ator aleatório (`test/Invariantes.t.sol`):

- supply **nunca** acima do cap;
- **claim duplo impossível** (nenhum resgate repetido aceito);
- soma resgatada ≤ soma publicada ≤ pool de 50M;
- votos delegados nunca superam o supply;
- **voto sem SBT sempre rejeitado no modo híbrido** (fuzz de contas e saldos).

### Achados do Slither e tratamento

| Detector | Severidade | Tratamento |
|---|---|---|
| `incorrect-equality` (`balanceOf == 0`) | Média | Corrigido (`< 1`). |
| `uninitialized-local` (`nivel`) | Média | Corrigido (inicialização explícita). |
| `unused-return` (`Checkpoints.push`) | Média | Corrigido: retornos usados no evento `NivelAtualizado`. |
| `calls-loop` | Baixa | Aceito e anotado: chamadas a contratos próprios e imutáveis; laço de quórum limitado a 16 contas. |
| `timestamp` | Baixa | Aceito e anotado: granularidade semanal das épocas. |
| `dead-code` (`_quorumReached`, `_voteSucceeded`) | Informativo | Falso positivo: overrides internos chamados pelo `Governor`. |
| `naming-convention` (`COUNTING_MODE`) | Informativo | Nome exigido pela interface `IGovernor`. |
| `unimplemented-functions` (`balanceOf`) | Informativo | Falso positivo: implementado via `ERC721` com override explícito. |

Reproduzir:

```bash
cd contracts
forge test
forge coverage --no-match-coverage "(script|test)"
forge build --build-info && slither . --ignore-compile
```

## Modelo de ameaças (resumo)

| Ameaça | Mitigação |
|---|---|
| Chave do backend vaza | Só tem `PUBLICADOR_ROLE` e `EMISSOR_ROLE`: pode publicar no máximo o teto semanal e emitir selos. Safe pausa o Distribuidor, revoga os papéis e o backend troca a chave. Nunca pode cunhar além do pool nem mover a tesouraria. |
| Árvore Merkle errada | Resgate nunca ultrapassa o `total` da época; épocas sequenciais e só depois do fim; teto por carteira. |
| Multisig comprometida | Não cria emissores (`MINTER_ADMIN_ROLE` é do Timelock), não move tesouraria nem fundo. Pode pausar e cancelar operações na fila — impacto de liveness, não de fundos. |
| Captura de governança | Snapshot no bloco de criação; tesouraria e vesting fora do quórum; modo híbrido (√DRC × nível, exige SBT); 48h de timelock para reação. |
| Sybil | SBT emitido só para membros com assinatura ativa; resgate exige SBT on-chain; recompensas só de contribuições confirmadas por terceiros. |
| Flash loan / compra de votos | DRC não tem liquidez oficial; snapshot pré-proposta; híbrido exige SBT intransferível. |
| Reentrância | Sem chamadas externas antes de atualizar estado (Distribuidor marca `resgatado` antes do `mint`); `SafeERC20` no fundo. |

## Contratos sem upgrade

Nenhum contrato é atualizável (nem o Governor). Correções exigem novo deploy aprovado em Assembleia e migração
coordenada pelo Timelock. Isso elimina o risco de proxy/admin malicioso em troca de custo operacional maior.

## Checklist pré-mainnet (obrigatório)

O script `DeployMainnet.s.sol` **se recusa a rodar** sem as variáveis abaixo. Marque cada item com link de evidência.

- [ ] **Auditoria externa** independente concluída, achados críticos/altos/médios resolvidos e relatório público
      (`AUDITORIA_URL`).
- [ ] **Revisão jurídica** sobre natureza do token (CVM, Lei 14.478/2022, tributação), termos de uso e LGPD
      (`PARECER_JURIDICO_URL`).
- [ ] **Testnet com usuários reais por no mínimo 4 semanas** (≥ 4 épocas fechadas, ≥ 2 propostas on-chain executadas)
      (`TESTNET_SEMANAS >= 4`).
- [ ] **Safe 3-de-5** criada na rede de destino com os 5 sócios, hardware wallets, e um teste de transação assinado
      por 3 deles (`MULTISIG` precisa ser contrato).
- [ ] Chave do backend **dedicada** (≠ Safe ≠ fundadores), em cofre de segredos, com saldo mínimo de gas.
- [ ] Endereços dos fundadores conferidos por dois sócios diferentes.
- [ ] Parâmetros de `TOKENOMICS.md` aprovados em Assembleia (decisão registrada).
- [ ] Todos os contratos **verificados no explorador** (`--verify`) logo após o deploy.
- [ ] Monitoramento: alertas para `RoleGranted`, `Paused`, `EpocaPublicada`, `ProposalQueued` e saldo da chave do backend.
- [ ] Plano de resposta a incidentes testado (pausar Distribuidor e token, cancelar operação no Timelock).
- [ ] Frase de confirmação: `CONFIRMO_DEPLOY_MAINNET="SIM, CHECKLIST DO SECURITY.md CONCLUIDO"`.

## Divulgação responsável

Encontrou uma vulnerabilidade? Escreva para **seguranca@agora.comunidade.br** (provisório) com detalhes e prova de conceito.
Não divulgue publicamente antes da correção. Reconheceremos publicamente quem reportar (se desejar).
