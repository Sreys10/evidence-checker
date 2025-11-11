# Frontend Repository Cleanup

## Files/Folders to Remove

Since backend is deployed separately, these are NOT needed in frontend repo:

### ❌ Remove These:

1. **`model/`** - Python detection models (backend handles this)
2. **`backend-service/`** - Separate backend repository
3. **`python-service/`** - Not needed
4. **`requirements.txt`** - Python dependencies
5. **`Dockerfile`** - Not needed for Vercel
6. **`docker-compose.yml`** - Not needed for Vercel

### ✅ Keep These:

- All `app/` folder (Next.js routes)
- All `components/` folder
- All `lib/` folder
- `package.json` and `package-lock.json`
- `next.config.ts`
- `tailwind.config.js`
- `tsconfig.json`
- All config files
- `public/` folder
- Documentation files (README, DEPLOYMENT.md, etc.)

## Quick Cleanup Commands

```bash
cd evi-check

# Remove from git tracking (if already committed)
git rm -r --cached model/ backend-service/ python-service/ 2>/dev/null || true
git rm --cached requirements.txt Dockerfile docker-compose.yml 2>/dev/null || true

# Commit cleanup
git commit -m "Remove backend files - using separate backend service"

# Push to GitHub
git push
```

## Verify Cleanup

After cleanup, your frontend repo should have:
- ✅ Next.js app structure
- ✅ React components
- ✅ API routes (that call external backend)
- ✅ No Python files
- ✅ No backend service files

## Next Steps

After cleanup, follow [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for deployment.

