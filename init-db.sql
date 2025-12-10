-- Initialize Role Plug database
-- This script runs once when the PostgreSQL container is first created

-- Create database (if not exists, handled by POSTGRES_DB env var)
-- Additional initialization can be added here

-- Create extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE roleplug TO roleplug;

-- Log initialization
SELECT 'Role Plug database initialized successfully' AS status;
