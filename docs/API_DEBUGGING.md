# API Debugging Guide

## Recent Improvements

### 1. Enhanced Error Handling
- **Retry Logic**: Added automatic retry for 500 errors (up to 2 attempts with exponential backoff)
- **Detailed Logging**: Enhanced error logging with timestamps, URLs, and request details
- **Better Error Messages**: More descriptive error messages for debugging

### 2. Improved Configuration
- **Increased Timeout**: Extended axios timeout from 10s to 30s
- **Vercel Headers**: Added CORS headers and function timeout settings
- **Consistent Response Handling**: Fixed response format consistency between axios and apiCall

### 3. Debugging Tools
- **Health Check Function**: `checkApiHealth()` to test API connectivity
- **ApiDebugger Component**: Real-time API monitoring component
- **Enhanced Console Logging**: Detailed request/response logging

## Common 500 Error Causes

### 1. Backend Server Issues
- **Server Overload**: High traffic causing timeout
- **Database Issues**: Connection problems or slow queries
- **Memory Issues**: Server running out of memory

### 2. Network/Proxy Issues
- **Vercel Proxy Timeout**: Function timeout (now set to 30s)
- **CORS Issues**: Cross-origin request problems
- **Network Latency**: Slow connection to backend

### 3. Request Issues
- **Large Payloads**: Request body too large
- **Invalid Headers**: Missing or malformed headers
- **Authentication Issues**: Token problems

## Debugging Steps

### 1. Check Console Logs
Look for detailed error logs in browser console:
```javascript
API Call Error Details: {
  url: "/api/auth/login",
  method: "post",
  status: 500,
  message: "Internal server error",
  retryCount: 0,
  timestamp: "2025-01-XX..."
}
```

### 2. Use ApiDebugger Component
Temporarily add the ApiDebugger component to your app:
```tsx
import ApiDebugger from '@/components/ApiDebugger';

// Add to any page for testing
<ApiDebugger />
```

### 3. Test API Health
Use the health check function:
```javascript
import { checkApiHealth } from '@/lib/apiCall';

const result = await checkApiHealth();
console.log('Health check result:', result);
```

### 4. Monitor Network Tab
- Open browser DevTools → Network tab
- Look for failed requests (red entries)
- Check response headers and body
- Note request timing

## Solutions

### 1. For Intermittent 500 Errors
- **Retry Logic**: Already implemented (2 retries with backoff)
- **Timeout Increase**: Extended to 30 seconds
- **Better Error Handling**: More graceful error recovery

### 2. For Persistent 500 Errors
- **Check Backend Logs**: Monitor server-side logs
- **Database Health**: Verify database connectivity
- **Server Resources**: Check CPU/memory usage

### 3. For Production Issues
- **Vercel Configuration**: Updated with proper headers and timeouts
- **Proxy Settings**: Consistent proxy configuration
- **Environment Variables**: Ensure proper backend URL

## Monitoring

### 1. Real-time Monitoring
- Use ApiDebugger component during development
- Monitor console logs for error patterns
- Track retry attempts and success rates

### 2. Error Tracking
- All errors are logged with timestamps
- Request details are preserved for debugging
- Error patterns can be identified

### 3. Performance Monitoring
- Request timing is logged
- Retry attempts are tracked
- Success/failure rates can be calculated

## Best Practices

### 1. Error Handling
- Always check `response.success` before using data
- Handle both network and server errors
- Provide user-friendly error messages

### 2. Retry Strategy
- Use exponential backoff for retries
- Limit retry attempts to prevent infinite loops
- Log retry attempts for monitoring

### 3. Logging
- Log all API calls for debugging
- Include relevant context (user, action, etc.)
- Use consistent log format

## Troubleshooting Checklist

- [ ] Check browser console for detailed error logs
- [ ] Verify backend server is running and accessible
- [ ] Test API health endpoint
- [ ] Check network connectivity
- [ ] Verify authentication tokens
- [ ] Monitor server resources
- [ ] Check database connectivity
- [ ] Review recent code changes
- [ ] Test in different environments (dev/prod)
- [ ] Check Vercel function logs 