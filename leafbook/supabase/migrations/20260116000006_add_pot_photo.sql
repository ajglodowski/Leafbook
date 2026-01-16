-- Add photo_url column to user_pots table for pot images
ALTER TABLE public.user_pots
ADD COLUMN photo_url TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN public.user_pots.photo_url IS 'Optional Vercel Blob URL for pot image';
