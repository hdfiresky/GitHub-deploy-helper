
import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-4xl w-full bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400">Problem Buddy Deployment Demo</h1>
          <p className="text-lg text-gray-400 mt-2">Vite + React + TypeScript + Tailwind CSS</p>
        </header>
        
        <main>
          <div className="bg-cyan-900/50 p-6 rounded-lg border border-cyan-700 mb-8 text-center">
            <h2 className="text-2xl font-semibold text-cyan-300 mb-3">Deployment Instructions</h2>
            <p className="text-gray-300 mb-4">
              Ready to deploy? Follow our step-by-step guide for a seamless setup on your own server.
            </p>
            <a
              href="DEPLOYMENT.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-600 transition-colors duration-300 shadow-lg"
            >
              View Deployment Guide
            </a>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-600">
            <h2 className="text-2xl font-semibold text-green-400 mb-4">Deployment Strategy Overview</h2>
            <p className="text-gray-300 mb-4">
              This application is configured to be deployed automatically using a GitHub Action. The process ensures zero-downtime deployments through a symbolic link strategy.
            </p>
            <ol className="list-decimal list-inside space-y-3 text-gray-300">
              <li>
                <span className="font-semibold text-gray-100">Trigger:</span> A push to the <code className="bg-gray-700 text-yellow-300 px-2 py-1 rounded">main</code> branch triggers the GitHub Action workflow.
              </li>
              <li>
                <span className="font-semibold text-gray-100">Build:</span> The action builds the app, generating static assets in the <code className="bg-gray-700 text-yellow-300 px-2 py-1 rounded">dist</code> folder.
              </li>
              <li>
                <span className="font-semibold text-gray-100">Transfer:</span> The <code className="bg-gray-700 text-yellow-300 px-2 py-1 rounded">dist</code> folder and <code className="bg-gray-700 text-yellow-300 px-2 py-1 rounded">deploy.sh</code> script are copied to the VM.
              </li>
              <li>
                <span className="font-semibold text-gray-100">Execute:</span> The <code className="bg-gray-700 text-yellow-300 px-2 py-1 rounded">deploy.sh</code> script runs on the VM:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-2 text-gray-400">
                  <li>Creates a new timestamped release directory in <code className="bg-gray-700 text-purple-300 px-1 rounded">/var/www/releases/</code>.</li>
                  <li>Moves the new build assets into this new directory.</li>
                  <li>Updates the symbolic link at <code className="bg-gray-700 text-purple-300 px-1 rounded">/var/www/problembuddy/problem-buddy-app</code> to point to the new release.</li>
                  <li>Cleans up old releases to conserve disk space.</li>
                </ul>
              </li>
            </ol>
          </div>
        </main>
        
        <footer className="text-center mt-8 text-sm text-gray-500">
          <p>This setup allows for atomic and instant rollbacks by simply changing the symlink to a previous release.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
