# Environment Configuration

This document describes the environment variables used to configure the client application.

## Required Environment Variables

### REACT_APP_API_URL

**Description**: The URL of the API server that the client will connect to.

**Default**: `http://localhost:3051` (in development)

**Production Usage**: Set this to your deployed API server URL when building for production.

**Examples**:

- Development: `http://localhost:3051`
- Production: `https://api.yourdomain.com`
- Production with custom port: `https://api.yourdomain.com:8080`

### REACT_APP_BUNNY_SUBDOMAIN

**Description**: Your Bunny subdomain for the billing portal integration.

**Default**: `subdomain`

**Example**: `mycompany`

## Setting Environment Variables

### For Development

Create a `.env` file in the client directory:

```bash
# .env
REACT_APP_API_URL=http://localhost:3051
REACT_APP_BUNNY_SUBDOMAIN=your-subdomain
```

### For Production Build

Set the environment variables before building:

```bash
# Using environment variables
export REACT_APP_API_URL=https://api.yourdomain.com
export REACT_APP_BUNNY_SUBDOMAIN=your-subdomain
npm run build

# Or inline
REACT_APP_API_URL=https://api.yourdomain.com npm run build
```

### For Static Hosting

When deploying to static hosting services (Netlify, Vercel, etc.), set these environment variables in your hosting platform's environment configuration.

## How It Works

The application uses the `src/config/api.ts` file to handle API URL configuration:

- In development, it defaults to `http://localhost:3051`
- In production, it uses the `REACT_APP_API_URL` environment variable
- If no environment variable is set, it falls back to the default

This allows the same codebase to work in both development and production environments with different API server URLs.
