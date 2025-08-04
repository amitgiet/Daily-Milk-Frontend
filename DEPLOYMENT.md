# Deployment Guide for Vercel

## Environment Variables Setup

When deploying to Vercel, you need to set up the following environment variables in your Vercel project settings:

### Required Environment Variables

1. **VITE_API_BASE_URL**
   - Value: `https://dairy-management-7yqn.onrender.com`
   - Description: The backend API URL for production

2. **VITE_DEV_PROXY_URL** (optional)
   - Value: `https://dairy-management-7yqn.onrender.com`
   - Description: The backend API URL for development proxy

### How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```
Name: VITE_API_BASE_URL
Value: https://dairy-management-7yqn.onrender.com
Environment: Production, Preview, Development

Name: VITE_DEV_PROXY_URL
Value: https://dairy-management-7yqn.onrender.com
Environment: Production, Preview, Development
```

### Local Development Setup

Create a `.env` file in your project root with:

```env
VITE_API_BASE_URL=https://dairy-management-7yqn.onrender.com
VITE_DEV_PROXY_URL=https://dairy-management-7yqn.onrender.com
```

### How It Works

- **Development**: Uses Vite proxy (`/api`) to avoid CORS issues
- **Production**: Uses direct API calls to the backend URL
- **Environment Variables**: Allow you to change the backend URL without code changes

### Important Notes

1. All environment variables must start with `VITE_` to be accessible in the frontend
2. The backend URL is hardcoded as fallback in case environment variables are not set
3. Make sure your backend CORS settings allow requests from your Vercel domain 