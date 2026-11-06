import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "@/components/ui/table";
import { toast } from "sonner";
export default function Directory() {
 const [rows,setRows]=useState<{id:string;nome:string;matricula:string|null;cargo:string|null;cliente:string|null;setor:string|null}[]>([]);
 const [search,setSearch]=useState("");
 useEffect(()=>{void supabase.from("profiles").select("id,nome,matricula,cargo,cliente,setor").eq("ativo",true).order("nome").then(({data,error})=>{if(error)toast.error(error.message);else setRows(data || []);});},[]);
 return <div className="space-y-4"><h1 className="text-2xl font-bold">Colaboradores</h1><Input placeholder="Buscar nome ou matrícula" value={search} onChange={e=>setSearch(e.target.value)} className="max-w-md"/><Table><TableHeader><TableRow>{["Nome","Matrícula","Cargo","Cliente","Setor"].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.filter(r=>`${r.nome} ${r.matricula}`.toLowerCase().includes(search.toLowerCase())).map(r=><TableRow key={r.id}>{[r.nome,r.matricula,r.cargo,r.cliente,r.setor].map((v,i)=><TableCell key={i}>{v || "—"}</TableCell>)}</TableRow>)}</TableBody></Table></div>;
}