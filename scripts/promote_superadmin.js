import { createClient } from "@supabase/supabase-js";

const targetEmail = (process.argv[2] || "waihong@overandabove.com.my").trim().toLowerCase();

function getEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return "";
}

const supabaseUrl = getEnv("SUPABASE_URL", "VITE_SUPABASE_URL");
const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const result = await supabase.auth.admin.listUsers({ page, perPage });
    if (result.error) throw result.error;

    const users = result.data?.users || [];
    const user = users.find((item) => String(item.email || "").toLowerCase() === email);
    if (user) return user;
    if (users.length < perPage) return null;
    page += 1;
  }
}

try {
  const user = await findUserByEmail(targetEmail);
  if (!user?.id) {
    console.error(`No Supabase Auth user found for ${targetEmail}.`);
    process.exit(1);
  }

  const result = await supabase.from("user_roles").upsert({ user_id: user.id, role: "superadmin" }, { onConflict: "user_id" });
  if (result.error) throw result.error;

  console.log(`${targetEmail} is now superadmin (${user.id}).`);
} catch (error) {
  const message = error?.message || String(error);
  if (message.toLowerCase().includes("check constraint")) {
    console.error(`${message}\nRun supabase/allow_superadmin_role.sql in Supabase SQL Editor, then run this script again.`);
  } else {
    console.error(message);
  }
  process.exit(1);
}
