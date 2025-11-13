import { sequelize } from './src/config/db.js';

async function runMigration() {
  try {
    console.log('Applying migration: Add resolution tracking to reports table');

    // 1. Add description column
    await sequelize.query(`
      ALTER TABLE "EventHub"."reports"
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    console.log('✓ Added description column');

    // 2. Add resolved_by column
    await sequelize.query(`
      ALTER TABLE "EventHub"."reports"
      ADD COLUMN IF NOT EXISTS resolved_by INTEGER;
    `);
    console.log('✓ Added resolved_by column');

    // 3. Add foreign key for resolved_by
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                      WHERE constraint_name = 'fk_reports_resolved_by'
                      AND table_schema = 'EventHub') THEN
          ALTER TABLE "EventHub"."reports"
          ADD CONSTRAINT fk_reports_resolved_by
          FOREIGN KEY (resolved_by) REFERENCES "EventHub"."users"(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    console.log('✓ Added foreign key for resolved_by');

    // 4. Add resolved_at column
    await sequelize.query(`
      ALTER TABLE "EventHub"."reports"
      ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
    `);
    console.log('✓ Added resolved_at column');

    // 5. Add admin_notes column
    await sequelize.query(`
      ALTER TABLE "EventHub"."reports"
      ADD COLUMN IF NOT EXISTS admin_notes TEXT;
    `);
    console.log('✓ Added admin_notes column');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration();