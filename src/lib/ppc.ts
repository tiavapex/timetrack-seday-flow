// PPC – Motoristas (Seday Equipamentos, Rev. 00 19/09/2026) — contrato Gerdau
export type Responsavel = "operacional" | "rh" | "seguranca";

export const PPC_VALOR_INTEGRAL = 600;
export const PPC_MAX_SEGURANCA = 40;
export const PPC_MAX_OPERACAO = 60;

export const PPC_ITENS_ADM: { key: string; label: string; resp: Responsavel[] }[] = [
  { key: "1.1", label: "Falta injustificada", resp: ["operacional", "rh"] },
  { key: "1.2", label: "Insubordinação", resp: ["operacional"] },
  { key: "1.3", label: "Álcool, medicamento ou drogas", resp: ["seguranca"] },
  { key: "1.4", label: "Celular, cigarro e cinto", resp: ["seguranca"] },
  { key: "1.5", label: "Sinal vermelho e passagem de nível", resp: ["operacional"] },
  { key: "1.6", label: "Velocidade", resp: ["seguranca"] },
];

export const RESP_LABEL: Record<Responsavel, string> = {
  operacional: "Operacional (Diego Rodrigues)",
  rh: "RH",
  seguranca: "Segurança (Pamela Helena Corrêa)",
};

/** adm: item key -> true (cumprido) / false (descumprido). Ausente = cumprido. */
export function calcularPPC(adm: Record<string, boolean>, seg: number, op: number) {
  const admOk = PPC_ITENS_ADM.every((i) => adm[i.key] !== false);
  const s = Math.min(Math.max(seg || 0, 0), PPC_MAX_SEGURANCA);
  const o = Math.min(Math.max(op || 0, 0), PPC_MAX_OPERACAO);
  const pontos = admOk ? s + o : 0;
  const valor = Math.round(((pontos / 100) * PPC_VALOR_INTEGRAL + Number.EPSILON) * 100) / 100;
  return { admOk, pontos, valor };
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
