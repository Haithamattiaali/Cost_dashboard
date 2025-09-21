# CORS Fix Documentation - Netlify + Render Deployment

## Problem Summary
The application was experiencing CORS issues when uploading files from the Netlify-hosted frontend (https://protco.netlify.app) to the Render-hosted Express backend (https://proceed-cost-dashboard-api.onrender.com).

## Root Causes Identified

1. **Missing CORS Headers on Render**: Despite configuring CORS middleware, headers were not being sent in responses
2. **Preflight Request Failures**: OPTIONS requests for multipart/form-data uploads were not being handled properly
3. **Cloudflare Proxy Issues**: Render uses Cloudflare which can strip CORS headers in certain configurations
4. **Missing Credentials Flag**: Frontend wasn't sending credentials with requests, causing CORS to fail

## Solution Implemented

### Backend Changes (Express/Render)

#### 1. Enhanced CORS Configuration (`backend/server.ts`)
- Implemented robust CORS middleware with explicit origin allowlist
- Added manual CORS header setting as fallback
- Explicitly handle OPTIONS preflight requests
- Added maxAge for preflight caching (24 hours)

```javascript
const allowedOrigins = [
  'https://protco.netlify.app',
  'https://proceed-cost-dashboard.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  maxAge: 86400,
  optionsSuccessStatus: 204
};
```

#### 2. Double-Layer CORS Protection
- Primary: CORS middleware package
- Secondary: Manual middleware that ensures headers are always set
- Explicit OPTIONS handling for all routes

#### 3. Upload Route Enhancements (`backend/routes/upload.ts`)
- Added logging for debugging CORS issues
- Ensure CORS headers are set on both success and error responses
- Better error handling for multer-specific errors

### Frontend Changes (React/Netlify)

#### 1. API Call Updates (`src/api/costs.ts`)
- Added `credentials: 'include'` to all fetch requests
- Enhanced error logging for upload failures
- Better network error detection and reporting

```javascript
const response = await fetch(apiUrl, {
  method: 'POST',
  body: formData,
  credentials: 'include', // Critical for CORS with credentials
  // Don't set Content-Type - browser handles multipart boundary
});
```

#### 2. Netlify Configuration (`netlify.toml`)
- Added API proxy redirects to Render backend
- Configured CORS headers for API routes
- Proper redirect ordering (API before SPA fallback)

```toml
[[redirects]]
  from = "/api/*"
  to = "https://proceed-cost-dashboard-api.onrender.com/api/:splat"
  status = 200
  force = true
```

#### 3. Additional Headers File (`public/_headers`)
- Backup CORS configuration for Netlify
- Security headers for production
- Cache control for static assets

### Environment Variables (Render)

Set these in your Render service:

```bash
NODE_ENV=production
CORS_ORIGIN=*  # Or specific origins
PORT=3001
HOST=0.0.0.0
DATABASE_PATH=./data/costs.db
UPLOAD_DIR=./uploads
```

## Deployment Steps

### 1. Deploy Backend to Render
1. Push the updated backend code to your repository
2. Render will automatically rebuild and deploy
3. Verify environment variables are set correctly
4. Check the health endpoint: `https://proceed-cost-dashboard-api.onrender.com/api/health`

### 2. Deploy Frontend to Netlify
1. Push the updated frontend code
2. Netlify will automatically build and deploy
3. The `netlify.toml` and `_headers` files will be processed
4. Verify the build completes successfully

### 3. Testing the Fix

Test the upload functionality:
1. Open browser DevTools Network tab
2. Navigate to the upload page
3. Select and upload an Excel file
4. Verify:
   - OPTIONS preflight request returns 204
   - POST request includes CORS headers
   - Upload completes successfully

## Troubleshooting

### If CORS Issues Persist:

1. **Check Render Logs**
   - Look for `[Upload Route]` and `[Upload]` log entries
   - Verify headers are being received and set

2. **Test Direct API Access**
   ```bash
   curl -X OPTIONS https://proceed-cost-dashboard-api.onrender.com/api/upload/excel \
     -H "Origin: https://protco.netlify.app" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

3. **Verify Netlify Proxy**
   - Check if requests go through Netlify proxy or direct to Render
   - Monitor Network tab for actual request URLs

4. **Try Alternative Solutions**
   - Use Netlify Functions as a proxy
   - Deploy backend to a different platform (Railway, Heroku)
   - Use a dedicated CORS proxy service

### Common Issues and Fixes:

| Issue | Solution |
|-------|----------|
| "Failed to fetch" error | Check if backend is running and accessible |
| Missing CORS headers | Ensure middleware order is correct |
| Preflight fails | Verify OPTIONS handling is in place |
| Credentials not included | Add `credentials: 'include'` to fetch calls |
| Headers stripped by proxy | Use Netlify redirects or direct API calls |

## Monitoring

Add monitoring for CORS issues:
1. Log all CORS-related errors on backend
2. Track preflight request success rate
3. Monitor upload success/failure ratio
4. Set up alerts for repeated CORS failures

## Security Considerations

While we're using `CORS_ORIGIN=*` for initial testing, in production you should:
1. Set specific allowed origins
2. Use environment-specific origin lists
3. Implement rate limiting on upload endpoints
4. Add file type and size validation
5. Scan uploaded files for security threats

## Additional Resources

- [Express CORS Middleware Documentation](https://expressjs.com/en/resources/middleware/cors.html)
- [Netlify Redirects and Proxies](https://docs.netlify.com/routing/redirects/)
- [Render.com Environment Variables](https://render.com/docs/environment-variables)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)