export const AREAS = [
  "01-GERAL",
  "06-MATRIZ",
  "07-LOGISTICA",
  "08-USIMINAS IPATINGA",
  "09-VALE JUATUBA",
];

export const SETORES = [
  "02-ADMINISTRATIVO",
  "20-DP/RH",
  "18-SESMT",
  "04-MANUTENCAO",
  "08-LOGISTICA",
  "13-FINANCEIRO",
  "14-COMERCIAL",
  "15-OPERACIONAL",
  "16-SUPRIMENTOS",
  "07-ALMOXARIFADO",
  "17-LIMPEZA",
  "21-SGI",
  "22-TI",
  "23-VENDAS",
];

export const SECOES = [
  "09-ADMINISTRATIVO",
  "44-DP/RH",
  "34-SESMT",
  "30-MANUTENCAO",
  "10-TRANSP RODOVIARIO",
  "35-ADM LOGISTICA",
  "43-FINANCEIRO",
  "33-COMERCIAL",
  "23-OPE EMP MRS",
  "36-SUPRIMENTOS",
  "45-SGI",
  "46-TI",
  "47-APOIO",
  "48-POS VENDAS",
];

/**
 * Calcula a data de término da avaliação somando o período (em dias) à data de admissão.
 * @param dataAdmissao formato YYYY-MM-DD
 * @param periodo "30" | "60" | "90"
 */
export function calcularDataTermino(dataAdmissao: string, periodo: string): string {
  if (!dataAdmissao) return "";
  const dias = parseInt(periodo, 10);
  if (!dias) return "";
  const d = new Date(dataAdmissao + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}
