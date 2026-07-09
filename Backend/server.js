process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const app = require('./app');
const prisma = require('./config/db');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // Validate database connection
    console.log('Validating database connection via Prisma...');
    await prisma.$connect();
    console.log('Database connected successfully.');

    // Auto-seed if User table is empty
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('No user profiles detected in the database. Performing automatic seed...');
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log('Database seeded: Default Administrator user registered.');
    }

    // Start server listening
    app.listen(PORT, () => {
      console.log(`BansosChain Backend Server running on port ${PORT}`);
      console.log(`Endpoint Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to initialize server or database connection:', error);
    process.exit(1);
  }
}

bootstrap();
