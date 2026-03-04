require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function diagnose() {
  console.log("Checking database constraints...");
  const { data, error } = await supabase.rpc('get_constraints', { t_name: 'profiles' });
  if (error) {
    // Si no hay RPC, probamos ver si podemos insertar con un ID manual o no
    console.log("No RPC found, testing manual insert...");
    const testId = crypto.randomUUID();
    const { error: insertError } = await supabase.from('profiles').insert({
      id: testId,
      full_name: 'Test Diagnosis',
      role: 'doctor'
    });
    console.log("Insert result:", insertError ? insertError.message : "Success");
  } else {
    console.log("Constraints:", data);
  }
}
diagnose();
