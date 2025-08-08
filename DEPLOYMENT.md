# Deployment Guide

## Vercel Deployment

This application is configured for deployment on Vercel with serverless functions.

### Prerequisites
- Node.js 16+ 
- Vercel CLI (optional)
- GitHub repository

### Deployment Steps

#### Option 1: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will automatically detect the configuration from `vercel.json`
6. Click "Deploy"

#### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to link your project
```

### Configuration Files

- `vercel.json`: Vercel deployment configuration
- `server-serverless.js`: Serverless-optimized version of the API
- `src/database-serverless.js`: In-memory database for serverless environment

### Important Notes

1. **Database**: Uses in-memory SQLite database in serverless environment
   - Data is not persistent between function invocations
   - Each request starts with a fresh database
   - For production, consider using a persistent database service

2. **Environment Variables**: 
   - `NODE_ENV=production` is automatically set by Vercel
   - No additional environment variables required for basic functionality

3. **Rate Limiting**: Reduced to 100 requests per 15 minutes for serverless

### Testing the Deployed API

Once deployed, you can test the API endpoints:

```bash
# Replace YOUR_VERCEL_URL with your actual Vercel deployment URL

# Store a value
curl -X POST https://YOUR_VERCEL_URL/object \
  -H "Content-Type: application/json" \
  -d '{"mykey": "hello world"}'

# Get latest value
curl https://YOUR_VERCEL_URL/object/mykey

# Health check
curl https://YOUR_VERCEL_URL/health

# API documentation
curl https://YOUR_VERCEL_URL/
```

### Production Considerations

For a production deployment, consider:

1. **Persistent Database**: Use PostgreSQL, MySQL, or MongoDB Atlas
2. **Environment Variables**: Store sensitive configuration in Vercel environment variables
3. **Monitoring**: Set up logging and monitoring services
4. **CDN**: Vercel provides CDN automatically
5. **Custom Domain**: Configure a custom domain in Vercel dashboard
