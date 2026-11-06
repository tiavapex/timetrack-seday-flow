# Roadmap — Integração colaboradores VPS

## Regulamentos motoristas Gerdau — novembro 2026
- [ ] Atualizar PPC com indicadores por área, descontos e preservação de registros anteriores
- [ ] Adicionar PPO Motoristas por viagens/turno/tara, mantendo a avaliação por notas
- [ ] Disponibilizar relatórios para impressão e verificar cálculos, permissões e salvamento

- [x] 1. Camada bronze (lotes + bruto imutável)
- [x] 2. Camada silver (tipado + histórico SCD-2 + rejeitados)
- [x] 3. Camada gold (dimensão + views + regras de acesso)
- [x] 4. Função sync-colaboradores (segredo de servidor ou admin/RH autenticado)
- [x] 5. Agendamento de hora em hora (incremental)
- [x] 6. Telas Integrações > Colaboradores (VPS) e Vincular colaboradores
- [ ] BLOQUEADO: cadastrar o endereço e a chave da API da VPS (VPS_API_URL, VPS_API_KEY) — depende do usuário
- [ ] 7. (ADIADO por pedido do usuário) Trocar listas de PPO/Férias/Horas Extras para o gold — só depois da primeira sincronização real
