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

  return { serviceClient };
}

function displayNameForAuthUser(user) {
  const metadata = user.user_metadata || {};
  return String(metadata.display_name || metadata.full_name || user.email || "").trim();
}

function mentionHandleForAuthUser(user) {
  const fallback = String(user.email || "").split("@")[0] || "user";
  return String(displayNameForAuthUser(user) || fallback).replace(/[^a-zA-Z0-9._-]+/g, "");
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const { serviceClient } = await requireDashboardUser(req);
    const usersResult = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 200 });
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

    const users = (usersResult.data?.users || [])
      .filter((u) => roleByUserId.has(u.id))
      .map((u) => ({
        id: u.id,
        email: u.email,
        displayName: displayNameForAuthUser(u),
        mentionHandle: mentionHandleForAuthUser(u),
        role: roleByUserId.get(u.id),
      }))
      .sort((a, b) => String(a.displayName || a.email || "").localeCompare(String(b.displayName || b.email || "")));

    return sendJson(res, 200, { users });
  } catch (e) {
    return sendJson(res, e?.statusCode || 500, { error: e?.message || "Server error." });
  }
}
