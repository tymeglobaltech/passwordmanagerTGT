import fs from 'fs';
import path from 'path';
import { query, testConnection } from './db';

const runMigrations = async () => {
  console.log('Starting database migrations...');

  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  try {
    // Collect all SQL files to run in order
    const sqlFiles = [
      path.join(__dirname, 'init.sql'),
      path.join(__dirname, 'migrations', '002_add_google_sso.sql'),
      path.join(__dirname, 'migrations', '003_add_full_name_and_setup_token.sql'),
      path.join(__dirname, 'migrations', '004_add_external_role.sql'),
    ];

    for (const sqlPath of sqlFiles) {
      if (!fs.existsSync(sqlPath)) {
        console.warn(`⚠️ Migration file not found, skipping: ${sqlPath}`);
        continue;
      }

      console.log(`Running: ${path.basename(sqlPath)}`);
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // Split by semicolon, respecting $$ dollar-quoted strings
      const statements: string[] = [];
      let current = '';
      let inDollarQuote = false;
      for (let i = 0; i < sql.length; i++) {
        if (sql[i] === '$' && sql[i + 1] === '$') {
          inDollarQuote = !inDollarQuote;
          current += '$$';
          i++;
        } else if (sql[i] === ';' && !inDollarQuote) {
          const trimmed = current.trim();
          if (trimmed.length > 0) statements.push(trimmed);
          current = '';
        } else {
          current += sql[i];
        }
      }
      const last = current.trim();
      if (last.length > 0) statements.push(last);

      for (const statement of statements) {
        await query(statement);
      }
    }

    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
