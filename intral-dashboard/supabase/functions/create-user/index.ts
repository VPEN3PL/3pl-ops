import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();

    const {
      userId,
      email,
      temporaryPassword,
      role,
      requestedByEmail,
    } = body;

    if (!userId) {
      throw new Error("User ID is required.");
    }

    if (!email) {
      throw new Error("Email is required.");
    }

    if (!temporaryPassword) {
      throw new Error("Temporary password is required.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey =
      Deno.env.get("SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      "";

    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is missing.");
    }

    if (!serviceRoleKey) {
      throw new Error("SERVICE_ROLE_KEY is missing.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { error: authError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: temporaryPassword,
      });

    if (authError) {
      throw authError;
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        must_change_password: true,
        is_active: true,
      })
      .eq("id", userId);

    if (profileError) {
      throw profileError;
    }

    const loginUrl = "https://3pl-ops.vercel.app/";

    const emailSubject = "Your INTRAL Connect password has been reset";

    const emailText = `
Hello,

Your INTRAL Connect password has been reset by an administrator.

Login URL:
${loginUrl}

Username:
${email}

Temporary Password:
${temporaryPassword}

Role:
${String(role || "").toUpperCase()}

Important:
You will be required to change your password the next time you log in.

If you did not expect this reset, please contact your INTRAL administrator.

Thank you,
INTRAL Connect Admin
    `.trim();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <h2>INTRAL Connect Password Reset</h2>

        <p>Hello,</p>

        <p>Your INTRAL Connect password has been reset by an administrator.</p>

        <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:14px;border-radius:10px;margin:18px 0;">
          <p><strong>Login URL:</strong><br />
          <a href="${loginUrl}">${loginUrl}</a></p>

          <p><strong>Username:</strong><br />
          ${email}</p>

          <p><strong>Temporary Password:</strong><br />
          ${temporaryPassword}</p>

          <p><strong>Role:</strong><br />
          ${String(role || "").toUpperCase()}</p>
        </div>

        <p><strong>Important:</strong> You will be required to change your password the next time you log in.</p>

        <p>If you did not expect this reset, please contact your INTRAL administrator.</p>

        <p>Thank you,<br />
        INTRAL Connect Admin</p>
      </div>
    `;

    let emailSent = false;
    let emailError = "";

    if (!resendApiKey) {
      emailSent = false;
      emailError = "RESEND_API_KEY is missing.";
    } else {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "INTRAL Connect <onboarding@resend.dev>",
            to: [email],
            subject: emailSubject,
            text: emailText,
            html: emailHtml,
          }),
        });

        const emailResult = await emailResponse.json().catch(() => ({}));

        if (!emailResponse.ok) {
          emailSent = false;
          emailError =
            emailResult?.message ||
            emailResult?.error ||
            `Resend failed with status ${emailResponse.status}`;
        } else {
          emailSent = true;
        }
      } catch (error) {
        emailSent = false;
        emailError = error.message;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        email,
        must_change_password: true,
        emailSent,
        emailError,
        requestedByEmail: requestedByEmail || "",
        message: emailSent
          ? "Password reset successfully and notification email sent."
          : "Password reset successfully, but notification email failed.",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
