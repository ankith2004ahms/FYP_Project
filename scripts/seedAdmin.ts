import { hashPassword } from '@/utils/auth';
import { getDb } from '@/lib/mongodb';
import { createUser, findUserByEmail } from '@/lib/services/userService';

async function seedAdminUser() {
  try {
    console.log('Starting admin user seeding...');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123';
    
    // Check if admin already exists
    const existingAdmin = await findUserByEmail(adminEmail);
    
    if (existingAdmin) {
      console.log(`Admin user already exists with email: ${adminEmail}`);
      return;
    }
    
    // Hash the password
    const passwordHash = await hashPassword(adminPassword);
    
    // Create the admin user
    const adminUser = await createUser({
      fullName: 'Admin User',
      email: adminEmail,
      passwordHash,
      lastLoginAt: new Date()
    });
    
    console.log(`Admin user created successfully with ID: ${adminUser.id}`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword} (only displayed once)`);
    
    console.log('Admin user seeding completed!');
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedAdminUser(); 