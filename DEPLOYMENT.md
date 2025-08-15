# Zero-Downtime Deployment Guide

This guide provides all the necessary steps, scripts, and configurations to set up an automated, zero-downtime deployment for this web application using GitHub Actions and a symbolic link strategy on a Linux VM.

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Server Setup](#2-server-setup)
3. [GitHub Secrets Configuration](#3-github-secrets-configuration)
4. [GitHub Actions Workflow](#4-github-actions-workflow)
5. [Deployment Script](#5-deployment-script)
6. [Nginx Configuration](#6-nginx-configuration)
7. [Triggering the First Deployment](#7-triggering-the-first-deployment)

---

## 1. Prerequisites

- A Linux-based Virtual Machine (VM) (e.g., Ubuntu 22.04) with SSH access.
- A user on the VM with `sudo` privileges (we'll use a user named `deployer` in this guide).
- A GitHub repository for your project.
- Nginx (or another web server) installed on the VM.

## 2. Server Setup

First, SSH into your server and perform the initial setup.

### Step 2.1: Create a Deployment User

It's best practice to use a dedicated user for deployments instead of `root`.

```bash
# SSH into your server as root or a sudo user
ssh user@your_server_ip

# Create a new user (e.g., deployer)
sudo adduser deployer

# Add the new user to the sudo group to grant admin privileges
sudo usermod -aG sudo deployer

# It's recommended to set up SSH key authentication for this user for security
# On your local machine:
# cat ~/.ssh/id_rsa.pub

# On the server, as the new user:
su - deployer
mkdir ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys # Paste your public key here
chmod 600 ~/.ssh/authorized_keys
exit
```

### Step 2.2: Create Directory Structure

Create the necessary directories that the deployment script will use. We will serve our application from `/var/www/problembuddy`.

```bash
# SSH as your deployer user
ssh deployer@your_server_ip

# Create the base directory and a directory for releases
sudo mkdir -p /var/www/problembuddy /var/www/releases

# Change ownership of these directories to your deployer user
sudo chown -R deployer:deployer /var/www/problembuddy
sudo chown -R deployer:deployer /var/www/releases
```

## 3. GitHub Secrets Configuration

In your GitHub repository, navigate to `Settings` > `Secrets and variables` > `Actions` and add the following repository secrets. The GitHub Actions workflow will use these to securely connect to your server.

- `SSH_HOST`: The IP address of your VM.
  - Example: `192.0.2.1`
- `SSH_USER`: The username for the deployment user on your VM.
  - Example: `deployer`
- `SSH_KEY`: The private SSH key that corresponds to the public key you added to the `deployer` user's `authorized_keys` file.
  - **Important**: This is your *private* key (`~/.ssh/id_rsa`), not the public one. Copy its full content.

## 4. GitHub Actions Workflow

Create a file in your repository at `.github/workflows/deploy.yml`. This YAML file defines the CI/CD pipeline.

```yaml
# .github/workflows/deploy.yml

name: Deploy to VM

on:
  push:
    branches:
      - main # Trigger deployment on push to the main branch

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Build project
        run: npm run build

      - name: Copy files to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          source: "dist,deploy.sh" # Copy the build output and the deploy script
          target: "~/deployment_tmp" # A temporary directory on the server

      - name: Execute deployment script
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            chmod +x ~/deployment_tmp/deploy.sh
            ~/deployment_tmp/deploy.sh
```

## 5. Deployment Script

Create a file named `deploy.sh` in the root of your project. This script will be copied to and executed on the server. It handles the core logic of creating a new release and updating the symbolic link.

```sh
#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Configuration
APP_NAME="problem-buddy-app" # Must match the 'base' in vite.config.ts without slashes
RELEASES_DIR="/var/www/releases"
APP_DIR="/var/www/problembuddy"
SYMLINK_PATH="$APP_DIR/$APP_NAME"
TEMP_DIR="~/deployment_tmp"
RELEASES_TO_KEEP=5

# Create a timestamp for the new release directory
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
NEW_RELEASE_DIR="$RELEASES_DIR/$APP_NAME-$TIMESTAMP"

echo "--- Starting deployment ---"

# 1. Create the new release directory
echo "Creating new release directory: $NEW_RELEASE_DIR"
mkdir -p "$NEW_RELEASE_DIR"

# 2. Move the built application from the temporary location to the new release directory
echo "Moving application files..."
mv ~/deployment_tmp/dist/* "$NEW_RELEASE_DIR/"

# 3. Update the symbolic link to point to the new release
echo "Updating symbolic link..."
# The -nfs options mean:
# -n: If the symlink is a directory, treat it as a file (important for updates)
# -f: Force creation, removing any existing file/symlink at the destination
# -s: Create a symbolic link
ln -nfs "$NEW_RELEASE_DIR" "$SYMLINK_PATH"

echo "Symbolic link updated to point to $NEW_RELEASE_DIR"

# 4. Clean up old releases
echo "Cleaning up old releases..."
# List all release directories, sort them by name (timestamp), keep the newest ones, and delete the rest.
ls -dr "$RELEASES_DIR/$APP_NAME-"* | tail -n +$(($RELEASES_TO_KEEP + 1)) | xargs -r rm -rf

# 5. Clean up the temporary directory
echo "Cleaning up temporary deployment files..."
rm -rf ~/deployment_tmp

echo "--- Deployment successful! ---"
```
**Important:** Make sure this script is executable before committing. On a Unix-like system, run: `chmod +x deploy.sh`.

## 6. Nginx Configuration

On your server, configure Nginx to serve the static files from the location managed by your symbolic link.

Create a new Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/problembuddy
```

Paste the following configuration, replacing `your_domain_or_ip` with your server's domain name or IP address.

```nginx
# /etc/nginx/sites-available/problembuddy

server {
    listen 80;
    server_name your_domain_or_ip;

    # The root directory points to the parent directory of the symlink.
    # Nginx will follow the symlink automatically.
    root /var/www/problembuddy;

    index index.html;

    location / {
        # This is crucial for single-page applications (SPAs) like React.
        # It tries to find a file, then a directory, and if not found,
        # falls back to index.html to let client-side routing take over.
        try_files $uri $uri/ /problem-buddy-app/index.html;
    }

    # Optional: Add caching headers for static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable this site by creating a symbolic link to it in the `sites-enabled` directory:
```bash
sudo ln -s /etc/nginx/sites-available/problembuddy /etc/nginx/sites-enabled/

# Test the Nginx configuration for syntax errors
sudo nginx -t

# If the test is successful, restart Nginx to apply the changes
sudo systemctl restart nginx
```

## 7. Triggering the First Deployment

You are now ready to deploy!

1.  Commit the `deploy.sh` script and the `.github/workflows/deploy.yml` file to your repository.
2.  Push your changes to the `main` branch.

```bash
git add deploy.sh .github/workflows/deploy.yml
git commit -m "feat: Add CI/CD deployment configuration"
git push origin main
```

Go to the "Actions" tab in your GitHub repository. You should see the "Deploy to VM" workflow running. If all steps are configured correctly, it will complete successfully, and your application will be live at `http://your_domain_or_ip/problem-buddy-app/`.
