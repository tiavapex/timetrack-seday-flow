import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PPONav } from "./PPONav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileSignature, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { TERMO_CIENCIA_TEXTO, PPO_DOC, fmtDataHora } from "@/lib/ppo";

const VERSAO_TEXTO = "PO-ADM-03 rev 01 — Anexo V";

export default function Termo() {
  const { user } = useAuth();
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [ciclo, setCiclo] = useState("");
  const [termos, setTermos] = useState<any[]>([]);
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [cy, me] = await Promise.all([
      (supabase as any).from("ppo_ciclos").select("id, nome").order("periodo_inicio", { ascending: false }),
      user ? (supabase as any).from("profiles").select("*").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setCiclos(cy.data || []);
    setPerfil(me.data);
    if (!ciclo && cy.data?.[0]) setCiclo(cy.data[0].id);
    if (me.data) {
      const { data } = await (supabase as any)
        .from("ppo_termos_ciencia")
        .select("*")
        .eq("colaborador_id", me.data.id);
      setTermos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const aceito = termos.find((t) => t.ciclo_id === ciclo);

  const aceitar = async () => {
    if (!ciclo) return toast.error("Selecione o ciclo.");
    if (!perfil) return toast.error("Perfil de colaborador não encontrado.");
    const { error } = await (supabase as any).from("ppo_termos_ciencia").insert({
      ciclo_id: ciclo,
      colaborador_id: perfil.id,
      aceito_em: new Date().toISOString(),
      texto_versao: VERSAO_TEXTO,
    });
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Termo de ciência registrado.");
    load();
  };

  return (
    <div className="space-y-6">
      <PPONav />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Termo de ciência</h1>
        <p className="text-muted-foreground">{PPO_DOC} — Anexo V</p>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" /> Declaração do colaborador
          </CardTitle>
          <Select value={ciclo} onValueChange={setCiclo}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Selecione o ciclo" />
            </SelectTrigger>
            <SelectContent>
              {ciclos.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-3 rounded-md border p-4 text-sm">
                {TERMO_CIENCIA_TEXTO.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <p className="text-xs text-muted-foreground">Versão do texto: {VERSAO_TEXTO}</p>
              </div>
              {aceito ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Termo aceito em{" "}
                  {fmtDataHora(aceito.aceito_em)}.
                </p>
              ) : (
                <Button onClick={aceitar} disabled={!ciclo}>
                  Declaro estar ciente
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
