import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { email, password, nome } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some((u) => u.email === email);

    if (userExists) {
      // User exists, update password and assign master role
      const user = existingUsers?.users?.find((u) => u.email === email);
      if (user) {
        // Update password
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: password,
          email_confirm: true,
        });

        // Delete existing roles and assign master
        await supabaseAdmin.from("user_roles").delete().eq("user_id", user.id);
        await supabaseAdmin.from("user_roles").insert({ user_id: user.id, role: "master" });
        
        // Update profile
        await supabaseAdmin
          .from("profiles")
          .update({ nome: nome || "Administrador Master", empresa: "Grupo Seday" })
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ success: true, message: "Master user updated with new password" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome: nome || "Administrador Master" }
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newUser?.user) {
      // Wait a bit for the trigger to create profile
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Delete default role and assign master
      await supabaseAdmin.from("user_roles").delete().eq("user_id", newUser.user.id);
      await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user.id, role: "master" });
      
      // Update profile
      await supabaseAdmin
        .from("profiles")
        .update({ nome: nome || "Administrador Master", empresa: "Grupo Seday" })
        .eq("user_id", newUser.user.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Master user created successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
