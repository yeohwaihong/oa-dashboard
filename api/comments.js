import { createClient } from "@supabase/supabase-js";

function getEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return "";
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function getBearerToken(req) {
  const header = String(req.headers?.authorization || "");
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function parseQuery(req) {
  const base = `http://${req.headers?.host || "localhost"}`;
  const url = new URL(req.url || "/", base);
  return url.searchParams;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        const error = new Error("Request body too large.");
        error.statusCode = 413;
        reject(error);
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        const error = new Error("Invalid JSON body.");
        error.statusCode = 400;
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function normalizeUuidList(value) {
  if (!Array.isArray(value)) return [];
  const ids = value.map((id) => String(id || "").trim()).filter(Boolean);
  return Array.from(new Set(ids));
}

function displayNameForAuthUser(user) {
  const metadata = user?.user_metadata || {};
  return String(metadata.display_name || metadata.full_name || user?.email || "").trim();
}

function mentionSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._-]+/g, "");
}

function mentionHandleForAuthUser(user) {
  const fallback = String(user?.email || "").split("@")[0] || "user";
  return String(displayNameForAuthUser(user) || fallback).replace(/[^a-zA-Z0-9._-]+/g, "");
}

function mentionAliasesForAuthUser(user) {
  const displayName = displayNameForAuthUser(user);
  const email = String(user?.email || "");
  const emailLocal = email.split("@")[0] || "";
  return Array.from(
    new Set([displayName, displayName.replace(/\s+/g, ""), email, emailLocal, mentionHandleForAuthUser(user)].map(mentionSlug).filter(Boolean)),
  );
}

async function mentionedUserIdsFromText(serviceClient, text, requestedMentionUserIds) {
  const mentionTokens = String(text || "").match(/@[a-zA-Z0-9._-]+/g) || [];
  const tokenSlugs = new Set(mentionTokens.map((token) => mentionSlug(token.slice(1))).filter(Boolean));
  if (!tokenSlugs.size) return [];

  const requestedIds = new Set(normalizeUuidList(requestedMentionUserIds));
  const usersResult = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (usersResult.error) throw usersResult.error;

  const roleRowsResult = await serviceClient.from("user_roles").select("user_id");
  if (roleRowsResult.error) throw roleRowsResult.error;
  const dashboardUserIds = new Set((roleRowsResult.data || []).map((row) => row.user_id).filter(Boolean));

  return Array.from(
    new Set(
      (usersResult.data?.users || [])
        .filter((candidate) => dashboardUserIds.has(candidate.id))
        .filter((candidate) => !requestedIds.size || requestedIds.has(candidate.id))
        .filter((candidate) => mentionAliasesForAuthUser(candidate).some((alias) => tokenSlugs.has(alias)))
        .map((candidate) => candidate.id),
    ),
  );
}

function appBaseUrl(req) {
  const configured = getEnv("DASHBOARD_APP_URL", "VITE_DASHBOARD_APP_URL", "VITE_PUBLIC_APP_URL");
  if (configured) return configured.replace(/\/+$/, "");
  const vercelUrl = getEnv("VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL");
  if (vercelUrl) return `https://${vercelUrl}`.replace(/\/+$/, "");
  const host = req.headers?.host;
  return host ? `https://${host}` : "";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendMentionEmails({ req, serviceClient, actorUser, event, comment, mentionUserIds }) {
  const resendApiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("MENTION_EMAIL_FROM", "RESEND_FROM_EMAIL");
  if (!resendApiKey || !from || !mentionUserIds.length) {
    return { sent: 0, skipped: mentionUserIds.length, configured: Boolean(resendApiKey && from) };
  }

  const recipients = [];
  for (const userId of mentionUserIds) {
    if (userId === actorUser.id) continue;
    const result = await serviceClient.auth.admin.getUserById(userId);
    const user = result.data?.user;
    if (!result.error && user?.email) recipients.push(user);
  }

  const baseUrl = appBaseUrl(req);
  const eventUrl = baseUrl && event?.id ? `${baseUrl}/event/${encodeURIComponent(event.id)}` : baseUrl;
  const actorName = displayNameForAuthUser(actorUser) || "Someone";
  const eventName = event?.name || "an event";
  const eventDate = event?.date || "";
  const subject = `${actorName} mentioned you on ${eventName}`;
  const text = [
    `${actorName} mentioned you in a dashboard comment.`,
    "",
    `Event: ${eventName}${eventDate ? ` (${eventDate})` : ""}`,
    "",
    comment.body,
    "",
    eventUrl ? `Open dashboard: ${eventUrl}` : "",
  ].filter((line, index, all) => line || all[index - 1]).join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <p><strong>${escapeHtml(actorName)}</strong> mentioned you in a dashboard comment.</p>
      <p><strong>Event:</strong> ${escapeHtml(eventName)}${eventDate ? ` (${escapeHtml(eventDate)})` : ""}</p>
      <blockquote style="border-left:4px solid #22d3ee;margin:16px 0;padding:8px 12px;color:#333">${escapeHtml(comment.body).replace(/\n/g, "<br>")}</blockquote>
      ${eventUrl ? `<p><a href="${escapeHtml(eventUrl)}">Open the dashboard</a></p>` : ""}
    </div>
  `;

  let sent = 0;
  for (const user of recipients) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: user.email,
        subject,
        text,
        html,
      }),
    });
    if (response.ok) sent += 1;
  }

  return { sent, skipped: mentionUserIds.length - sent, configured: true };
}

async function requireDashboardUser(req) {
  const supabaseUrl = getEnv("SUPABASE_URL", "VITE_SUPABASE_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    const missing = [
      !supabaseUrl ? "SUPABASE_URL/VITE_SUPABASE_URL" : null,
      !anonKey ? "SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY" : null,
      !serviceKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter(Boolean);
    const error = new Error(`Missing env: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }

  const token = getBearerToken(req);
  if (!token) {
    const error = new Error("Missing Authorization header.");
    error.statusCode = 401;
    throw error;
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const userResult = await userClient.auth.getUser();
  if (userResult.error || !userResult.data?.user?.id) {
    const error = new Error("Invalid session.");
    error.statusCode = 401;
    throw error;
  }

  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const roleResult = await serviceClient.from("user_roles").select("role").eq("user_id", userResult.data.user.id).maybeSingle();
  if (roleResult.error) {
    const error = new Error(roleResult.error.message || "Failed to read user role.");
    error.statusCode = 500;
    throw error;
  }

  const role = normalizeRole(roleResult.data?.role);
  if (role !== "superadmin" && role !== "admin" && role !== "staff" && role !== "dj") {
    const error = new Error("Dashboard role required.");
    error.statusCode = 403;
    throw error;
  }

  return { serviceClient, user: userResult.data.user, role };
}

export default async function handler(req, res) {
  try {
    if (!["GET", "POST", "DELETE"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST, DELETE");
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const { serviceClient, user, role } = await requireDashboardUser(req);
    const query = parseQuery(req);
    const eventId = String(query.get("event_id") || "").trim();

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const cleanBody = String(body.body || "").trim();
      const commentEventId = String(body.eventId || body.event_id || "").trim();
      const mentionUserIds = await mentionedUserIdsFromText(serviceClient, cleanBody, body.mentionUserIds || body.mention_user_ids);
      if (!commentEventId) return sendJson(res, 400, { error: "Event ID is required." });
      if (!cleanBody) return sendJson(res, 400, { error: "Comment body is required." });

      const eventResult = await serviceClient.from("events").select("id, name, date").eq("id", commentEventId).maybeSingle();
      if (eventResult.error) return sendJson(res, 500, { error: eventResult.error.message || "Could not load event." });
      if (!eventResult.data) return sendJson(res, 404, { error: "Event not found." });

      const insertResult = await serviceClient
        .from("event_comments")
        .insert({
          event_id: commentEventId,
          user_id: user.id,
          body: cleanBody,
          mention_user_ids: mentionUserIds,
        })
        .select("id, event_id, user_id, body, mention_user_ids, created_at")
        .single();
      if (insertResult.error) {
        return sendJson(res, 500, { error: insertResult.error.message || "Could not post comment." });
      }

      let emailNotifications = { sent: 0, skipped: mentionUserIds.length, configured: false };
      try {
        emailNotifications = await sendMentionEmails({
          req,
          serviceClient,
          actorUser: user,
          event: eventResult.data,
          comment: insertResult.data,
          mentionUserIds,
        });
      } catch (emailError) {
        emailNotifications = {
          sent: 0,
          skipped: mentionUserIds.length,
          configured: true,
          error: emailError?.message || "Mention email failed.",
        };
      }

      return sendJson(res, 201, { comment: insertResult.data, emailNotifications });
    }

    if (req.method === "DELETE") {
      const body = await readJsonBody(req);
      const commentId = String(body.id || query.get("id") || "").trim();
      if (!commentId) return sendJson(res, 400, { error: "Comment ID is required." });

      const existing = await serviceClient.from("event_comments").select("id, user_id").eq("id", commentId).maybeSingle();
      if (existing.error) return sendJson(res, 500, { error: existing.error.message || "Could not load comment." });
      if (!existing.data) return sendJson(res, 404, { error: "Comment not found." });
      const canDelete = existing.data.user_id === user.id || role === "admin" || role === "superadmin";
      if (!canDelete) return sendJson(res, 403, { error: "Only the original poster can delete this comment." });

      const deleted = await serviceClient.from("event_comments").delete().eq("id", commentId);
      if (deleted.error) return sendJson(res, 500, { error: deleted.error.message || "Could not delete comment." });
      return sendJson(res, 200, { deleted: true, id: commentId });
    }

    let request = serviceClient
      .from("event_comments")
      .select("id, event_id, user_id, body, mention_user_ids, created_at")
      .order("created_at", { ascending: true });

    if (eventId) request = request.eq("event_id", eventId);

    const result = await request;
    if (result.error) {
      return sendJson(res, 500, { error: result.error.message || "Could not load comments." });
    }

    return sendJson(res, 200, { comments: result.data || [] });
  } catch (e) {
    return sendJson(res, e?.statusCode || 500, { error: e?.message || "Server error." });
  }
}
