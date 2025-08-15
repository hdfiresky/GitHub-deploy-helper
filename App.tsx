import React, { useState, useEffect, FC, PropsWithChildren } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MARKDOWN_BASE_URL } from './config';

// A custom renderer for code blocks to add styling and a copy button.
const CodeRenderer: FC<PropsWithChildren<{ className?: string; inline?: boolean }>> = ({ className, children, inline }) => {
  const [isCopied, setIsCopied] = useState(false);

  if (inline) {
    return <code className="bg-gray-700 text-yellow-300 px-1.5 py-0.5 rounded-md font-mono text-sm">{children}</code>;
  }

  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : 'text';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-900/70 rounded-lg my-4 relative border border-gray-700 font-mono">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-700/50 rounded-t-lg text-xs">
        <span className="text-gray-400 uppercase">{lang}</span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white font-sans py-1 px-2 rounded transition-colors text-xs flex items-center gap-2"
          aria-label="Copy code to clipboard"
        >
          {isCopied ? '✅ Copied!' : '📋 Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code>{children}</code>
      </pre>
    </div>
  );
};

// Component to display the formatted deployment guide.
const GuideView: FC<{ onGoBack: () => void; guidePath: string }> = ({ onGoBack, guidePath }) => {
  const [guideContent, setGuideContent] = useState('Loading guide...');

  useEffect(() => {
    fetch(guidePath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.text();
      })
      .then((text) => setGuideContent(text))
      .catch((error) => {
        console.error(`Failed to fetch deployment guide from ${guidePath}:`, error);
        setGuideContent('### Error: Could not load deployment guide.\n\nPlease check the browser console for more details.');
      });
  }, [guidePath]);
  
  return (
    <div>
      <button
        onClick={onGoBack}
        className="mb-6 bg-gray-700 text-cyan-300 font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors duration-300"
      >
        &larr; Back to Overview
      </button>
      <ReactMarkdown
        children={guideContent}
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-cyan-400 border-b border-gray-600 pb-2 mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-green-400 mt-8 mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-cyan-300 mt-6 mb-2" {...props} />,
          p: ({ node, ...props }) => <p className="text-gray-300 mb-4 leading-relaxed" {...props} />,
          a: ({ node, ...props }) => <a className="text-cyan-400 hover:underline" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 mb-4 pl-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-2 mb-4 pl-4" {...props} />,
          li: ({ node, ...props }) => <li className="text-gray-300" {...props} />,
          code: CodeRenderer,
          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-500 pl-4 italic text-gray-400 my-4" {...props} />,
        }}
      />
    </div>
  );
};

// Component for the main landing page view.
const HomeView: FC<{ onShowGuide: (guide: 'ci_cd' | 'server_side' | 'windows') => void }> = ({ onShowGuide }) => (
  <>
    <header className="text-center mb-8">
      <h1 className="text-4xl font-bold text-cyan-400">Problem Buddy Deployment Demo</h1>
      <p className="text-lg text-gray-400 mt-2">Vite + React + TypeScript + Tailwind CSS</p>
    </header>

    <main>
      <div className="space-y-8">
        {/* CI/CD Guide */}
        <div className="bg-cyan-900/50 p-6 rounded-lg border border-cyan-700 text-center">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-3">1. Automated CI/CD Deployment</h2>
          <p className="text-gray-300 mb-4 max-w-2xl mx-auto">
            The primary, recommended strategy. A step-by-step guide for setting up a seamless, fully automated deployment pipeline using GitHub Actions.
          </p>
          <button
            onClick={() => onShowGuide('ci_cd')}
            className="inline-block bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-600 transition-colors duration-300 shadow-lg"
          >
            View CI/CD Guide
          </button>
        </div>
        
        {/* Local/Manual Deployment Guides */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-500 text-center flex flex-col">
            <h2 className="text-2xl font-semibold text-yellow-300 mb-3">2. Server-Side Deployment</h2>
            <p className="text-gray-300 mb-4 flex-grow">
              For deploying from your VM. This guide shows how to install a script on your server to handle deployments of pre-uploaded `.zip` packages.
            </p>
            <button
              onClick={() => onShowGuide('server_side')}
              className="inline-block bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors duration-300 shadow-lg mt-auto"
            >
              View Server Script Guide
            </button>
          </div>
          <div className="bg-green-900/50 p-6 rounded-lg border border-green-700 text-center flex flex-col">
            <h2 className="text-2xl font-semibold text-green-300 mb-3">3. One-Click Windows Deployment</h2>
            <p className="text-gray-300 mb-4 flex-grow">
              For Windows users. A powerful script to deploy any project from your local machine with a single command. It automates zipping, uploading, and deploying.
            </p>
            <button
              onClick={() => onShowGuide('windows')}
              className="inline-block bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors duration-300 shadow-lg mt-auto"
            >
              View Windows Script Guide
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-600 mt-8">
        <h2 className="text-2xl font-semibold text-green-400 mb-4">Core Deployment Strategy</h2>
        <p className="text-gray-300 mb-4">
          All deployment methods use the same zero-downtime strategy on the server, which relies on atomic symbolic link switching.
        </p>
        <ol className="list-decimal list-inside space-y-3 text-gray-300">
          <li>
            <span className="font-semibold text-gray-100">New Release Folder:</span> A new timestamped directory is created in the `/var/www/releases` folder.
          </li>
          <li>
            <span className="font-semibold text-gray-100">Transfer Files:</span> The new build assets are placed into this new directory.
          </li>
          <li>
            <span className="font-semibold text-gray-100">Activate Release:</span> A symbolic link (e.g., `/var/www/problembuddy/problem-buddy-app`) is atomically updated to point to the new release directory.
          </li>
        </ol>
      </div>
    </main>
    <footer className="text-center mt-8 text-sm text-gray-500">
      <p>This setup allows for atomic and instant rollbacks by simply changing the symlink to a previous release.</p>
    </footer>
  </>
);

type View = 'home' | 'ci_cd' | 'server_side' | 'windows';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');

  const GuideMap: Record<Exclude<View, 'home'>, string> = {
    ci_cd: 'DEPLOYMENT.md',
    server_side: 'LOCAL_DEPLOYMENT.md',
    windows: 'AUTOMATED_LOCAL_DEPLOYMENT.md',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 font-sans">
      <div className="max-w-4xl w-full bg-gray-800 rounded-lg shadow-xl p-8 my-8 border border-gray-700">
        {view === 'home' ? (
          <HomeView onShowGuide={(guide) => setView(guide)} />
        ) : (
          <GuideView onGoBack={() => setView('home')} guidePath={`${MARKDOWN_BASE_URL}${GuideMap[view]}`} />
        )}
      </div>
    </div>
  );
};

export default App;
