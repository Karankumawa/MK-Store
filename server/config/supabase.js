const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
const { localDbClient } = require('./localDb');

// Read configured Supabase URL and Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxijcsihpfryixariljg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if credentials are placeholders or if DNS fails
const isDefaultPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL && 
    (!supabaseKey || supabaseKey.startsWith('sb_secret_') || supabaseUrl.includes('lxijcsihpfryixariljg'));

let useLocal = isDefaultPlaceholder;
let realClient = null;

if (!useLocal && supabaseUrl && supabaseKey) {
    try {
        realClient = createClient(supabaseUrl, supabaseKey);
        // Verify hostname in background
        const urlObj = new URL(supabaseUrl);
        dns.lookup(urlObj.hostname, (err) => {
            if (err) {
                console.warn(`[DB] Supabase hostname ${urlObj.hostname} not reachable (${err.code}). Using local database.`);
                useLocal = true;
            } else {
                console.log(`[DB] Supabase hostname ${urlObj.hostname} resolved successfully.`);
            }
        });
    } catch (e) {
        console.warn(`[DB] Could not initialize Supabase client: ${e.message}. Using local database.`);
        useLocal = true;
    }
} else {
    console.log('[DB] Using local persistent database (server/data/store.json).');
}

const supabaseWrapper = {
    from: (table) => {
        if (useLocal || !realClient) {
            return localDbClient.from(table);
        }
        return realClient.from(table);
    },
    // Expose underlying client / mode for diagnostics
    isLocal: () => useLocal,
    setUseLocal: (val) => { useLocal = val; }
};

module.exports = supabaseWrapper;
