import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
console.log('Reading .env from:', envPath);

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

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase URL or Key in .env');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function test() {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) {
            console.error('Error fetching products:', error);
        } else {
            console.log('Successfully fetched products.');
            const count = data ? data.length : 0;
            console.log('Count:', count);
            if (count > 0) {
                // Print just the name of the first product to avoid massive JSON output
                console.log('First product name:', data[0].name);
            }
        }
    }

    test();

} catch (err) {
    console.error('Error reading .env or executing script:', err);
}
