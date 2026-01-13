# Deployment Guide for Digestive Diary

## ✅ Code Pushed to GitHub

Your code has been successfully pushed to: https://github.com/philipposk/Digestive-Diary

## Deployment Options for digestive.6x7.gr

### Option 1: Vercel (RECOMMENDED) ⭐

**Best for Next.js apps with API routes and AI features**

#### Why Vercel?
- ✅ Built specifically for Next.js (made by the Next.js team)
- ✅ **GitHub Actions NOT needed** - Vercel handles deployment automatically
- ✅ Free tier with generous limits
- ✅ Easy custom domain setup (digestive.6x7.gr)
- ✅ Environment variables in dashboard
- ✅ Automatic HTTPS/SSL certificates
- ✅ Supports API routes (your AI endpoints will work)
- ✅ Serverless functions (perfect for OpenAI/Groq APIs)

#### Setup Steps:

1. **Sign up/Login to Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub (connect your GitHub account)

2. **Import Your Repository**
   - Click "Add New Project"
   - Select `philipposk/Digestive-Diary` repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Click "Deploy"

4. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add:
     - `OPENAI_API_KEY` = `your_openai_key`
     - `GROQ_API_KEY` = `your_groq_key` (optional)
   - Click "Save"
   - Redeploy the project (Settings → Deployments → Redeploy)

5. **Configure Custom Domain (digestive.6x7.gr)**
   - Go to Project Settings → Domains
   - Add domain: `digestive.6x7.gr`
   - Vercel will show DNS records to add:
     - Add a CNAME record: `digestive` → `cname.vercel-dns.com`
     - OR add an A record if you prefer (Vercel will show the IP)
   - Wait for DNS propagation (5-60 minutes)
   - Vercel automatically provides SSL certificate

6. **Automatic Deployments**
   - Every push to `main` branch = automatic deployment
   - Preview deployments for pull requests
   - **No GitHub Actions needed!**

---

### Option 2: Netlify

Similar to Vercel, also good for Next.js.

- ✅ Free tier
- ✅ Custom domains
- ✅ Environment variables
- ✅ GitHub Actions NOT needed (auto-deployments)
- ⚠️ Slightly more setup for Next.js API routes

---

### Option 3: Self-Hosted (Your Own Server)

**Only if you have/own a VPS/server and want full control**

#### Requirements:
- VPS/Server (DigitalOcean, AWS EC2, etc.)
- Node.js 18+ installed
- Nginx or similar web server
- Domain DNS access (6x7.gr)

#### With GitHub Actions (Optional):
GitHub Actions can help automate deployment to your server, but you still need:
- A server/VPS
- SSH access configured
- Server setup (Node.js, PM2, Nginx, etc.)

**This is much more complex than Vercel/Netlify.**

---

## Recommendation: Use Vercel 🚀

For a Next.js app with API routes and AI features, **Vercel is the easiest and most reliable option**. You don't need GitHub Actions - Vercel handles everything automatically when you connect your GitHub repository.

## Quick Start with Vercel

1. Visit https://vercel.com
2. Sign up with GitHub
3. Import `philipposk/Digestive-Diary`
4. Add environment variables (OPENAI_API_KEY, GROQ_API_KEY)
5. Add custom domain: `digestive.6x7.gr`
6. Update DNS records at your domain registrar
7. Done! Every push = auto-deploy

## Important Notes

- **API Keys**: Never commit `.env.local` files (already in `.gitignore`)
- **Environment Variables**: Must be set in Vercel dashboard (not in code)
- **DNS Configuration**: You'll need access to DNS settings for `6x7.gr` domain
- **SSL/HTTPS**: Vercel provides this automatically
- **Cost**: Vercel free tier is sufficient for most apps (generous limits)

## Testing After Deployment

1. Check that all API routes work (`/api/openai/*`, `/api/groq/*`, `/api/ai/*`)
2. Test AI features (voice, chat, parsing)
3. Verify environment variables are set correctly
4. Check that custom domain works with HTTPS

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Vercel Support: https://vercel.com/support

