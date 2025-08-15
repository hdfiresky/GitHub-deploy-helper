# Problem Buddy Deployment Demo

![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

A reference implementation demonstrating a secure, automated, zero-downtime deployment strategy for a modern web application built with Vite, React, and TypeScript.

This project serves as both a live demo and a comprehensive guide for setting up a production-grade CI/CD pipeline.

## 🚀 Project Purpose

The primary goal of this repository is not the web application itself, but the robust deployment architecture it showcases. It provides a concrete, step-by-step guide for developers and operations engineers to implement a deployment system that is:

-   **Secure:** Follows the Principle of Least Privilege, isolating the deployment process with a dedicated, non-interactive user.
-   **Automated:** Uses GitHub Actions to build and deploy the application on every push to the `main` branch.
-   **Reliable:** Achieves zero-downtime deployments through an atomic symbolic link switching strategy.
-   **Maintainable:** All past releases are kept on the server, allowing for instant rollbacks at any time.

## ✨ Core Concepts Demonstrated

-   **CI/CD with GitHub Actions:** A complete workflow that checks out code, builds the static assets, and securely transfers them to a production server.
-   **Symbolic Link (Symlink) Strategy:** The web server (Nginx) points to a stable symlink (`/var/www/problembuddy/problem-buddy-app`). Each new deployment is placed in a timestamped directory, and the symlink is atomically updated to point to the new version, ensuring users never experience downtime.
-   **Principle of Least Privilege:** A dedicated `deployer` user is created on the server with severely restricted permissions. This user has no interactive shell and can *only* execute a specific deployment script via `sudo`, preventing unauthorized server access.
-   **Atomic Deploys & Instant Rollbacks:** Because the symlink update is a single, atomic operation, the switch to a new release is instantaneous. Rolling back is as simple as manually pointing the symlink back to a previous release directory.

## 🛠️ Technology Stack

-   **Frontend:** Vite, React, TypeScript, Tailwind CSS
-   **CI/CD:** GitHub Actions
-   **Server:** Linux (Ubuntu 22.04), Nginx
-   **Automation:** Bash Scripting, SSH, SCP

## 🖥️ Local Development

To run this application on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/problem-buddy-app.git
    cd problem-buddy-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    or
    ```bash
    npm ci # For a clean install based on package-lock.json
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173/problem-buddy-app/`.

## 🌐 Deployment

The heart of this project is its deployment process. Several complete, production-ready guides are available to set up your own server and CI/CD pipeline from scratch.

### [➡️ View the Full CI/CD Deployment Guide (DEPLOYMENT.md)](DEPLOYMENT.md)

This detailed guide covers the primary, automated deployment strategy using GitHub Actions. It is the recommended approach for production environments.

### [➡️ View the Universal Deployment Script Guide (UNIVERSAL_DEPLOYMENT_SCRIPT.md)](UNIVERSAL_DEPLOYMENT_SCRIPT.md)

**Advanced:** Provides a powerful script for Windows and macOS/Linux that you can add to your system's PATH and run from anywhere to deploy any pre-built project.

### [➡️ View the One-Click Local Deployment Guide (AUTOMATED_LOCAL_DEPLOYMENT.md)](AUTOMATED_LOCAL_DEPLOYMENT.md)

A simple script that lives inside your project for fast, automated deployments from your local machine.

### [➡️ View the Step-by-Step Manual Deployment Guide (LOCAL_DEPLOYMENT.md)](LOCAL_DEPLOYMENT.md)

This guide provides the original, step-by-step process for deploying a pre-packaged `.zip` file. This is useful for understanding the process or if you cannot use the automated scripts.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.