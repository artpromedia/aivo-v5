#!/bin/bash
# Refresh Staging Data
# Clears and re-seeds staging database with fresh test data
# 
# Usage: ./scripts/refresh-staging-data.sh
# Schedule: Weekly via cron or GitHub Actions

set -e

echo "🔄 AIVO v5 Staging Data Refresh"
echo "================================"
echo ""

# Check environment
if [ "$NODE_ENV" = "production" ]; then
    echo "❌ Cannot run in production environment!"
    exit 1
fi

# Ensure we're connected to staging database
if [ -z "$STAGING_DATABASE_URL" ]; then
    echo "⚠️  STAGING_DATABASE_URL not set, using DATABASE_URL"
    export DATABASE_URL="${DATABASE_URL:-postgresql://localhost:5432/aivo_staging}"
else
    export DATABASE_URL="$STAGING_DATABASE_URL"
fi

echo "📍 Database: ${DATABASE_URL%@*}@****"
echo ""

# Run Prisma migrations to ensure schema is up to date
echo "📦 Running database migrations..."
pnpm prisma migrate deploy

# Run seeding script
echo ""
echo "🌱 Seeding fresh data..."
npx ts-node --transpile-only scripts/seed-staging.ts

# Verify data
echo ""
echo "✅ Verifying seeded data..."
npx ts-node --transpile-only -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const users = await prisma.user.count({ where: { email: { contains: '@aivo.test' } } });
  const tenants = await prisma.tenant.count({ where: { slug: 'test-district' } });
  
  console.log('  Users: ' + users);
  console.log('  Tenants: ' + tenants);
  
  if (users === 0 || tenants === 0) {
    console.log('❌ Verification failed!');
    process.exit(1);
  }
  
  console.log('✅ Verification passed!');
  await prisma.\$disconnect();
}

verify();
"

echo ""
echo "================================"
echo "✅ Staging data refresh complete!"
echo ""
echo "Next scheduled refresh: $(date -d 'next sunday' '+%Y-%m-%d' 2>/dev/null || echo 'Weekly')"
