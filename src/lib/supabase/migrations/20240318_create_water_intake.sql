-- Create water_intake table
CREATE TABLE IF NOT EXISTS public.water_intake (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    glasses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own water intake
CREATE POLICY "Users can view their own water intake"
    ON public.water_intake
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own water intake
CREATE POLICY "Users can insert their own water intake"
    ON public.water_intake
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own water intake
CREATE POLICY "Users can update their own water intake"
    ON public.water_intake
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own water intake
CREATE POLICY "Users can delete their own water intake"
    ON public.water_intake
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_water_intake_updated_at
    BEFORE UPDATE ON public.water_intake
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 