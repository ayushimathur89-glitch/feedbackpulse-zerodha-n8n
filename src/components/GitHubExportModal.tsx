import React, { useState } from 'react';
import {
  X,
  Github,
  Download,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  Key,
  FolderGit2
} from 'lucide-react';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({ isOpen, onClose }) => {
  const [token, setToken] = useState('');
  const [repoName, setRepoName] = useState('feedbackpulse-zerodha-n8n');
  const [isPrivate, setIsPrivate] = useState(false);
  const [activeTab, setActiveTab] = useState<'push' | 'download' | 'terminal'>('push');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    success: boolean;
    message: string;
    repoUrl?: string;
  } | null>(null);

  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const handlePushToGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setStatus({
        success: false,
        message: 'Please enter your GitHub Personal Access Token (PAT).'
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          repoName: repoName.trim(),
          isPrivate
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to push repository to GitHub');
      }

      setStatus({
        success: true,
        message: data.message || `All files successfully pushed to GitHub!`,
        repoUrl: data.repoUrl
      });
    } catch (err: any) {
      setStatus({
        success: false,
        message: err.message || 'Error occurred while syncing with GitHub'
      });
    } finally {
      setLoading(false);
    }
  };

  const terminalInstructions = `# 1. Download & extract the zip, or in your terminal:
git init
git add -A
git commit -m "feat: complete Zerodha review intelligence and n8n workflow"
git branch -M main

# 2. Add your GitHub repository as origin:
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/${repoName.trim() || 'feedbackpulse-zerodha-n8n'}.git

# 3. Push all commits & files to GitHub:
git push -u origin main`;

  const copyTerminalCommands = () => {
    navigator.clipboard.writeText(terminalInstructions);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-inner">
              <Github className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Export &amp; Submit to GitHub
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Ready for Submission
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                All 4 deliverables, n8n visual flow, dataset, and code ready to push
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-2 bg-slate-950 border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('push')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'push'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>1. Push via Token (Auto)</span>
          </button>
          <button
            onClick={() => setActiveTab('download')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'download'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>2. Download ZIP</span>
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'terminal'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>3. Git Commands</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'push' && (
            <form onSubmit={handlePushToGithub} className="space-y-4">
              <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2.5">
                <FolderGit2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Automated GitHub Repository Creator:</span>
                  <p className="mt-0.5 text-indigo-200/90 leading-relaxed">
                    Provide your GitHub Personal Access Token (PAT). Our backend will automatically create the repository under your account on GitHub and push all branches, source code, and commit history directly!
                  </p>
                </div>
              </div>

              {/* Token Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    GitHub Personal Access Token (PAT) <span className="text-rose-400">*</span>
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=FeedbackPulse-Zerodha-Submission"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-1"
                  >
                    <span>Generate token on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Requires <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">repo</code> scope to create the repository and push commits.
                </p>
              </div>

              {/* Repo Name & Privacy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Repository Name
                  </label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="feedbackpulse-zerodha-n8n"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Repository Visibility
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                        !isPrivate
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Public (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                        isPrivate
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Private
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Alert */}
              {status && (
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    status.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {status.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-slate-100">{status.message}</p>
                      {status.repoUrl && (
                        <div className="pt-1">
                          <a
                            href={status.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition"
                          >
                            <span>Open Created GitHub Repository</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Repo &amp; Pushing Files...</span>
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    <span>Create Repository &amp; Push All Files to GitHub</span>
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'download' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Download Complete Project ZIP
                    </h4>
                    <p className="text-xs text-slate-400">
                      Contains all 4 deliverables, clean source code, configurations, and documentation.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
                  <div className="font-semibold text-slate-200">Files included:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400 font-mono text-[11px]">
                    <li>README.md (Complete Step 1-4 documentation &amp; Zerodha analysis)</li>
                    <li>server.ts (Backend &amp; n8n webhook proxy)</li>
                    <li>src/ (React UI, Review Intelligence, Pulse, Fee Explainer, n8n visual engine)</li>
                    <li>package.json, tsconfig.json, vite.config.ts</li>
                    <li>Sample reviews dataset (100 Zerodha customer reviews)</li>
                  </ul>
                </div>

                <a
                  href="/api/export/zip"
                  download="feedbackpulse-zerodha-repo.zip"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download feedbackpulse-zerodha-repo.zip (~250 KB)</span>
                </a>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">How to upload this to GitHub manually:</span>
                <ol className="list-decimal list-inside mt-1.5 space-y-1 text-slate-400">
                  <li>Go to <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-indigo-400 underline">github.com/new</a> and create a new repository.</li>
                  <li>Click <strong>uploading an existing file</strong> link on the empty repo page.</li>
                  <li>Unzip and drag &amp; drop the project files into the browser and click Commit.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  Run in your local terminal:
                </span>
                <button
                  onClick={copyTerminalCommands}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition border border-slate-700"
                >
                  {copiedCmd ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Commands</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-indigo-200 whitespace-pre-wrap leading-relaxed select-all">
                {terminalInstructions}
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Remember to replace <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-200 font-mono">&lt;YOUR_GITHUB_USERNAME&gt;</code> with your actual GitHub username before running the commands.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            Git tree is clean &amp; committed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
