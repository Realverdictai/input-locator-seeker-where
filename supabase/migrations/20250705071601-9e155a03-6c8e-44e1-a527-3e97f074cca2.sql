-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding and narrative columns to cases_master table
ALTER TABLE cases_master ADD COLUMN IF NOT EXISTS narrative TEXT;
ALTER TABLE cases_master ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector similarity searches
CREATE INDEX IF NOT EXISTS cases_master_embedding_idx ON cases_master USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);