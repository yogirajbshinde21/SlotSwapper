# Azure Production Environment Variables
# Copy these values to Azure Portal Configuration

# ===========================================
# BACKEND (Azure App Service Configuration)
# ===========================================
# App Service → Configuration → Application settings → New application setting

PORT=8080
NODE_ENV=production
JWT_EXPIRE=7d

# MongoDB Connection (from Cosmos DB)
# Get this from: Cosmos DB → Connection String → PRIMARY CONNECTION STRING
MONGODB_URI=mongodb://[ACCOUNT_NAME]:[KEY]@[ACCOUNT_NAME].mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@[ACCOUNT_NAME]@

# JWT Secret (generate a strong random string)
# Generate with: openssl rand -base64 32
# Or use a password generator with 32+ characters
JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_SECRET_KEY_32_CHARS_MIN

# Frontend URL (your Azure Static Web App URL)
# Get this from: Static Web App → Overview → URL
FRONTEND_URL=https://slotswapper-frontend.azurestaticapps.net


# ===========================================
# FRONTEND (Azure Static Web App Configuration)
# ===========================================
# Static Web App → Configuration → Application settings → Add

# Backend API URL (your Azure App Service URL)
# Get this from: App Service → Overview → URL
REACT_APP_API_URL=https://slotswapper-api-yourname.azurewebsites.net/api


# ===========================================
# NOTES
# ===========================================
# 1. Never commit this file with real values to GitHub
# 2. Replace [ACCOUNT_NAME], [KEY], [yourname] with actual values
# 3. JWT_SECRET should be a strong, random string
# 4. Update FRONTEND_URL and REACT_APP_API_URL after deployment
# 5. All values are case-sensitive
