export type PPOTipo = "adm_rh" | "producao" | "seguranca";

export interface PPOCriterio {
  key: string;
  label: string;
  peso: number;
}

export interface PPOPilar {
  tipo: PPOTipo;
  titulo: string;
  pilar: string;
  modo: "conformidade" | "pontuacao";
  criterios: PPOCriterio[];
}

export const PPO_PILARES: PPOPilar[] = [
  {
    tipo: "adm_rh",
    titulo: "Avaliação PPO: RH / Administrativo",
    pilar: "Pilar 1 - Obrigatório",
    modo: "conformidade",
    criterios: [
      { key: "ponto", label: "Ponto", peso: 0.25 },
      { key: "troca_escala", label: "Troca de escala", peso: 0.5 },
      { key: "assiduidade", label: "Assiduidade (falta injustificada)", peso: 1 },
      { key: "absenteismo", label: "Absenteísmo", peso: 0.5 },
      { key: "advertencia", label: "Advertência / Insubordinação / Respeito", peso: 1 },
      { key: "danificar_equip", label: "Danificar equip. por mau uso e não informar", peso: 0.5 },
      { key: "nao_registrar_incidente", label: "Não registrar incidente", peso: 0.5 },
      { key: "influencia", label: "Influência álcool / remédios / drogas", peso: 1 },
    ],
  },
  {
    tipo: "producao",
    titulo: "Avaliação PPO: Produção / Manutenção",
    pilar: "Pilar 2",
    modo: "pontuacao",
    criterios: [
      { key: "limpeza", label: "Limpeza e conservação equipamento", peso: 10 },
      { key: "check_list", label: "Check list (pré-uso) e preenchimento correto", peso: 20 },
      { key: "pedal", label: "Não utilizar pedal emergência sem necessidade", peso: 5 },
      { key: "horimetro", label: "Apontamento de horímetro / GLP", peso: 15 },
      { key: "abastecimento", label: "Abastecimento GLP", peso: 10 },
      { key: "informar_incidentes", label: "Informar incidentes patrimônio, peças, materiais", peso: 20 },
      { key: "danificar_equipamento", label: "Danificar o equipamento", peso: 20 },
    ],
  },
  {
    tipo: "seguranca",
    titulo: "Avaliação PPO: Segurança do Trabalho",
    pilar: "Pilar 3",
    modo: "pontuacao",
    criterios: [
      { key: "epi", label: "EPI / uniforme / crachá", peso: 10 },
      { key: "cinco_s", label: "5S na área", peso: 10 },
      { key: "apr", label: "Preencher APR corretamente e entrega mensal", peso: 20 },
      { key: "caminho_seguro", label: "Usar caminho seguro pedestres", peso: 10 },
      { key: "celular", label: "Não utilizar celular durante atividade / caminhando", peso: 20 },
      { key: "procedimentos", label: "Cumprir proced. e normas ST interna e contratante", peso: 20 },
      { key: "dds", label: "Participar DDS", peso: 10 },
    ],
  },
];

export function getPilar(tipo: string): PPOPilar {
  return PPO_PILARES.find((p) => p.tipo === tipo) || PPO_PILARES[0];
}

export const PPO_NOTA_OBS =
  "Na coluna de observação deverão ser preenchidos os seguintes dados em caso de infração: data, frota e ocorrência, para que possamos lançar evidência no recibo aos operadores.";

export function calcularTotal(
  pilar: PPOPilar,
  criterios: Record<string, boolean>
): number {
  return pilar.criterios.reduce((acc, c) => {
    const ok = criterios[c.key] !== false;
    if (pilar.modo === "pontuacao") return acc + (ok ? c.peso : 0);
    return acc + (ok ? 0 : c.peso);
  }, 0);
}

export function totalMaximo(pilar: PPOPilar): number {
  return pilar.criterios.reduce((a, c) => a + c.peso, 0);
}
