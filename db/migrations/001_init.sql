-- The Event LinkedIn Automation - Database Schema v1.0.0
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE services_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    source_url TEXT,
    source_hash TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_services_active ON services_catalog(is_active);

CREATE TABLE editorial_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_prompts_active ON editorial_prompts(is_active);

CREATE TABLE posts_archive (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    hook TEXT,
    body TEXT NOT NULL,
    cta TEXT,
    hashtags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'generated'
        CHECK (status IN ('generated','review_pending','approved','published','failed','queued','draft')),
    service_tags TEXT[] DEFAULT '{}',
    theme_tags TEXT[] DEFAULT '{}',
    language TEXT DEFAULT 'fr',
    scheduled_for TIMESTAMPTZ,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    linkedin_post_id TEXT,
    linkedin_post_url TEXT,
    generation_model TEXT,
    generation_meta JSONB DEFAULT '{}',
    similarity_score NUMERIC(5,4) DEFAULT 0,
    approval_required BOOLEAN DEFAULT false,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    notes TEXT,
    hook_variants JSONB DEFAULT '[]',
    short_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_posts_status ON posts_archive(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_generated ON posts_archive(generated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_published ON posts_archive(published_at DESC) WHERE deleted_at IS NULL AND status = 'published';
CREATE INDEX idx_posts_service_tags ON posts_archive USING GIN(service_tags);
CREATE INDEX idx_posts_body_search ON posts_archive USING GIN(body gin_trgm_ops);

CREATE TABLE oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL DEFAULT 'linkedin',
    subject_type TEXT NOT NULL DEFAULT 'user',
    subject_id TEXT NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_type TEXT DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ NOT NULL,
    scope TEXT,
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_oauth_provider_subject ON oauth_tokens(provider, subject_type, subject_id);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'system',
    resource_type TEXT,
    resource_id TEXT,
    payload JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_event ON audit_logs(event_type);

CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
    ('editorial_config', '{"max_length":1300,"min_length":200,"max_hashtags":5,"max_emojis":3,"language":"fr","manual_approval":false}'),
    ('linkedin_config', '{"publish_enabled":false,"target_type":"personal"}'),
    ('scheduling_config', '{"day_of_week":4,"hour":10,"minute":0,"timezone":"Europe/Brussels"}'),
    ('content_angles', '["service","client_problem","social_proof","seasonality","corporate","private_event","staffing","experience","quality","call_to_action"]')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_services_updated BEFORE UPDATE ON services_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_prompts_updated BEFORE UPDATE ON editorial_prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON posts_archive FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_oauth_updated BEFORE UPDATE ON oauth_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_admin_updated BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
