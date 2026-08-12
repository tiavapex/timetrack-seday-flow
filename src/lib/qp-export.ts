import jsPDF from "jspdf";

export interface QPData {
  empresa: string;
  area: string | null;
  data_evento: string;
  data_entrega: string | null;
  tp_admissao: boolean;
  tp_demissao: boolean;
  tp_reembolso: boolean;
  tp_advertencia: boolean;
  tp_abono: boolean;
  tp_acerto_ponto: boolean;
  tp_troca: boolean;
  tp_compensacao: boolean;
  tp_folga: boolean;
  nome: string;
  cargo: string | null;
  salario: string | null;
  matricula: string | null;
  motivo: string;
  rec_aprovado: boolean;
  rec_treinamento: boolean;
  rec_reprovado: boolean;
  rec_curriculo: boolean;
  rec_cursos: boolean;
  rec_outros: boolean;
  indicado_por: string | null;
  tempo_experiencia: string | null;
  data_necessidade_admissao: string | null;
  data_exame_admissional: string | null;
  data_admissao: string | null;
  ben_ad_funcao: boolean;
  ben_ad_funcao_valor: string | null;
  ben_va_vr: string | null;
  ben_va_vr_ativo: boolean;
  ben_va_vr_valor: string | null;
  ben_ppo: boolean;
  ben_ppo_valor: string | null;
  ben_vt: boolean;
  ben_vt_valor: string | null;
  ben_plano_saude: boolean;
  ben_plano_saude_fob: string | null;
  ben_plano_odonto: boolean;
  ben_outro: string | null;
  ben_obs: string | null;
  unif_calca: string | null;
  unif_camisa: string | null;
  unif_jaqueta: string | null;
  unif_botina: string | null;
  unif_capa_chuva: string | null;
  observacoes: string | null;
}

const d = (v?: string | null) =>
  v ? new Date(v + "T00:00:00").toLocaleDateString("pt-BR") : "____/____/______";

const chk = (label: string, on: boolean) => `${on ? "( X )" : "(    )"} ${label}`;
const sn = (on: boolean) => `N ${on ? "( )" : "(X)"}   S ${on ? "(X)" : "( )"}`;

export function exportQPtoPDF(qp: QPData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 12;
  let y = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("QP - QUEIRA PROVIDENCIAR", W / 2, y, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(`Empresa: ${qp.empresa}`, M, y);
  doc.text(`Data evento: ${d(qp.data_evento)}`, W - M, y, { align: "right" });
  y += 5;
  doc.text(`Área: ${qp.area || "-"}`, M, y);
  doc.text(`Data entrega: ${d(qp.data_entrega)}`, W - M, y, { align: "right" });
  y += 4;
  doc.line(M, y, W - M, y);

  const box = (title: string, lines: string[][], h = 5) => {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    lines.forEach((cols) => {
      y += h;
      const w = (W - 2 * M) / cols.length;
      cols.forEach((c, i) => doc.text(c, M + i * w, y, { maxWidth: w - 2 }));
    });
    y += 2;
    doc.line(M, y, W - M, y);
  };

  box("TIPO DE SOLICITAÇÃO", [
    [chk("ADMISSÃO", qp.tp_admissao), chk("ADVERTÊNCIA / SUSPENSÃO", qp.tp_advertencia), chk("TROCA", qp.tp_troca)],
    [chk("DEMISSÃO", qp.tp_demissao), chk("ABONO", qp.tp_abono), chk("COMPENSAÇÃO", qp.tp_compensacao)],
    [chk("REEMBOLSO", qp.tp_reembolso), chk("ACERTO DE PONTO", qp.tp_acerto_ponto), chk("FOLGA", qp.tp_folga)],
  ]);

  box("COLABORADOR", [
    [`NOME: ${qp.nome}`],
    [`CARGO: ${qp.cargo || "-"}`, `MATRÍCULA: ${qp.matricula || "-"}`],
    [`SALÁRIO: ${qp.salario || "-"}`],
    [`MOTIVO: ${qp.motivo}`],
  ]);

  box("RECRUTAMENTO E SELEÇÃO", [
    [chk("APROVADO", qp.rec_aprovado), chk("CURRÍCULO", qp.rec_curriculo), `INDICADO POR: ${qp.indicado_por || "-"}`],
    [chk("TREINAMENTO", qp.rec_treinamento), chk("CURSOS", qp.rec_cursos), `TEMPO DE EXPERIÊNCIA: ${qp.tempo_experiencia || "-"}`],
    [chk("REPROVADO", qp.rec_reprovado), chk("OUTROS", qp.rec_outros), ""],
    [`NECESSIDADE PARA ADMISSÃO: ${d(qp.data_necessidade_admissao)}`],
    [`EXAME ADMISSIONAL: ${d(qp.data_exame_admissional)}`, `ADMISSÃO: ${d(qp.data_admissao)}`],
  ]);

  box("BENEFÍCIOS / UNIFORME (tamanho / numeração)", [
    [`AD FUNÇÃO / GRATIFICAÇÃO  ${sn(qp.ben_ad_funcao)}  Valor (%): ${qp.ben_ad_funcao_valor || "-"}`, `CALÇA: ${qp.unif_calca || "-"}`],
    [`${qp.ben_va_vr || "VA / VR"} (valor dia)  ${sn(qp.ben_va_vr_ativo)}  Valor: ${qp.ben_va_vr_valor || "-"}`, `CAMISA: ${qp.unif_camisa || "-"}`],
    [`PPO  ${sn(qp.ben_ppo)}  Valor: ${qp.ben_ppo_valor || "-"}`, `JAQUETA: ${qp.unif_jaqueta || "-"}`],
    [`VT / AUXÍLIO (valor dia)  ${sn(qp.ben_vt)}  Valor: ${qp.ben_vt_valor || "-"}`, `BOTINA: ${qp.unif_botina || "-"}`],
    [`PLANO DE SAÚDE  ${sn(qp.ben_plano_saude)}  ${qp.ben_plano_saude_fob || ""}`, `CAPA DE CHUVA: ${qp.unif_capa_chuva || "-"}`],
    [`PLANO ODONTOLÓGICO  ${sn(qp.ben_plano_odonto)}`, `Outro: ${qp.ben_outro || "-"}`],
    [`Obs.: ${qp.ben_obs || "-"}`],
  ]);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("OBSERVAÇÕES:", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  y += 5;
  doc.text(doc.splitTextToSize(qp.observacoes || "-", W - 2 * M), M, y);
  y += 24;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const cols = ["RESPONSÁVEL", "ENCARREGADO/COORDENADOR", "DIRETORIA", "ADMINISTRATIVO"];
  const cw = (W - 2 * M) / cols.length;
  cols.forEach((c, i) => {
    doc.line(M + i * cw + 2, y, M + (i + 1) * cw - 2, y);
    doc.text(c, M + i * cw + cw / 2, y + 4, { align: "center", maxWidth: cw - 4 });
    doc.setFont("helvetica", "normal");
    doc.text("Data: ____/____/______", M + i * cw + cw / 2, y + 9, { align: "center" });
    doc.setFont("helvetica", "bold");
  });
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("PARA OS APROVADORES: DATA E ASSINATURA", M, y);
  doc.text("Rev. 02: 01/08/2022", W - M, y, { align: "right" });

  doc.save(`QP-${qp.nome.replace(/\s+/g, "_")}-${qp.data_evento}.pdf`);
}
