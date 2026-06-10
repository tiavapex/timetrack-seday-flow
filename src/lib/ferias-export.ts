import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export interface FeriasData {
  matricula: string | null;
  colaborador_nome: string;
  cargo: string | null;
  empresa: string | null;
  centro_custo: string;
  data_emissao: string;
  periodo_aquisitivo_inicio: string;
  periodo_aquisitivo_fim: string;
  data_inicio: string;
  dias_descanso: number;
  abono_data_inicio: string | null;
  abono_dias: number | null;
  observacao: string | null;
}

const fmt = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "";

export function exportFeriasPDF(data: FeriasData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  let y = 15;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SOLICITAÇÃO DE FÉRIAS", W / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.empresa || "Grupo Seday", W / 2, y, { align: "center" });
  y += 8;

  const row = (l1: string, v1: string, l2: string, v2: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(l1, 15, y);
    doc.text(l2, 110, y);
    doc.setFont("helvetica", "normal");
    doc.text(v1, 15, y + 5);
    doc.text(v2, 110, y + 5);
    y += 12;
  };

  row("Data de Emissão:", fmt(data.data_emissao), "Centro de Custo:", data.centro_custo);
  row("Matrícula:", data.matricula || "-", "Colaborador:", data.colaborador_nome);
  row(
    "Cargo:",
    data.cargo || "-",
    "Período Aquisitivo:",
    `${fmt(data.periodo_aquisitivo_inicio)} a ${fmt(data.periodo_aquisitivo_fim)}`
  );
  row(
    "Data de Início:",
    fmt(data.data_inicio),
    "Descanso (dias):",
    String(data.dias_descanso)
  );
  row(
    "Abono - data início:",
    fmt(data.abono_data_inicio),
    "Abono - dias:",
    data.abono_dias ? String(data.abono_dias) : "-"
  );

  if (data.observacao) {
    doc.setFont("helvetica", "bold");
    doc.text("Observação:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.observacao, 180);
    doc.text(lines, 15, y);
    y += lines.length * 5 + 5;
  }

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Datas e Assinaturas:", 15, y);
  y += 12;
  const sig = (label: string) => {
    doc.setFont("helvetica", "normal");
    doc.text("Data: ____/____/______", 15, y);
    doc.line(110, y, 195, y);
    doc.text(label, 152, y + 5, { align: "center" });
    y += 15;
  };
  sig("Solicitante/Responsável");
  sig("Administrativo/RH");
  sig("Diretoria");

  doc.setFontSize(8);
  doc.text("Rev. 00", W - 15, 290, { align: "right" });

  doc.save(`ferias_${data.colaborador_nome.replace(/\s+/g, "_")}.pdf`);
}

export function exportFeriasXLSX(data: FeriasData) {
  const rows = [
    ["SOLICITAÇÃO DE FÉRIAS"],
    [data.empresa || "Grupo Seday"],
    [],
    ["Data de Emissão:", fmt(data.data_emissao), "Centro de Custo:", data.centro_custo],
    ["Matrícula:", data.matricula || "", "Colaborador:", data.colaborador_nome],
    [
      "Cargo:",
      data.cargo || "",
      "Período Aquisitivo:",
      `${fmt(data.periodo_aquisitivo_inicio)} a ${fmt(data.periodo_aquisitivo_fim)}`,
    ],
    ["Data de Início:", fmt(data.data_inicio), "Descanso (dias):", data.dias_descanso],
    [
      "Abono - data início:",
      fmt(data.abono_data_inicio),
      "Abono - dias:",
      data.abono_dias || "",
    ],
    ["Observação:", data.observacao || ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 22 }, { wch: 30 }, { wch: 22 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Férias");
  XLSX.writeFile(wb, `ferias_${data.colaborador_nome.replace(/\s+/g, "_")}.xlsx`);
}
