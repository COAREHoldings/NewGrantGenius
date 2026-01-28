# Vercel Deployment Guide for Grant-Master

## Prerequisites
- Vercel account (https://vercel.com)
- Neon PostgreSQL database (https://neon.tech)
- OpenAI API key

## Step 1: Import Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import from GitHub: `COAREHoldings/Grant-Master`

## Step 2: Configure Environment Variables
Add these in Vercel's "Environment Variables" section:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon connection string (e.g., `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require`) |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `JWT_SECRET` | Random 32+ character string (generate: `openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g., `https://grant-master.vercel.app`) |

## Step 3: Initialize Database
Run migrations on your Neon database:
```sql
-- Execute contents of migrations/003_cre_tables.sql
-- Execute contents of migrations/004_usage_tracking.sql
```

Or use Neon's SQL editor to run the migration files.

## Step 4: Deploy
Click "Deploy" - Vercel handles the rest automatically.

## Post-Deployment
- Test authentication at `/`
- Create a new application
- Verify AI suggestions work (requires valid OpenAI key)

## Troubleshooting
- **Database errors**: Verify `DATABASE_URL` includes `?sslmode=require`
- **AI not working**: Check OpenAI API key has sufficient credits
- **Auth issues**: Ensure `JWT_SECRET` is set
