-- Reference schema (managed by Alembic in practice)
-- This file is for documentation and manual inspection only.

CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    api_key VARCHAR UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR PRIMARY KEY,
    client_id VARCHAR REFERENCES clients(id),
    tier VARCHAR DEFAULT 'free',
    monthly_limit INTEGER DEFAULT 50,
    requests_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    renewed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_jobs (
    id VARCHAR PRIMARY KEY,
    client_id VARCHAR REFERENCES clients(id),
    provider VARCHAR NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    tokens_used FLOAT DEFAULT 0,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
