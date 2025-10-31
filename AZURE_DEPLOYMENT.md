# 🚀 SlotSwapper - Azure Deployment Guide (GitHub Student Pack)

This guide will walk you through deploying your SlotSwapper MERN application to Microsoft Azure using your **GitHub Student Developer Pack** credits (no credit card required).

---

## 📋 What You'll Deploy

- **Backend API** → Azure App Service (Node.js)
- **Frontend** → Azure Static Web Apps (React)
- **Database** → Azure Cosmos DB for MongoDB (Free tier)

**Total Cost: $0** using GitHub Student credits ($100/year)

---

## ✅ Prerequisites

Before starting, ensure you have:

1. ✅ **GitHub Student Developer Pack** activated at [education.github.com](https://education.github.com/pack)
2. ✅ **Azure for Students** account (included in GitHub Student Pack)
3. ✅ **Git** installed on your machine
4. ✅ **GitHub repository** with your SlotSwapper code
5. ✅ **VS Code** with Azure extensions (recommended)

---

## 🎯 Deployment Overview

```
Step 1: Activate Azure for Students (5 min)
Step 2: Prepare Code for Deployment (15 min)
Step 3: Deploy Database (Cosmos DB) (10 min)
Step 4: Deploy Backend (App Service) (15 min)
Step 5: Deploy Frontend (Static Web Apps) (10 min)
Step 6: Configure & Test (10 min)
```

**Total Time: ~65 minutes**

---

## Step 1: Activate Azure for Students

### 1.1 Access Azure Portal

1. Go to [portal.azure.com](https://portal.azure.com)
2. Click **"Sign in"**
3. Use your **GitHub-linked email** (student email)
4. If first time, complete Azure for Students activation
5. Verify you see **"Azure for Students"** subscription with **$100 credit**

### 1.2 Verify Your Credits

```
Home → Cost Management + Billing → Subscriptions
You should see: "Azure for Students" - $100 remaining
```

---

## Step 2: Prepare Code for Deployment

### 2.1 Update Backend for Azure

#### A. Add Production Start Script

Your `backend/package.json` already has `"start": "node src/server.js"` ✅

#### B. Update CORS Configuration

Edit `backend/src/server.js` - Update CORS section (around line 13):

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        /\.azurestaticapps\.net$/,  // Allow Azure Static Web Apps
        /\.azurewebsites\.net$/      // Allow Azure App Service
      ]
    : 'http://localhost:3000',
  credentials: true
}));
```

#### C. Create Azure Startup File

Create `backend/web.config` (for Windows Azure):

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="src/server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="src/server.js"/>
        </rule>
      </rules>
    </rewrite>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
```

#### D. Add Node Version

Add to `backend/package.json` (after "devDependencies"):

```json
"engines": {
  "node": ">=14.0.0",
  "npm": ">=6.0.0"
}
```

### 2.2 Prepare Frontend Build Configuration

Create `frontend/staticwebapp.config.json`:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    }
  ],
  "globalHeaders": {
    "content-security-policy": "default-src 'self' https: 'unsafe-inline' 'unsafe-eval'"
  },
  "mimeTypes": {
    ".json": "application/json"
  }
}
```

### 2.3 Push Changes to GitHub

```bash
# In your project root
git add .
git commit -m "Prepare for Azure deployment"
git push origin main
```

---

## Step 3: Deploy Azure Cosmos DB (MongoDB Database)

### 3.1 Create Cosmos DB Account

1. In **Azure Portal** → Click **"Create a resource"**
2. Search for **"Azure Cosmos DB"**
3. Click **"Create"** → Select **"Azure Cosmos DB for MongoDB"**

**Configuration:**

| Setting | Value |
|---------|-------|
| **Subscription** | Azure for Students |
| **Resource Group** | Click "Create new" → `slotswapper-rg` |
| **Account Name** | `slotswapper-db-[yourname]` (must be globally unique) |
| **Location** | Choose closest (e.g., `East US`, `West Europe`) |
| **Capacity mode** | **Serverless** ⭐ (FREE for students!) |
| **Version** | MongoDB 4.2 |
| **Geo-Redundancy** | Disable (to save credits) |
| **Multi-region Writes** | Disable |

4. Click **"Review + Create"**
5. Click **"Create"**
6. ⏱️ Wait 3-5 minutes for deployment

### 3.2 Get MongoDB Connection String

1. Once deployed, click **"Go to resource"**
2. Left menu → **"Connection String"** (under Settings)
3. Copy the **"PRIMARY CONNECTION STRING"**

Example:
```
mongodb://slotswapper-db:KEY@slotswapper-db.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@slotswapper-db@
```

4. **Save this connection string** - you'll need it for backend!

### 3.3 Important Cosmos DB Note

⚠️ **Azure Cosmos DB for MongoDB uses a different connection pattern than local MongoDB:**

- Local: `mongodb://localhost:27017/slotswapper`
- Azure: `mongodb://account:key@account.mongo.cosmos.azure.com:10255/?ssl=true...`

Your existing code will work, just update the connection string!

---

## Step 4: Deploy Backend to Azure App Service

### 4.1 Create App Service (Backend API)

1. Azure Portal → **"Create a resource"**
2. Search for **"Web App"**
3. Click **"Create"**

**Configuration:**

| Setting | Value |
|---------|-------|
| **Subscription** | Azure for Students |
| **Resource Group** | `slotswapper-rg` (same as database) |
| **Name** | `slotswapper-api-[yourname]` |
| **Publish** | **Code** |
| **Runtime stack** | **Node 18 LTS** |
| **Operating System** | **Linux** |
| **Region** | Same as your Cosmos DB |
| **Pricing Plan** | Click "Explore pricing plans" → **Free F1** (100% FREE!) |

4. Click **"Review + Create"** → **"Create"**
5. ⏱️ Wait 2-3 minutes

### 4.2 Configure Environment Variables

1. Go to your App Service: **`slotswapper-api-[yourname]`**
2. Left menu → **"Configuration"** (under Settings)
3. Click **"+ New application setting"** for each variable:

**Add these settings:**

| Name | Value |
|------|-------|
| `PORT` | `8080` |
| `MONGODB_URI` | Your Cosmos DB connection string from Step 3.2 |
| `JWT_SECRET` | Generate random string: `openssl rand -base64 32` or use: `your_super_secret_production_jwt_key_12345` |
| `JWT_EXPIRE` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Leave empty for now (update after frontend deployment) |

4. Click **"Save"** at the top
5. Click **"Continue"** when prompted (will restart app)

### 4.3 Deploy Backend Code

**Option A: Deploy from GitHub (Recommended)**

1. In your App Service → **"Deployment Center"** (left menu)
2. **Source**: Select **"GitHub"**
3. Click **"Authorize"** and sign in to GitHub
4. **Organization**: Your GitHub username
5. **Repository**: Select your SlotSwapper repository
6. **Branch**: `main` (or `master`)
7. **Build Provider**: App Service build service
8. Click **"Save"**

Azure will:
- ✅ Connect to your GitHub repo
- ✅ Automatically build and deploy your backend
- ✅ Run `npm install` and `npm start`
- ✅ Auto-deploy on future commits

⏱️ Wait 5-10 minutes for first deployment

**Option B: Deploy via VS Code**

1. Install **Azure App Service extension** in VS Code
2. Click Azure icon in sidebar
3. Sign in to Azure
4. Right-click your App Service → **"Deploy to Web App"**
5. Select your `backend` folder

### 4.4 Verify Backend Deployment

1. In App Service → **"Overview"** → Copy the **URL**
   - Example: `https://slotswapper-api-yourname.azurewebsites.net`

2. Test health endpoint in browser:
   ```
   https://slotswapper-api-yourname.azurewebsites.net/api/health
   ```

3. You should see:
   ```json
   {
     "success": true,
     "message": "SlotSwapper API is running",
     "environment": "production"
   }
   ```

✅ **Backend is live!**

---

## Step 5: Deploy Frontend to Azure Static Web Apps

### 5.1 Create Static Web App

1. Azure Portal → **"Create a resource"**
2. Search for **"Static Web App"**
3. Click **"Create"**

**Configuration:**

| Setting | Value |
|---------|-------|
| **Subscription** | Azure for Students |
| **Resource Group** | `slotswapper-rg` |
| **Name** | `slotswapper-frontend` |
| **Plan type** | **Free** (100% FREE!) |
| **Region** | Choose closest |
| **Deployment source** | **GitHub** |
| **GitHub account** | Click "Sign in with GitHub" |
| **Organization** | Your GitHub username |
| **Repository** | Your SlotSwapper repo |
| **Branch** | `main` |

**Build Details:**

| Setting | Value |
|---------|-------|
| **Build presets** | `React` |
| **App location** | `/frontend` |
| **Api location** | (leave empty) |
| **Output location** | `build` |

4. Click **"Review + Create"** → **"Create"**
5. ⏱️ Wait 3-5 minutes for deployment

### 5.2 Configure Frontend Environment Variables

1. Go to your Static Web App: **`slotswapper-frontend`**
2. Left menu → **"Configuration"** (under Settings)
3. Click **"+ Add"** under "Application settings"

**Add this setting:**

| Name | Value |
|------|-------|
| `REACT_APP_API_URL` | `https://slotswapper-api-yourname.azurewebsites.net/api` |

⚠️ Replace `yourname` with your actual backend URL from Step 4.4

4. Click **"Save"**

### 5.3 Update Backend CORS with Frontend URL

Now that frontend is deployed, update backend to accept requests:

1. Go to **App Service** (backend): `slotswapper-api-yourname`
2. **Configuration** → Edit **`FRONTEND_URL`** setting
3. Set value to your Static Web App URL:
   ```
   https://slotswapper-frontend.azurestaticapps.net
   ```
4. Click **"Save"**

### 5.4 Get Frontend URL

1. In Static Web App → **"Overview"**
2. Copy the **URL**:
   ```
   https://slotswapper-frontend.azurestaticapps.net
   ```

✅ **Frontend is live!**

---

## Step 6: Test Your Deployed Application

### 6.1 Access Your Live App

1. Open your Static Web App URL in browser:
   ```
   https://slotswapper-frontend.azurestaticapps.net
   ```

2. You should see the **SlotSwapper landing page**

### 6.2 Test Full Workflow

1. ✅ **Register a new user**
   - Click "Get Started" or "Register"
   - Fill in name, email, password
   - Check if registration succeeds

2. ✅ **Create an event**
   - Go to "My Slots"
   - Click "+ Add Event"
   - Fill in event details
   - Verify event appears

3. ✅ **Make event swappable**
   - Click "Make Swappable"
   - Check status changes to green "SWAPPABLE"

4. ✅ **Test marketplace** (optional - needs 2nd user)
   - Open incognito window
   - Register another user
   - Create and make event swappable
   - Browse marketplace
   - Send swap request

### 6.3 Monitor Logs (If Issues)

**Backend Logs:**
1. App Service → **"Log stream"** (left menu)
2. Watch real-time logs for errors

**Frontend Logs:**
1. Static Web App → **"Functions"** → **"Logs"**
2. Or use browser DevTools console

---

## 🎉 Deployment Complete!

Your SlotSwapper app is now live on Azure!

### 🔗 Your Live URLs

- **Frontend**: `https://slotswapper-frontend.azurestaticapps.net`
- **Backend API**: `https://slotswapper-api-yourname.azurewebsites.net`
- **Database**: Cosmos DB (accessed internally)

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Frontend can't connect to Backend

**Symptom:** Network errors, CORS errors in browser console

**Solution:**
1. Verify `REACT_APP_API_URL` in Static Web App configuration
2. Verify `FRONTEND_URL` in App Service configuration
3. Check CORS settings in `backend/src/server.js`
4. Both should include each other's URLs

### Issue 2: Backend returns "Cannot connect to database"

**Symptom:** 500 errors when creating users/events

**Solution:**
1. Go to App Service → Configuration
2. Verify `MONGODB_URI` is correctly set
3. Test connection string in Azure Cloud Shell:
   ```bash
   mongosh "YOUR_CONNECTION_STRING"
   ```

### Issue 3: "Application Error" on Backend

**Symptom:** App Service shows generic error page

**Solution:**
1. App Service → Log stream → Check for errors
2. Common issues:
   - Missing environment variables
   - Wrong Node version (should be 18 LTS)
   - Port mismatch (should be 8080)

### Issue 4: Frontend shows blank page

**Symptom:** White screen, no errors in Azure

**Solution:**
1. Check browser DevTools → Console for errors
2. Verify `REACT_APP_API_URL` is set correctly
3. Static Web App → Deployment History → Check build logs

### Issue 5: JWT Authentication Fails

**Symptom:** Users can't login, "Unauthorized" errors

**Solution:**
1. Verify `JWT_SECRET` is set in App Service config
2. Ensure it's the same across all backend instances
3. Check JWT_EXPIRE is set to `7d`

---

## 📊 Monitoring & Costs

### Check Your Azure Credits

```
Azure Portal → Cost Management + Billing → Cost Analysis
```

**Expected Monthly Costs (with Free tiers):**
- ✅ App Service (F1): $0
- ✅ Static Web App (Free): $0
- ✅ Cosmos DB (Serverless, low usage): $0-5

**Your $100 credit should last the entire year!**

### Application Insights (Optional - Free)

Monitor app performance:

1. Create Application Insights resource (Free tier)
2. Connect to App Service
3. View metrics: requests, response times, errors

---

## 🚀 Continuous Deployment

### Automatic Updates

Your apps are now connected to GitHub:

1. **Make code changes locally**
2. **Commit and push to GitHub**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. **Azure automatically deploys** (5-10 min)
   - Backend: App Service builds and deploys
   - Frontend: Static Web App rebuilds React app

### Manual Deployment

If you want to manually trigger:

**Backend:**
- App Service → Deployment Center → Sync

**Frontend:**
- Static Web App → GitHub Actions → Re-run workflow

---

## 🔒 Security Best Practices

### Before Going Public

1. ✅ **Secure JWT Secret**
   - Generate strong random key
   - Never commit to GitHub

2. ✅ **Enable HTTPS Only**
   - App Service → TLS/SSL settings → "HTTPS Only" = On

3. ✅ **Restrict CORS**
   - Only allow your frontend domain
   - Remove wildcard patterns

4. ✅ **Add Rate Limiting**
   - Consider adding express-rate-limit

5. ✅ **Review Cosmos DB Firewall**
   - Cosmos DB → Firewall and virtual networks
   - Consider enabling IP restrictions

---

## 📚 Additional Resources

- [Azure for Students Docs](https://azure.microsoft.com/en-us/free/students/)
- [Azure App Service Docs](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Static Web Apps Docs](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Cosmos DB for MongoDB Docs](https://docs.microsoft.com/en-us/azure/cosmos-db/mongodb/)

---

## 🆘 Need Help?

- **Azure Support**: Azure Portal → Help + Support (Free for students)
- **GitHub Student Pack**: [education.github.com/support](https://education.github.com/support)
- **Stack Overflow**: Tag your questions with `azure`, `mern`, `azure-cosmosdb`

---

## ✅ Deployment Checklist

Use this checklist to track your progress:

- [ ] Azure for Students activated
- [ ] $100 credits visible in portal
- [ ] Code updated for Azure (CORS, config files)
- [ ] Changes pushed to GitHub
- [ ] Cosmos DB created and connection string saved
- [ ] App Service created (backend)
- [ ] Backend environment variables configured
- [ ] Backend deployed from GitHub
- [ ] Backend health check working
- [ ] Static Web App created (frontend)
- [ ] Frontend environment variables configured
- [ ] Frontend URL added to backend CORS
- [ ] Full app tested (register, login, create event)
- [ ] URLs shared/documented

---

**Congratulations! Your SlotSwapper app is now running on Microsoft Azure! 🎉**

**Live Demo URLs to share:**
- Frontend: `https://slotswapper-frontend.azurestaticapps.net`
- API: `https://slotswapper-api-yourname.azurewebsites.net/api/health`

---

*Last Updated: October 31, 2025*
*Deployment Time: ~65 minutes*
*Cost: $0 with GitHub Student Pack*
