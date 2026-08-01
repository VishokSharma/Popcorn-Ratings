# Production Deployment Guide

## Environment Variables

### API (.env.production)
```bash
NODE_ENV=production
DB_HOST=<database-host>
DB_PASSWORD=<secure-password>
JWT_SECRET=<generate-secure-random-string>
JWT_REFRESH_SECRET=<generate-secure-random-string>
CORS_ORIGIN=https://app.example.com
```

### Frontend (.env.production)
```bash
NEXT_PUBLIC_API_URL=https://api.example.com
API_INTERNAL_URL=https://api.example.com
```

## Security Checklist

- [ ] All secrets are randomly generated (use: `openssl rand -hex 32`)
- [ ] HTTPS enabled on both frontend and API
- [ ] CORS_ORIGIN configured for your domain
- [ ] Database backups configured
- [ ] Error logging setup (Sentry or similar)
- [ ] Rate limiting enabled
- [ ] Security headers set (X-Frame-Options, CSP, etc)
- [ ] CORS credentials: true for cookies

## Database Setup

```bash
# Create production database
createdb popcorn_ratings_prod

# Run migrations
psql -U postgres -d popcorn_ratings_prod < schema.sql
```

## Testing Production Build

```bash
# Build Next.js
npm run build

# Start production server
npm start
```

## Monitoring

- Monitor error logs regularly
- Check database performance
- Monitor API response times
- Track user growth and engagement
