# Módulo ASE — Autorização de Serviços Extraordinários

Cria um módulo independente para emitir, aprovar e exportar ASEs no padrão da planilha enviada.

## O que será criado

### 1. Banco de dados (Lovable Cloud)
Duas novas tabelas:

- **`ases`** — cabeçalho da autorização
  - `periodo_data`, `cliente`, `centro_custo` (605 Matriz / 607 Empilhadeiras / 609 Transportes)
  - `responsavel`, `lider_gestor`, `setor` (ADM / Empilhadeira / Transporte / Outro + texto livre)
  - `horario_inicio`, `horario_fim`
  - `atividades` (texto), `observacao` (texto)
  - `status` (rascunho / pendente / aprovada / reprovada / lancada)
  - `criado_por`, `aprovado_por`, `aprovado_em`, `lancado_por`, `lancado_em`
  - Timestamps padrão

- **`ase_colaboradores`** — linhas de colaboradores na ASE
  - `ase_id`, `user_id` (referência ao profile), `escala_sim` (bool), `numero`, `vt` (bool), `alimentacao` (bool)
  - Matrícula, nome e cargo são lidos do profile (snapshot opcional para manter histórico)

RLS conforme regras de permissão abaixo, com GRANTs em `authenticated` e `service_role`.

### 2. Permissões
- **Supervisor**: cria ASE para o líder dele e para a equipe.
- **Líder**: cria ASE apenas para a própria equipe.
- **Gestor / Admin / Master**: cria e aprova ASEs para todos.
- **DP**: visualiza aprovadas e marca como lançadas no ERP.
- **Colaborador**: vê apenas as ASEs em que aparece como participante.

Como hoje só temos os papéis `master`, `admin`, `gestor`, `dp` e `colaborador`, vou tratar:
- `master` / `admin` / `gestor` → criam e aprovam para todos.
- `colaborador` → leitura própria.
- (Supervisor e Líder serão mapeados como `gestor` enquanto não existir esse papel — se desejar criar papéis novos, me avise.)

### 3. Telas
- **`/ase`** — listagem com filtros (período, cliente, status), botão "Nova ASE".
- **`/ase/nova`** — formulário fiel ao da planilha: cabeçalho, seleção múltipla de colaboradores cadastrados (com matrícula/cargo automáticos), atividades, observação.
- **`/ase/:id`** — detalhe com ações: Aprovar / Reprovar (gestor+), Revogar, Marcar como lançada no ERP (DP+), Exportar PDF, Exportar XLSX.
- Item "ASE" adicionado à Sidebar.

### 4. Exportações
- **PDF**: layout fiel à planilha (cabeçalho, tabela de colaboradores, atividades, observação, rodapé com a frase de prazo do DP). Gerado via `jspdf` + `jspdf-autotable`.
- **XLSX**: mesmo conteúdo, gerado via `xlsx` (SheetJS) para download direto.

## Detalhes técnicos

- Migração SQL com as duas tabelas + GRANTs + RLS + policies por papel + triggers `updated_at`.
- Edge Function não é necessária — todas as operações usam RLS.
- Tipos `src/integrations/supabase/types.ts` serão regenerados após a migração.
- Páginas em `src/pages/ASE/` (`ASEList.tsx`, `ASEForm.tsx`, `ASEDetalhe.tsx`) + util `src/lib/ase-export.ts` para PDF/XLSX.
- Rotas adicionadas em `src/App.tsx`; item no `Sidebar.tsx`.
- Dependências novas: `jspdf`, `jspdf-autotable`, `xlsx`.

## Fora do escopo (a confirmar depois, se quiser)
- Criar papéis novos (`supervisor`, `lider`) com hierarquia de equipes.
- Geração automática de horas extras a partir de uma ASE aprovada.
- Assinatura digital no PDF.

Confirma esse plano para eu implementar?
