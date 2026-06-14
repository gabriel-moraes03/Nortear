CREATE TABLE chat_session (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT      NOT NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_session_user_id ON chat_session (user_id);

CREATE TABLE chat_message (
    id          BIGSERIAL   PRIMARY KEY,
    session_id  UUID        NOT NULL REFERENCES chat_session (id) ON DELETE CASCADE,
    sender      VARCHAR(20) NOT NULL,
    content     TEXT        NOT NULL,
    timestamp   TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_message_session_id ON chat_message (session_id);

CREATE TABLE telegram_user_mapping (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT    NOT NULL UNIQUE,
    telegram_chat_id BIGINT    NOT NULL UNIQUE
);
