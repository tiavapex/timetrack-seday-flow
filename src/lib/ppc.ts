// PPC – Motoristas (Seday Equipamentos, Rev. 00 19/09/2026) — contrato Gerdau
export type Responsavel = "operacional" | "rh" | "seguranca";

export const PPC_VALOR_INTEGRAL = 600;
export const PPC_MAX_SEGURANCA = 40;
export const PPC_MAX_OPERACAO = 60;

export const PPC_ITENS_ADM: { key: string; label: string; resp: Responsavel[] }[] = [
  { key: "1.1", label: "Falta injustificada; ausência sem atestado ou sem comunicar à Supervisão antes do horário de trabalho", resp: ["operacional", "rh"] },
  { key: "1.2", label: "Insubordinação / desrespeito aos colegas e superiores", resp: ["operacional"] },
  { key: "1.3", label: "Álcool, medicamento ou drogas", resp: ["seguranca"] },
  { key: "1.4", label: "Celular, cigarro e cinto", resp: ["seguranca"] },
  { key: "1.5", label: "Sinal vermelho e passagem de nível", resp: ["operacional"] },
  { key: "1.6", label: "Velocidade: Gerdau 30 km/h; pista seca até 80 km/h; molhada até 60 km/h, respeitando limite menor da via", resp: ["seguranca"] },
];

export const RESP_LABEL: Record<Responsavel, string> = {
  operacional: "Operacional (Diego Rodrigues)",
  rh: "RH",
  seguranca: "Segurança (Pamela Helena Corrêa)",
};

/** adm: item key -> true (cumprido) / false (descumprido). Ausente = cumprido. */
export function calcularPPC(adm: Record<string, boolean>, seg: number, op: number) {
  const admOk = PPC_ITENS_ADM.every((i) => adm[i.key] !== false) && adm["1.1.operacional"] !== false && adm["1.1.rh"] !== false;
  const s = Math.min(Math.max(seg || 0, 0), PPC_MAX_SEGURANCA);
  const o = Math.min(Math.max(op || 0, 0), PPC_MAX_OPERACAO);
  const pontos = admOk ? s + o : 0;
  const valor = Math.round(((pontos / 100) * PPC_VALOR_INTEGRAL + Number.EPSILON) * 100) / 100;
  return { admOk, pontos, valor };
}

export type ItensPPC = Record<string, boolean | string | number>;
export const PPC_SEGURANCA = [
  { key: "2.1", label: "Ciência do PO e conhecimento dos riscos e do ambiente de trabalho", pontos: 5 },
  { key: "2.2", label: "Leitura do DDS e confirmação de ciência no prazo", pontos: 5 },
  { key: "2.3", label: "Cumprimento das normas e procedimentos de Segurança da Seday e da Gerdau", pontos: 10 },
  { key: "2.4", label: "Utilizar e portar uniforme, EPIs e EPCs obrigatórios", pontos: 10 },
];
export const PPC_OPERACAO = [
  { key: "3.1", label: "Limpeza, organização e conservação da cabine interna", pontos: 5 },
  { key: "3.2", label: "Preencher Controle de Pesagem, Part Diária, checklist da carreta e áreas da Gerdau; extrair dados do Disco Tacógrafo toda segunda-feira pela manhã", pontos: 10 },
  { key: "3.3", label: "Comunicar e obter autorização da Supervisão para atraso ou saída antecipada", pontos: 10 },
  { key: "3.4", label: "Cumprimento das etapas e procedimentos do ciclo operacional", pontos: 10 },
  { key: "3.5", label: "Transportar carga com tampa bem encaixada e mangote de descarga preso", pontos: 15 },
];
export function descontoDano(valor: number) {
  if (!Number.isFinite(valor) || valor <= 0) return 0;
  return valor <= 500 ? 2 : valor <= 1000 ? 3 : 5;
}
export function pontosSeguranca(itens: ItensPPC) {
  const desconto = PPC_SEGURANCA.reduce((n, i) => n + (itens[i.key] === false ? i.pontos : 0), 0);
  const incidente = { baixo: 2, medio: 3, alto: 5 }[String(itens.incidente)] || 0;
  return Math.max(0, PPC_MAX_SEGURANCA - desconto - incidente);
}
export function pontosOperacao(itens: ItensPPC) {
  const desconto = PPC_OPERACAO.reduce((n, i) => n + (itens[i.key] === false ? i.pontos : 0), 0);
  return Math.max(0, PPC_MAX_OPERACAO - desconto - descontoDano(Number(itens.dano)));
}

/** Período de apuração: dia 26 do mês anterior a 25 do mês de referência. */
export function periodoPPC(ref: Date) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const base = ref.getDate() >= 26 ? m + 1 : m;
  const fim = new Date(y, base, 25);
  const inicio = new Date(y, base - 1, 26);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { inicio: iso(inicio), fim: iso(fim) };
}
