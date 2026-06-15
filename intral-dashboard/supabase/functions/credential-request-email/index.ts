import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const getEmailFrom = () => {
  return (
    Deno.env.get("EMAIL_FROM") ||
    Deno.env.get("INTRAL_EMAIL_FROM") ||
    "INTRAL Connect <onboarding@resend.dev>"
  );
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      throw new Error("Only POST requests are supported.");
    }

    const body = await req.json();

    const {
      fullName,
      email,
      department,
      manager,
      requestedRole,
      phone,
      reason,
    } = body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(fullName || "Requester").trim();
    const cleanDepartment = String(department || "Not provided").trim();
    const cleanManager = String(manager || "Not provided").trim();
    const cleanRole = String(requestedRole || "employee").trim().toUpperCase();
    const cleanPhone = String(phone || "Not provided").trim();
    const cleanReason = String(reason || "Not provided").trim();

    if (!cleanEmail) {
      throw new Error("Email is required.");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is missing.");
    }

    const subject = "INTRAL Connect credential request received";

    const text = `
Hello ${cleanName},

Your INTRAL Connect credential request has been received.

Request Status:
Pending Admin Review

Requested Role:
${cleanRole}

Department / Area:
${cleanDepartment}

Manager / Approver:
${cleanManager}

Phone:
${cleanPhone}

Reason:
${cleanReason}

An INTRAL administrator will review your request. If approved, you will receive a separate email with your login instructions and temporary password.

Thank you,
INTRAL Connect Admin
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <h2>INTRAL Connect Credential Request Received</h2>

        <p>Hello ${cleanName},</p>

        <p>Your INTRAL Connect credential request has been received.</p>

        <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:14px;border-radius:10px;margin:18px 0;">
          <p><strong>Request Status:</strong><br />Pending Admin Review</p>
          <p><strong>Requested Role:</strong><br />${cleanRole}</p>
          <p><strong>Department / Area:</strong><br />${cleanDepartment}</p>
          <p><strong>Manager / Approver:</strong><br />${cleanManager}</p>
          <p><strong>Phone:</strong><br />${cleanPhone}</p>
          <p><strong>Reason:</strong><br />${cleanReason}</p>
        </div>

        <p>An INTRAL administrator will review your request. If approved, you will receive a separate email with your login instructions and temporary password.</p>

        <p>Thank you,<br />
        INTRAL Connect Admin</p>
      </div>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: getEmailFrom(),
        to: [cleanEmail],
        subject,
        text,
        html,
      }),
    });

    const emailResult = await emailResponse.json().catch(() => ({}));

    if (!emailResponse.ok) {
      throw new Error(
        emailResult?.message ||
          emailResult?.error ||
          `Resend failed with status ${emailResponse.status}`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent: true,
        emailError: "",
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
        emailSent: false,
        emailError: error instanceof Error ? error.message : "Unknown credential request email error.",
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
