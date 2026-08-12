import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getPilar, PPO_NOTA_OBS, totalMaximo } from "./ppo-criterios";

export interface PPOItemData {
  matricula: string | null;
  nome: string;
  funcao: string | null;
  criterios: Record<string, boolean>;
  total: number | null;
  observacao: string | null;
}

export interface PPOData {
  tipo: string;
  pilar: string;
  empresa: string | null;
  periodo_inicio: string;
  periodo_fim: string;
  observacao: string | null;
  itens: PPOItemData[];
}

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function cellValue(modo: string, ok: boolean, peso: number) {
  if (modo === "pontuacao") return ok ? String(peso) : "0";
  return ok ? "ok" : "-";
}

export function exportPPOtoPDF(ppo: PPOData) {
  const pilar = getPilar(ppo.tipo);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(pilar.titulo.toUpperCase(), pageWidth / 2, 12, { align: "center" });
  doc.setFontSize(10);
  doc.text(pilar.pilar, pageWidth / 2, 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(
    `Período: ${fmt(ppo.periodo_inicio)} a ${fmt(ppo.periodo_fim)}${
      ppo.empresa ? "   |   Empresa: " + ppo.empresa : ""
    }`,
    pageWidth / 2,
    24,
    { align: "center" }
  );

  const head = [
    [
      "MAT",
      "NOME",
      "FUNÇÃO",
      ...pilar.criterios.map((c) => c.label),
      ...(pilar.modo === "pontuacao" ? ["TOTAL"] : []),
      "Observação",
    ],
  ];

  const pesos = [
    "AVALIAÇÃO",
    "",
    "",
    ...pilar.criterios.map((c) => String(c.peso)),
    ...(pilar.modo === "pontuacao" ? [String(totalMaximo(pilar))] : []),
    "",
  ];

  const body = ppo.itens.map((i) => [
    i.matricula || "",
    i.nome,
    i.funcao || "",
    ...pilar.criterios.map((c) =>
      cellValue(pilar.modo, i.criterios?.[c.key] !== false, c.peso)
    ),
    ...(pilar.modo === "pontuacao" ? [String(i.total ?? "")] : []),
    i.observacao || "",
  ]);

  autoTable(doc, {
    head,
    body: [pesos, ...body],
    startY: 30,
    styles: { fontSize: 6.5, cellPadding: 1, halign: "center", valign: "middle" },
    headStyles: { fillColor: [30, 64, 124], fontSize: 6, textColor: 255 },
    columnStyles: { 1: { halign: "left", cellWidth: 40 }, 2: { halign: "left" } },
    theme: "grid",
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(7);
  doc.text(PPO_NOTA_OBS, 10, finalY, { maxWidth: pageWidth - 20 });
  if (ppo.observacao) {
    doc.setFontSize(8);
    doc.text(`Observação geral: ${ppo.observacao}`, 10, finalY + 8, {
      maxWidth: pageWidth - 20,
    });
  }

  doc.save(`PPO-${pilar.tipo}-${ppo.periodo_inicio}.pdf`);
}

export function exportPPOtoExcel(ppo: PPOData) {
  const pilar = getPilar(ppo.tipo);
  const rows: (string | number)[][] = [
    [pilar.titulo],
    [pilar.pilar, "", "", `Período: ${fmt(ppo.periodo_inicio)} a ${fmt(ppo.periodo_fim)}`],
    [],
    [
      "MAT",
      "NOME",
      "FUNÇÃO",
      ...pilar.criterios.map((c) => c.label),
      ...(pilar.modo === "pontuacao" ? ["TOTAL"] : []),
      "Observação",
    ],
    [
      "AVALIAÇÃO",
      "",
      "",
      ...pilar.criterios.map((c) => c.peso),
      ...(pilar.modo === "pontuacao" ? [totalMaximo(pilar)] : []),
      "",
    ],
    ...ppo.itens.map((i) => [
      i.matricula || "",
      i.nome,
      i.funcao || "",
      ...pilar.criterios.map((c) =>
        pilar.modo === "pontuacao"
          ? i.criterios?.[c.key] !== false
            ? c.peso
            : 0
          : i.criterios?.[c.key] !== false
          ? "ok"
          : "-"
      ),
      ...(pilar.modo === "pontuacao" ? [i.total ?? ""] : []),
      i.observacao || "",
    ]),
    [],
    [PPO_NOTA_OBS],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PPO");
  XLSX.writeFile(wb, `PPO-${pilar.tipo}-${ppo.periodo_inicio}.xlsx`);
}
