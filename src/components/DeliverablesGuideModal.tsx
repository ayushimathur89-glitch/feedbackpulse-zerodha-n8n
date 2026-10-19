import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  Download, 
  ExternalLink, 
  BookOpen, 
  FileText, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  HelpCircle,
  Share2
} from 'lucide-react';
import { DocEntry, EmailDraft, FeeExplainerData, WeeklyPulseData } from '../types';

interface DeliverablesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeklyPulse: WeeklyPulseData | null;
  feeExplainer: FeeExplainerData | null;
  latestDoc: DocEntry | null;
  latestEmail: EmailDraft | null;
  onDownloadCsv: () => void;
}

export const DeliverablesGuideModal: React.FC<DeliverablesGuideModalProps> = ({
  isOpen,
  onClose,
  weeklyPulse,
  feeExplainer,
  latestDoc,
  latestEmail,
  onDownloadCsv,
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'readme' | 'sources' | 'snippets'>('checklist');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPulse, setCopiedPulse] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const prototypeUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(prototypeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const officialSourcesList = [
    {
      title: 'Zerodha Official Brokerage & Charges List (Equity, F&O, Currency, Commodity)',
      url: 'https://zerodha.com/charges',
      description: 'Official schedule of charges outlining flat ₹20/0.03% intraday brokerage, free equity delivery, ₹50 auto-square-off fee, and government levies.'
    },
    {
      title: 'National Stock Exchange of India (NSE) — Equity & Derivatives Transaction Charges & Levies',
      url: 'https://www.nseindia.com/products-services/equity-market-trading-charges',
      description: 'Statutory exchange turnover fees, IPFT levies, and Securities Transaction Tax (STT) rates applied on stock and F&O order turnover.'
    },
    {
      title: 'Securities and Exchange Board of India (SEBI) — Master Circular on Stock Broker Regulations & Levies',
      url: 'https://www.sebi.gov.in',
      description: 'Regulatory mandate governing brokerage caps, margin collection rules, and transparent contract note disclosures.'
    },
    {
      title: 'Zerodha Support Portal — How are Intraday MIS & F&O Auto Square-off Charges Calculated',
      url: 'https://support.zerodha.com/category/trading-and-markets/margin-leverage-and-product-and-order-types/articles/what-is-the-auto-square-off-charge',
      description: 'Detailed explanation of RMS 3:20 PM automatic square-off rules and the ₹50 + GST penalty levied on open intraday positions.'
    },
    {
      title: 'Central Depository Services Limited (CDSL) — Depository Participant (DP) Charges Schedule',
      url: 'https://www.cdslindia.com',
      description: 'Statutory DP charges levied upon debit of shares from demat holdings during equity delivery sell transactions.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Assignment Deliverables & Submission Package
              </h3>
              <p className="text-xs text-slate-400">
                All required artifacts, links, sources, README, and export snippets in one place.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="bg-slate-950 px-5 border-b border-slate-800 flex space-x-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Deliverables Checklist (All 7 Items)
          </button>
          <button
            onClick={() => setActiveTab('readme')}
            className={`py-3 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'readme'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            README & Evaluation Answers
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`py-3 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'sources'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Source List (4–6 Official URLs)
          </button>
          <button
            onClick={() => setActiveTab('snippets')}
            className={`py-3 px-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'snippets'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Submission Copy Snippets
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          
          {/* TAB 1: Deliverables Checklist */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4">
                <span className="font-semibold text-white block mb-1">
                  1. Working Prototype Link:
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={prototypeUrl}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      2. Weekly Product Pulse (MD)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {weeklyPulse ? `${weeklyPulse.wordCount} words` : 'Generated'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Structured ≤250-word note with summary of top themes, verbatim quotes, trending observations, and 3 product actions.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      3. Notes/Doc Appended Snippet
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      MCP Output #1
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Appended entry matching schema: date, top_themes, weekly_pulse, identified_fee_issue, explanation_bullets, source_links.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      4. Email Draft Text / Screen
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono">
                      MCP Output #2
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Subject: "Weekly Product Pulse + Customer Clarification — Mutual Fund Exit Load" with weekly pulse & fee snippet (No auto-send).
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      5. Reviews CSV Sample (8–12 Wks)
                    </span>
                    <button
                      onClick={onDownloadCsv}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Download .csv
                    </button>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Authentic dataset spanning July 29 to October 14, 2026 with user ratings, author names, platforms, and fee reviews.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: README Answers */}
          {activeTab === 'readme' && (
            <div className="space-y-4 leading-relaxed font-sans">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Question 1: What fee issue was identified from reviews?
                </h4>
                <div className="text-slate-300 pl-4 border-l-2 border-indigo-500/40 text-[12px] space-y-1">
                  <p>
                    <strong>Identified Fee Issue:</strong> Confusion over Intraday Equity &amp; F&amp;O Order Charges (Brokerage + Regulatory Levies + ₹50 Auto Square-Off Fee) without real-time pre-trade breakdown.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Why it happens:</strong> In the 100 customer reviews, users (e.g., Shanky Karwa, Mukesh Kumar, vickey Shyner) complain that <em>"its charges are more as compared to other platforms"</em>, asking <em>"what u r charging for"</em>, and requesting <em>"intraday charges shown separately in real time"</em>. Traders place intraday orders expecting flat ₹20 brokerage, but when statutory levies (STT, exchange turnover charges, GST, stamp duty) and ₹50 RMS auto-square-off fees are deducted at end-of-day, they feel surprised by the accumulated deductions because the Kite order pad does not display a pre-trade charges estimate.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Question 2: Where does the MCP / Tool approval happen?
                </h4>
                <div className="text-slate-300 pl-4 border-l-2 border-orange-500/40 text-[12px] space-y-1">
                  <p>
                    <strong>Approval Gate Location:</strong> The approval occurs inside the <strong>n8n workflow</strong> via a <em>Manual Approval / Wait for Webhook</em> node.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Gating Mechanism:</strong> The n8n workflow ingests the structured JSON payload containing the weekly pulse and fee explainer, halts execution in an approval state, and alerts the operator. Once the operator verifies and approves the output via the n8n approval interface, the workflow resumes and triggers downstream actions: appending the entry to the corporate Document / Knowledge Base (e.g., Google Docs / Notion) and creating the email draft in Gmail with auto-send disabled.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Question 3: How to run the application?
                </h4>
                <div className="text-slate-300 pl-4 border-l-2 border-emerald-500/40 text-[12px] space-y-1">
                  <p>
                    1. Open the web app URL directly in any browser.
                  </p>
                  <p>
                    2. In <strong>Step 1</strong>, click <em>"Run Review Intelligence"</em> to cluster the 100 Zerodha customer reviews into 5 themes, extract the top 3 themes, 3 quotes, and isolate the intraday &amp; F&amp;O fee confusion.
                  </p>
                  <p>
                    3. In <strong>Step 2</strong>, click <em>"Generate Pulse"</em> to obtain the &le;250-word internal update for Zerodha product leadership.
                  </p>
                  <p>
                    4. In <strong>Step 3</strong>, click <em>"Generate Explainer"</em> to create the &le;6 bullet customer snippet with 2 official sources.
                  </p>
                  <p>
                    5. In the <strong>n8n Integration Section</strong>, copy the prepared JSON payload or trigger your n8n workflow webhook to execute the approval gate, doc append, and email draft creation!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Source List */}
          {activeTab === 'sources' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs">
                Official regulatory and statutory sources (4–6 URLs) referenced in the fee explainer and submission:
              </p>
              <div className="space-y-2">
                {officialSourcesList.map((src, i) => (
                  <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs">{src.title}</span>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono text-[11px]"
                      >
                        Visit Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {src.description}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 truncate pt-1">
                      {src.url}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Submission Copy Snippets */}
          {activeTab === 'snippets' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Weekly Product Pulse Text (For Assignment Submission):</span>
                  <button
                    onClick={() => {
                      if (weeklyPulse) {
                        navigator.clipboard.writeText(weeklyPulse.pulseText);
                        setCopiedPulse(true);
                        setTimeout(() => setCopiedPulse(false), 2000);
                      }
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {copiedPulse ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPulse ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 max-h-36 overflow-auto font-mono whitespace-pre-line">
                  {weeklyPulse?.pulseText || 'Run Step 2 to generate pulse text.'}
                </pre>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">n8n Workflow JSON Payload (For Step 4 Webhook / Nodes):</span>
                  <button
                    onClick={() => {
                      const payload = {
                        date: new Date().toISOString().split('T')[0],
                        product: 'Zerodha Kite',
                        weekly_pulse: weeklyPulse?.pulseText || '',
                        fee_explainer: feeExplainer,
                      };
                      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                      setCopiedDoc(true);
                      setTimeout(() => setCopiedDoc(false), 2000);
                    }}
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                  >
                    {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDoc ? 'Copied n8n JSON' : 'Copy n8n Payload'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-lg text-[10px] font-mono text-orange-300 max-h-40 overflow-auto whitespace-pre">
                  {JSON.stringify({
                    date: new Date().toISOString().split('T')[0],
                    product: 'Zerodha Kite',
                    weekly_pulse: weeklyPulse?.pulseText || '',
                    fee_explainer: feeExplainer,
                  }, null, 2)}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
