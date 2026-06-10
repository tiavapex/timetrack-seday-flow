import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ASEColaborador {
  matricula: string | null;
  nome: string;
  cargo: string | null;
  escala_sim: boolean;
  numero: number | null;
  vt: boolean;
  alimentacao: boolean;
}

export interface ASEData {
  periodo_data: string;
  cliente: string;
  centro_custo: string;
  responsavel: string;
  lider_gestor: string | null;
  setor: string;
  setor_outro: string | null;
  horario_inicio: string;
  horario_fim: string;
  atividades: string;
  observacao: string | null;
  colaboradores: ASEColaborador[];
}

const CC_LABEL: Record<string, string> = {
  "605": "605: MATRIZ",
  "607": "607: CONTRATO EMPILHADEIRAS",
  "609": "609: TRANSPORTES",
};

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function check(v: string, on: boolean) {
  return on ? `(X) ${v}` : `(  ) ${v}`;
}

export function exportASEtoPDF(ase: ASEData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 12;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("AUTORIZAÇÃO DE SERVIÇOS EXTRAORDINÁRIOS - ASE", pageWidth / 2, y, {
    align: "center",
  });
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Período: ${formatDate(ase.periodo_data)}`, pageWidth - 14, y, { align: "right" });
  doc.text("Rev. 00 - 01/03/2021", 14, y);
  y += 6;

  const setores = ["ADM", "EMPILHADEIRA", "TRANSPORTE", "OUTRO"];
  const ccs = ["605", "607", "609"];

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    body: [
      [{ content: "CLIENTE:", styles: { fontStyle: "bold" } }, { content: ase.cliente, colSpan: 3 }],
      [
        { content: "C.CUSTO:", styles: { fontStyle: "bold" } },
        {
          content: ccs.map((c) => check(CC_LABEL[c], ase.centro_custo === c)).join("    "),
          colSpan: 3,
        },
      ],
      [
        { content: "RESPONSÁVEL:", styles: { fontStyle: "bold" } },
        ase.responsavel,
        { content: "LÍDER/GESTOR:", styles: { fontStyle: "bold" } },
        ase.lider_gestor || "",
      ],
      [
        { content: "SETOR:", styles: { fontStyle: "bold" } },
        {
          content:
            setores
              .map((s) =>
                check(
                  s === "OUTRO" && ase.setor === "OUTRO" && ase.setor_outro
                    ? `OUTRO: ${ase.setor_outro}`
                    : s,
                  ase.setor === s
                )
              )
              .join("  "),
          colSpan: 1,
        },
        { content: "HORÁRIO PREVISTO:", styles: { fontStyle: "bold" } },
        `${ase.horario_inicio.slice(0, 5)} às ${ase.horario_fim.slice(0, 5)}`,
      ],
    ],
    columnStyles: { 0: { cellWidth: 28 }, 2: { cellWidth: 38 } },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["ESCALA SIM", "N°", "MATRÍCULA", "NOME", "CARGO", "VT", "ALIMENTAÇÃO"]],
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2 },
    body:
      ase.colaboradores.length > 0
        ? ase.colaboradores.map((c) => [
            c.escala_sim ? "X" : "",
            c.numero ?? "",
            c.matricula ?? "",
            c.nome,
            c.cargo ?? "",
            c.vt ? "Sim" : "",
            c.alimentacao ? "Sim" : "",
          ])
        : [["", "", "", "", "", "", ""]],
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    body: [
      [{ content: "ATIVIDADES:", styles: { fontStyle: "bold", cellWidth: 28 } }, ase.atividades],
      [
        { content: "OBSERVAÇÃO:", styles: { fontStyle: "bold", cellWidth: 28 } },
        ase.observacao || "",
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "A ASE diária deverá ser entregue ao DP até às 14:00h. A ASE de fim de semana deverá ser entregue ao DP até às 12:00h de sexta-feira.",
    14,
    y,
    { maxWidth: pageWidth - 28 }
  );

  doc.save(`ASE_${ase.cliente}_${ase.periodo_data}.pdf`);
}

export function exportASEtoXLSX(ase: ASEData) {
  const rows: (string | number)[][] = [
    ["AUTORIZAÇÃO DE SERVIÇOS EXTRAORDINÁRIOS - ASE", "", "", "", "", "Período:", formatDate(ase.periodo_data)],
    [],
    ["CLIENTE:", ase.cliente],
    ["C.CUSTO:", CC_LABEL[ase.centro_custo] ?? ase.centro_custo],
    ["RESPONSÁVEL:", ase.responsavel, "", "LÍDER/GESTOR:", ase.lider_gestor || ""],
    [
      "SETOR:",
      ase.setor === "OUTRO" && ase.setor_outro ? `OUTRO: ${ase.setor_outro}` : ase.setor,
      "",
      "HORÁRIO PREVISTO:",
      `${ase.horario_inicio.slice(0, 5)} às ${ase.horario_fim.slice(0, 5)}`,
    ],
    [],
    ["ESCALA SIM", "N°", "MATRÍCULA", "NOME", "CARGO", "VT", "ALIMENTAÇÃO"],
    ...ase.colaboradores.map((c) => [
      c.escala_sim ? "X" : "",
      c.numero ?? "",
      c.matricula ?? "",
      c.nome,
      c.cargo ?? "",
      c.vt ? "Sim" : "",
      c.alimentacao ? "Sim" : "",
    ]),
    [],
    ["ATIVIDADES:", ase.atividades],
    ["OBSERVAÇÃO:", ase.observacao || ""],
    [],
    [
      "A ASE diária deverá ser entregue ao DP até às 14:00h. A ASE de fim de semana deverá ser entregue ao DP até às 12:00h de sexta-feira.",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 30 }, { wch: 22 }, { wch: 8 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ASE");
  XLSX.writeFile(wb, `ASE_${ase.cliente}_${ase.periodo_data}.xlsx`);
}
