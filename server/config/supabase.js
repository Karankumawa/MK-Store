const { createClient } = require('@supabase/supabase-js');

// Initialize the Supabase client using the provided URL and Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxijcsihpfryixariljg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
