import fs from 'node:fs';
import path from 'node:path';

// Prisma 7 configuration file.
// Load .env manually to ensure DATABASE_URL is available during CLI execution.
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach((line) => {
    const [rawKey, rawValue] = line.split('=');
    if (!rawKey || !rawValue) return;

    const key = rawKey.trim();
    const value = rawValue.trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  });
}

const prismaConfig = {
  migrations: {
    seed: 'npx tsx ./prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};

export default prismaConfig;
