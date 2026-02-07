import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            env[key] = value;
        }
    });

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) process.exit(1);

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function test() {
        console.log('Checking cart_items table...');
        const { data, error } = await supabase
            .from('cart_items')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error:', error.message);
        } else {
            console.log('Table exists. Row count:', data.length);
        }
    }

    test();

} catch (err) {
    console.error(err);
}
