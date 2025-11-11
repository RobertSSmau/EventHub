-- Migration: Add user reports support to reports table

-- 1. Rename event_id to reported_event_id
ALTER TABLE reports 
RENAME COLUMN event_id TO reported_event_id;

-- 2. Make reported_event_id nullable
ALTER TABLE reports 
ALTER COLUMN reported_event_id DROP NOT NULL;

-- 3. Add reported_user_id column
ALTER TABLE reports 
ADD COLUMN reported_user_id INTEGER;

-- 4. Add foreign key for reported_user_id
ALTER TABLE reports 
ADD CONSTRAINT fk_reports_reported_user 
FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. Add status column
ALTER TABLE reports 
ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING';

-- 6. Add constraint: must report either user or event (not both, not neither)
ALTER TABLE reports 
ADD CONSTRAINT chk_report_target CHECK (
    (reported_user_id IS NOT NULL AND reported_event_id IS NULL) OR
    (reported_user_id IS NULL AND reported_event_id IS NOT NULL)
);

-- 7. Update indexes
DROP INDEX IF EXISTS idx_rep_event_id;
CREATE INDEX idx_reports_event_id ON reports(reported_event_id);
CREATE INDEX idx_reports_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);

-- Add status constraint
ALTER TABLE reports 
ADD CONSTRAINT chk_reports_status CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'));
