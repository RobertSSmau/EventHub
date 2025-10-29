CREATE TABLE users (
    id              SERIAL,
    username        VARCHAR(50)     NOT NULL,
    email           VARCHAR(100)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    role            VARCHAR(10)     DEFAULT 'USER',
    is_blocked      BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW(),
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN'))
);

CREATE TABLE events (
    id              SERIAL,
    title           VARCHAR(100)    NOT NULL,
    description     TEXT            NOT NULL,
    category        VARCHAR(50)     NOT NULL,
    location        VARCHAR(100)    NOT NULL,
    date            TIMESTAMP       NOT NULL,
    capacity        INTEGER,
    image_url       VARCHAR(255),
    status          VARCHAR(10)     DEFAULT 'PENDING',
    creator_id      INTEGER         NOT NULL,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW(),
    CONSTRAINT pk_events PRIMARY KEY (id),
    CONSTRAINT fk_events_creator FOREIGN KEY (creator_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_events_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_events_capacity CHECK (capacity > 0)
);

CREATE TABLE registrations (
    user_id         INTEGER NOT NULL,
    event_id        INTEGER NOT NULL,
    registered_at   TIMESTAMP DEFAULT NOW(),
    CONSTRAINT pk_registrations PRIMARY KEY (user_id, event_id),
    CONSTRAINT fk_reg_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_event FOREIGN KEY (event_id)
        REFERENCES events (id) ON DELETE CASCADE
);

CREATE TABLE reports (
    id              SERIAL,
    reporter_id     INTEGER NOT NULL,
    event_id        INTEGER NOT NULL,
    reason          TEXT    NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT pk_reports PRIMARY KEY (id),
    CONSTRAINT fk_reports_user FOREIGN KEY (reporter_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_event FOREIGN KEY (event_id)
        REFERENCES events (id) ON DELETE CASCADE
);

CREATE INDEX idx_events_date       ON events (date);
CREATE INDEX idx_events_category   ON events (category);
CREATE INDEX idx_events_status     ON events (status);
CREATE INDEX idx_reg_event_id      ON registrations (event_id);
CREATE INDEX idx_rep_event_id      ON reports (event_id);