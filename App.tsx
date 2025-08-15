import React, { useState, useEffect, FC, PropsWithChildren } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
const HomeView: FC<{ onShowGuide: () => void; onShowLocalGuide: () => void; onShowAutomatedLocalGuide: () => void; }> = ({ onShowGuide, onShowLocalGuide, onShowAutomatedLocalGuide }) => (
  <>
    <header className="text-center mb-8">
      <h1 className="text-4xl font-bold text-cyan-400">Problem Buddy Deployment Demo</h1>
      <p className="text-lg text-gray-400 mt-2">Vite + React + TypeScript + Tailwind CSS</p>
    </header>

    <main>
      <div className="bg-cyan-900/50 p-6 rounded-lg border border-cyan-700 mb-8 text-center">
        <h2 className="text-2xl font-semibold text-cyan-300 mb-3">Automated CI/CD Deployment</h2>
        <p className="text-gray-300 mb-4">
          The primary, recommended strategy. View the step-by-step guide for a seamless, automated setup on your server.
        </p>
        <button
          onClick={onShowGuide}
          className="inline-block bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-600 transition-colors duration-300 shadow-lg"
        >
          View Automated CI/CD Guide
        </button>
      </div>

      <div className="bg-green-900/50 p-6 rounded-lg border border-green-700 mb-8 text-center">
        <h2 className="text-2xl font-semibold text-green-300 mb-3">One-Click Local Deployment</h2>
        <p className="text-gray-300 mb-4">
          The easiest way to deploy from your local machine. This guide provides scripts that automate the entire process.
        </p>
        <button
          onClick={onShowAutomatedLocalGuide}
          className="inline-block bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors duration-300 shadow-lg"
        >
          View One-Click Guide
        </button>
      </div>

      <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-500 text-center">
        <h2 className="text-2xl font-semibold text-yellow-300 mb-3">Step-by-Step Manual Deployment</h2>
        <p className="text-gray-300 mb-4">
          Need to deploy without a script? Follow the original guide for performing a manual deployment step-by-step.
        </p>
        <button
          onClick={onShowLocalGuide}
          className="inline-block bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors duration-300 shadow-lg"
        >
          View Step-by-Step Guide
        </button>
      </div>

      <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-600 mt-8">
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
            <span className="font-semibold text-gray-100">Transfer:</span> The <code className="bg-gray-700 text-yellow-300 px-2 py-1 rounded">dist</code> folder and deployment script are copied to the VM.
          </li>
          <li>
            <span className="font-semibold text-gray-100">Execute:</span> The deployment script runs on the VM:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-2 text-gray-400">
              <li>Creates a new timestamped release directory.</li>
              <li>Moves the new build assets into this new directory.</li>
              <li>Updates the symbolic link to point to the new release.</li>
            </ul>
          </li>
        </ol>
      </div>
    </main>
    <footer className="text-center mt-8 text-sm text-gray-500">
      <p>This setup allows for atomic and instant rollbacks by simply changing the symlink to a previous release.</p>
    </footer>
  </>
);

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'guide' | 'local_guide' | 'automated_local_guide'>('home');

  const GuideMap = {
    guide: 'DEPLOYMENT.md',
    local_guide: 'LOCAL_DEPLOYMENT.md',
    automated_local_guide: 'AUTOMATED_LOCAL_DEPLOYMENT.md',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 font-sans">
      <div className="max-w-4xl w-full bg-gray-800 rounded-lg shadow-xl p-8 my-8 border border-gray-700">
        {view === 'home' ? (
          <HomeView 
            onShowGuide={() => setView('guide')} 
            onShowLocalGuide={() => setView('local_guide')}
            onShowAutomatedLocalGuide={() => setView('automated_local_guide')}
          />
        ) : (
          <GuideView onGoBack={() => setView('home')} guidePath={`${import.meta.env.BASE_URL}${GuideMap[view]}`} />
        )}
      </div>
    </div>
  );
};

export default App;
