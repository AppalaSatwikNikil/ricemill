-- Table to store cart items linked to users
CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY, -- We'll use product_id-weight as the composite ID string
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    name TEXT NOT NULL,
    price DECIMAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    weight TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/edit their own cart items
-- Check if policy exists first or just create (Supabase UI handles this better but SQL is good for record)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cart_items' AND policyname = 'Users can manage their own cart'
    ) THEN
        CREATE POLICY "Users can manage their own cart" ON cart_items
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
