-- Migration: Add resolution tracking to reports table

-- 1. Add description column for detailed report description
ALTER TABLE reports
ADD COLUMN description TEXT;

-- 2. Add resolved_by column (references users.id)
ALTER TABLE reports
ADD COLUMN resolved_by INTEGER;

-- 3. Add foreign key for resolved_by
ALTER TABLE reports
ADD CONSTRAINT fk_reports_resolved_by
FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Add resolved_at column
ALTER TABLE reports
ADD COLUMN resolved_at TIMESTAMP;

-- 5. Add admin_notes column for admin resolution notes
ALTER TABLE reports
ADD COLUMN admin_notes TEXT;