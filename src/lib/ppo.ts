// Regras do PO-ADM-03 rev 01 — Prêmio de Reconhecimento por Performance Administrativa (PPO)
// Nenhum peso ou faixa é fixo no código: os valores abaixo são apenas rótulos e defaults de semente.

export const PPO_DOC = "PO-ADM-03 rev 01";

export const PPO_TEXTOS_LEGAIS = {
  faixas:
    "Os percentuais representam faixas internas de reconhecimento, não desconto de salário ou penalidade financeira.",
  participacao:
    "A participação no programa não gera garantia de recebimento em todos os ciclos.",
  naoSubstitui:
    "O PPO não substitui salário, horas extras, adicionais legais, benefícios, obrigações trabalhistas, medidas disciplinares, avaliações de competência, treinamento, procedimentos de segurança ou controles de jornada.",
  inelegibilidade: "A inelegibilidade não constitui medida disciplinar.",
  lgpd:
    "Não registre diagnóstico, CID, doença, medicamento ou resultado clínico. Para exame ocupacional, registre apenas se o requisito ocupacional foi atendido.",
} as const;

export const PILARES = [
  {
    numero: 1,
    nome: "Resultado e Entregas",
    pesoPadrao: 50,
    sugestoes:
      "SLA, metas, produtividade, prazo de atendimento, cronogramas, volume de demandas concluídas, disponibilidade para atividades críticas, entregas programadas.",
  },
  {
    numero: 2,
    nome: "Qualidade e Eficiência",
    pesoPadrao: 25,
    sugestoes:
      "Acuracidade, retrabalho, erros, devoluções, inconsistências, conformidade documental, atendimento correto da demanda, eficiência de processo. Use sempre faixas objetivas — nunca 'zero erro' como única referência.",
  },
  {
    numero: 3,
    nome: "Segurança, Compliance e Disciplina Operacional",
    pesoPadrao: 15,
    sugestoes:
      "Treinamentos obrigatórios, requisitos de acesso, uso de EPI quando exigido, procedimentos de segurança, compliance, proteção da informação, comunicação de condições inseguras, ações preventivas. Cumprir obrigação legal é requisito mínimo e não gera prêmio.",
  },
  {
    numero: 4,
    nome: "Melhoria Contínua e Comportamento Organizacional",
    pesoPadrao: 10,
    sugestoes:
      "Sugestões de melhoria, participação em projetos, redução de desperdício, simplificação de processo, solução de problemas, compartilhamento de conhecimento, colaboração entre áreas.",
  },
] as const;

export function nomePilar(n: number) {
  return PILARES.find((p) => p.numero === n)?.nome ?? `Pilar ${n}`;
}

export const UNIDADES = [
  { value: "%", label: "Percentual (%)" },
  { value: "dias", label: "Dias" },
  { value: "qtd", label: "Quantidade" },
  { value: "score", label: "Pontuação" },
  { value: "sim_nao", label: "Sim / Não" },
];

export const DIRECOES = [
  { value: "maior_melhor", label: "Quanto maior, melhor" },
  { value: "menor_melhor", label: "Quanto menor, melhor" },
  { value: "binario", label: "Binário / qualitativo" },
];

export const FONTES_DADO = [
  "ERP",
  "Sistema de chamados",
  "GLPI",
  "Controle de ponto",
  "Planilha oficial",
  "Controle financeiro",
  "Registro de compras",
  "Indicadores de RH",
  "Sistema de manutenção",
  "Sistema do SGI",
  "Formulário",
  "Checklist",
  "Registro de treinamento",
  "Registro de SST",
];

export const MOTIVOS_ALTERACAO_INDICADOR = [
  "Mudança de processo",
  "Mudança de sistema",
  "Mudança de responsabilidade",
  "Mudança de estratégia",
  "Alteração de legislação",
  "Indicador inadequado",
  "Melhoria de medição",
];

export const TIPOS_BARREIRA = [
  "Fraude comprovada em registros",
  "Adulteração deliberada de informações",
  "Falsificação de documentos",
  "Manipulação intencional de indicadores",
  "Violação grave e comprovada de requisito crítico de segurança",
  "Ato doloso",
  "Assédio comprovado após apuração competente",
  "Violação deliberada e grave de confidencialidade",
  "Outra situação previamente classificada como crítica",
];

export const TIPOS_OCORRENCIA = [
  { value: "indicador", label: "Indicador" },
  { value: "qualidade", label: "Qualidade" },
  { value: "seguranca", label: "Segurança" },
  { value: "compliance", label: "Compliance" },
  { value: "integridade_informacao", label: "Integridade de informação" },
  { value: "outro", label: "Outro" },
];

export const STATUS_OCORRENCIA = [
  { value: "registrada", label: "Registrada" },
  { value: "em_analise", label: "Em análise" },
  { value: "aguardando_manifestacao", label: "Aguardando manifestação" },
  { value: "decidida", label: "Decidida" },
  { value: "arquivada", label: "Arquivada" },
];

export const STATUS_AVALIACAO: Record<string, string> = {
  rascunho: "Rascunho",
  em_apuracao: "Em apuração",
  aguardando_validacao: "Aguardando validação",
  validada: "Validada",
  comunicada: "Comunicada",
  em_contestacao: "Em contestação",
  encerrada: "Encerrada",
};

export const STATUS_CICLO: Record<string, string> = {
  rascunho: "Rascunho",
  aberto: "Aberto",
  em_apuracao: "Em apuração",
  em_validacao: "Em validação",
  comunicado: "Comunicado",
  encerrado: "Encerrado",
};

export interface Faixa {
  limite_inferior: number | null;
  limite_superior: number | null;
  nota: number;
  ordem: number;
}

// Faixas default do procedimento (usadas apenas como sugestão ao criar indicador)
export const FAIXAS_META: Faixa[] = [
  { limite_inferior: 100, limite_superior: null, nota: 100, ordem: 1 },
  { limite_inferior: 95, limite_superior: 99.99, nota: 90, ordem: 2 },
  { limite_inferior: 90, limite_superior: 94.99, nota: 80, ordem: 3 },
  { limite_inferior: 80, limite_superior: 89.99, nota: 70, ordem: 4 },
  { limite_inferior: null, limite_superior: 79.99, nota: 0, ordem: 5 },
];

export const FAIXAS_ACURACIDADE: Faixa[] = [
  { limite_inferior: 99, limite_superior: null, nota: 100, ordem: 1 },
  { limite_inferior: 98, limite_superior: 98.99, nota: 90, ordem: 2 },
  { limite_inferior: 97, limite_superior: 97.99, nota: 80, ordem: 3 },
  { limite_inferior: 95, limite_superior: 96.99, nota: 70, ordem: 4 },
  { limite_inferior: null, limite_superior: 94.99, nota: 0, ordem: 5 },
];

export const FAIXAS_BINARIO: Faixa[] = [
  { limite_inferior: 1, limite_superior: null, nota: 100, ordem: 1 },
  { limite_inferior: null, limite_superior: 0, nota: 0, ordem: 2 },
];

export function converterNota(faixas: Faixa[], valor: number | null): number | null {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return null;
  const ordenadas = [...faixas].sort((a, b) => a.ordem - b.ordem);
  const f = ordenadas.find(
    (x) =>
      (x.limite_inferior === null || valor >= x.limite_inferior) &&
      (x.limite_superior === null || valor <= x.limite_superior)
  );
  return f ? Number(f.nota) : null;
}

export function faixaAplicada(faixas: Faixa[], valor: number | null) {
  if (valor === null) return null;
  const ordenadas = [...faixas].sort((a, b) => a.ordem - b.ordem);
  return (
    ordenadas.find(
      (x) =>
        (x.limite_inferior === null || valor >= x.limite_inferior) &&
        (x.limite_superior === null || valor <= x.limite_superior)
    ) || null
  );
}

export function descreverFaixa(f: Faixa) {
  if (f.limite_inferior !== null && f.limite_superior !== null)
    return `de ${f.limite_inferior} a ${f.limite_superior}`;
  if (f.limite_inferior !== null) return `≥ ${f.limite_inferior}`;
  if (f.limite_superior !== null) return `≤ ${f.limite_superior}`;
  return "qualquer valor";
}

export interface ItemCalculo {
  pilar: number;
  nota: number | null;
  peso: number | null;
}

export interface PesosPilar {
  p1: number;
  p2: number;
  p3: number;
  p4: number;
}

export const PESOS_PADRAO: PesosPilar = { p1: 50, p2: 25, p3: 15, p4: 10 };

export function notaPilar(itens: ItemCalculo[], pilar: number): number {
  const validos = itens.filter((i) => i.pilar === pilar && i.nota !== null);
  const somaPesos = validos.reduce((a, i) => a + (Number(i.peso) || 0), 0);
  if (!somaPesos) return 0;
  const soma = validos.reduce((a, i) => a + Number(i.nota) * (Number(i.peso) || 0), 0);
  return round2(soma / somaPesos);
}

export function calcularResultado(
  itens: ItemCalculo[],
  pesos: PesosPilar,
  opcoes?: { elegivel?: boolean; fatorProporcional?: number | null }
) {
  const p1 = notaPilar(itens, 1);
  const p2 = notaPilar(itens, 2);
  const p3 = notaPilar(itens, 3);
  const p4 = notaPilar(itens, 4);
  let final = round2((p1 * pesos.p1 + p2 * pesos.p2 + p3 * pesos.p3 + p4 * pesos.p4) / 100);
  if (opcoes?.fatorProporcional) final = round2((final * opcoes.fatorProporcional) / 100);
  const elegivel = opcoes?.elegivel !== false;
  const { faixa, percentual } = faixaReconhecimento(final, elegivel);
  return { p1, p2, p3, p4, final, faixa, percentual };
}

export function faixaReconhecimento(nota: number, elegivel = true) {
  if (!elegivel) return { faixa: "inelegivel", percentual: 0 };
  if (nota >= 95) return { faixa: "95,00 a 100,00", percentual: 100 };
  if (nota >= 90) return { faixa: "90,00 a 94,99", percentual: 90 };
  if (nota >= 80) return { faixa: "80,00 a 89,99", percentual: 80 };
  if (nota >= 70) return { faixa: "70,00 a 79,99", percentual: 70 };
  return { faixa: "sem_reconhecimento", percentual: 0 };
}

export function rotuloFaixa(faixa: string | null) {
  if (!faixa) return "—";
  if (faixa === "inelegivel") return "Inelegível no ciclo";
  if (faixa === "sem_reconhecimento") return "Sem reconhecimento";
  return faixa;
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export const CONDICOES_ELEGIBILIDADE = [
  { campo: "eleg_vinculo", label: "Vínculo empregatício elegível" },
  { campo: "eleg_cargo_contemplado", label: "Cargo/setor contemplado pelo programa" },
  { campo: "eleg_indicadores_definidos", label: "Possui indicadores definidos para a função" },
  { campo: "eleg_periodo_suficiente", label: "Período mínimo de avaliação suficiente" },
  { campo: "eleg_evidencias_suficientes", label: "Dados e evidências suficientes" },
  { campo: "eleg_requisitos_seguranca", label: "Requisitos mínimos de segurança e conformidade atendidos" },
] as const;

export const TERMO_CIENCIA_TEXTO = [
  "Declaro ter recebido orientação sobre os objetivos, critérios, indicadores aplicáveis à minha função, fontes de dados, metodologia de apuração, regras de elegibilidade e o processo de manifestação previstos no Programa de Reconhecimento por Performance Administrativa (PPO).",
  "Declaro estar ciente de que a participação no programa não gera garantia de recebimento em todos os ciclos, e que o resultado depende da apuração objetiva dos indicadores definidos para a minha função.",
  "Declaro estar ciente de que o PPO não substitui salário, horas extras, adicionais legais, benefícios, obrigações trabalhistas, medidas disciplinares, avaliações de competência, processos de treinamento, procedimentos de segurança ou controles de jornada.",
  "Declaro estar ciente de que o presente termo não implica renúncia a qualquer direito.",
];

// Dias úteis (com feriados) — espelha fn_prazo_contestacao no banco
export function prazoDiasUteis(inicio: Date, dias: number, feriados: string[] = []) {
  const d = new Date(inicio);
  let restantes = dias;
  while (restantes > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    const iso = d.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !feriados.includes(iso)) restantes--;
  }
  return d;
}

export function fmtData(d?: string | null) {
  if (!d) return "—";
  const iso = d.length === 10 ? d + "T00:00:00" : d;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function fmtDataHora(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR");
}

export function fmtNota(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return Number(n).toFixed(2).replace(".", ",");
}
