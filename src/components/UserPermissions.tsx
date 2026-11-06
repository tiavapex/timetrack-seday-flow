import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MODULOS, Permissoes, acessoPadrao } from "@/lib/permissoes";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
export function UserPermissions({ user, onClose }: { user: { user_id: string; nome: string; roles: string[] } | null; onClose: () => void }) {
  const [values,setValues] = useState<Permissoes>({});
  const [loading,setLoading] = useState(false);
  const { refreshAccess } = useAuth();
  useEffect(() => { if (!user?.user_id) return; setLoading(true); void supabase.from("user_module_permissions").select("module,enabled").eq("user_id",user.user_id).then(({data,error}) => { if(error)toast.error(error.message); setValues(Object.fromEntries(MODULOS.map(m=>[m.key,data?.find(p=>p.module===m.key)?.enabled ?? acessoPadrao(user.roles,m.key)]))); setLoading(false); }); },[user]);
  const save = async () => { if (!user) return; setLoading(true); const {error}=await supabase.rpc("set_user_permissions",{p_user:user.user_id,p_permissions:values}); setLoading(false); if(error)return toast.error(error.message); await refreshAccess(); toast.success("Permissões atualizadas"); onClose(); };
  return <Dialog open={!!user} onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Permissões — {user?.nome}</DialogTitle></DialogHeader><div className="grid gap-3 sm:grid-cols-2">{MODULOS.map(m=>{const blocked=m.key==="usuarios" || (user?.roles.includes("dp") && m.key==="vagas") || user?.roles.some(r=>["master","admin"].includes(r)); return <label key={m.key} className="flex items-center gap-2 border-b py-2 text-sm"><Checkbox aria-label={m.label} checked={!!values[m.key]} disabled={loading || !!blocked} onCheckedChange={v=>setValues(p=>({...p,[m.key]:v===true}))}/>{m.label}</label>;})}</div><DialogFooter><Button variant="outline" onClick={()=>setValues(Object.fromEntries(MODULOS.map(m=>[m.key,acessoPadrao(user?.roles || [],m.key)])))}>Padrão do perfil</Button><Button onClick={save} disabled={loading}>Salvar permissões</Button></DialogFooter></DialogContent></Dialog>;
}