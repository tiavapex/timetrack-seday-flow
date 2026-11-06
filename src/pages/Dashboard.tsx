import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MODULOS } from "@/lib/permissoes";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
export default function Dashboard(){const {profile,roles,canAccess,canRequest,isGestor}=useAuth();const title=roles.includes("dp")?"Departamento Pessoal":roles.includes("rh")?"Recursos Humanos":isGestor?"Aprovações":canRequest?"Solicitações":"Painel";return <div className="space-y-6"><div><h1 className="text-2xl font-bold">{title}</h1><p className="text-muted-foreground">{profile?.nome}</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{MODULOS.filter(m=>m.key!=="dashboard"&&canAccess(m.key)).map(m=><Button key={m.key} asChild variant="outline" className="h-16 justify-between"><Link to={m.path==="/integracoes"?"/integracoes/colaboradores":m.path}>{m.label}<ArrowRight className="h-4 w-4"/></Link></Button>)}</div></div>;}
