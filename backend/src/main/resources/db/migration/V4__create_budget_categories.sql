CREATE TABLE budget_categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    budget_amount NUMERIC(12,2) NOT NULL CHECK (budget_amount >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_budget_user_month_name
    ON budget_categories (user_id, month, LOWER(name));