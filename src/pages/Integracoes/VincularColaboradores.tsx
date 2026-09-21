import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface Colab {
  id: string;
  matricula: string | null;
  nome: string;
  cargo: string | null;
  setor: string | null;
  ativo?: boolean;
  gestor_id: string | null;
  user_id: string | null;
}

interface Login {
  user_id: string;
  nome: string;
  email: string;
}

export default function VincularColaboradores() {
  const { isAdmin, isRh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [colabs, setColabs] = useState<Colab[]>([]);
  const [logins, setLogins] = useState<Login[]>([]);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);

  const podeEditar = isAdmin || isRh;

  const carregar = async () => {
    setLoading(true);
    const [{ data: gold, error: goldErr }, { data: profs }] = await Promise.all([
      (supabase as any)
        .from("gold_colaboradores")
        .select("id, matricula, nome, cargo, setor, ativo, gestor_id, user_id")
        .order("nome"),
      (supabase as any)
        .from("profiles")
        .select("user_id, nome, email")
        .not("user_id", "is", null)
        .order("nome"),
    ]);
    if (goldErr) toast.error("Erro ao carregar colaboradores: " + goldErr.message);
    else setColabs((gold as Colab[]) || []);
    setLogins((profs as Login[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(
    () =>
      colabs.filter(
        (c) =>
          !busca ||
          c.nome.toLowerCase().includes(busca.toLowerCase()) ||
          (c.matricula || "").includes(busca) ||
          (c.cargo || "").toLowerCase().includes(busca.toLowerCase()) ||
          (c.setor || "").toLowerCase().includes(busca.toLowerCase())
      ),
    [colabs, busca]
  );

  const salvar = async (id: string, campo: "gestor_id" | "user_id", valor: string) => {
    setSalvando(id + campo);
    const payload = { [campo]: valor || null };
    const { error } = await (supabase as any)
      .from("gold_colaboradores")
      .update(payload)
      .eq("id", id);
    if (error) toast.error("Não foi possível salvar: " + error.message);
    else {
      setColabs((prev) => prev.map((c) => (c.id === id ? { ...c, ...payload } : c)));
      toast.success("Vínculo atualizado.");
    }
    setSalvando(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vincular colaboradores</h1>
        <p className="text-muted-foreground">
          Defina o gestor responsável e ligue cada colaborador ao respectivo login
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" /> Colaboradores sincronizados
          </CardTitle>
          <Input
            placeholder="Buscar por nome, matrícula, cargo ou setor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="max-w-md"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum colaborador sincronizado ainda. Execute uma sincronização em
              Integrações &gt; Colaboradores (VPS).
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Gestor responsável</TableHead>
                    <TableHead>Login vinculado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.matricula || "-"}</TableCell>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell>{c.cargo || "-"}</TableCell>
                      <TableCell>{c.setor || "-"}</TableCell>
                      <TableCell>
                        <select
                          className="h-9 w-48 rounded-md border border-input bg-background px-2 text-sm"
                          value={c.gestor_id || ""}
                          disabled={!podeEditar || salvando === c.id + "gestor_id"}
                          onChange={(e) => salvar(c.id, "gestor_id", e.target.value)}
                        >
                          <option value="">Sem gestor</option>
                          {colabs
                            .filter((g) => g.id !== c.id)
                            .map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.nome}
                              </option>
                            ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <select
                          className="h-9 w-56 rounded-md border border-input bg-background px-2 text-sm"
                          value={c.user_id || ""}
                          disabled={!podeEditar || salvando === c.id + "user_id"}
                          onChange={(e) => salvar(c.id, "user_id", e.target.value)}
                        >
                          <option value="">Sem login</option>
                          {logins.map((l) => (
                            <option key={l.user_id} value={l.user_id}>
                              {l.nome} ({l.email})
                            </option>
                          ))}
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
