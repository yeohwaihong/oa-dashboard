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

function parseQuery(req) {
  const base = `http://${req.headers?.host || "localhost"}`;
  const url = new URL(req.url || "/", base);
  return url.searchParams;
}

const superAdminEmail = "waihong@overabove.com.my";

async function requireAdmin(req) {
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

  if (roleResult.data?.role !== "admin" || String(userResult.data.user.email || "").toLowerCase() !== superAdminEmail) {
    const error = new Error("Superadmin access required.");
    error.statusCode = 403;
    throw error;
  }

  return { serviceClient };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const { serviceClient } = await requireAdmin(req);
    const query = parseQuery(req);
    const page = Math.max(1, Number.parseInt(query.get("page") || "1", 10) || 1);
    const perPage = Math.max(1, Math.min(200, Number.parseInt(query.get("perPage") || "200", 10) || 200));

    const usersResult = await serviceClient.auth.admin.listUsers({ page, perPage });
    if (usersResult.error) {
      return sendJson(res, 500, { error: usersResult.error.message || "Failed to list users." });
    }

    const roleRowsResult = await serviceClient.from("user_roles").select("user_id, role");
    if (roleRowsResult.error) {
      return sendJson(res, 500, { error: roleRowsResult.error.message || "Failed to load roles." });
    }

    const roleByUserId = new Map();
    for (const row of roleRowsResult.data || []) {
      if (row?.user_id) roleByUserId.set(row.user_id, row.role || null);
    }

    const users = (usersResult.data?.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      role: roleByUserId.get(u.id) || null,
    }));

    return sendJson(res, 200, { users });
  } catch (e) {
    return sendJson(res, e?.statusCode || 500, { error: e?.message || "Server error." });
  }
}
