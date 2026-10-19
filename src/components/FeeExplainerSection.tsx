import React, { useState } from 'react';
import { 
  HelpCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  BookOpen
} from 'lucide-react';
import { FeeExplainerData } from '../types';

interface FeeExplainerSectionProps {
  explainerData: FeeExplainerData | null;
  identifiedFeeIssue: string;
  isLoading: boolean;
  onGenerateExplainer: () => void;
  onUpdateExplainer: (data: FeeExplainerData) => void;
}

export const FeeExplainerSection: React.FC<FeeExplainerSectionProps> = ({
  explainerData,
  identifiedFeeIssue,
  isLoading,
  onGenerateExplainer,
  onUpdateExplainer,
}) => {
  const [copied, setCopied] = useState(false);

  const bulletCount = explainerData?.bullets.length || 0;
  const isCompliant = bulletCount > 0 && bulletCount <= 6;

  const handleCopySnippet = () => {
    if (!explainerData) return;
    const formatted = `${explainerData.title.toUpperCase()}
${'-'.repeat(explainerData.title.length)}

${explainerData.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n\n')}

OFFICIAL REGULATORY & SCHEME REFERENCES:
${explainerData.sourceLinks.map((s) => `• ${s.title}: ${s.url}`).join('\n')}

Last checked: ${explainerData.lastChecked}
[WealthPulse Verified Support Knowledge Base Snippet]`;

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Step 3 — Standardized Fee Explainer (Derived from Insights)
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Customer-Facing Support Explainer (≤ 6 Bullets)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Directly connected to the fee confusion identified in Step 1. Neutral, facts-only tone with 2 official source links and timestamp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {explainerData && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border ${
              isCompliant 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {isCompliant ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{bulletCount} / 6 bullets</span>
              <span className="text-[10px] uppercase font-bold">{isCompliant ? 'Passed' : 'Exceeded'}</span>
            </div>
          )}

          <button
            onClick={onGenerateExplainer}
            disabled={isLoading || !identifiedFeeIssue}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 shadow-md shadow-emerald-600/20"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Explainer...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{explainerData ? 'Regenerate Explainer' : 'Generate Explainer'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Connection Anchor to Step 1 */}
      <div className="mt-4 px-3.5 py-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">Target Fee Issue:</span>
          <span className="text-amber-400 font-medium">
            {identifiedFeeIssue || 'Mutual Fund Exit Load misunderstanding during early redemptions'}
          </span>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
          Directly Linked to Step 1 Insights
        </span>
      </div>

      {/* Explainer Body */}
      {explainerData ? (
        <div className="mt-5 space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white tracking-tight">
                {explainerData.title}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Facts-Only Tone
                </span>
                <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Last checked: {explainerData.lastChecked}
                </span>
              </div>
            </div>

            {/* Bullets List (<= 6) */}
            <div className="space-y-2.5">
              {explainerData.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="flex-1">{bullet}</p>
                </div>
              ))}
            </div>

            {/* 2 Official Source Links */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                Official Regulatory & Authority Source References (2 Links)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {explainerData.sourceLinks.map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition group"
                  >
                    <span className="truncate pr-2 font-medium">{source.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Ready to be packaged into the weekly email draft & internal docs via MCP.
            </span>
            <button
              onClick={handleCopySnippet}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Support Snippet' : 'Copy for Support Desk'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 p-8 border border-dashed border-slate-800 rounded-xl text-center">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">
            Click "Generate Explainer" above to produce the structured ≤6 bullet customer explanation and official sources.
          </p>
        </div>
      )}
    </section>
  );
};
