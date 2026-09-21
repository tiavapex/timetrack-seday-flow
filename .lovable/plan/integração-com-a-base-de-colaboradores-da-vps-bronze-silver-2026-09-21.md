# Integração com a base de colaboradores da VPS (bronze / silver / gold)

## Diagnóstico do que já existe

- A tabela de pessoas do app hoje é `profiles` (nome, email, matrícula, cargo, setor, área, seção, cliente, empresa, data de admissão, ativo, `user_id` do login). Ela tem **3 registros**, 2 com matrícula e 1 matrícula distinta — ou seja, não há base real de colaboradores carregada. Não há risco de perda de dados e não é preciso dedupe prévio.
- Papéis já existem em `user_roles` + funções `has_role`, `is_admin_or_higher`, `ppo_is_rh`, etc. Serão reaproveitadas; nenhuma função nova de papel será criada.
- Quem consome lista de colaboradores hoje: PPO "Avaliar colaborador", PPO (ocorrências, apuração, feedback, termo, meu resultado), Férias, Horas Extras, Colaboradores e a importação por planilha. Todos leem `profiles`.
- Não existe hoje nenhuma camada de ingestão, histórico ou controle de lotes.

## O que falta (o que vou construir)

### Camada bronze (bruto, imutável)
- `bronze.ingest_batches` — controle de lotes (origem, entidade, início/fim, status running/success/error/partial, contadores, `extracted_at`, mensagem de erro, quem disparou).
- `bronze.colaboradores_raw` — payload JSON por registro, `row_hash` sha256 gerado e armazenado, com gatilho que **rejeita UPDATE e DELETE** (append-only real) e índices por origem/lote/hash.

### Camada silver (tipado, com histórico)
- `silver.colaboradores` em SCD-2 (`valid_from`, `valid_to`, `is_current`) com índice único parcial por `origem_id` onde `is_current`.
- `silver.rejeitados` — linha sem nome ou sem `origem_id` vai para cá com o motivo e **não derruba a carga**.
- `silver.fn_promote(lote)` idempotente: última linha por `origem_id`, fecha a versão anterior quando o hash muda, insere a nova, devolve novos/alterados/rejeitados.

### Camada gold (contrato do app)
- `gold.dim_colaborador` com `origem_id` único, dados do colaborador, `gestor_id` (auto-referência) e `user_id` (login). **Regra crítica:** o upsert do silver nunca sobrescreve `gestor_id` nem `user_id` — são dados do app.
- `gold.fn_promote()`, `gold.fn_run_pipeline(lote)` (roda silver + gold, fecha o lote e devolve os contadores em JSON).
- Views: `vw_colaboradores_ativos`, `vw_minha_equipe` (equipe do gestor logado), `vw_sync_status` (histórico dos lotes + rejeitados).

### Segurança
- bronze e silver ficam fora dos schemas expostos pela API; só `gold` é exposto.
- RLS em `gold.dim_colaborador`: admin/RH/DP/gestor veem todos; gestor vê a própria equipe; cada pessoa vê o próprio registro. Alteração só por admin/RH e restrita a `gestor_id`/`user_id` (via gatilho que bloqueia mudança das outras colunas).
- Só o papel de serviço escreve no pipeline. Nenhum CPF em claro — apenas `cpf_hash`.

### Função de sincronização
- `sync-colaboradores`: valida o cabeçalho `x-sync-secret`, abre o lote, pagina a API da VPS com `X-API-Key` (limite 200), grava cada página no bronze, usa como marca d'água o `extracted_at` do último lote bem-sucedido (incremental) ou faz carga cheia com `{"full": true}`, e no fim executa o pipeline. Em erro marca o lote como `error` com a mensagem e responde 500 — nunca deixa lote pendurado.
- Agendamento de hora em hora com `{"full": false}`.
- Segredos necessários: `VPS_API_URL`, `VPS_API_KEY`, `SYNC_SECRET`. Vou pedir esses valores no formulário seguro depois de a função existir.

### Telas
- Nova seção **Integrações > Colaboradores (VPS)**, só para admin/RH: cartões com ativos, última sincronização, status do último lote e rejeitados; botão "Sincronizar agora" (o segredo fica no servidor) com opção "carga completa"; histórico com etiqueta colorida por status e o erro visível.
- Tela **Vincular colaboradores**: lista do gold com busca para definir o gestor e ligar cada pessoa ao login — é isso que faz o PPO e as férias enxergarem as equipes.
- PPO "Avaliar colaborador", Férias e Horas Extras passam a ler do gold (ativos / minha equipe), mantendo exatamente o layout atual.

## Estratégia de convivência com `profiles`

`profiles` continua existindo e continua sendo a identidade de login (é referenciada por avaliações, férias, PPO etc.). O gold passa a ser a fonte dos colaboradores vindos da VPS, e o vínculo é feito por `user_id`. Como há apenas 3 registros em `profiles`, nada é apagado nem migrado à força: depois da primeira sincronização, a tela de vínculo permite casar cada colaborador com o login existente.

## Ordem de entrega

1. Migração bronze. 2. Migração silver. 3. Migração gold (views + RLS). 4. Função de sincronização + segredos. 5. Agendamento de hora em hora. 6. Telas de integração e vínculo. 7. Trocar as listas do PPO/Férias/Horas Extras para o gold. 8. Resumo final.
