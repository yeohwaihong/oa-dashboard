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

function parseJsonBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === "object") return body;
  try {
    return JSON.parse(String(body));
  } catch {
    return {};
  }
}

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

async function requireSuperadmin(req) {
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
  if (role !== "superadmin") {
    const error = new Error("Superadmin role required.");
    error.statusCode = 403;
    throw error;
  }

  return { serviceClient };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const { serviceClient } = await requireSuperadmin(req);
    const body = parseJsonBody(req);
    const userId = String(body.userId || "").trim();
    const password = String(body.password || "");

    if (!userId) return sendJson(res, 400, { error: "userId is required." });
    if (password.length < 8) return sendJson(res, 400, { error: "Password must be at least 8 characters." });

    const updated = await serviceClient.auth.admin.updateUserById(userId, { password });
    if (updated.error) return sendJson(res, 500, { error: updated.error.message || "Failed to update password." });

    return sendJson(res, 200, { ok: true });
  } catch (e) {
    return sendJson(res, e?.statusCode || 500, { error: e?.message || "Server error." });
  }
}
