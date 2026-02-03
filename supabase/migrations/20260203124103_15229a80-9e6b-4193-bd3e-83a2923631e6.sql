-- Add video_url column to products table for embedded video support
ALTER TABLE public.products
ADD COLUMN video_url text;