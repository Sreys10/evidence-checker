# MongoDB Setup Guide

## Quick Setup Options

### Option 1: MongoDB Atlas (Cloud - Recommended for Testing)

1. **Create Free Account:**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up for free (M0 cluster is free forever)

2. **Create Cluster:**
   - Click "Build a Database"
   - Choose "FREE" (M0) tier
   - Select a cloud provider and region
   - Click "Create"

3. **Set Up Database Access:**
   - Go to "Database Access" in left menu
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
   - Set privileges to "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Set Up Network Access:**
   - Go to "Network Access" in left menu
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for testing
   - Click "Confirm"

5. **Get Connection String:**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

6. **Update Environment Variables:**
   - In `backend-service/.env` or set environment variable:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
     MONGODB_DB_NAME=evi-check
     ```

### Option 2: Local MongoDB (Windows)

1. **Download MongoDB:**
   - Go to https://www.mongodb.com/try/download/community
   - Download Windows installer
   - Run installer (choose "Complete" installation)

2. **Start MongoDB:**
   - MongoDB should start as a Windows service automatically
   - Or manually start: Open Command Prompt as Admin
     ```bash
     net start MongoDB
     ```

3. **Verify MongoDB is Running:**
   ```bash
     mongosh
     # Should connect to MongoDB shell
   ```

4. **Update Environment Variables:**
   ```
   MONGODB_URI=mongodb://localhost:27017/
   MONGODB_DB_NAME=evi-check
   ```

### Option 3: Docker (If you have Docker)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Then use:
```
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB_NAME=evi-check
```

## Verify Connection

After setting up, restart your backend and check the logs. You should see:
```
Connected to MongoDB: evi-check
```

If you see connection errors, check:
- MongoDB is running (if local)
- Connection string is correct
- Network access is allowed (if Atlas)
- Username/password are correct



