# Roadmap — Integração colaboradores VPS

## Acesso e fluxo por usuário
- [ ] Permissões por módulo ajustáveis pelo administrador e proteção das telas
- [ ] Separar colaboradores e gestão de usuários; habilitar perfis RH/Segurança
- [ ] Supervisor solicita, gestor aprova e DP/RH recebem apenas solicitações aprovadas
- [ ] Verificar regras com testes e salvamento autenticado

## Regulamentos motoristas Gerdau — novembro 2026
- [x] Atualizar PPC com indicadores por área, descontos e preservação de registros anteriores
- [x] Adicionar PPO Motoristas por viagens/turno/tara, mantendo a avaliação por notas
- [x] Disponibilizar relatórios para impressão; 24 testes de cálculo aprovados; salvamento e leitura verificados com Master; testes removidos

- [x] 1. Camada bronze (lotes + bruto imutável)
- [x] 2. Camada silver (tipado + histórico SCD-2 + rejeitados)
- [x] 3. Camada gold (dimensão + views + regras de acesso)
- [x] 4. Função sync-colaboradores (segredo de servidor ou admin/RH autenticado)
- [x] 5. Agendamento de hora em hora (incremental)
- [x] 6. Telas Integrações > Colaboradores (VPS) e Vincular colaboradores
- [ ] BLOQUEADO: cadastrar o endereço e a chave da API da VPS (VPS_API_URL, VPS_API_KEY) — depende do usuário
- [ ] 7. (ADIADO por pedido do usuário) Trocar listas de PPO/Férias/Horas Extras para o gold — só depois da primeira sincronização real
