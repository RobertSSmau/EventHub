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
    id                  SERIAL,
    reporter_id         INTEGER NOT NULL,
    reported_user_id    INTEGER,
    reported_event_id   INTEGER,
    reason              TEXT NOT NULL,
    status              VARCHAR(20) DEFAULT 'PENDING',
    created_at          TIMESTAMP DEFAULT NOW(),
    CONSTRAINT pk_reports PRIMARY KEY (id),
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_reported_user FOREIGN KEY (reported_user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_reported_event FOREIGN KEY (reported_event_id)
        REFERENCES events (id) ON DELETE CASCADE,
    CONSTRAINT chk_report_target CHECK (
        (reported_user_id IS NOT NULL AND reported_event_id IS NULL) OR
        (reported_user_id IS NULL AND reported_event_id IS NOT NULL)
    ),
    CONSTRAINT chk_reports_status CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'))
);

CREATE INDEX idx_events_date       ON events (date);
CREATE INDEX idx_events_category   ON events (category);
CREATE INDEX idx_events_status     ON events (status);
CREATE INDEX idx_reg_event_id      ON registrations (event_id);
CREATE INDEX idx_reports_event_id  ON reports (reported_event_id);
CREATE INDEX idx_reports_user_id   ON reports (reported_user_id);
CREATE INDEX idx_reports_status    ON reports (status);