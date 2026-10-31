const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
const { localDbClient } = require('./localDb');

// Read configured Supabase URL and Key (Supports standard SUPABASE_URL / SUPABASE_SECRET_KEY)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if credentials are empty or legacy placeholder
const isDefaultPlaceholder = !supabaseUrl || !supabaseKey || supabaseUrl.includes('lxijcsihpfryixariljg');

let useLocal = isDefaultPlaceholder;
let realClient = null;

if (!useLocal && supabaseUrl && supabaseKey) {
    try {
        realClient = createClient(supabaseUrl, supabaseKey);
        // Verify hostname in background
        const urlObj = new URL(supabaseUrl);
        dns.lookup(urlObj.hostname, (err) => {
            if (err) {
                console.warn(`[DB] Supabase hostname ${urlObj.hostname} not reachable (${err.code}). Using local database fallback.`);
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
