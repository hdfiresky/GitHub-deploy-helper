# Server-Side Deployment Script Guide

This guide explains how to set up and use a deployment script directly on your server (VM). This script is the core component for handling manual deployments of pre-packaged applications.

This script is a prerequisite for the **[One-Click Windows Deployment Guide](AUTOMATED_LOCAL_DEPLOYMENT.md)**, as the Windows script calls this server-side script to perform the final deployment steps.

## Overview

The process involves:
1.  Creating a robust `local_deploy.sh` script on your server.
2.  Making the script executable from anywhere by placing it in `/usr/local/bin`.
3.  Using this script to deploy a `temp.zip` file that you have uploaded to your server's home directory.

---

## 1. Prerequisites

-   You must have completed the initial **Server Setup** from the main [DEPLOYMENT.md guide](DEPLOYMENT.md), including the creation of the `deployer` user and the required directory structure (`/var/www/releases`, `/var/www/problembuddy`).
-   You need `unzip` installed on your server (`sudo apt-get install unzip`).

---

## 2. Server Script Setup (One-Time)

You need to create the `local_deploy.sh` script on your server. This only needs to be done once.

### Step 2.1: Create the Script File

SSH into your server with a user that has `sudo` privileges and create the following file.

```bash
# SSH into your server
ssh user@your_server_ip

# Create the script file
sudo nano /usr/local/bin/local_deploy.sh
```

### Step 2.2: Add Script Content

Copy the entire Bash script below and paste it into the `nano` editor. This script takes the application name as a command-line argument and deploys a `temp.zip` file from the user's home directory.

```bash
#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- CONFIGURATION ---
APP_ROOT="/var/www/problembuddy"
RELEASES_DIR="/var/www/releases"
DEPLOY_USER="deployer"
# --- END CONFIGURATION ---

# --- VALIDATION ---
# This script must be run via sudo from a regular user's session.
if [ -z "$SUDO_USER" ] || [ "$EUID" -ne 0 ]; then
  echo "Error: This script must be run with sudo."
  exit 1
fi

# The application name is the first command-line argument.
APP_NAME="$1"
if [ -z "$APP_NAME" ]; then
  echo "Error: Application name not provided as an argument."
  echo "Usage: sudo local_deploy.sh <app-name>"
  exit 1
fi

ZIP_FILE="/home/$SUDO_USER/temp.zip"
if [ ! -f "$ZIP_FILE" ]; then
  echo "Error: Deployment package '$ZIP_FILE' not found."
  echo "Please upload your built application as 'temp.zip' to your home directory first."
  exit 1
fi
# --- END VALIDATION ---

# --- SCRIPT LOGIC ---
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
RELEASE_PATH="$RELEASES_DIR/$TIMESTAMP"
APP_PATH="$APP_ROOT/$APP_NAME"

echo "🚀 Starting local deployment for '$APP_NAME'..."

# 1. Create a new release directory
echo "-> Creating new release directory: $RELEASE_PATH"
mkdir -p "$RELEASE_PATH"

# 2. Extract the contents of temp.zip into the new release directory
echo "-> Extracting $ZIP_FILE..."
unzip -q "$ZIP_FILE" -d "$RELEASE_PATH"

# 3. Ensure correct ownership of the new release files
echo "-> Setting ownership for $DEPLOY_USER user..."
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$RELEASE_PATH"

# 4. Create the application's parent directory if it doesn't exist
mkdir -p "$(dirname "$APP_PATH")"

# 5. Atomically update the symbolic link to point to the new release
echo "-> Activating new release by updating symbolic link..."
ln -sfn "$RELEASE_PATH" "$APP_PATH"

# 6. Clean up the uploaded zip file
echo "-> Cleaning up uploaded package..."
rm "$ZIP_FILE"

echo "✅ Deployment successful! '$APP_NAME' is now live at $APP_PATH."
# --- END SCRIPT LOGIC ---
```
Save and close the file (`Ctrl+X`, `Y`, `Enter`).

### Step 2.3: Set Permissions

Make the script executable and ensure it's owned by `root`.
```bash
sudo chmod +x /usr/local/bin/local_deploy.sh
sudo chown root:root /usr/local/bin/local_deploy.sh
```

---

## 3. How to Use the Script

To use this script, you first need to upload your packaged application to the server.

### Step 3.1: Package and Upload (From Your Local Machine)

On your local machine, build and zip your application.

```bash
# 1. Build the application
npm run build

# 2. Zip the contents of the 'dist' directory
# On Windows, you can right-click the 'dist' folder and send to a compressed file.
# On macOS/Linux:
(cd dist && zip -r ../temp.zip .)

# 3. Upload the zip file to your server
scp temp.zip user@your_server_ip:~/
```

### Step 3.2: Run the Deployment (On the Server)

Now, SSH into your server and run the script, providing the application name that Nginx is configured to use.

```bash
# SSH into your server
ssh user@your_server_ip

# Run the script with sudo and pass the application name
sudo local_deploy.sh problem-buddy-app
```

The script will handle the rest. Your application will be deployed and live, and the `temp.zip` file will be removed automatically.
