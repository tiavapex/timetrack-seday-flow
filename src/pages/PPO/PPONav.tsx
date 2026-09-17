import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function PPONav() {
  const { isRh, isLideranca, isAuditor, podeAdminPPO } = useAuth();

  const itens = [
    { to: "/ppo", label: "Painel", show: true, end: true },
    { to: "/ppo/meu-resultado", label: "Meu resultado", show: true },
    { to: "/ppo/avaliacoes", label: "Apuração", show: isLideranca || isRh || isAuditor },
    { to: "/ppo/ciclos", label: "Ciclos", show: podeAdminPPO },
    { to: "/ppo/indicadores", label: "Indicadores", show: true },
    { to: "/ppo/sla", label: "SLA", show: true },
    { to: "/ppo/ocorrencias", label: "Ocorrências", show: true },
    { to: "/ppo/contestacoes", label: "Contestações", show: true },
    { to: "/ppo/termo", label: "Termo de ciência", show: true },
    { to: "/ppo/governanca", label: "Governança", show: true },
    { to: "/ppo/auditoria", label: "Auditoria", show: isAuditor || isRh },
    { to: "/ppo/operacional", label: "PPO Operacional", show: true },
  ].filter((i) => i.show);

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-2">
      {itens.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.end}
          className={({ isActive }) =>
            cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
