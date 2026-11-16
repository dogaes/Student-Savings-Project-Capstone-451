CREATE TABLE ai_usage (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_ai_usage_user_date UNIQUE (user_id, usage_date),
    CONSTRAINT chk_ai_usage_request_count CHECK (request_count >= 0)
);
