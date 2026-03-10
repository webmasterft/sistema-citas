import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpdate() {
  const id = "ca40d116-3d56-4c15-94d5-129f43ac6b81"; // replace with real ID if needed for the test
  console.log("Updating doctors_directory ID:", id);
  const { data, error } = await supabase
    .from("doctors_directory")
    .update({ ruc: "9999999999001", birth_date: "1990-01-01" })
    .eq("id", id)
    .select();
  console.log("Result doctors_directory:", data, error);

  console.log("Checking if profiles updated too...");
  const { data: prof, error: profErr } = await supabase.from("profiles").select("*").eq("id", id);
  console.log("Profiles:", prof, profErr);
}
testUpdate();
