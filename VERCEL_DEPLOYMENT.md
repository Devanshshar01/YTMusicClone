# 🚀 Vercel Deployment Guide - Authentication

## Important: Database Configuration for Vercel

⚠️ **SQLite doesn't work on Vercel** because it's a serverless platform. You need to use PostgreSQL.

## Option 1: Use Vercel Postgres (Recommended)

### Step 1: Create a Postgres Database

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Follow the setup wizard

### Step 2: Configure Environment Variables

Vercel will automatically add the `POSTGRES_PRISMA_URL` variable. You need to add:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add these variables:

```
DATABASE_URL=your_postgres_connection_string
NEXTAUTH_SECRET=generate_a_random_secret_key
NEXTAUTH_URL=https://your-app.vercel.app
```

To generate a secure secret:
```bash
openssl rand -base64 32
```

### Step 3: Update Prisma Schema for PostgreSQL

The schema is already PostgreSQL-compatible, but update your local `prisma/schema.prisma` if needed:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 4: Deploy to Vercel

```bash
# Commit your changes
git add .
git commit -m "Configure for Vercel deployment with PostgreSQL"
git push

# Or deploy directly
vercel --prod
```

### Step 5: Run Database Migrations on Vercel

After deployment, you need to run migrations:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Run migration using Vercel's environment
npx prisma migrate deploy
```

Or set up a migration script in your CI/CD.

## Option 2: Use External PostgreSQL (Neon, Supabase, Railway)

### Using Neon (Free PostgreSQL)

1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string
5. Add to Vercel environment variables:

```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=https://your-app.vercel.app
```

### Using Supabase (Free PostgreSQL)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (use "Connection pooling" for better performance)
5. Add to Vercel environment variables

### Using Railway (Free PostgreSQL)

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL service
4. Copy the connection string
5. Add to Vercel environment variables

## Build Configuration

Your `package.json` should have (already configured):

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

## Environment Variables on Vercel

Make sure to set these in your Vercel project settings:

### Required:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `NEXTAUTH_URL` - Your production URL (e.g., https://your-app.vercel.app)

### Optional:
- `NODE_ENV=production`

## Troubleshooting

### Error: @prisma/client did not initialize

**Solution:** Make sure:
1. ✅ `postinstall` script is in package.json
2. ✅ `prisma generate` is in build script
3. ✅ Prisma is in dependencies (not devDependencies)
4. ✅ All environment variables are set on Vercel

### Error: Can't reach database server

**Solution:**
1. Check your DATABASE_URL is correct
2. Ensure the database allows connections from Vercel IPs
3. Make sure SSL mode is enabled for external databases

### Error: Database migrations not applied

**Solution:**
Run migrations after deployment:
```bash
npx prisma migrate deploy
```

Or add a migration script to run automatically.

## Development vs Production

### Local Development (SQLite)
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="local-dev-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Production (PostgreSQL)
```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
NEXTAUTH_SECRET="your-super-secure-random-secret"
NEXTAUTH_URL="https://your-app.vercel.app"
```

## Quick Start for Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Set up PostgreSQL** (choose one):
   - Vercel Postgres
   - Neon
   - Supabase
   - Railway

4. **Set Environment Variables** on Vercel dashboard:
   - DATABASE_URL
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL

5. **Update schema for PostgreSQL:**
   ```bash
   # Edit prisma/schema.prisma to use postgresql
   # Then generate
   npx prisma generate
   ```

6. **Deploy:**
   ```bash
   vercel --prod
   ```

7. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

## Automated Migrations

To automatically run migrations on deploy, you can add a script or use Vercel's build hooks. However, be cautious with automated migrations in production.

## Using SQLite Locally, PostgreSQL on Vercel

You can use different databases for different environments. Update your schema:

```prisma
datasource db {
  provider = "postgresql"  // Use postgresql for production
  url      = env("DATABASE_URL")
}
```

For local development with SQLite, you can temporarily change it or use PostgreSQL locally too (recommended for consistency).

## Success Checklist

Before deploying, ensure:

- [ ] `postinstall` script added to package.json
- [ ] `prisma generate` in build script
- [ ] bcryptjs and next-auth in dependencies
- [ ] Prisma schema uses PostgreSQL provider
- [ ] Environment variables set on Vercel
- [ ] PostgreSQL database created and accessible
- [ ] Migrations ready to run

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

---

**Pro Tip:** Use Neon or Supabase for free PostgreSQL hosting that works perfectly with Vercel!
