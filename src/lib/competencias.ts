export const COMPETENCIAS = [
  { titulo: "Em relação ao cumprimento de suas atividades", descricao: "Pré-disposição para ação e para o esforço em prol da organização, quanto ao compartilhamento de valores entre estas e as pessoas que nela atuam, buscando atingir os objetivos organizacionais." },
  { titulo: "Em relação a credibilidade e confiança", descricao: "Grau de confiabilidade das informações / atividades / serviços prestados, sob sua responsabilidade." },
  { titulo: "No que refere-se ao trabalho em equipe", descricao: "Capacidade de interagir e cooperar no compartilhamento de ideias, objetivos, atividades e soluções para atingir os objetivos organizacionais." },
  { titulo: "Nível de Flexibilidade", descricao: "Como compreende e responde às novas situações de trabalho, podendo exercer múltiplas atividades / serviços, inerentes à sua área de atuação." },
  { titulo: "Aplicação do Conhecimento", descricao: "Experiência no uso das ferramentas, conceitos, métodos, procedimentos, etc, para melhorar o desenvolvimento das atividades em geral." },
  { titulo: "Referente a organização do tempo e trabalho - prioridade", descricao: "Atitudes em relação à administração de tempo e trabalho, considerando a assiduidade, a pontualidade, interrupções durante o período de trabalho e/ou programações quanto aos prazos para a realização das atividades." },
  { titulo: "No que diz respeito ao relacionamento interpessoal", descricao: "Capacidade de se relacionar de forma cordial com as pessoas dos diversos níveis hierárquicos e culturais, incluindo os usuários/clientes, de forma a manter o ambiente de trabalho agradável e produtivo." },
  { titulo: "No que refere-se a comunicação", descricao: "Capacidade de se expressar (nas diversas formas) de maneira clara, objetiva e adequada, bem como a capacidade de ouvir os outros e dar respostas consistentes, contribuindo para atingir os objetivos." },
  { titulo: "Em relação a qualidade do trabalho", descricao: "Capacidade de realizar atividades / serviços de forma organizada, clara, consistente e objetiva atingindo objetivos pré-estabelecidos." },
  { titulo: "Capacidade de resolver problemas", descricao: "Capacidade de resolver problemas e imprevistos, de forma eficaz, a partir do conhecimento / experiência, para alcançar os objetivos." },
  { titulo: "Em relação ao comportamento ético no decorrer de suas atividades", descricao: "Atitude pautada pelo respeito ao próximo, integridade, senso de justiça, impessoalidade nas ações e a valorização do conceito de cidadania e do bem público." },
  { titulo: "Capacidade em administração de conflitos", descricao: "É a capacidade de lidar e procurar solucionar conflitos, opiniões divergentes e condições adversas no ambiente de trabalho." },
  { titulo: "Habilidade de criação e/ou inovação", descricao: "Capacidade de criar ou inovar projetos, planos, ideias, metodologias, processos, etc. para aplicação na execução das atividades / serviços, que gere impacto e otimização nos processos e formas de trabalho." },
  { titulo: "Capacitação e desenvolvimento profissional", descricao: "Interesse pela busca ativa de qualificação e aprimoramento pessoal e profissional, na área de atuação, com objetivo de melhorar o desenvolvimento das atividades / serviços." },
];

export const NOTAS = [
  { value: "insatisfatorio", label: "Insatisfatório" },
  { value: "fraco", label: "Fraco" },
  { value: "regular", label: "Regular" },
  { value: "bom", label: "Bom" },
  { value: "otimo", label: "Ótimo" },
  { value: "excelente", label: "Excelente" },
  { value: "nao_aplicavel", label: "Não aplicável" },
] as const;

export type NotaValue = typeof NOTAS[number]["value"];

export const notaLabel = (v: string) => NOTAS.find((n) => n.value === v)?.label ?? v;
