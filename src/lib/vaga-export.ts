import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface VagaPDFData {
  numero?: number;
  solicitante_nome: string;
  solicitante_cargo?: string | null;
  solicitante_contato?: string | null;
  unidade: string;
  area_departamento: string;
  centro_custo?: string | null;
  tipo_vaga: string;
  cargo_substituido?: string | null;
  data_solicitacao: string;
  cargo_solicitado: string;
  reporta_se_a?: string | null;
  area_setor?: string | null;
  escala_trabalho?: string | null;
  numero_vagas: number;
  vaga_sigilosa: boolean;
  local_trabalho?: string | null;
  regime_contratacao?: string | null;
  faixa_salarial?: string | null;
  beneficios?: string | null;
  motivo_substituicao?: string | null;
  motivo_necessidade?: string | null;
  impacto_nao_preenchida?: string | null;
  prazo_atendimento?: string | null;
  escolaridade?: string | null;
  formacao?: string | null;
  tempo_experiencia?: string | null;
  registro_profissional?: string | null;
  idiomas?: string | null;
  informatica?: string | null;
  cnh?: string | null;
  residir_regiao?: string | null;
  disp_viagens?: string | null;
  disp_mudanca?: string | null;
  cursos_ferramentas?: string | null;
  alt_realocacao?: boolean;
  alt_promocao?: boolean;
  alt_banco_talentos?: boolean;
  alt_terceirizacao?: boolean;
  alt_na?: boolean;
  justificativa_sem_alternativa?: string | null;
  experiencia_necessaria?: string | null;
  atividades_realizadas?: string | null;
  soft_skills?: string | null;
  observacoes_particularidades?: string | null;
  recursos_ti?: string | null;
  recursos_logistica?: string | null;
  recursos_infraestrutura?: string | null;
  recursos_sst?: string | null;
  recursos_financeiro?: string | null;
}

const fmtDate = (d?: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "";
const chk = (label: string, on?: boolean) => `${on ? "[X]" : "[ ]"} ${label}`;

export function exportVagaToPDF(v: VagaPDFData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("FORMULÁRIO DE ABERTURA DE VAGA", w / 2, 12, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`FO-RH-03  REV. 00  Data: 20/02/2026`, w - 14, 12, { align: "right" });
  if (v.numero) doc.text(`Nº ${v.numero}`, 14, 12);

  let y = 18;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 1.5 },
    body: [
      [
        { content: "SOLICITANTE:", styles: { fontStyle: "bold" } }, v.solicitante_nome,
        { content: "CARGO:", styles: { fontStyle: "bold" } }, v.solicitante_cargo || "",
      ],
      [
        { content: "CONTATO:", styles: { fontStyle: "bold" } }, v.solicitante_contato || "",
        { content: "DATA:", styles: { fontStyle: "bold" } }, fmtDate(v.data_solicitacao),
      ],
      [
        { content: "UNIDADE:", styles: { fontStyle: "bold" } }, v.unidade,
        { content: "ÁREA/DEPTO:", styles: { fontStyle: "bold" } }, v.area_departamento,
      ],
      [
        { content: "C.CUSTO:", styles: { fontStyle: "bold" } }, v.centro_custo || "",
        { content: "TIPO DE VAGA:", styles: { fontStyle: "bold" } }, v.tipo_vaga,
      ],
      [
        { content: "CARGO SUBSTITUÍDO:", styles: { fontStyle: "bold" } }, v.cargo_substituido || "",
        { content: "MOTIVO SUBST.:", styles: { fontStyle: "bold" } }, v.motivo_substituicao || "",
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 2;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [[{ content: "INFORMAÇÕES DA VAGA", colSpan: 4, styles: { halign: "center", fillColor: [30, 64, 175] } }]],
    styles: { fontSize: 9, cellPadding: 1.5 },
    body: [
      [
        { content: "Cargo solicitado:", styles: { fontStyle: "bold" } }, v.cargo_solicitado,
        { content: "Reporta-se a:", styles: { fontStyle: "bold" } }, v.reporta_se_a || "",
      ],
      [
        { content: "Área/setor:", styles: { fontStyle: "bold" } }, v.area_setor || "",
        { content: "Escala:", styles: { fontStyle: "bold" } }, v.escala_trabalho || "",
      ],
      [
        { content: "Nº de vagas:", styles: { fontStyle: "bold" } }, String(v.numero_vagas),
        { content: "Sigilosa:", styles: { fontStyle: "bold" } }, v.vaga_sigilosa ? "Sim" : "Não",
      ],
      [
        { content: "Local trabalho:", styles: { fontStyle: "bold" } }, v.local_trabalho || "",
        { content: "Regime:", styles: { fontStyle: "bold" } }, v.regime_contratacao || "",
      ],
      [
        { content: "Faixa salarial:", styles: { fontStyle: "bold" } }, v.faixa_salarial || "",
        { content: "Prazo:", styles: { fontStyle: "bold" } }, fmtDate(v.prazo_atendimento),
      ],
      [{ content: "Benefícios:", styles: { fontStyle: "bold" } }, { content: v.beneficios || "", colSpan: 3 }],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 2;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [[{ content: "JUSTIFICATIVA DA REQUISIÇÃO", colSpan: 2, styles: { halign: "center", fillColor: [30, 64, 175] } }]],
    styles: { fontSize: 9, cellPadding: 1.5 },
    body: [
      [
        { content: "Motivo da necessidade:\n" + (v.motivo_necessidade || "") },
        { content: "Impacto caso não preenchida:\n" + (v.impacto_nao_preenchida || "") },
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 2;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [[{ content: "PERFIL DO CANDIDATO", colSpan: 4, styles: { halign: "center", fillColor: [30, 64, 175] } }]],
    styles: { fontSize: 9, cellPadding: 1.5 },
    body: [
      [
        { content: "Escolaridade:", styles: { fontStyle: "bold" } }, v.escolaridade || "",
        { content: "Idiomas:", styles: { fontStyle: "bold" } }, v.idiomas || "",
      ],
      [
        { content: "Formação:", styles: { fontStyle: "bold" } }, v.formacao || "",
        { content: "Informática:", styles: { fontStyle: "bold" } }, v.informatica || "",
      ],
      [
        { content: "Experiência:", styles: { fontStyle: "bold" } }, v.tempo_experiencia || "",
        { content: "CNH:", styles: { fontStyle: "bold" } }, v.cnh || "",
      ],
      [
        { content: "Registro Prof.:", styles: { fontStyle: "bold" } }, v.registro_profissional || "",
        { content: "Residir região:", styles: { fontStyle: "bold" } }, v.residir_regiao || "",
      ],
      [
        { content: "Disp. viagens:", styles: { fontStyle: "bold" } }, v.disp_viagens || "",
        { content: "Disp. mudança:", styles: { fontStyle: "bold" } }, v.disp_mudanca || "",
      ],
      [{ content: "Cursos/ferramentas:", styles: { fontStyle: "bold" } }, { content: v.cursos_ferramentas || "", colSpan: 3 }],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 2;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [[{ content: "AVALIAÇÃO DE ALTERNATIVAS", colSpan: 5, styles: { halign: "center", fillColor: [30, 64, 175] } }]],
    styles: { fontSize: 9, cellPadding: 1.5, halign: "center" },
    body: [
      [
        chk("Realocação interna", v.alt_realocacao),
        chk("Promoção interna", v.alt_promocao),
        chk("Banco de talentos", v.alt_banco_talentos),
        chk("Terceirização", v.alt_terceirizacao),
        chk("N/A", v.alt_na),
      ],
      [{ content: "Justificativa:\n" + (v.justificativa_sem_alternativa || ""), colSpan: 5, styles: { halign: "left" } }],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 2;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [[{ content: "DESCRIÇÃO DO CARGO", colSpan: 2, styles: { halign: "center", fillColor: [30, 64, 175] } }]],
    styles: { fontSize: 9, cellPadding: 1.5 },
    body: [
      [
        { content: "Experiência necessária:\n" + (v.experiencia_necessaria || "") },
        { content: "Atividades:\n" + (v.atividades_realizadas || "") },
      ],
      [
        { content: "Soft skills:\n" + (v.soft_skills || "") },
        { content: "Observações:\n" + (v.observacoes_particularidades || "") },
      ],
    ],
  });

  doc.addPage();
  y = 14;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [[{ content: "RECURSOS NECESSÁRIOS", colSpan: 2, styles: { halign: "center", fillColor: [30, 64, 175] } }]],
    styles: { fontSize: 9, cellPadding: 1.5 },
    body: [
      [{ content: "TI:", styles: { fontStyle: "bold", cellWidth: 32 } }, v.recursos_ti || ""],
      [{ content: "Logística:", styles: { fontStyle: "bold" } }, v.recursos_logistica || ""],
      [{ content: "Infraestrutura:", styles: { fontStyle: "bold" } }, v.recursos_infraestrutura || ""],
      [{ content: "SST:", styles: { fontStyle: "bold" } }, v.recursos_sst || ""],
      [{ content: "Financeiro:", styles: { fontStyle: "bold" } }, v.recursos_financeiro || ""],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 6;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [[
      { content: "APROVAÇÕES (Assinatura física da Diretoria)", colSpan: 4, styles: { halign: "center", fillColor: [30, 64, 175] } },
    ]],
    styles: { fontSize: 9, cellPadding: 4, minCellHeight: 16 },
    body: [
      [
        { content: "Solicitante", styles: { fontStyle: "bold" } }, "",
        { content: "Data", styles: { fontStyle: "bold" } }, "",
      ],
      [
        { content: "Gestor Processo/Unidade", styles: { fontStyle: "bold" } }, "",
        { content: "Data", styles: { fontStyle: "bold" } }, "",
      ],
      [
        { content: "Gestor RH", styles: { fontStyle: "bold" } }, "",
        { content: "Data", styles: { fontStyle: "bold" } }, "",
      ],
      [
        { content: "Diretoria Responsável", styles: { fontStyle: "bold" } }, "",
        { content: "Data", styles: { fontStyle: "bold" } }, "",
      ],
      [
        { content: "Diretor Presidente", styles: { fontStyle: "bold" } }, "",
        { content: "Data", styles: { fontStyle: "bold" } }, "",
      ],
    ],
  });

  doc.save(`Abertura_Vaga_${v.numero ?? ""}_${v.cargo_solicitado}.pdf`);
}
