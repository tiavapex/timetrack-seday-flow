import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { notaLabel } from "./competencias";

export function exportAvaliacaoPDF(avaliacao: any, itens: any[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.text("AVALIAÇÃO DAS COMPETÊNCIAS", w / 2, 40, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Período de experiência: ${avaliacao.periodo} dias`, w / 2, 58, { align: "center" });

  autoTable(doc, {
    startY: 75,
    theme: "grid",
    styles: { fontSize: 9 },
    body: [
      ["Nome", avaliacao.nome || "", "Cargo", avaliacao.cargo || ""],
      ["Setor/Centro de Custo", avaliacao.setor || "", "Matrícula", avaliacao.matricula || ""],
      ["Data de admissão", avaliacao.data_admissao || "", "Data de término", avaliacao.data_termino || ""],
    ],
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["#", "Competência", "Avaliação"]],
    body: itens.map((it, i) => [i + 1, `${it.competencia}\n${it.descricao || ""}`, notaLabel(it.nota)]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [30, 64, 175] },
    columnStyles: { 0: { cellWidth: 25 }, 2: { cellWidth: 90 } },
  });

  let y = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Observações do avaliador:", 40, y);
  doc.setFont("helvetica", "normal");
  const obs = doc.splitTextToSize(avaliacao.observacoes || "", w - 80);
  doc.text(obs, 40, y + 14);
  y = y + 14 + obs.length * 12 + 10;

  doc.setFont("helvetica", "bold");
  doc.text("Medida a ser tomada:", 40, y);
  doc.setFont("helvetica", "normal");
  const medidas = ["prorrogar", "efetivar", "demitir"];
  doc.text(
    medidas.map((m) => `${avaliacao.medida === m ? "(X)" : "( )"} ${m.charAt(0).toUpperCase() + m.slice(1)}`).join("    "),
    40,
    y + 14
  );
  y += 32;

  doc.setFont("helvetica", "bold");
  doc.text("Mobilização:", 40, y);
  doc.setFont("helvetica", "normal");
  if (avaliacao.mobilizacao) {
    doc.text(`(X) Sim — Data de mobilização: ${avaliacao.data_mobilizacao || ""}`, 40, y + 14);
  } else {
    doc.text(`(X) Não — Motivo: ${avaliacao.motivo_nao_mobilizacao || ""}`, 40, y + 14);
  }
  y += 36;

  doc.text("Responsável avaliação: ____________________________________", 40, y);
  doc.text("Administrativo: __________________________________________", 40, y + 20);
  doc.text("Diretoria: ______________________________________________", 40, y + 40);

  doc.save(`avaliacao-${avaliacao.nome || "competencias"}-${avaliacao.periodo}d.pdf`);
}
