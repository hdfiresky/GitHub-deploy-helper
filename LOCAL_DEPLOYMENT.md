# Step-by-Step Manual Deployment Guide

This guide provides the original, step-by-step manual deployment method for scenarios where you need to deploy a pre-built application package without using automated scripts. This is useful for understanding the underlying process, for testing, or when CI/CD is unavailable.

> **Note:** For a much faster and more convenient local deployment, see the **[One-Click Local Deployment Guide](AUTOMATED_LOCAL_DEPLOYMENT.md)**, which automates these steps into a single command.

## Overview

The process involves:
1.  Building your application locally to generate the static assets.
2.  Compressing the build output into a `temp.zip` file.
3.  Uploading `temp.zip` to the server.
4.  Running a script on the server that takes an application name, creates a new timestamped release, extracts the files, and updates the symbolic link.

---

## 1. Prerequisites

-   You must have completed the initial **Server Setup** from the main [DEPLOYMENT.md guide](DEPLOYMENT.md), including the creation of the `deployer` user and the required directory structure (`/var/www/releases`, `/var/www/problembuddy`).
-   You need `zip` and `unzip` installed on your server (`sudo apt-get install zip unzip`).

---

## 2. Local Preparation

First, build your application and package it for deployment.

```bash
# 1. Build the application
npm run build

# 2. Navigate into the build output directory
# The directory name is 'dist' by default for Vite projects.
cd dist

# 3. Zip the contents of the directory
# The '.*' ensures hidden files are included.
zip -r ../temp.zip . .*

# 4. Navigate back to the project root
cd ..
```

You should now have a `temp.zip` file in your project's root directory.

---

## 3. Upload to Server

Upload the `temp.zip` file to your home directory on the server. Replace `user` and `your_server_ip` with your credentials.

```bash
# Use scp to copy the zip file to your user's home directory
scp temp.zip user@your_server_ip:~/
```

---

## 4. Server Script Setup (One-Time)

You need to create the `local_deploy.sh` script on your server. This only needs to be done once.

### Step 4.1: Create the Script File

SSH into your server and create the following file.

```bash
# SSH into your server
ssh user@your_server_ip

# Create the script file
sudo nano /usr/local/bin/local_deploy.sh
```

### Step 4.2: Add Script Content

Copy the entire Bash script below and paste it into the `nano` editor. **Note:** This script now takes the application name as a command-line argument.

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

# The application name is now the first command-line argument.
APP_NAME="$1"
if [ -z "$APP_NAME" ]; then
  echo "Error: Application name not provided as an argument."
  echo "Usage: sudo /usr/local/bin/local_deploy.sh <app-name>"
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

### Step 4.3: Set Permissions

Make the script executable and owned by `root`.
```bash
sudo chmod +x /usr/local/bin/local_deploy.sh
sudo chown root:root /usr/local/bin/local_deploy.sh
```

---

## 5. Running the Deployment

With `temp.zip` uploaded and the script in place, you can now run the deployment by providing the app name as an argument.

```bash
# Run the script with sudo and pass the application name
sudo local_deploy.sh problem-buddy-app
```

The script will handle the rest. Your application will be deployed and live, and the `temp.zip` file will be removed.

---

## 6. Simplifying the Command (Optional)

To make running the deployment even easier, you can create a shell alias.

### Create a Bash Alias

1.  Open your Bash configuration file. This is usually `~/.bashrc` or `~/.bash_aliases`.
    ```bash
    nano ~/.bashrc
    ```

2.  Add the following line to the end of the file, including the application name:
    ```bash
    alias local_deploy='sudo /usr/local/bin/local_deploy.sh problem-buddy-app'
    ```

3.  Save the file (`Ctrl+X`, `Y`, `Enter`) and apply the changes to your current shell session:
    ```bash
    source ~/.bashrc
    ```

Now, you can deploy simply by running:
```bash
local_deploy
```
The alias will be available in all future terminal sessions.
