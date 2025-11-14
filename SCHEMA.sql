CREATE TABLE "EventHub".users (
	id serial4 NOT NULL,
	username varchar(50) NOT NULL,
	email varchar(100) NOT NULL,
	password_hash varchar(255) NOT NULL,
	"role" varchar(10) DEFAULT 'USER'::character varying NULL,
	is_blocked bool DEFAULT false NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	email_verified bool DEFAULT false NULL,
	CONSTRAINT chk_users_role CHECK (((role)::text = ANY ((ARRAY['USER'::character varying, 'ADMIN'::character varying])::text[]))),
	CONSTRAINT pk_users PRIMARY KEY (id),
	CONSTRAINT uq_users_email UNIQUE (email),
	CONSTRAINT uq_users_username UNIQUE (username)
);

CREATE TABLE "EventHub".reports (
	id serial4 NOT NULL,
	reporter_id int4 NOT NULL,
	reported_event_id int4 NULL,
	reason text NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	reported_user_id int4 NULL,
	status varchar(20) DEFAULT 'PENDING'::character varying NULL,
	description text NULL,
	resolved_by int4 NULL,
	resolved_at timestamp NULL,
	admin_notes text NULL,
	CONSTRAINT chk_report_target CHECK ((((reported_user_id IS NOT NULL) AND (reported_event_id IS NULL)) OR ((reported_user_id IS NULL) AND (reported_event_id IS NOT NULL)))),
	CONSTRAINT chk_reports_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'REVIEWED'::character varying, 'RESOLVED'::character varying, 'DISMISSED'::character varying])::text[]))),
	CONSTRAINT pk_reports PRIMARY KEY (id)
);
CREATE INDEX idx_reports_event_id ON "EventHub".reports USING btree (reported_event_id);
CREATE INDEX idx_reports_status ON "EventHub".reports USING btree (status);
CREATE INDEX idx_reports_user_id ON "EventHub".reports USING btree (reported_user_id);


ALTER TABLE "EventHub".reports ADD CONSTRAINT fk_reports_event FOREIGN KEY (reported_event_id) REFERENCES "EventHub".events(id) ON DELETE CASCADE;
ALTER TABLE "EventHub".reports ADD CONSTRAINT fk_reports_reported_user FOREIGN KEY (reported_user_id) REFERENCES "EventHub".users(id) ON DELETE CASCADE;
ALTER TABLE "EventHub".reports ADD CONSTRAINT fk_reports_resolved_by FOREIGN KEY (resolved_by) REFERENCES "EventHub".users(id) ON DELETE SET NULL;
ALTER TABLE "EventHub".reports ADD CONSTRAINT fk_reports_user FOREIGN KEY (reporter_id) REFERENCES "EventHub".users(id) ON DELETE CASCADE;

CREATE TABLE "EventHub".registrations (
	user_id int4 NOT NULL,
	event_id int4 NOT NULL,
	registered_at timestamp DEFAULT now() NULL,
	CONSTRAINT pk_registrations PRIMARY KEY (user_id, event_id)
);
CREATE INDEX idx_reg_event_id ON "EventHub".registrations USING btree (event_id);

ALTER TABLE "EventHub".registrations ADD CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES "EventHub".events(id) ON DELETE CASCADE;
ALTER TABLE "EventHub".registrations ADD CONSTRAINT fk_reg_user FOREIGN KEY (user_id) REFERENCES "EventHub".users(id) ON DELETE CASCADE;

CREATE TABLE "EventHub".events (
	id serial4 NOT NULL,
	title varchar(100) NOT NULL,
	description text NOT NULL,
	category varchar(50) NOT NULL,
	"location" varchar(100) NOT NULL,
	"date" timestamp NOT NULL,
	capacity int4 NULL,
	image_url varchar(255) NULL,
	status varchar(10) DEFAULT 'PENDING'::character varying NULL,
	creator_id int4 NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT chk_events_capacity CHECK ((capacity > 0)),
	CONSTRAINT chk_events_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[]))),
	CONSTRAINT pk_events PRIMARY KEY (id)
);
CREATE INDEX idx_events_category ON "EventHub".events USING btree (category);
CREATE INDEX idx_events_date ON "EventHub".events USING btree (date);
CREATE INDEX idx_events_status ON "EventHub".events USING btree (status);

ALTER TABLE "EventHub".events ADD CONSTRAINT fk_events_creator FOREIGN KEY (creator_id) REFERENCES "EventHub".users(id) ON DELETE CASCADE;