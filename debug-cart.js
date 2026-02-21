
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Superbase URL or Anon Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCart() {
    console.log("Testing connection to 'cart_items' table...");

    try {
        // 1. Try to read (might be empty but shouldn't hang)
        console.log("Attempting to SELECT from cart_items...");
        const { data: readData, error: readError } = await supabase
            .from('cart_items')
            .select('*')
            .limit(5);

        if (readError) {
            console.error("SELECT Error:", readError.message);
            console.error("This might be an RLS policy issue if the table exists but you have no access.");
        } else {
            console.log("SELECT Success! Rows found:", readData.length);
        }

        // 2. Try to describe the table (check if it exists)
        console.log("\nChecking table columns...");
        const { data: colData, error: colError } = await supabase
            .from('cart_items')
            .select('*')
            .limit(0);

        if (colError) {
            console.error("Table check failed:", colError.message);
        } else {
            console.log("Table 'cart_items' is accessible.");
        }

    } catch (err) {
        console.error("Unexpected error during test:", err);
    }
}

testCart();
