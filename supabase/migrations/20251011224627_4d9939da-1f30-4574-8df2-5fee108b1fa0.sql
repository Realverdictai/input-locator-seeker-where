-- Add is_voice_session column to mediation_sessions table
ALTER TABLE mediation_sessions 
ADD COLUMN is_voice_session boolean DEFAULT false;