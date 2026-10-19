import React from 'react';
import { Sparkles, Download, HelpCircle, Cpu, ArrowRight, Workflow, Github } from 'lucide-react';

interface HeaderProps {
  onOpenDeliverables: () => void;
  onOpenGithubExport: () => void;
  onDownloadCsv: () => void;
  reviewCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDeliverables,
  onOpenGithubExport,
  onDownloadCsv,
  reviewCount
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff6d5a] via-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-[#ff6d5a]/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                FeedbackPulse <span className="text-[#ff6d5a]">AI</span>
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase rounded-full bg-[#ff6d5a]/10 text-[#ff6d5a] border border-[#ff6d5a]/30">
                n8n Studio Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Review Intelligence → Weekly Product Pulse → Support Fee Explainer → n8n Workflow Execution
            </p>
          </div>
        </div>

        {/* Action Controls & Deliverables Guide */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="hidden lg:flex items-center px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 gap-2">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Gemini 3.8 Flash</span>
            <span className="w-1 h-1 rounded-full bg-slate-500" />
            <span className="text-orange-400 font-medium">n8n Engine</span>
          </div>

          <button
            onClick={onDownloadCsv}
            title="Download the current 100 Zerodha customer reviews CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Reviews CSV ({reviewCount})</span>
          </button>

          <button
            onClick={onOpenGithubExport}
            title="Push to GitHub or download full repository ZIP"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-indigo-500/50 transition shadow-sm"
          >
            <Github className="w-3.5 h-3.5 text-indigo-400" />
            <span>GitHub / Export</span>
          </button>

          <button
            onClick={onOpenDeliverables}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-600/25 transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Deliverables Guide</span>
          </button>
        </div>
      </div>

      {/* Progress Pipeline Ribbon */}
      <div className="bg-slate-950/70 border-t border-slate-800/80 px-4 sm:px-6 py-2 overflow-x-auto text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center gap-2 whitespace-nowrap">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Workflow Pipeline:
          </span>
          <span className="text-slate-300 font-medium">1. Review Intelligence</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-300 font-medium">2. Weekly Product Pulse (≤250 words)</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-300 font-medium">3. Fee Explainer (≤6 bullets + 2 sources)</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-[#ff6d5a] font-medium flex items-center gap-1">
            <Workflow className="w-3.5 h-3.5 text-[#ff6d5a]" /> 4. n8n Visual Workflow &amp; Approval Execution
          </span>
        </div>
      </div>
    </header>
  );
};
