# 🚀 Quick Azure Deployment Checklist

## ✅ Pre-Deployment (Complete These First)

1. **Activate Azure for Students**
   - Visit: https://portal.azure.com
   - Sign in with GitHub Student email
   - Verify $100 credits visible

2. **Prepare Your Code**
   ```bash
   # Make sure all new files are committed
   git add .
   git commit -m "Prepare for Azure deployment"
   git push origin main
   ```

3. **Have These Ready**
   - GitHub account credentials
   - Student email address
   - Access to your GitHub repository

---

## 📝 Step-by-Step Deployment Order

### Step 1: Create Cosmos DB (10 min)
- [ ] Azure Portal → Create Resource → "Azure Cosmos DB"
- [ ] Choose "Azure Cosmos DB for MongoDB"
- [ ] Resource Group: `slotswapper-rg`
- [ ] Account Name: `slotswapper-db-[yourname]`
- [ ] Capacity: **Serverless** (FREE!)
- [ ] Copy connection string when done

### Step 2: Deploy Backend (15 min)
- [ ] Azure Portal → Create Resource → "Web App"
- [ ] Name: `slotswapper-api-[yourname]`
- [ ] Runtime: Node 18 LTS, Linux
- [ ] Pricing: **Free F1**
- [ ] Configuration → Add environment variables:
  - `PORT` = `8080`
  - `MONGODB_URI` = (your Cosmos DB connection string)
  - `JWT_SECRET` = (generate random string)
  - `JWT_EXPIRE` = `7d`
  - `NODE_ENV` = `production`
- [ ] Deployment Center → Connect GitHub
- [ ] Select repo and branch
- [ ] Test: `https://your-backend.azurewebsites.net/api/health`

### Step 3: Deploy Frontend (10 min)
- [ ] Azure Portal → Create Resource → "Static Web App"
- [ ] Name: `slotswapper-frontend`
- [ ] Plan: **Free**
- [ ] Connect GitHub
- [ ] Build preset: React
- [ ] App location: `/frontend`
- [ ] Output location: `build`
- [ ] Configuration → Add:
  - `REACT_APP_API_URL` = `https://your-backend.azurewebsites.net/api`
- [ ] Copy frontend URL when done

### Step 4: Update CORS (5 min)
- [ ] Go to Backend App Service
- [ ] Configuration → Update `FRONTEND_URL`
- [ ] Set to your Static Web App URL
- [ ] Save and restart

### Step 5: Test Everything (5 min)
- [ ] Open frontend URL in browser
- [ ] Register a new user
- [ ] Create an event
- [ ] Make it swappable
- [ ] Check browser console for errors

---

## 🔧 Configuration Values Reference

### Backend Environment Variables
```
PORT=8080
MONGODB_URI=mongodb://[account]:[key]@[account].mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@[account]@
JWT_SECRET=your_generated_secret_key_here_use_openssl_rand_base64_32
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://slotswapper-frontend.azurestaticapps.net
```

### Frontend Environment Variables
```
REACT_APP_API_URL=https://slotswapper-api-yourname.azurewebsites.net/api
```

---

## 🆘 Quick Troubleshooting

### Problem: Backend health check fails
**Solution:** Check App Service Logs (Log Stream) for errors

### Problem: Frontend shows "Network Error"
**Solution:** 
1. Check `REACT_APP_API_URL` is correct
2. Verify backend `FRONTEND_URL` includes frontend domain
3. Check CORS settings in server.js

### Problem: "Cannot connect to database"
**Solution:** Verify `MONGODB_URI` in backend configuration

### Problem: JWT errors / Can't login
**Solution:** Check `JWT_SECRET` is set in backend configuration

---

## 💰 Cost Tracking

### Free Resources Being Used
- ✅ App Service F1: FREE
- ✅ Static Web App Free tier: FREE
- ✅ Cosmos DB Serverless: FREE (with low usage)

### Monitor Your Credits
```
Azure Portal → Cost Management → Cost Analysis
Expected monthly cost: $0-5 (within $100 credit)
```

---

## 📱 Share Your Deployed App

Once deployed, share these URLs:

- **Live App**: `https://slotswapper-frontend.azurestaticapps.net`
- **API Health**: `https://slotswapper-api-yourname.azurewebsites.net/api/health`
- **GitHub Repo**: `https://github.com/yourusername/slotswapper`

---

## 🔄 Making Updates

After initial deployment, to update:

```bash
# 1. Make your code changes
# 2. Commit and push
git add .
git commit -m "Update feature"
git push origin main

# 3. Azure automatically deploys (wait 5-10 min)
# 4. Check deployment status in Azure Portal
```

---

## ✅ Final Checklist

- [ ] Backend deployed and health check working
- [ ] Frontend deployed and accessible
- [ ] Database connected (can register users)
- [ ] CORS configured (no browser console errors)
- [ ] Environment variables set correctly
- [ ] GitHub auto-deployment working
- [ ] App tested end-to-end
- [ ] URLs documented and shared

---

**Total Time: ~45 minutes**
**Total Cost: $0 (using student credits)**

For detailed instructions, see: **AZURE_DEPLOYMENT.md**

---

*Quick Reference Guide - Keep this handy during deployment!*
