const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vmifpqugzarduojgqsvo.supabase.co', 'sb_publishable_UXxJn7n2Xjz_1wH_MLaRNg_O1UuVkN9');

async function main() {
  let { data, error } = await supabase.auth.signInWithPassword({
    email: 'abebe@waiter.local',
    password: '1234'
  });
  console.log("Abebe login:", error ? error.message : "Success");

  let { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
    email: 'manager@admin.local',
    password: 'admin1234'
  });
  console.log("Manager login:", adminError ? adminError.message : "Success");
}
main();
