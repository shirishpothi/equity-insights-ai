# Deployment Guide

This guide explains how to deploy your Equity Insights AI application with full functionality.

## Overview

The application has been configured to support multiple deployment options:

1. **Vercel (Recommended)** - Full functionality with serverless functions
2. **Netlify** - Full functionality with serverless functions  
3. **GitHub Pages** - Static demo only (limited functionality)

## Option 1: Vercel Deployment (Recommended)

Vercel provides the best experience for Next.js applications with built-in support for API routes.

### Setup Steps:

1. **Create a Vercel account** at [vercel.com](https://vercel.com)

2. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

3. **Set up environment variables in Vercel**:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add environment variable: `GEMINI_API_KEY` with your API key value

4. **Deploy using GitHub integration**:
   - Connect your GitHub repository to Vercel
   - Vercel will automatically deploy on every push to main branch

5. **Or deploy manually**:
   ```bash
   vercel --prod
   ```

### GitHub Actions Setup (Optional):

To use the included GitHub Actions workflow for Vercel:

1. Add these secrets to your GitHub repository:
   - `VERCEL_TOKEN`: Your Vercel token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID
   - `GEMINI_API_KEY`: Your Gemini API key

2. Enable the workflow in `.github/workflows/deploy-vercel.yml`

## Option 2: Netlify Deployment

Netlify also supports Next.js applications with serverless functions.

### Setup Steps:

1. **Create a Netlify account** at [netlify.com](https://netlify.com)

2. **Connect your repository**:
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Connect your GitHub repository

3. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`

4. **Set environment variables**:
   - Go to Site settings > Environment variables
   - Add `GEMINI_API_KEY` with your API key value

5. **Install the Next.js plugin**:
   - The `netlify.toml` file is already configured
   - Netlify will automatically detect and use it

## Option 3: GitHub Pages (Static Demo)

This option provides a static demo without AI functionality.

### Setup Steps:

1. **Enable GitHub Pages**:
   - Go to repository Settings > Pages
   - Select "GitHub Actions" as source

2. **Set repository secrets**:
   - Add `GEMINI_API_KEY` (for consistency, though not used in static build)

3. **Run the workflow**:
   - Go to Actions tab
   - Run "Deploy to GitHub Pages (Static Demo)" manually
   - Or enable automatic deployment by uncommenting the push trigger

**Note**: This deployment will show a demo interface but AI features will display a message explaining that full functionality requires a server environment.

## Environment Variables

All deployment options require the following environment variable:

- `GEMINI_API_KEY`: Your Google Gemini API key

### Getting a Gemini API Key:

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API key"
4. Create a new API key
5. Copy the key and use it in your deployment

## Testing Your Deployment

After deployment, test the following features:

1. **Stock Analysis**: Enter a ticker symbol and investment details
2. **Ticker Suggestions**: Type in the ticker field to see autocomplete suggestions
3. **PDF Export**: Generate and download analysis reports
4. **Responsive Design**: Test on mobile and desktop

## Troubleshooting

### Common Issues:

1. **API Key Not Working**:
   - Verify the environment variable name is exactly `GEMINI_API_KEY`
   - Check that the API key is valid and has proper permissions
   - Ensure the key is set in the correct environment (production vs preview)

2. **Build Failures**:
   - Check that all dependencies are properly installed
   - Verify Node.js version is 18 or higher
   - Review build logs for specific error messages

3. **API Routes Not Working**:
   - Ensure you're not using GitHub Pages for full functionality
   - Check that the deployment platform supports serverless functions
   - Verify API routes are accessible at `/api/analyze-stock` and `/api/suggest-tickers`

### Getting Help:

If you encounter issues:

1. Check the deployment platform's logs
2. Verify environment variables are set correctly
3. Test the application locally first
4. Review the specific platform's documentation for Next.js deployments

## Recommended Workflow

For the best development and deployment experience:

1. **Development**: Use `npm run dev` locally
2. **Testing**: Use `npm test` to run tests
3. **Staging**: Deploy to Vercel preview environment
4. **Production**: Deploy to Vercel production or your preferred platform

This setup ensures your AI-powered stock analysis application is fully functional and accessible to users.
