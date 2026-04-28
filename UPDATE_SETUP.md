# Auto-Update Setup Guide

Your app is now configured for auto-updates! Here's how to set up distribution:

## Installation

First, install electron-updater in both your main and electron directories:

```bash
# Install in main directory
npm install electron-updater

# Install in electron directory
cd electron && npm install electron-updater && cd ..
```

## Distribution Options

### Option 1: GitHub Releases (Recommended - FREE)

**Best for:** Small to medium projects, open-source

**Steps:**

1. **Create a GitHub Repository**
   - Create a new public or private repo (e.g., `fasto-rms`)
   - Clone it locally

2. **Update electron-builder.json**
   ```json
   "publish": [
       {
           "provider": "github",
           "owner": "YOUR_GITHUB_USERNAME",
           "repo": "fasto-rms"
       }
   ]
   ```

3. **Build and Publish**
   ```bash
   npm run build
   npm run build-electron
   # Then use GH CLI or web UI to create a release
   gh release create v1.0.1 --generate-notes
   # Upload the .exe file from ./release folder
   ```

4. **Set GitHub Token** (for automated publishing)
   ```bash
   # Set environment variable
   $env:GH_TOKEN = "your_github_token"
   # Or in .env file
   GH_TOKEN=your_github_token
   ```

---

### Option 2: AWS S3 (Recommended for Private)

**Best for:** Enterprise, large teams, private distribution

**Steps:**

1. **Create S3 Bucket**
   - Go to AWS S3 console
   - Create bucket: `fasto-rms-updates`
   - Enable versioning (optional)

2. **Update electron-builder.json**
   ```json
   "publish": [
       {
           "provider": "s3",
           "bucket": "fasto-rms-updates",
           "region": "us-east-1",
           "channel": "latest"
       }
   ]
   ```

3. **Set AWS Credentials**
   ```bash
   # Set environment variables
   $env:AWS_ACCESS_KEY_ID = "your_key"
   $env:AWS_SECRET_ACCESS_KEY = "your_secret"
   ```

4. **Build and Upload**
   ```bash
   npm run build
   npm run build-electron
   # Publishes automatically to S3
   ```

5. **Configure Access**
   - Make bucket files public or use CloudFront distribution
   - Set CORS headers for cross-origin access

---

### Option 3: Dropbox

**Best for:** Simple, small team distribution

**Steps:**

1. **Create Dropbox App**
   - Go to https://www.dropbox.com/developers/apps
   - Create a new app with access token

2. **Update electron-builder.json**
   ```json
   "publish": [
       {
           "provider": "dropbox",
           "token": "your_dropbox_token"
       }
   ]
   ```

---

### Option 4: Custom HTTP Server

**Best for:** Full control, self-hosted

**Steps:**

1. **Update electron-builder.json**
   ```json
   "publish": [
       {
           "provider": "generic",
           "url": "https://your-domain.com/updates/"
       }
   ]
   ```

2. **Create latest.yml file**
   After building, you'll get a `latest.yml` file in the release folder. Upload it along with the .exe to your server.

3. **Serve from your domain**
   - Upload `latest.yml` and `.exe` files to `https://your-domain.com/updates/`
   - Ensure both files are accessible

---

## Version Management

### Update Your Version

1. **In package.json** (root):
   ```json
   "version": "1.0.1"
   ```

2. **In electron/package.json**:
   ```json
   "version": "1.0.1"
   ```

3. **In electron-builder.json** (optional):
   ```json
   "productName": "FasTo RMS",
   "version": "1.0.1"
   ```

### Build & Release Process

```bash
# 1. Update version in package.json files
# 2. Build the app
npm run build

# 3. Build Electron
npm run build-electron

# 4. Create release (GitHub example)
gh release create v1.0.1 \
  --title "FasTo RMS v1.0.1" \
  --notes "Bug fixes and improvements" \
  ./release/FasTo-RMS-Setup-1.0.1.exe

# Or use npm script if configured
npm run publish
```

---

## Testing Updates

### Test Locally

1. **Mock an update locally** by modifying your version in the app
2. **Force check for updates** via menu or button
3. **Monitor electron console** for debug messages

### Development Mode

In development, auto-updates are disabled. To test:

```typescript
// In electron/handlers/updates.ts, temporarily add:
if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true;
}
```

---

## How It Works

1. **App Launches** → Checks for updates every 1 hour
2. **Update Found** → Shows notification to user
3. **User Clicks Download** → Downloads new version in background
4. **Download Complete** → Shows "Restart to Install" prompt
5. **User Restarts** → Old version uninstalled, new version installed
6. **App Launches** → New version runs

---

## Troubleshooting

### Updates Not Being Found
- Check `publish` configuration in electron-builder.json
- Ensure version in latest.yml is higher than current
- Check network connectivity
- View logs in: `%APPDATA%\FasTo RMS\logs\` (Windows)

### Download Fails
- Check S3/GitHub/server credentials
- Verify file permissions
- Check firewall/proxy settings

### Installation Hangs
- Check disk space
- Verify installer permissions
- Check Windows Defender/antivirus exclusions

---

## Security Considerations

1. **Code Signing** (Recommended for production)
   ```json
   "win": {
       "certificateFile": "path/to/cert.pfx",
       "certificatePassword": "password",
       "signingHashAlgorithms": ["sha256"]
   }
   ```

2. **Signature Verification**
   - electron-updater verifies signatures by default
   - Use code signing certificates for production

3. **HTTPS Only**
   - Always use HTTPS for update URLs
   - Never use HTTP for production

---

## Next Steps

1. Choose your distribution provider (GitHub Releases recommended for start)
2. Update electron-builder.json with your configuration
3. Increment version numbers
4. Run `npm run build && npm run build-electron`
5. Publish to your chosen provider
6. Test with real users

For more info: https://www.electron.build/configuration/publish
