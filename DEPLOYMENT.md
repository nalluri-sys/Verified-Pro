# Verified pro Deployment Guide

## 1) Push to GitHub

1. Initialize git (if not initialized):
   - git init
2. Add files and commit:
   - git add .
   - git commit -m "Prepare project for deployment"
3. Create a GitHub repository and connect remote:
   - git remote add origin https://github.com/<your-username>/<your-repo>.git
   - git branch -M main
   - git push -u origin main

## 2) Required Environment Variables

Set these in your deployment platform:

- PORT=3000
- NODE_ENV=production
- MONGODB_URI=<your-mongodb-uri>
- JWT_SECRET=<secure-random-secret>
- BASE_PATH=/

## 3) Build and Start Commands (No Docker)

Use these commands in your deployment service:

- Install: pnpm install --frozen-lockfile --ignore-scripts
- Build: pnpm run build:deploy
- Start: pnpm start

## 4) Docker Deployment

Build image:
- docker build -t verified-pro .

Run container:
- docker run -p 3000:3000 --env-file .env verified-pro

## 5) App URLs

- Web app: /
- API health check: /api/healthz

## Notes

- The app is configured as single-port deployment: frontend and backend are served by the API server.
- Frontend production build is generated before backend bundle in build:deploy.
