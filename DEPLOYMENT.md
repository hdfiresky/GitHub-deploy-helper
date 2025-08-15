# Production-Grade Secure Deployment Guide

This guide details an automated, zero-downtime deployment setup for this web application using a **secure, production-ready** strategy. It follows the **Principle of Least Privilege** to ensure the CI/CD process has only the minimum necessary permissions to deploy the application.

## Table of Contents
1. [Security Overview](#1-security-overview)
2. [Prerequisites](#2-prerequisites)
3. [Server Setup (Secure)](#3-server-setup-secure)
4. [GitHub Secrets Configuration](#4-github-secrets-configuration)
5. [GitHub Actions Workflow (`.github/workflows/deploy.yml`)](#5-github-actions-workflow-githubworkflowsdeployyml)
6. [Deployment Script (`/usr/local/bin/deploy.sh`)](#6-deployment-script-usrlocalbindeploysh)
7. [Nginx Configuration](#7-nginx-configuration)
8. [Triggering the First Deployment](#8-triggering-the-first-deployment)
9. [Performing a Manual Rollback](#9-performing-a-manual-rollback)
10. [Manual Deployment Alternative](#10-manual-deployment-alternative)

---

## 1. Security Overview

Instead of giving our automation tool (GitHub Actions) full shell access, we will severely restrict what its dedicated user can do:
- **Dedicated User:** A non-root `deployer` user will own the application files.
- **No Interactive Shell:** The `deployer` user's shell will be set to `/sbin/nologin`, making it impossible for anyone to get an interactive shell session, even with a valid SSH key. This still permits file transfers via SFTP/SCP.
- **No Sudo Group:** The `deployer` user will **not** be in the `sudo` group, preventing general administrative access.
- **Granular Sudo:** The `deployer` user will only be granted passwordless `sudo` permission for *one specific command*: running the deployment script.

---

## 2. Prerequisites

- A Linux-based VM (e.g., Ubuntu 22.04) with SSH access.
- A GitHub repository for your project.
- Nginx installed on the VM.

---

## 3. Server Setup (Secure)

SSH into your server as a user with `sudo` privileges to perform this one-time setup.

### Step 3.1: Create a Restricted Deployment User

```bash
# SSH into your server
ssh user@your_server_ip

# Create a new user (e.g., deployer) and set their shell to /sbin/nologin
sudo adduser --shell /sbin/nologin deployer
```

### Step 3.2: Create Directory Structure

Create the directories for the application and releases.

```bash
# Create the base directory and a directory for releases
sudo mkdir -p /var/www/problembuddy /var/www/releases

# Change ownership of these directories to your new deployer user
sudo chown -R deployer:deployer /var/www/problembuddy
sudo chown -R deployer:deployer /var/www/releases
```

### Step 3.3: Create and Harden the Deployment Script

The deployment script itself must be secure. We will place it in `/usr/local/bin`, make it owned by `root`, and only allow `root` to write to it.

```bash
# Create the script file on the server.
# You will paste the script content from Section 6 into this file.
sudo nano /usr/local/bin/deploy.sh

# After pasting the script, save and close (Ctrl+X, Y, Enter).

# Make the script executable
sudo chmod +x /usr/local/bin/deploy.sh

# Set ownership to root to prevent the deployer user from modifying it
sudo chown root:root /usr/local/bin/deploy.sh
```

### Step 3.4: Configure Granular Sudo Access

We will allow the `deployer` user to run *only* the new deployment script with `sudo` privileges, without a password.

```bash
# Edit the sudoers file using visudo, which prevents syntax errors
sudo visudo

# Add the following line at the end of the file:
deployer ALL=(ALL) NOPASSWD: /usr/local/bin/deploy.sh
```
This line means: the user `deployer` on `ALL` terminals can run commands as `(ALL)` users `NOPASSWD` (without a password prompt) for the specific command `/usr/local/bin/deploy.sh`.

### Step 3.5: Set Up the SSH Key

Now, we'll add the public SSH key for the `deployer` user so GitHub Actions can connect.

```bash
# Switch to the deployer user
sudo su - deployer -s /bin/bash

# Create the .ssh directory and authorized_keys file
mkdir ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Now, open the file to add your public key
nano ~/.ssh/authorized_keys
```
Get your **public** SSH key (`cat ~/.ssh/id_rsa.pub` on your local machine, or generate a new one for this purpose). Paste the entire public key into the `authorized_keys` file on the server, then save and close.

```bash
# Exit from the deployer user shell
exit
```

---

## 4. GitHub Secrets Configuration

In your GitHub repository, go to `Settings` > `Secrets and variables` > `Actions` and add these secrets:

- `SSH_HOST`: The IP address of your VM.
- `SSH_USER`: The username of your restricted user (`deployer`).
- `SSH_KEY`: The **private** SSH key that corresponds to the public key you just added to the server.

---

## 5. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

Create a file in your local repository at `.github/workflows/deploy.yml`. Copy and paste the entire YAML content below into this new file.

```yaml
name: Deploy to Production VM

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Rename dist for deployment
        run: mv dist deployment_tmp

      - name: Copy files to server
        uses: appleboy/scp-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          source: "deployment_tmp"
          target: "/home/${{ secrets.SSH_USER }}"
          rm: true # Clean the target directory before copying

      - name: Execute deployment script on server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            sudo /usr/local/bin/deploy.sh /home/${{ secrets.SSH_USER }}/deployment_tmp
            rm -rf /home/${{ secrets.SSH_USER }}/deployment_tmp
```

---

## 6. Deployment Script (`/usr/local/bin/deploy.sh`)

This is the content for the `deploy.sh` script you created on the server in **Step 3.3**. Copy and paste the entire script below into `/usr/local/bin/deploy.sh` on your server.

```bash
#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- CONFIGURATION ---
# The source directory where GitHub Actions copies the built app. This is passed as the first argument.
SOURCE_DIR="$1"
# The application name, derived from vite.config.ts's 'base' property.
APP_NAME="problem-buddy-app"
# The root directory for the application's live version.
APP_ROOT="/var/www/problembuddy"
# The directory where timestamped releases are stored.
RELEASES_DIR="/var/www/releases"
# The deployment user. The script will ensure files are owned by this user.
DEPLOY_USER="deployer"
# Number of old releases to keep. (Disabled)
# RELEASES_TO_KEEP=5
# --- END CONFIGURATION ---

# --- VALIDATION ---
if [ -z "$SOURCE_DIR" ]; then
  echo "Error: Source directory not provided."
  exit 1
fi
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Source directory '$SOURCE_DIR' does not exist."
  exit 1
fi
# --- END VALIDATION ---

# --- SCRIPT LOGIC ---
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
RELEASE_PATH="$RELEASES_DIR/$TIMESTAMP"
APP_PATH="$APP_ROOT/$APP_NAME"

echo "🚀 Starting deployment..."

# 1. Create a new release directory and the 'app' subdirectory
echo "-> Creating new release directory: $RELEASE_PATH/app"
mkdir -p "$RELEASE_PATH/app"

# 2. Copy application files from the temporary source to the new 'app' subdirectory
echo "-> Copying application files to new release 'app' subdirectory..."
rsync -a "$SOURCE_DIR/" "$RELEASE_PATH/app/"

# 3. Ensure correct ownership of the new release files
echo "-> Setting ownership for $DEPLOY_USER user..."
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$RELEASE_PATH"

# 4. Create the application's parent directory if it doesn't exist
mkdir -p "$(dirname "$APP_PATH")"

# 5. Atomically update the symbolic link to point to the new release's 'app' subdirectory
echo "-> Activating new release by updating symbolic link..."
ln -sfn "$RELEASE_PATH/app" "$APP_PATH"

# 6. Clean up old releases (DISABLED)
# Old releases are intentionally kept to allow for easy manual rollbacks.
# If you need to clean up old releases, you can do so manually or re-enable this section.
# echo "-> Cleaning up old releases (keeping last $RELEASES_TO_KEEP)..."
# ls -1dt "$RELEASES_DIR"/*/ | tail -n +$(($RELEASES_TO_KEEP + 1)) | xargs -r rm -rf || true

echo "✅ Deployment successful! Application is now live."
# --- END SCRIPT LOGIC ---
```

---

## 7. Nginx Configuration

Configure Nginx to serve the static files from the location managed by your symbolic link.

### Step 7.1: Create Nginx Config File
```bash
sudo nano /etc/nginx/sites-available/problembuddy
```
Paste the following, replacing `your_domain_or_ip`:
```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    root /var/www/problembuddy;
    index index.html;

    location / {
        try_files $uri $uri/ /problem-buddy-app/index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 7.2: Enable the Site and Verify Nginx
```bash
sudo ln -s /etc/nginx/sites-available/problembuddy /etc/nginx/sites-enabled/
sudo nginx -t      # Test configuration
sudo systemctl restart nginx
sudo systemctl status nginx
```

### Step 7.3: Configure Firewall
If a firewall is active, ensure HTTP traffic is allowed.
```bash
sudo ufw allow 'Nginx HTTP'
sudo ufw enable
sudo ufw status
```

---

## 8. Triggering the First Deployment

You are now ready for a secure deployment!

1.  Commit the `.github/workflows/deploy.yml` file to your repository.
2.  Push your changes to the `main` branch.

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: Add secure CI/CD deployment workflow"
git push origin main
```

Go to the "Actions" tab in your GitHub repository to monitor the workflow. Your application will be live at `http://your_domain_or_ip/problem-buddy-app/`.

---

## 9. Performing a Manual Rollback

The symbolic link strategy makes rollbacks instantaneous and trivial. Because all previous releases are kept, you can switch back to any of them at any time.

### Step 9.1: List Available Releases

SSH into your server and list the contents of the releases directory to see all available deployment timestamps.

```bash
ls -l /var/www/releases
```

You will see an output like this, where each directory is a previous release:
```
total 12
drwxr-xr-x 3 deployer deployer 4096 Jul 20 10:30 20240720103000
drwxr-xr-x 3 deployer deployer 4096 Jul 20 10:45 20240720104500
drwxr-xr-x 3 deployer deployer 4096 Jul 20 11:00 20240720110000
```

### Step 9.2: Update the Symbolic Link

Identify the timestamp of the release you want to roll back to. Then, use `ln -sfn` to atomically update the symbolic link to point to that old release directory's `app` subfolder.

For example, to roll back to the `20240720104500` release:

```bash
# The target path is /var/www/problembuddy/problem-buddy-app
# The source path is the 'app' subfolder of the old release you want to activate
sudo ln -sfn /var/www/releases/20240720104500/app /var/www/problembuddy/problem-buddy-app
```

The rollback is instant. Users will immediately be served the files from the older release. No server restart is needed.

---

## 10. Manual Deployment Alternative

For scenarios where you need to deploy manually, several guides are available depending on your needs.

### [➡️ One-Click Local Deployment Guide (AUTOMATED_LOCAL_DEPLOYMENT.md)](AUTOMATED_LOCAL_DEPLOYMENT.md)
**Recommended for local deploys.** This guide provides scripts for Windows, macOS, and Linux that automate the entire build, upload, and deployment process with a single command from your local machine.

### [➡️ Step-by-Step Manual Deployment Guide (LOCAL_DEPLOYMENT.md)](LOCAL_DEPLOYMENT.md)
This guide provides the original, step-by-step process for deploying a pre-packaged `.zip` file. This is useful for understanding the process or if you cannot use the automated scripts.
