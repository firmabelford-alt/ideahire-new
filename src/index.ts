import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-calendar-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CalendarReminder = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_type: "deadline" | "meeting" | "payment" | "personal";
  starts_at: string;
  timezone: string | null;
  reminder_due_at: string | null;
  delivery_attempts: number;
};

type DeliveryResult = {
  id: string;
  status: "sent" | "failed";
  reason?: string;
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getEventTypeLabel(type: CalendarReminder["event_type"]) {
  const labels: Record<CalendarReminder["event_type"], string> = {
    deadline: "Termin pracy",
    meeting: "Spotkanie",
    payment: "Płatność",
    personal: "Własne przypomnienie",
  };

  return labels[type] || labels.personal;
}

function getSafeTimezone(value: string | null) {
  const fallback = "Europe/Warsaw";

  if (!value) return fallback;

  try {
    new Intl.DateTimeFormat("pl-PL", {
      timeZone: value,
    }).format(new Date());

    return value;
  } catch {
    return fallback;
  }
}

function formatReminderDate(value: string, timezone: string | null) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: getSafeTimezone(timezone),
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function createReminderEmail(
  reminder: CalendarReminder,
  calendarUrl: string,
) {
  const title = escapeHtml(reminder.title);
  const description = reminder.description
    ? escapeHtml(reminder.description).replaceAll("\n", "<br />")
    : "Brak dodatkowej notatki.";
  const eventType = escapeHtml(getEventTypeLabel(reminder.event_type));
  const eventDate = escapeHtml(
    formatReminderDate(reminder.starts_at, reminder.timezone),
  );
  const safeCalendarUrl = escapeHtml(calendarUrl);

  return {
    subject: `Przypomnienie IdeaHire: ${reminder.title}`,
    text: [
      "IdeaHire — przypomnienie",
      "",
      reminder.title,
      `${getEventTypeLabel(reminder.event_type)} · ${formatReminderDate(
        reminder.starts_at,
        reminder.timezone,
      )}`,
      "",
      reminder.description || "Brak dodatkowej notatki.",
      "",
      `Otwórz kalendarz: ${calendarUrl}`,
      "",
      "To wiadomość transakcyjna ustawiona przez Ciebie w kalendarzu IdeaHire.",
    ].join("\n"),
    html: `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Przypomnienie IdeaHire</title>
  </head>
  <body style="margin:0;background:#eef2f7;font-family:Inter,Arial,sans-serif;color:#10213d;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f7;padding:32px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dce4ee;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:30px 32px 18px;background:linear-gradient(135deg,#10213d,#245f9f);color:#ffffff;">
                <div style="font-size:12px;font-weight:800;letter-spacing:.12em;opacity:.76;">IDEAHIRE · KALENDARZ</div>
                <h1 style="margin:15px 0 0;font-size:30px;line-height:1.12;letter-spacing:-.04em;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <div style="display:inline-block;padding:7px 10px;border-radius:999px;background:#e8f1fb;color:#1f5b99;font-size:12px;font-weight:800;">${eventType}</div>
                <p style="margin:20px 0 0;font-size:17px;font-weight:800;line-height:1.5;">${eventDate}</p>
                <p style="margin:16px 0 24px;color:#56667d;font-size:14px;line-height:1.7;">${description}</p>
                <a href="${safeCalendarUrl}" style="display:inline-block;padding:13px 18px;border-radius:13px;background:#235fa8;color:#ffffff;text-decoration:none;font-size:13px;font-weight:800;">Otwórz kalendarz</a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #e3e8ef;color:#7b8798;font-size:11px;line-height:1.55;">
                To wiadomość transakcyjna ustawiona przez Ciebie w prywatnym kalendarzu IdeaHire. Ustawienie możesz zmienić lub usunąć po zalogowaniu.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

async function sendReminderEmail(
  resendApiKey: string,
  fromEmail: string,
  recipientEmail: string,
  reminder: CalendarReminder,
  calendarUrl: string,
) {
  const email = createReminderEmail(reminder, calendarUrl);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `ideahire-calendar-${reminder.id}-${
        reminder.reminder_due_at || reminder.starts_at
      }`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipientEmail],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const providerMessage =
      typeof payload?.message === "string"
        ? payload.message
        : `HTTP ${response.status}`;

    throw new Error(`Resend: ${providerMessage}`);
  }

  return payload;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const cronSecret = Deno.env.get("CALENDAR_CRON_SECRET");
  const fromEmail =
    Deno.env.get("REMINDER_FROM_EMAIL") ||
    "IdeaHire <przypomnienia@ideahire.pl>";
  const siteUrl = (
    Deno.env.get("SITE_URL") ||
    "https://ideahire-new.pages.dev"
  ).replace(/\/$/, "");

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !cronSecret) {
    return jsonResponse(
      {
        error: "Missing required server configuration",
        required: [
          "SUPABASE_URL",
          "SUPABASE_SERVICE_ROLE_KEY",
          "RESEND_API_KEY",
          "CALENDAR_CRON_SECRET",
        ],
      },
      500,
    );
  }

  const suppliedSecret =
    request.headers.get("x-calendar-secret") || "";

  if (suppliedSecret !== cronSecret) {
    return jsonResponse(
      { error: "Unauthorized" },
      401,
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.rpc(
    "ideahire_claim_due_calendar_reminders",
    { p_limit: 50 },
  );

  if (error) {
    console.error("CALENDAR CLAIM ERROR", error);

    return jsonResponse(
      {
        error: "Could not claim reminders",
        detail: error.message,
      },
      500,
    );
  }

  const reminders = (data || []) as CalendarReminder[];
  const results: DeliveryResult[] = [];
  const calendarUrl = `${siteUrl}/calendar`;

  for (const reminder of reminders) {
    try {
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(reminder.user_id);

      if (userError) throw userError;

      const recipientEmail = userData.user?.email;

      if (!recipientEmail) {
        throw new Error("Konto nie ma adresu e-mail.");
      }

      await sendReminderEmail(
        resendApiKey,
        fromEmail,
        recipientEmail,
        reminder,
        calendarUrl,
      );

      const { error: updateError } = await supabase
        .from("ideahire_calendar_events")
        .update({
          reminder_sent_at: new Date().toISOString(),
          delivery_status: "sent",
          processing_started_at: null,
          last_delivery_error: null,
        })
        .eq("id", reminder.id)
        .eq("delivery_status", "processing");

      if (updateError) throw updateError;

      results.push({
        id: reminder.id,
        status: "sent",
      });
    } catch (error) {
      const reason = String(
        error instanceof Error ? error.message : error,
      ).slice(0, 900);

      console.error("CALENDAR DELIVERY ERROR", {
        reminderId: reminder.id,
        reason,
      });

      await supabase
        .from("ideahire_calendar_events")
        .update({
          delivery_status: "failed",
          processing_started_at: null,
          last_delivery_error: reason,
        })
        .eq("id", reminder.id)
        .eq("delivery_status", "processing");

      results.push({
        id: reminder.id,
        status: "failed",
        reason,
      });
    }
  }

  return jsonResponse({
    ok: true,
    claimed: reminders.length,
    sent: results.filter((item) => item.status === "sent").length,
    failed: results.filter((item) => item.status === "failed").length,
    results,
  });
});
