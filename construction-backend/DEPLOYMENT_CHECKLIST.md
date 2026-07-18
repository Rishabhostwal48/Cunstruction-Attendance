# Construction Workforce Proof-of-Presence Platform - Deployment Checklist

## Pre-Deployment Verification

### 1. Code Quality
- [ ] All files follow consistent formatting
- [ ] No console.log() statements in production code
- [ ] Error messages don't expose sensitive information
- [ ] Input validation on all endpoints
- [ ] Authorization checks on protected routes
- [ ] No hardcoded secrets in code

### 2. Security
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] CORS_ORIGIN is set to production domain
- [ ] Helmet.js security headers enabled
- [ ] Password hashing implemented
- [ ] File upload validation active
- [ ] Rate limiting configured
- [ ] SQL injection protection (MongoDB)

### 3. Performance
- [ ] Database indexes created
- [ ] Response compression enabled
- [ ] Pagination implemented
- [ ] Query optimization done
- [ ] No N+1 query issues
- [ ] Caching strategy defined

### 4. Database
- [ ] MongoDB connection tested
- [ ] All collections created
- [ ] Indexes created
- [ ] Backup strategy in place
- [ ] Data validation in schemas
- [ ] TTL indexes set (if needed)

### 5. File Storage
- [ ] Upload directory structure created
- [ ] File permissions correct
- [ ] File size limits enforced
- [ ] File type validation active
- [ ] S3 abstraction layer ready

### 6. Monitoring & Logging
- [ ] Error logging configured
- [ ] Request logging enabled
- [ ] Performance monitoring setup
- [ ] Alert system configured
- [ ] Log rotation configured

### 7. Testing
- [ ] All endpoints tested
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Error handling tested
- [ ] Geofence validation tested
- [ ] File upload tested

### 8. Documentation
- [ ] API documentation complete
- [ ] Development guide written
- [ ] Postman collection created
- [ ] README updated
- [ ] Environment setup documented

## Environment Configuration

### Development
```env
NODE_ENV=development
PORT=5000
JWT_EXPIRY=7d
LOG_LEVEL=debug
```

### Staging
```env
NODE_ENV=staging
PORT=5000
JWT_EXPIRY=7d
LOG_LEVEL=info
```

### Production
```env
NODE_ENV=production
PORT=5000
JWT_EXPIRY=7d
LOG_LEVEL=error
CORS_ORIGIN=https://yourdomain.com
```

## Deployment Steps

### 1. Heroku Deployment
```bash
# Create app
heroku create construction-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=<production_mongodb_uri>
heroku config:set JWT_SECRET=<strong_secret>
heroku config:set CORS_ORIGIN=https://yourdomain.com

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

### 2. AWS EC2 Deployment
```bash
# SSH into instance
ssh -i key.pem ec2-user@instance-ip

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Clone repository
git clone <repo-url>
cd construction-backend

# Install dependencies
npm install --production

# Create .env file
nano .env

# Install PM2 globally
sudo npm install -g pm2

# Start app with PM2
pm2 start src/app.js --name construction-backend
pm2 startup
pm2 save

# Configure Nginx (reverse proxy)
sudo nano /etc/nginx/sites-available/construction-backend
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Docker Deployment
```bash
# Build image
docker build -t construction-backend:1.0.0 .

# Run container
docker run -d \
  -p 5000:5000 \
  -e MONGO_URI=<mongodb_uri> \
  -e JWT_SECRET=<secret> \
  --name construction-backend \
  construction-backend:1.0.0

# Check logs
docker logs -f construction-backend
```

## Post-Deployment

### Verification
- [ ] API responds to health check
- [ ] Database connection established
- [ ] Authentication working
- [ ] File uploads functional
- [ ] Reports generating
- [ ] Error handling working

### Monitoring Setup
1. Set up error tracking (Sentry, Rollbar)
2. Configure uptime monitoring (Pingdom, UptimeRobot)
3. Set up performance monitoring (New Relic, DataDog)
4. Configure log aggregation (ELK, LogRocket)

### Backup & Recovery
1. Enable automated MongoDB backups
2. Test backup restoration
3. Document recovery procedures
4. Set backup retention policy

### Security Audit
1. Run security scan (npm audit)
2. Review firewall rules
3. Check SSL certificate validity
4. Verify access controls
5. Review API rate limits

## Scaling Strategy

### Phase 1: Current (0-100 users)
- Single Node.js instance
- Single MongoDB instance
- Local file storage

### Phase 2: Growing (100-1000 users)
- Load balancing (multiple Node instances)
- MongoDB replication
- Redis caching
- AWS S3 for file storage
- CDN for static files

### Phase 3: Enterprise (1000+ users)
- Auto-scaling groups
- Database sharding
- Microservices (if needed)
- Advanced caching layers
- Global CDN

## Troubleshooting

### High Memory Usage
```bash
# Check processes
pm2 monit

# Increase memory
NODE_OPTIONS=--max-old-space-size=2048
```

### Database Connection Issues
```bash
# Test connection
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});
```

### File Upload Failures
- Check disk space
- Verify upload directory permissions
- Check file size limits
- Review multer configuration

## Health Check Endpoint

```bash
curl http://yourdomain.com/health

# Response:
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00Z",
  "environment": "production"
}
```

## Rollback Procedure

### Git-based Rollback
```bash
git revert <commit-hash>
git push origin main
# Redeploy
```

### Database Rollback
```javascript
// Use MongoDB backups
// 1. Stop application
pm2 stop construction-backend

// 2. Restore backup
mongorestore --drop --db construction-backend <backup-path>

// 3. Restart application
pm2 start construction-backend
```

## Continuous Deployment (CI/CD)

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run build
      - uses: AkhileshNS/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: construction-backend
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
```

## Performance Benchmarks

### Expected Performance (Single Node)
- Response time: < 200ms (p95)
- Throughput: 1000+ requests/second
- Concurrent connections: 100+
- File upload: < 2 seconds (5MB)

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:5000/health

# Using autocannon
npx autocannon http://localhost:5000/health
```

## Monitoring Dashboards

### Key Metrics to Track
- Request count and response time
- Error rate by endpoint
- Database query performance
- File upload success rate
- Geofence validation latency
- User activity patterns
- API usage per role

## Maintenance Schedule

### Daily
- Monitor error logs
- Check disk usage
- Verify backup completion

### Weekly
- Review performance metrics
- Check security logs
- Test backup restoration

### Monthly
- Update dependencies
- Run security audit
- Performance optimization
- Database maintenance

## Contact & Support

- **DevOps**: [devops@company.com]
- **Backend Team**: [backend@company.com]
- **Emergency**: [on-call-number]

---

**Version**: 1.0.0  
**Last Updated**: January 15, 2025  
**Status**: Ready for Deployment
