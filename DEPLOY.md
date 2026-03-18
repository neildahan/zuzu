# Deploy React + Express + MongoDB to GCP Cloud Run

A step-by-step guide for deploying a full-stack app (React/Vite + Node/Express + MongoDB) to Google Cloud Run. Reusable for any project with this stack.

---

## Prerequisites

- Google account
- `gcloud` CLI installed
- Docker installed (for local testing, optional)

---

## Step 1: Install the gcloud CLI

```bash
# macOS
brew install --cask google-cloud-sdk

# Or download from https://cloud.google.com/sdk/docs/install
```

Verify:
```bash
gcloud --version
```

---

## Step 2: Create a GCP Project

```bash
# Login
gcloud auth login

# Create project (pick a unique ID)
gcloud projects create YOUR_PROJECT_ID --name="Your App Name"

# Set it as active
gcloud config set project YOUR_PROJECT_ID

# Enable billing (required for Cloud Run)
# Go to: https://console.cloud.google.com/billing
# Link your project to a billing account (free tier covers small apps)
```

---

## Step 3: Enable Required APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com
```

---

## Step 4: Set Up MongoDB Atlas (Free Tier)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up / log in
2. Create a **free shared cluster** (M0 — free forever)
3. Choose a cloud provider and region close to your Cloud Run region
4. Under **Database Access** — create a database user with a password
5. Under **Network Access** — click **"Allow Access from Anywhere"** (`0.0.0.0/0`)
   - Cloud Run IPs are dynamic, so this is necessary
   - Your data is still protected by the username/password
6. Click **Connect** → **Drivers** → copy the connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/YOUR_DB_NAME?retryWrites=true&w=majority
   ```
   Replace `USERNAME`, `PASSWORD`, and `YOUR_DB_NAME` with your values.

---

## Step 5: Prepare Your App for Production

### 5a. Dockerfile (multi-stage build)

Create `Dockerfile` in the project root:

```dockerfile
# Stage 1: Build the React client
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production server
FROM node:18-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server/src/index.js"]
```

### 5b. .dockerignore

Create `.dockerignore` in the project root:

```
node_modules
client/node_modules
server/node_modules
client/dist
.git
.env
*.md
.dockerignore
Dockerfile
```

### 5c. Serve frontend from Express

In your Express entry file (`server/src/index.js`), add static file serving:

```js
const path = require('path');

// After middleware, before routes:
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
}

// After all API routes:
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}
```

### 5d. Add start script

In `server/package.json`, add:

```json
"scripts": {
  "start": "node src/index.js"
}
```

### 5e. Use PORT env variable

Cloud Run sets the `PORT` env variable (default 8080). Make sure your server reads it:

```js
app.listen(process.env.PORT || 3001, () => { ... });
```

---

## Step 6: Test Locally with Docker (Optional)

```bash
# Build
docker build -t my-app .

# Run (replace the MongoDB URI with your Atlas URI)
docker run -p 8080:8080 \
  -e MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/mydb" \
  -e PORT=8080 \
  -e NODE_ENV=production \
  my-app

# Open http://localhost:8080
```

---

## Step 7: Deploy to Cloud Run

### First deployment:

```bash
# From the project root directory
gcloud run deploy YOUR_SERVICE_NAME \
  --source . \
  --region me-west1 \
  --allow-unauthenticated \
  --set-env-vars "MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mydb,NODE_ENV=production" \
  --port 8080 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 3
```

**Flags explained:**
| Flag | Purpose |
|------|---------|
| `--source .` | Build from source using Cloud Build (no local Docker needed) |
| `--region me-west1` | Closest region to Israel. Use `us-central1` for US |
| `--allow-unauthenticated` | Public access (no auth required) |
| `--set-env-vars` | Environment variables (comma-separated) |
| `--port 8080` | Container port |
| `--memory 512Mi` | RAM allocation |
| `--min-instances 0` | Scale to zero when idle (free!) |
| `--max-instances 3` | Cap scaling |

### First time it will ask:
- To create an **Artifact Registry** — say **yes**
- To enable APIs if not done — say **yes**

It builds in the cloud (~2-3 minutes first time) and gives you a URL like:
```
https://your-service-name-xxxxxxxxxx-zf.a.run.app
```

---

## Step 8: Subsequent Deploys

### Option A: Manual deploy (one command)

After code changes, commit, push, and deploy:

```bash
git add .
git commit -m "your changes"
git push
gcloud run deploy YOUR_SERVICE_NAME --source . --region europe-west1
```

It remembers your previous settings. Takes ~1-2 minutes.

### Option B: Auto-deploy from GitHub (recommended)

Set this up once and every `git push` to main auto-deploys — no commands needed.

1. Go to **https://console.cloud.google.com/run**
2. Click on your service (e.g. `zuzu`)
3. Click the **"Integrations"** tab (or **"Set up continuous deployment"**)
4. Click **"Add Integration"** → **"Continuous Deployment"**
5. Authenticate with **GitHub** and select your repository
6. Configure:
   - **Branch**: `main` (or whichever branch you want to auto-deploy)
   - **Build type**: `Dockerfile` (it will detect the Dockerfile in your repo)
7. Click **Save**

Now your workflow is just:

```bash
git add .
git commit -m "your changes"
git push
# Done! Cloud Run auto-builds and deploys in ~2-3 minutes
```

You can monitor deployments in the **Cloud Run → Revisions** tab.

### Rollback

If a deploy breaks something, roll back to the previous version:

```bash
# List revisions
gcloud run revisions list --service YOUR_SERVICE_NAME --region europe-west1

# Route traffic back to a previous revision
gcloud run services update-traffic YOUR_SERVICE_NAME \
  --region europe-west1 \
  --to-revisions PREVIOUS_REVISION_NAME=100
```

---

## Step 9: Custom Domain (Optional)

```bash
# Map your domain
gcloud run domain-mappings create \
  --service YOUR_SERVICE_NAME \
  --domain your-domain.com \
  --region me-west1
```

Then add the DNS records it shows to your domain registrar. SSL is automatic.

---

## Step 10: Seed Data (Optional)

If you need to seed your production database:

```bash
# Set the production MongoDB URI locally
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/mydb" node server/src/seed.js
```

---

## Useful Commands

```bash
# View logs
gcloud run services logs read YOUR_SERVICE_NAME --region me-west1

# Stream live logs
gcloud run services logs tail YOUR_SERVICE_NAME --region me-west1

# View service details
gcloud run services describe YOUR_SERVICE_NAME --region me-west1

# List all services
gcloud run services list

# Update env vars without redeploying
gcloud run services update YOUR_SERVICE_NAME \
  --region me-west1 \
  --set-env-vars "KEY=value"

# Delete service (stops all billing)
gcloud run services delete YOUR_SERVICE_NAME --region me-west1
```

---

## Cost Breakdown (Single User)

| Resource | Free Tier | Your Usage | Cost |
|----------|-----------|------------|------|
| Cloud Run | 2M requests/mo | ~few hundred | $0 |
| Cloud Build | 120 min/day | ~3 min/deploy | $0 |
| Artifact Registry | 500MB | ~200MB | $0 |
| MongoDB Atlas M0 | 512MB | ~few MB | $0 |
| **Total** | | | **$0/mo** |

---

## Troubleshooting

### App crashes on deploy
```bash
# Check logs
gcloud run services logs read YOUR_SERVICE_NAME --region me-west1 --limit 50
```

### MongoDB connection fails
- Verify Atlas Network Access allows `0.0.0.0/0`
- Check the connection string is correct in env vars
- Make sure the database user password has no special chars that need URL encoding

### Cold starts are slow
Set `--min-instances 1` to keep one instance warm (costs ~$5/mo)

### Build fails
```bash
# Test locally first
docker build -t test .
docker run -p 8080:8080 -e MONGODB_URI="..." -e PORT=8080 -e NODE_ENV=production test
```
