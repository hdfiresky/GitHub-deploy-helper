# One-Click Windows Deployment Guide

This guide provides the easiest and fastest way to deploy a web application from your local Windows machine. It uses a powerful batch script that automates the entire process: packaging the app, uploading it to the server, and running the remote deployment command.

This script relies on the `local_deploy.sh` script being installed on the server, as detailed in the **[Server-Side Deployment Guide](LOCAL_DEPLOYMENT.md)**.

## Overview

You will save a `.bat` script to your project root. After a one-time configuration, you can run this single script to deploy your application by providing your application's name as an argument.

---

## 1. Prerequisites

1.  **Complete Server Setup:** You must have completed the setup from both the main [DEPLOYMENT.md guide](DEPLOYMENT.md) and the [Server-Side Deployment Guide](LOCAL_DEPLOYMENT.md).
2.  **SSH Key Authentication:** You must have passwordless SSH access configured for your user on the server. Your local machine's public SSH key should be in your user's `~/.ssh/authorized_keys` file on the server.
3.  **Local Tools (Windows):** Windows 10/11 with OpenSSH Client (for `scp` and `ssh`) and PowerShell 5.1+ (for zipping). These are typically built-in.

---

## 2. Create the Local Windows Deployment Script

Save the following content as `deploy-local.bat` in the **root directory of your project**.

```batch
@echo off
setlocal

REM --- CONFIGURE THESE VARIABLES ---
set "SSH_USER=your_user"
set "SSH_HOST=your_server_ip"
REM --- END CONFIGURATION ---

REM --- VALIDATION ---
if "%~1"=="" (
    echo [ERROR] Application name not provided.
    echo Usage: %~n0 your-app-name
    goto :eof
)
set "APP_NAME=%~1"

if not exist "dist" (
    echo [ERROR] Build directory 'dist' not found. Please run 'npm run build' first.
    goto :eof
)
REM --- END VALIDATION ---


echo [INFO] Starting automated local deployment for app: %APP_NAME%

REM 1. Build the application (optional, uncomment if you want to build every time)
REM echo [INFO] Building the application...
REM call npm run build
REM if %errorlevel% neq 0 (
REM     echo [ERROR] npm build failed. Aborting.
REM     goto :eof
REM )

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

1.  **Edit the Script:** Open `deploy-local.bat` and update the configuration variables at the top with your server's IP address and your username.

2.  **Build Your App:** Before running the script, make sure you have a fresh build of your application.
    ```cmd
    npm run build
    ```

3.  **Run it!** Open a command prompt in your project's root directory and run the script, passing your application's name as an argument. This name should match what your Nginx server expects.
    ```cmd
    .\deploy-local.bat problem-buddy-app
    ```

The script will now perform all the necessary steps automatically. If your SSH key is not passphrase-protected and your user has passwordless `sudo` access on the server for the remote script, the entire process should complete without any prompts.