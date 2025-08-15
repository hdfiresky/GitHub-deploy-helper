# One-Click Local Deployment Guide

This guide provides the easiest and fastest way to deploy the application from your local machine. It uses scripts that automate the entire process: building the app, packaging it, uploading it to the server, and running the remote deployment command.

## Overview

You will save a script (either `.sh` for macOS/Linux or `.bat` for Windows) to your project root. After a one-time configuration, you can run this single script to deploy your application.

---

## 1. Prerequisites

1.  **Complete Server Setup:** You must have completed the **Server Setup** steps from the main [DEPLOYMENT.md guide](DEPLOYMENT.md).
2.  **Install Remote Script:** You must have installed the `local_deploy.sh` script on your server as described in the **[Step-by-Step Manual Guide](LOCAL_DEPLOYMENT.md)**.
3.  **SSH Key Authentication:** You must have passwordless SSH access configured for your user on the server. Your local machine's public SSH key should be in your user's `~/.ssh/authorized_keys` file on the server.
4.  **Local Tools:**
    -   **macOS/Linux:** `zip` command line tool (usually pre-installed).
    -   **Windows:** Windows 10/11 with OpenSSH Client (for `scp` and `ssh`) and PowerShell 5.1+ (for zipping). These are typically built-in.

---

## 2. Create the Local Deployment Script

Choose the script for your operating system and save it to the **root directory of your project**.

### For macOS / Linux (`deploy-local.sh`)

Save the following content as `deploy-local.sh`:

```bash
#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- CONFIGURE THESE VARIABLES ---
SSH_USER="your_user"
SSH_HOST="your_server_ip"
APP_NAME="problem-buddy-app"
# --- END CONFIGURATION ---

echo "🚀 Starting automated local deployment..."

# 1. Build the application
echo "-> Building the application..."
npm run build

# 2. Package the build output
echo "-> Zipping the 'dist' directory into temp.zip..."
cd dist
zip -qr ../temp.zip .
cd ..

# 3. Upload to server
echo "-> Uploading 'temp.zip' to ${SSH_USER}@${SSH_HOST}..."
scp temp.zip ${SSH_USER}@${SSH_HOST}:~/

# 4. Execute remote deployment script
echo "-> Executing remote deployment script on server..."
# The remote script requires sudo, so it may prompt for a password if sudo is not passwordless for your user.
ssh ${SSH_USER}@${SSH_HOST} "sudo /usr/local/bin/local_deploy.sh ${APP_NAME}"

# 5. Clean up local zip file
echo "-> Cleaning up local package..."
rm temp.zip

echo "✅ Deployment complete!"
```

### For Windows (`deploy-local.bat`)

Save the following content as `deploy-local.bat`:

```batch
@echo off
setlocal

REM --- CONFIGURE THESE VARIABLES ---
set "SSH_USER=your_user"
set "SSH_HOST=your_server_ip"
set "APP_NAME=problem-buddy-app"
REM --- END CONFIGURATION ---

echo [INFO] Starting automated local deployment...

REM 1. Build the application
echo [INFO] Building the application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] npm build failed. Aborting.
    goto :eof
)

REM 2. Package the build output using PowerShell
echo [INFO] Zipping the 'dist' directory into temp.zip...
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path temp.zip) { Remove-Item temp.zip -Force }; Compress-Archive -Path dist\* -DestinationPath temp.zip"
if %errorlevel% neq 0 (
    echo [ERROR] Zipping failed. Aborting.
    goto :eof
)

REM 3. Upload to server
echo [INFO] Uploading 'temp.zip' to %SSH_USER%@%SSH_HOST%...
scp temp.zip %SSH_USER%@%SSH_HOST%:~/
if %errorlevel% neq 0 (
    echo [ERROR] SCP upload failed. Aborting.
    goto :eof
)

REM 4. Execute remote deployment script
echo [INFO] Executing remote deployment script on server...
ssh %SSH_USER%@%SSH_HOST% "sudo /usr/local/bin/local_deploy.sh %APP_NAME%"
if %errorlevel% neq 0 (
    echo [ERROR] Remote script execution failed.
)

REM 5. Clean up local zip file
echo [INFO] Cleaning up local package...
del temp.zip

echo [SUCCESS] Deployment complete!
endlocal
```

---

## 3. Configure and Run the Script

1.  **Edit the Script:** Open the script you just created and update the configuration variables at the top with your server's IP address and your username. The `APP_NAME` should match what your Nginx server expects.

2.  **Make it Executable (macOS/Linux only):**
    ```bash
    chmod +x deploy-local.sh
    ```

3.  **Run it!**
    -   On macOS/Linux:
        ```bash
        ./deploy-local.sh
        ```
    -   On Windows:
        ```cmd
        .\deploy-local.bat
        ```

The script will now perform all the necessary steps automatically. If your SSH key is not passphrase-protected and your user has passwordless `sudo` access on the server, the entire process should complete without any prompts.
