# Universal Deployment Script Guide

This guide provides an advanced, universal deployment script that can be run from any command prompt to deploy any pre-built web application from your local machine. This is a powerful tool for developers who manage multiple projects.

The script is "smart": it verifies that a project has been built (by checking for a `dist` folder with `.html` files) before proceeding.

## Overview

You will save a script (either `.sh` for macOS/Linux or `.bat` for Windows) to a central location on your computer and add that location to your system's `PATH` environment variable. This allows you to run the script from anywhere, simply by passing it the path to the project you want to deploy.

---

## 1. Prerequisites

1.  **Complete Server Setup:** You must have completed the **Server Setup** steps from the main [DEPLOYMENT.md guide](DEPLOYMENT.md).
2.  **Install Remote Script:** You must have installed the `local_deploy.sh` script on your server as described in the **[Step-by-Step Manual Guide](LOCAL_DEPLOYMENT.md)**.
3.  **SSH Key Authentication:** You must have passwordless SSH access configured for your user on the server. Your local machine's public SSH key should be in your user's `~/.ssh/authorized_keys` file on the server.

---

## 2. Create the Universal Script

Choose the script for your operating system.

### For Windows (`deploy-universal.bat`)

Create a central directory for your scripts (e.g., `C:\scripts`). Save the following content in that directory as `deploy-universal.bat`:

```batch
@echo off
setlocal

REM --- CONFIGURE THESE VARIABLES ---
set "SSH_USER=your_user"
set "SSH_HOST=your_server_ip"
set "APP_NAME=problem-buddy-app"
REM --- END CONFIGURATION ---

REM --- VALIDATION ---
if "%~1"=="" (
    echo [ERROR] Project directory path not provided.
    echo Usage: %~n0 "C:\path\to\your\project"
    goto :eof
)

set "PROJECT_DIR=%~1"
set "DIST_DIR=%PROJECT_DIR%\dist"
set "ZIP_FILE=%PROJECT_DIR%\temp.zip"

if not exist "%PROJECT_DIR%" (
    echo [ERROR] Project directory not found: "%PROJECT_DIR%"
    goto :eof
)

if not exist "%DIST_DIR%" (
    echo [ERROR] Build directory 'dist' not found in project: "%DIST_DIR%"
    goto :eof
)

REM Check for any .html file in the dist directory to verify it's a web app build.
dir "%DIST_DIR%\*.html" >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No .html files found in "%DIST_DIR%". Is the project built?
    goto :eof
)

echo [INFO] Starting universal deployment for "%PROJECT_DIR%"...

REM 1. Package the build output using PowerShell
echo [INFO] Zipping "%DIST_DIR%" into "%ZIP_FILE%"...
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path -Path '%ZIP_FILE%') { Remove-Item -Path '%ZIP_FILE%' -Force }; Compress-Archive -Path '%DIST_DIR%\*' -DestinationPath '%ZIP_FILE%'"
if %errorlevel% neq 0 (
    echo [ERROR] Zipping failed. Aborting.
    goto :eof
)

REM 2. Upload to server
echo [INFO] Uploading "%ZIP_FILE%" to %SSH_USER%@%SSH_HOST%:~/temp.zip...
scp "%ZIP_FILE%" %SSH_USER%@%SSH_HOST%:~/temp.zip
if %errorlevel% neq 0 (
    echo [ERROR] SCP upload failed. Aborting.
    goto :eof
)

REM 3. Execute remote deployment script
echo [INFO] Executing remote deployment script on server...
ssh %SSH_USER%@%SSH_HOST% "sudo /usr/local/bin/local_deploy.sh %APP_NAME%"
if %errorlevel% neq 0 (
    echo [ERROR] Remote script execution failed.
)

REM 4. Clean up local zip file
echo [INFO] Cleaning up local package...
del "%ZIP_FILE%"

echo [SUCCESS] Deployment complete!
endlocal
```

### For macOS / Linux (`deploy-universal.sh`)

Create a central directory for your scripts (e.g., `~/scripts`). Save the following content in that directory as `deploy-universal.sh`:

```bash
#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- CONFIGURE THESE VARIABLES ---
SSH_USER="your_user"
SSH_HOST="your_server_ip"
APP_NAME="problem-buddy-app"
# --- END CONFIGURATION ---

# --- VALIDATION ---
if [ -z "$1" ]; then
    echo "Error: Project directory path not provided."
    echo "Usage: $(basename "$0") /path/to/your/project"
    exit 1
fi

PROJECT_DIR="$1"
DIST_DIR="$PROJECT_DIR/dist"
ZIP_FILE="$PROJECT_DIR/temp.zip"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "Error: Project directory not found: '$PROJECT_DIR'"
    exit 1
fi

if [ ! -d "$DIST_DIR" ]; then
    echo "Error: Build directory 'dist' not found in project: '$DIST_DIR'"
    exit 1
fi

# Check for any .html file in the dist directory to verify it's a web app build.
if ! ls "$DIST_DIR"/*.html > /dev/null 2>&1; then
    echo "Error: No .html files found in '$DIST_DIR'. Is the project built?"
    exit 1
fi

echo "🚀 Starting universal deployment for '$PROJECT_DIR'..."

# 1. Package the build output
echo "-> Zipping '$DIST_DIR' into '$ZIP_FILE'..."
# Use a subshell to zip contents correctly without parent folders
(cd "$DIST_DIR" && zip -qr "$ZIP_FILE" .)

# 2. Upload to server
echo "-> Uploading '$ZIP_FILE' to ${SSH_USER}@${SSH_HOST}:~/temp.zip..."
scp "$ZIP_FILE" "${SSH_USER}@${SSH_HOST}:~/temp.zip"

# 3. Execute remote deployment script
echo "-> Executing remote deployment script on server..."
ssh "${SSH_USER}@${SSH_HOST}" "sudo /usr/local/bin/local_deploy.sh ${APP_NAME}"

# 4. Clean up local zip file
echo "-> Cleaning up local package..."
rm "$ZIP_FILE"

echo "✅ Deployment complete!"
```

---

## 3. Add Script to System PATH (One-Time Setup)

To run the script from anywhere, you need to add its containing folder to your system's `PATH`.

### For Windows

1.  Press `Win + S` and search for "Edit the system environment variables".
2.  In the System Properties window, click the "Environment Variables..." button.
3.  In the "System variables" section, find and select the `Path` variable, then click "Edit...".
4.  Click "New" and add the path to your scripts directory (e.g., `C:\scripts`).
5.  Click "OK" on all windows to save.
6.  **Important:** You must open a **new** Command Prompt or PowerShell window for the changes to take effect.

### For macOS / Linux

1.  Open your shell's configuration file (e.g., `~/.bashrc`, `~/.zshrc`).
2.  Add the following line to the end of the file, replacing `~/scripts` with your chosen directory:
    ```bash
    export PATH="$HOME/scripts:$PATH"
    ```
3.  Save the file and apply the changes by running `source ~/.bashrc` (or your shell's config file) or by opening a new terminal window.

---

## 4. Configure and Run

1.  **Edit the Script:** Open the script you saved and update the `SSH_USER`, `SSH_HOST`, and `APP_NAME` variables at the top.
2.  **Make it Executable (macOS/Linux only):**
    ```bash
    chmod +x ~/scripts/deploy-universal.sh
    ```
3.  **Run it from anywhere!**
    -   First, make sure your project is built (`npm run build`).
    -   Then, open a new terminal and run the script, passing the full path to your project directory.
    -   On Windows:
        ```cmd
        deploy-universal.bat "C:\Users\YourName\Documents\projects\my-cool-app"
        ```
    -   On macOS/Linux:
        ```bash
        deploy-universal.sh "/home/yourname/projects/my-cool-app"
        ```
The script will take care of the rest, deploying your application to the server.