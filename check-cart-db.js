import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkTable() {
    console.log('Checking for cart_items table...');
    const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .limit(1);

    if (error) {
        if (error.code === 'PGRST204' || error.message.includes('not found')) {
            console.log('cart_items table does NOT exist.');
        } else {
            console.error('Error checking table:', error);
        }
    } else {
        console.log('cart_items table EXISTS.');
    }
}

checkTable();
