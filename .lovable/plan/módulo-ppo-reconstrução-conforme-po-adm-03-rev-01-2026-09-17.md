# Módulo PPO — reconstrução conforme PO-ADM-03 rev. 01

## Diagnóstico do que existe hoje

O módulo PPO atual é um **checklist operacional**, não o programa administrativo do procedimento:

- 3 "pilares" fixos no código (RH/Administrativo, Produção/Manutenção, Segurança), com critérios e pesos escritos no arquivo `ppo-criterios.ts` — não configuráveis.
- Uma avaliação = uma planilha com várias pessoas em linhas, marcando "ok / não ok" por critério.
- Duas tabelas no banco: `ppo_avaliacoes` e `ppo_itens` (critérios em JSON).
- Telas: lista, formulário, detalhe, exportação PDF/Excel.
- Status simples: rascunho / pendente / aprovado / reprovado. Sem ciclos, sem indicadores, sem evidências, sem contestação, sem auditoria, sem portal do colaborador.

## O que falta (tudo o que o procedimento exige)

Ciclos anuais e data de corte · matriz de indicadores por cargo/setor com fórmula, meta, peso, fonte e responsável · faixas de conversão para nota 0–100 · matriz de SLA · pesos por pilar configuráveis (50/25/15/10) · cálculo da nota final e faixa de reconhecimento · elegibilidade e barreiras · proporcionalidade · evidência obrigatória por indicador · fluxo liderança → gerência → RH/DP · ocorrências com manifestação do colaborador · termo de ciência · contestação em 3 dias úteis · feedback e plano de ação · portal individual do colaborador · dashboard de indicadores do programa · trilha de auditoria · perfis de acesso (SESMT, SGI, Jurídico, Diretoria) · textos legais obrigatórios · restrição total de dados de saúde.

## Como vou tratar o módulo atual

O PPO atual e o novo são coisas diferentes. O checklist de Produção/Segurança seguirá funcionando em **"PPO Operacional (legado)"**, sem perder nenhum dado, e o novo programa administrativo nasce em telas próprias sob o mesmo menu PPO. Nada é apagado.

## Etapas de entrega

Cada etapa termina em algo utilizável e revisado por você antes da seguinte.

**Etapa 1 — Base de dados e regras**
Todas as tabelas novas (ciclos, cargos/setores, pesos por pilar, indicadores, faixas, SLA, avaliações, itens, ocorrências, barreiras, contestações, feedbacks, plano de ação, termos, melhorias, governança, log de auditoria, feriados), perfis novos (sesmt, sgi, juridico, diretoria), regras de acesso por perfil, cálculo automático da nota, prazo em dias úteis, trilha de auditoria automática e as cargas iniciais (pesos 50/25/15/10, faixas padrão de meta e acuracidade, matriz de governança do Anexo VIII, SLAs modelo de RH/DP, Financeiro, Compras e TI).

**Etapa 2 — Matriz de Indicadores e Matriz de SLA**
Cadastro por setor/cargo/pilar com fórmula, meta, peso, fonte e responsável; editor de faixas com prévia da escala; bloqueio de indicador incompleto; versionamento com motivo da alteração; importar/exportar CSV e Excel. Validação de soma de pesos = 100%.

**Etapa 3 — Ciclos e Apuração Individual**
Abertura de ciclo, data de corte, geração automática das avaliações dos elegíveis, tela de apuração com abas por pilar, evidência e fonte obrigatórias, nota convertida automaticamente e painel lateral com nota por pilar, nota final, faixa e percentual em tempo real.

**Etapa 4 — Fluxo de validação e comunicação**
Enviar para validação, validar (gerência), consolidar (RH/DP), comunicar ao colaborador, encerrar — cada botão liberado apenas para o perfil previsto na matriz de governança. Elegibilidade (6 condições), barreiras com aprovação e proporcionalidade com análise do RH.

**Etapa 5 — Ocorrências**
Registro com evidência, análise da liderança, manifestação do colaborador e decisão documentada; a ocorrência só pode impactar nota depois de decidida com manifestação registrada.

**Etapa 6 — Colaborador**
Portal "Meu resultado" (confidencial), termo de ciência com aceite registrado, contestação com contador de 3 dias úteis e recálculo quando deferida, feedback com plano de ação e ciência das duas partes.

**Etapa 7 — Dashboard, relatórios e auditoria**
Índices de adesão, contestação, revisão, fechamento no prazo e melhorias; gráficos por faixa, por pilar e por setor (nunca ranking individual); relatórios PDF/Excel com cabeçalho PO-ADM-03 rev 01; tela de auditoria com trilha completa para SGI/Diretoria.

**Etapa 8 — Checklist de aderência**
Documento item a item do procedimento apontando onde cada exigência foi atendida.

## Regras que serão respeitadas sem exceção

- Nenhuma nota sem fonte de dado e evidência anexada.
- Nenhuma redução automática de percentual por advertência ou suspensão.
- Cumprir obrigação legal e usar EPI são requisitos mínimos (Sim/Não), separados da contribuição preventiva pontuável.
- Nenhum dado de saúde: apenas "requisito ocupacional atendido: Sim/Não".
- Nenhum resultado individual visível a quem não tem perfil para vê-lo.
- Pesos e faixas sempre vindos do banco, nunca fixos no código.
- Os quatro textos legais exibidos literalmente nas telas de resultado, termo e comunicação.
- Registros de apuração nunca excluídos — apenas inativados, com log.

## Detalhes técnicos

- Banco: novas tabelas `ppo_*` com RLS por perfil via `has_role`, funções `fn_converter_nota`, `fn_calcular_avaliacao` (trigger em itens), `fn_prazo_contestacao` (dias úteis com tabela de feriados) e trigger genérico de auditoria gravando antes/depois em `ppo_auditoria_log`.
- Evidências em bucket privado do Storage, com política por perfil.
- Rotas: `/ppo` (dashboard), `/ppo/ciclos`, `/ppo/indicadores`, `/ppo/sla`, `/ppo/avaliacoes/:id`, `/ppo/ocorrencias`, `/ppo/feedback/:id`, `/ppo/termo`, `/ppo/contestacoes`, `/ppo/meu-resultado`, `/ppo/governanca`, `/ppo/auditoria`; o checklist atual passa para `/ppo/operacional`.
- Cálculo replicado no banco (fonte da verdade) e no cliente (prévia ao vivo), ambos lendo pesos e faixas do banco.
