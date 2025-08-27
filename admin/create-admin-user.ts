#!/usr/bin/env npx tsx

/**
 * Create Admin User for SignalCartel
 * Adds admin@signalcartel.com with admin123 password to the database
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');
    console.log('Available models:', Object.keys(prisma));
    
    const email = 'admin@signalcartel.com';
    const password = 'admin123';
    const name = 'SignalCartel Admin';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create or update the admin user
    const user = await prisma.User.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name,
      },
      create: {
        email,
        password: hashedPassword,
        name,
      },
    });
    
    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 User ID: ${user.id}`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();