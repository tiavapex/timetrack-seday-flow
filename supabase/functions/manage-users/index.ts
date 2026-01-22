import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the requesting user has admin permissions
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin or master
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

    const roles = userRoles?.map((r) => r.role) || [];
    const isAdmin = roles.includes("master") || roles.includes("admin");

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...params } = await req.json();
    console.log(`[manage-users] Action: ${action}`, params);

    switch (action) {
      case "list": {
        // List all users with their profiles and roles
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesError) {
          throw profilesError;
        }

        // Get roles for all users
        const { data: allRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, role");

        const usersWithRoles = profiles?.map((profile) => ({
          ...profile,
          roles: allRoles?.filter((r) => r.user_id === profile.user_id).map((r) => r.role) || [],
        }));

        return new Response(
          JSON.stringify({ success: true, data: usersWithRoles }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create": {
        const { email, password, nome, empresa, setor, matricula, role } = params;

        if (!email || !password || !nome) {
          return new Response(
            JSON.stringify({ error: "Email, senha e nome são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { nome }
        });

        if (createError) {
          console.error("[manage-users] Create error:", createError);
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (newUser?.user) {
          // Wait for trigger to create profile
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Update profile with additional data
          await supabaseAdmin
            .from("profiles")
            .update({ nome, empresa, setor, matricula })
            .eq("user_id", newUser.user.id);

          // Set role if specified
          if (role && role !== "colaborador") {
            // Only master can create admin/master users
            const isMaster = roles.includes("master");
            if ((role === "master" || role === "admin") && !isMaster) {
              return new Response(
                JSON.stringify({ error: "Apenas usuários Master podem criar admins" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            await supabaseAdmin.from("user_roles").delete().eq("user_id", newUser.user.id);
            await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user.id, role });
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: "Usuário criado com sucesso" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        const { user_id, nome, empresa, setor, matricula, ativo, role } = params;

        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "ID do usuário é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update profile
        const updateData: Record<string, unknown> = {};
        if (nome !== undefined) updateData.nome = nome;
        if (empresa !== undefined) updateData.empresa = empresa;
        if (setor !== undefined) updateData.setor = setor;
        if (matricula !== undefined) updateData.matricula = matricula;
        if (ativo !== undefined) updateData.ativo = ativo;

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update(updateData)
            .eq("user_id", user_id);

          if (updateError) {
            throw updateError;
          }
        }

        // Update role if specified
        if (role) {
          const isMaster = roles.includes("master");
          if ((role === "master" || role === "admin") && !isMaster) {
            return new Response(
              JSON.stringify({ error: "Apenas usuários Master podem definir papel de admin" }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
          await supabaseAdmin.from("user_roles").insert({ user_id, role });
        }

        return new Response(
          JSON.stringify({ success: true, message: "Usuário atualizado com sucesso" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        const { user_id } = params;

        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "ID do usuário é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if trying to delete self
        if (user_id === requestingUser.id) {
          return new Response(
            JSON.stringify({ error: "Você não pode excluir sua própria conta" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete user from auth (cascade will handle profiles and roles)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (deleteError) {
          throw deleteError;
        }

        return new Response(
          JSON.stringify({ success: true, message: "Usuário excluído com sucesso" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reset-password": {
        const { user_id, new_password } = params;

        if (!user_id || !new_password) {
          return new Response(
            JSON.stringify({ error: "ID e nova senha são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          password: new_password,
        });

        if (resetError) {
          throw resetError;
        }

        return new Response(
          JSON.stringify({ success: true, message: "Senha alterada com sucesso" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Ação inválida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("[manage-users] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
