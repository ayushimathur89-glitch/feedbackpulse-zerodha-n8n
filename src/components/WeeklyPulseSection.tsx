import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Sparkles, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { WeeklyPulseData } from '../types';

interface WeeklyPulseSectionProps {
  pulseData: WeeklyPulseData | null;
  isLoading: boolean;
  onGeneratePulse: () => void;
  onUpdatePulseText: (text: string) => void;
}

export const WeeklyPulseSection: React.FC<WeeklyPulseSectionProps> = ({
  pulseData,
  isLoading,
  onGeneratePulse,
  onUpdatePulseText,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const wordCount = pulseData ? pulseData.pulseText.split(/\s+/).filter(Boolean).length : 0;
  const isCompliant = wordCount > 0 && wordCount <= 250;

  const handleCopy = () => {
    if (!pulseData) return;
    navigator.clipboard.writeText(pulseData.pulseText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    if (!pulseData) return;
    const blob = new Blob([pulseData.pulseText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weekly-product-pulse-${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Step 2 — Weekly Product Pulse (Internal Output)
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            Executive & Product Team Pulse (≤ 250 Words)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Structured weekly synthesis for cross-functional product & engineering leads with top themes, real quotes, key observation, and 3 action items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pulseData && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border ${
              isCompliant 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {isCompliant ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{wordCount} / 250 words</span>
              <span className="text-[10px] uppercase font-bold">{isCompliant ? 'Passed' : 'Exceeded'}</span>
            </div>
          )}

          <button
            onClick={onGeneratePulse}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition disabled:opacity-50 shadow-md shadow-violet-600/20"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{pulseData ? 'Regenerate Pulse' : 'Generate Pulse'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      {pulseData ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Format:</span>
              <span>Top Themes • Quotes • Key Observation • 3 Action Ideas</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition"
              >
                {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditing ? 'Preview Mode' : 'Edit Note'}</span>
              </button>
              <span>•</span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy MD'}</span>
              </button>
              <span>•</span>
              <button
                onClick={handleDownloadMd}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition"
                title="Download as Markdown file (Assignment Deliverable)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
            </div>
          </div>

          {isEditing ? (
            <textarea
              rows={12}
              value={pulseData.pulseText}
              onChange={(e) => onUpdatePulseText(e.target.value)}
              className="w-full p-4 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 leading-relaxed"
            />
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 text-xs text-slate-300 leading-relaxed space-y-3 prose prose-invert max-w-none">
              <div className="whitespace-pre-line font-sans">
                {pulseData.pulseText}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
            <span>Ready for MCP human approval step</span>
            <span>Generated: {pulseData.generatedAt}</span>
          </div>
        </div>
      ) : (
        <div className="mt-6 p-8 border border-dashed border-slate-800 rounded-xl text-center">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">
            Run Step 1 review intelligence or click "Generate Pulse" above to create the ≤250-word internal update.
          </p>
        </div>
      )}
    </section>
  );
};
