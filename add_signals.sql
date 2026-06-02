-- Run this in your Supabase SQL Editor:
ALTER TABLE businesses ADD COLUMN signals text[] DEFAULT '{}';
ALTER TABLE business_analysis ADD COLUMN signals text[] DEFAULT '{}';
