import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
Deno.serve(async () => {
  const s = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const pwd = "Seday@" + Math.floor(100000 + Math.random() * 900000);
  const { data, error } = await s.auth.admin.createUser({
    email: "tst@seday.com.br", password: pwd, email_confirm: true, user_metadata: { nome: "Pamela Helena Corrêa" },
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  const id = data.user.id;
  await s.from("profiles").update({ nome: "Pamela Helena Corrêa", cliente: "Gerdau", cargo: "Técnica de Segurança do Trabalho" }).eq("user_id", id);
  await s.from("user_roles").delete().eq("user_id", id);
  await s.from("user_roles").insert({ user_id: id, role: "sesmt" });
  return new Response(JSON.stringify({ ok: true, pwd }));
});
