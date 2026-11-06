import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function relatorioMotoristas(titulo: string, periodo: { inicio: string; fim: string }, colunas: string[], linhas: (string | number)[][], pagamento: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(15);
  doc.text(`${titulo} — Motoristas Gerdau`, 14, 16);
  doc.setFontSize(10);
  const fmt = (d: string) => d.split("-").reverse().join("/");
  doc.text(`Período: ${fmt(periodo.inicio)} a ${fmt(periodo.fim)} | ${pagamento}`, 14, 24);
  autoTable(doc, { startY: 30, head: [colunas], body: linhas, styles: { fontSize: 9 }, theme: "grid" });
  doc.addPage();
  doc.text("Ciência do colaborador", 14, 20);
  autoTable(doc, { startY: 28, head: [["Colaborador", "Assinatura", "Data"]], body: linhas.map(l => [String(l[0]), "", ""]), styles: { minCellHeight: 18 }, theme: "grid" });
  doc.save(`${titulo}-Motoristas-${periodo.inicio}.pdf`);
}