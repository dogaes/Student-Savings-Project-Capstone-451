CREATE TABLE loans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    lender VARCHAR(100),
    principal NUMERIC(12,2) NOT NULL CHECK (principal >= 0),
    interest_rate NUMERIC(5,2) NOT NULL CHECK (interest_rate >= 0),
    monthly_payment NUMERIC(12,2) NOT NULL CHECK (monthly_payment >= 0),
    remaining_balance NUMERIC(12,2) NOT NULL CHECK (remaining_balance >= 0),
    next_due_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_loan_user_name ON loans (user_id, LOWER(name));