export const MODULOS = [
  { key: "dashboard", label: "Painel", path: "/dashboard" },
  { key: "horas_extras", label: "Horas Extras", path: "/registros" },
  { key: "colaboradores", label: "Colaboradores", path: "/colaboradores" },
  { key: "ferias", label: "Férias", path: "/ferias" },
  { key: "vagas", label: "Abertura de Vagas", path: "/vagas" },
  { key: "ppo", label: "Avaliação PPO", path: "/ppo" },
  { key: "qp", label: "QP — Queira Providenciar", path: "/qp" },
  { key: "dp", label: "Departamento Pessoal", path: "/departamento-pessoal" },
  { key: "integracoes", label: "Integrações", path: "/integracoes" },
  { key: "relatorios", label: "Relatórios", path: "/relatorios" },
  { key: "usuarios", label: "Gestão de Usuários", path: "/usuarios" },
] as const;
export type Modulo = typeof MODULOS[number]["key"];
export type Permissoes = Partial<Record<Modulo, boolean>>;
export function acessoPadrao(roles: string[], modulo: Modulo): boolean {
  if (roles.some(r => ["master", "admin"].includes(r))) return true;
  if (modulo === "usuarios") return false;
  if (roles.includes("dp")) return modulo !== "vagas";
  if (roles.some(r => ["gestor", "supervisor", "coordenador", "encarregado", "lider"].includes(r))) return !["integracoes", "dp"].includes(modulo);
  if (roles.includes("rh")) return ["dashboard", "vagas", "colaboradores", "relatorios"].includes(modulo);
  if (roles.includes("sesmt")) return ["dashboard", "ppo", "colaboradores", "relatorios"].includes(modulo);
  return ["dashboard", "horas_extras", "ppo"].includes(modulo);
}
export function podeAcessar(roles: string[], permissoes: Permissoes, modulo: Modulo): boolean {
  if (roles.some(r => ["master", "admin"].includes(r))) return true;
  if (modulo === "usuarios" || (roles.includes("dp") && modulo === "vagas")) return false;
  return permissoes[modulo] ?? acessoPadrao(roles, modulo);
}
export function moduloDaRota(path: string): Modulo | null {
  if (path.startsWith("/configuracoes")) return "usuarios";
  return MODULOS.find(m => path === m.path || path.startsWith(m.path + "/"))?.key ?? null;
}
export function podeSolicitar(roles: string[]): boolean {
  return roles.some(r => ["master", "admin", "supervisor", "gestor", "lider", "encarregado", "coordenador"].includes(r));
}