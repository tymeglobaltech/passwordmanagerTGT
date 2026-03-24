import bcrypt from 'bcrypt';
import { query, testConnection } from './db';

const seedDatabase = async () => {
  console.log('Starting database seeding...');

  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  try {
    // Check if admin already exists
    const existingAdmin = await query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists, skipping seed');
      process.exit(0);
    }

    // Create admin user
    const password = 'Admin123!';
    const passwordHash = await bcrypt.hash(password, 12);

    await query(
      `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      ['admin', 'admin@passwordpal.com', passwordHash, 'admin', true]
    );

    console.log('✅ Database seeding completed successfully');
    console.log('');
    console.log('Default admin credentials:');
    console.log('  Username: admin');
    console.log('  Password: Admin123!');
    console.log('');
    console.log('⚠️  IMPORTANT: Change these credentials immediately after first login!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
