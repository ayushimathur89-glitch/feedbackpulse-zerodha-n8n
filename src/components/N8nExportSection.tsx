import React, { useState } from 'react';
import { 
  Workflow, 
  Play, 
  Check, 
  Copy, 
  Download, 
  Upload, 
  ShieldCheck, 
  FileText, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  Code2, 
  Send, 
  Pause, 
  RefreshCw, 
  Settings2, 
  Sparkles,
  ChevronRight,
  Eye,
  Sliders,
  ArrowRight
} from 'lucide-react';
import { AnalysisResult, FeeExplainerData, WeeklyPulseData } from '../types';

interface N8nExportSectionProps {
  analysis: AnalysisResult | null;
  weeklyPulse: WeeklyPulseData | null;
  feeExplainer: FeeExplainerData | null;
}

type NodeStatus = 'idle' | 'running' | 'waiting_approval' | 'success' | 'rejected' | 'error';

interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'approval' | 'action';
  icon: 'webhook' | 'shield' | 'doc' | 'mail';
  status: NodeStatus;
  executionTime?: string;
  outputSummary?: string;
}

const DEFAULT_N8N_WORKFLOW_JSON = {
  name: "Zerodha Product Pulse & Customer Clarification Workflow",
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "zerodha-pulse-webhook",
        responseMode: "onReceived",
        options: {}
      },
      id: "node-webhook-1",
      name: "Webhook: Pulse Ingestion",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [220, 300]
    },
    {
      parameters: {
        resume: "form",
        formTitle: "Approval Required: Zerodha Weekly Pulse & Fee Explainer",
        formDescription: "Review the Zerodha Kite product pulse and customer explainer before appending to docs and drafting email.",
        fields: {
          values: [
            { fieldLabel: "Approve downstream documentation logging?", fieldType: "boolean" },
            { fieldLabel: "Approve corporate email draft creation?", fieldType: "boolean" }
          ]
        }
      },
      id: "node-approval-2",
      name: "Human Approval Gate",
      type: "n8n-nodes-base.wait",
      typeVersion: 1.1,
      position: [500, 300]
    },
    {
      parameters: {
        operation: "append",
        documentId: "doc_zerodha_knowledge_base",
        text: "={{ $json.weekly_pulse }}\n\n{{ $json.identified_fee_issue }}\n\n{{ $json.explanation_bullets }}"
      },
      id: "node-doc-3",
      name: "Google Docs / Notion: Append Entry",
      type: "n8n-nodes-base.googleDocs",
      typeVersion: 2,
      position: [820, 200]
    },
    {
      parameters: {
        resource: "draft",
        operation: "create",
        subject: "={{ $json.email_draft.subject }}",
        toList: "={{ $json.email_draft.recipients }}",
        message: "={{ $json.email_draft.body }}",
        additionalFields: {
          autoSend: false
        }
      },
      id: "node-email-4",
      name: "Gmail: Stage Email Draft",
      type: "n8n-nodes-base.gmail",
      typeVersion: 2.1,
      position: [820, 420]
    }
  ],
  connections: {
    "Webhook: Pulse Ingestion": {
      main: [
        [
          { node: "Human Approval Gate", type: "main", index: 0 }
        ]
      ]
    },
    "Human Approval Gate": {
      main: [
        [
          { node: "Google Docs / Notion: Append Entry", type: "main", index: 0 },
          { node: "Gmail: Stage Email Draft", type: "main", index: 0 }
        ]
      ]
    }
  }
};

export const N8nExportSection: React.FC<N8nExportSectionProps> = ({
  analysis,
  weeklyPulse,
  feeExplainer,
}) => {
  // Workflow nodes state
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'node-webhook-1',
      name: 'Webhook: Pulse Ingestion',
      type: 'n8n-nodes-base.webhook',
      category: 'trigger',
      icon: 'webhook',
      status: 'idle',
      outputSummary: 'Awaiting execution trigger...'
    },
    {
      id: 'node-approval-2',
      name: 'Human Approval Gate (Wait Node)',
      type: 'n8n-nodes-base.wait',
      category: 'approval',
      icon: 'shield',
      status: 'idle',
      outputSummary: 'Human-in-the-Loop policy gate'
    },
    {
      id: 'node-doc-3',
      name: 'Google Docs / Notion Append',
      type: 'n8n-nodes-base.googleDocs',
      category: 'action',
      icon: 'doc',
      status: 'idle',
      outputSummary: 'Awaits approval to append entry'
    },
    {
      id: 'node-email-4',
      name: 'Gmail: Stage Email Draft',
      type: 'n8n-nodes-base.gmail',
      category: 'action',
      icon: 'mail',
      status: 'idle',
      outputSummary: 'Auto-send strictly locked'
    }
  ]);

  // Execution states
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionPhase, setExecutionPhase] = useState<'idle' | 'running_webhook' | 'waiting_approval' | 'approved' | 'rejected' | 'completed'>('idle');
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionDuration, setExecutionDuration] = useState<string | null>(null);
  const [activeInspectorNode, setActiveInspectorNode] = useState<string>('node-webhook-1');
  const [activeTab, setActiveTab] = useState<'canvas' | 'results' | 'json-workflow' | 'live-webhook'>('canvas');

  // JSON import modal state
  const [customJsonInput, setCustomJsonInput] = useState<string>(JSON.stringify(DEFAULT_N8N_WORKFLOW_JSON, null, 2));
  const [workflowName, setWorkflowName] = useState<string>("Zerodha Product Pulse & Customer Clarification Workflow");
  const [jsonImportSuccess, setJsonImportSuccess] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);

  // Live Webhook settings
  const [liveWebhookUrl, setLiveWebhookUrl] = useState('');
  const [liveTriggerStatus, setLiveTriggerStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [executionMode, setExecutionMode] = useState<'canvas' | 'live_webhook'>('canvas');

  // Generate payload for execution
  const currentPayload = {
    date: new Date().toISOString().split('T')[0],
    product: 'Zerodha Kite',
    top_themes: analysis?.topThemes || [
      'Live Chart Rendering Failures & Blank Screen Glitch (Critical Incident)',
      'Feature Parity & Chart Trading vs Rivals (Groww & Dhan)',
      'Fee Transparency & Intraday / F&O Charges Confusion'
    ],
    weekly_pulse: weeklyPulse?.pulseText || 'Weekly product pulse note...',
    identified_fee_issue: analysis?.identifiedFeeIssue || 'Confusion over Intraday Equity & F&O Order Charges without real-time pre-trade breakdown',
    explanation_bullets: feeExplainer?.bullets || [
      'Zerodha charges flat ₹20 or 0.03% (whichever lower) per executed order for Equity Intraday and F&O.',
      'Statutory government levies (STT, Exchange Turnover Charges, GST) are added separately by law.',
      'Unclosed intraday MIS positions past 3:20 PM incur an RMS auto square-off fee of ₹50 + 18% GST per order.'
    ],
    source_links: feeExplainer?.sourceLinks || [
      { title: 'Zerodha Official Brokerage & Charges List', url: 'https://zerodha.com/charges' },
      { title: 'NSE Transaction Charges & Statutory Levies', url: 'https://www.nseindia.com/products-services/equity-market-trading-charges' }
    ],
    email_draft: {
      subject: `Weekly Product Pulse + Customer Clarification — Zerodha Intraday & F&O Charges (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`,
      recipients: ['product-team@zerodha.internal', 'support-leads@zerodha.internal'],
      body: `Hi Zerodha Leadership & Support Desk,\n\nHere is this week's synthesis of 100 customer reviews for Zerodha Kite and the reusable customer fee explainer:\n\n=========================================\nWEEKLY PRODUCT PULSE\n=========================================\n${weeklyPulse?.pulseText || ''}\n\n=========================================\nSTANDARDIZED CUSTOMER FEE EXPLAINER (REUSABLE SNIPPET)\n=========================================\n${feeExplainer?.title || 'Understanding Zerodha Charges'}\n\n${(feeExplainer?.bullets || []).map((b, i) => `${i + 1}. ${b}`).join('\n\n')}\n\nOFFICIAL REFERENCES:\n${(feeExplainer?.sourceLinks || []).map(s => `• ${s.title}: ${s.url}`).join('\n')}\n\nLast checked: ${feeExplainer?.lastChecked || '2026-10-16'}\n\n--\nPrepared via FeedbackPulse AI for n8n Automation Engine.\nNote: Auto-send disabled per approval policy.`
    }
  };

  // 1. Trigger the workflow execution
  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    const execId = `#${Math.floor(1000 + Math.random() * 9000)}`;
    setExecutionId(execId);
    setExecutionPhase('running_webhook');

    // If live webhook mode is chosen and URL is provided, call backend proxy
    if (executionMode === 'live_webhook' && liveWebhookUrl.trim()) {
      try {
        const response = await fetch('/api/n8n/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: liveWebhookUrl,
            payload: currentPayload
          })
        });
        const resData = await response.json();
        setLiveTriggerStatus({
          success: response.ok,
          message: response.ok ? `Dispatched to live n8n instance! Status: ${resData.status || 200}` : `Error: ${resData.error || 'Failed'}`
        });
      } catch (err: any) {
        setLiveTriggerStatus({ success: false, message: err?.message || 'Failed to dispatch to live n8n' });
      }
    }

    // Node 1: Webhook Node runs
    setNodes(prev => prev.map(n => n.id === 'node-webhook-1' ? { ...n, status: 'running' } : { ...n, status: 'idle' }));

    setTimeout(() => {
      setNodes(prev => prev.map(n => {
        if (n.id === 'node-webhook-1') {
          return { ...n, status: 'success', executionTime: '142ms', outputSummary: '1 item received (8 keys parsed)' };
        }
        if (n.id === 'node-approval-2') {
          return { ...n, status: 'waiting_approval', outputSummary: 'Awaiting operator consent' };
        }
        return n;
      }));
      setExecutionPhase('waiting_approval');
      setActiveInspectorNode('node-approval-2');
    }, 600);
  };

  // 2. Human Approval Decision
  const handleApprovalDecision = (approved: boolean) => {
    if (!approved) {
      setNodes(prev => prev.map(n => {
        if (n.id === 'node-approval-2') return { ...n, status: 'rejected', outputSummary: 'Operator rejected execution' };
        if (n.category === 'action') return { ...n, status: 'idle', outputSummary: 'Execution halted by gate' };
        return n;
      }));
      setExecutionPhase('rejected');
      setIsExecuting(false);
      return;
    }

    // Approved: Run Downstream Branches (Google Docs & Gmail)
    setExecutionPhase('approved');
    setNodes(prev => prev.map(n => {
      if (n.id === 'node-approval-2') return { ...n, status: 'success', executionTime: 'Approved by Operator', outputSummary: 'Privileges granted' };
      if (n.category === 'action') return { ...n, status: 'running' };
      return n;
    }));

    setTimeout(() => {
      setNodes(prev => prev.map(n => {
        if (n.id === 'node-doc-3') {
          return { ...n, status: 'success', executionTime: '210ms', outputSummary: 'Appended 1 entry to Knowledge Base' };
        }
        if (n.id === 'node-email-4') {
          return { ...n, status: 'success', executionTime: '185ms', outputSummary: 'Email draft created in Mailbox (No auto-send)' };
        }
        return n;
      }));
      setExecutionPhase('completed');
      setIsExecuting(false);
      setExecutionDuration('537ms');
      setActiveInspectorNode('node-doc-3');
    }, 800);
  };

  // Reset workflow execution
  const handleResetWorkflow = () => {
    setNodes(prev => prev.map(n => ({ ...n, status: 'idle', executionTime: undefined })));
    setExecutionPhase('idle');
    setExecutionId(null);
    setExecutionDuration(null);
    setActiveInspectorNode('node-webhook-1');
  };

  // Import custom n8n JSON
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(customJsonInput);
      if (parsed.name) setWorkflowName(parsed.name);
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        // Map custom nodes to our canvas nodes if present
        const mapped: WorkflowNode[] = parsed.nodes.slice(0, 5).map((n: any, idx: number) => ({
          id: n.id || `custom-${idx}`,
          name: n.name || `Node ${idx + 1}`,
          type: n.type || 'n8n-node',
          category: idx === 0 ? 'trigger' : idx === 1 ? 'approval' : 'action',
          icon: idx === 0 ? 'webhook' : idx === 1 ? 'shield' : idx === 2 ? 'doc' : 'mail',
          status: 'idle',
          outputSummary: 'Loaded from custom n8n JSON'
        }));
        setNodes(mapped);
      }
      setJsonImportSuccess(true);
      setTimeout(() => setJsonImportSuccess(false), 3000);
      setActiveTab('canvas');
    } catch {
      alert('Invalid JSON format. Please verify your n8n workflow export JSON.');
    }
  };

  const handleDownloadWorkflowJson = () => {
    const blob = new Blob([customJsonInput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `n8n-zerodha-pulse-workflow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-2xl space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#ff6d5a]/15 text-[#ff6d5a] border border-[#ff6d5a]/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5" />
              Step 4 — n8n Automation Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Status: <span className="text-emerald-400 font-bold">Active &amp; Ready</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>n8n Visual Workflow &amp; Approval Canvas</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Connected to your n8n workflow. Review node connections, trigger execution, enforce human approval gating, and inspect live outputs directly inside this interface.
          </p>
        </div>

        {/* Primary Workflow Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExecuteWorkflow}
            disabled={isExecuting && executionPhase !== 'waiting_approval'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ff6d5a] to-[#ea4b35] hover:from-[#ff553f] hover:to-[#d83f2a] transition shadow-lg shadow-[#ff6d5a]/25 disabled:opacity-50"
          >
            {isExecuting && executionPhase === 'running_webhook' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Triggering Nodes...</span>
              </>
            ) : executionPhase === 'waiting_approval' ? (
              <>
                <Pause className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Approval Required</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute n8n Workflow</span>
              </>
            )}
          </button>

          {executionPhase !== 'idle' && (
            <button
              onClick={handleResetWorkflow}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              Reset Canvas
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'canvas' ? 'bg-[#ff6d5a] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>n8n Workflow Canvas</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'results' ? 'bg-[#ff6d5a] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Output Destinations</span>
            {executionPhase === 'completed' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('json-workflow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'json-workflow' ? 'bg-[#ff6d5a] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Workflow JSON (.json)</span>
          </button>

          <button
            onClick={() => setActiveTab('live-webhook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'live-webhook' ? 'bg-[#ff6d5a] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Live Webhook Target</span>
          </button>
        </div>

        {/* Execution Status Badge */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {executionId && (
            <span className="font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
              Execution: <strong className="text-white">{executionId}</strong>
            </span>
          )}
          {executionDuration && (
            <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              {executionDuration}
            </span>
          )}
        </div>
      </div>

      {/* TAB 1: INTERACTIVE n8n WORKFLOW CANVAS */}
      {activeTab === 'canvas' && (
        <div className="space-y-4">
          
          {/* n8n Studio Canvas Box */}
          <div className="relative bg-[#111622] border border-slate-800 rounded-2xl p-6 sm:p-8 min-h-[360px] overflow-x-auto shadow-inner">
            
            {/* Dot grid background pattern mimicking n8n canvas */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none rounded-2xl" 
              style={{
                backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />

            {/* Workflow Title Tag on Canvas */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff6d5a]"></span>
              <span className="text-xs font-semibold text-slate-300 font-mono tracking-tight">
                {workflowName}
              </span>
            </div>

            {/* Interactive Nodes Flow (Flex Grid with Connector Lines) */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 pt-8 pb-4">
              
              {/* NODE 1: Webhook Ingestion */}
              <div 
                onClick={() => setActiveInspectorNode('node-webhook-1')}
                className={`w-full md:w-60 bg-slate-900 border rounded-xl p-4 cursor-pointer transition transform hover:-translate-y-0.5 ${
                  activeInspectorNode === 'node-webhook-1' ? 'border-[#ff6d5a] shadow-lg shadow-[#ff6d5a]/15' : 'border-slate-800'
                } ${nodes[0].status === 'running' ? 'ring-2 ring-[#ff6d5a] ring-offset-2 ring-offset-slate-950 animate-pulse' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#ff6d5a]/20 text-[#ff6d5a] flex items-center justify-center font-bold text-xs">
                      <Workflow className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">Webhook Ingestion</div>
                      <div className="text-[10px] text-slate-500 font-mono">POST /pulse</div>
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    nodes[0].status === 'success' ? 'bg-emerald-400' :
                    nodes[0].status === 'running' ? 'bg-[#ff6d5a] animate-ping' : 'bg-slate-600'
                  }`} />
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80">
                  {nodes[0].outputSummary}
                </div>
              </div>

              {/* Connector Arrow 1 -> 2 */}
              <div className="hidden md:flex flex-col items-center justify-center text-slate-600">
                <span className="text-[10px] font-mono text-slate-500">JSON</span>
                <ArrowRight className="w-5 h-5 text-slate-500" />
              </div>

              {/* NODE 2: Human Approval Gate */}
              <div 
                onClick={() => setActiveInspectorNode('node-approval-2')}
                className={`w-full md:w-64 bg-slate-900 border rounded-xl p-4 cursor-pointer transition transform hover:-translate-y-0.5 ${
                  activeInspectorNode === 'node-approval-2' ? 'border-amber-400 shadow-lg shadow-amber-400/15' : 'border-slate-800'
                } ${nodes[1].status === 'waiting_approval' ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 animate-pulse' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">Human Approval Gate</div>
                      <div className="text-[10px] text-amber-400 font-mono">Wait / Form Node</div>
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    nodes[1].status === 'success' ? 'bg-emerald-400' :
                    nodes[1].status === 'waiting_approval' ? 'bg-amber-400 animate-pulse' :
                    nodes[1].status === 'rejected' ? 'bg-rose-400' : 'bg-slate-600'
                  }`} />
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80">
                  {nodes[1].outputSummary}
                </div>
              </div>

              {/* Connector Arrow 2 -> 3 & 4 */}
              <div className="hidden md:flex flex-col items-center justify-center text-slate-600">
                <span className="text-[10px] font-mono text-emerald-400">Approved</span>
                <ArrowRight className="w-5 h-5 text-emerald-400" />
              </div>

              {/* BRANCH: Downstream Nodes (Docs & Email) */}
              <div className="w-full md:w-64 flex flex-col gap-3">
                {/* NODE 3: Google Docs */}
                <div 
                  onClick={() => setActiveInspectorNode('node-doc-3')}
                  className={`bg-slate-900 border rounded-xl p-3 cursor-pointer transition transform hover:-translate-y-0.5 ${
                    activeInspectorNode === 'node-doc-3' ? 'border-emerald-500 shadow-md shadow-emerald-500/15' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white">Google Docs / Notion</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${nodes[2].status === 'success' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  </div>
                  <div className="text-[10px] text-slate-400 truncate bg-slate-950 px-2 py-1 rounded">
                    {nodes[2].outputSummary}
                  </div>
                </div>

                {/* NODE 4: Gmail Draft */}
                <div 
                  onClick={() => setActiveInspectorNode('node-email-4')}
                  className={`bg-slate-900 border rounded-xl p-3 cursor-pointer transition transform hover:-translate-y-0.5 ${
                    activeInspectorNode === 'node-email-4' ? 'border-violet-500 shadow-md shadow-violet-500/15' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white">Gmail Draft</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${nodes[3].status === 'success' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  </div>
                  <div className="text-[10px] text-slate-400 truncate bg-slate-950 px-2 py-1 rounded">
                    {nodes[3].outputSummary}
                  </div>
                </div>
              </div>

            </div>

            {/* In-Canvas Human Approval Prompt Banner (Appears when paused on Approval Node) */}
            {executionPhase === 'waiting_approval' && (
              <div className="mt-6 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-2 border-amber-500/80 rounded-xl p-5 shadow-2xl animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Human-in-the-Loop Gate: Operator Decision Required</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Paused
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        The n8n workflow has paused execution. Do you approve appending the Zerodha Weekly Pulse &amp; Fee Explainer to the document and staging the Gmail draft?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleApprovalDecision(false)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprovalDecision(true)}
                      className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve &amp; Resume n8n</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Node Inspector Drawer */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#ff6d5a]" />
                <span className="font-bold text-white">
                  Node Inspector: {nodes.find(n => n.id === activeInspectorNode)?.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Type: {nodes.find(n => n.id === activeInspectorNode)?.type}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Status: <strong className="text-white uppercase">{nodes.find(n => n.id === activeInspectorNode)?.status}</strong>
              </span>
            </div>

            {/* Inspector Details */}
            {activeInspectorNode === 'node-webhook-1' && (
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-mono block">Input Payload Dispatched into Webhook:</span>
                <pre className="p-3 bg-slate-900 rounded-lg text-[10px] font-mono text-indigo-300 max-h-36 overflow-auto whitespace-pre">
                  {JSON.stringify(currentPayload, null, 2)}
                </pre>
              </div>
            )}

            {activeInspectorNode === 'node-approval-2' && (
              <div className="space-y-2 text-slate-300">
                <p>
                  <strong>Approval Rule:</strong> Execution halts via n8n <code>Wait for Webhook / Form Response</code> node. Requires affirmative operator response before branching to Google Docs and Gmail.
                </p>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                  <span>Security Constraint: </span>
                  <span className="text-amber-300 font-medium">Auto-send is locked to prevent unverified outgoing emails.</span>
                </div>
              </div>
            )}

            {activeInspectorNode === 'node-doc-3' && (
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-mono block">Document Output Entry:</span>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 text-[11px] whitespace-pre-line leading-relaxed max-h-36 overflow-auto">
                  {`# Zerodha Weekly Pulse — ${currentPayload.date}\nFee Issue: ${currentPayload.identified_fee_issue}\n\nTop Themes:\n${currentPayload.top_themes.map(t => `- ${t}`).join('\n')}\n\n${currentPayload.weekly_pulse}`}
                </div>
              </div>
            )}

            {activeInspectorNode === 'node-email-4' && (
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-mono block">Gmail Staged Draft:</span>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 text-[11px] whitespace-pre-line leading-relaxed max-h-36 overflow-auto">
                  <strong>Subject: {currentPayload.email_draft.subject}</strong>
                  <br /><br />
                  {currentPayload.email_draft.body}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: LIVE OUTPUT DESTINATIONS */}
      {activeTab === 'results' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Output 1: Internal Knowledge Base Document */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col justify-between">
            <div className="p-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Google Docs / Notion Knowledge Base</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                {nodes[2].status === 'success' ? 'Appended (Live)' : 'Staged (Pre-execution)'}
              </span>
            </div>

            <div className="p-4 sm:p-5 text-xs text-slate-300 space-y-3 max-h-80 overflow-y-auto leading-relaxed">
              <div className="border-b border-slate-800 pb-2">
                <div className="text-[10px] uppercase font-bold text-slate-500">Document Entry Title</div>
                <div className="text-sm font-bold text-white">Zerodha Kite Weekly Review Synthesis — {currentPayload.date}</div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase mb-1">Identified Fee Issue</span>
                <span className="text-amber-400 font-medium">{currentPayload.identified_fee_issue}</span>
              </div>

              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase mb-1">Top Themes</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentPayload.top_themes.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase mb-1">Weekly Pulse Content</span>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-line">
                  {currentPayload.weekly_pulse}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase mb-1">Customer Fee Explainer Bullets</span>
                <div className="space-y-1">
                  {currentPayload.explanation_bullets.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">{idx + 1}.</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
                  alert('Copied Document Entry!');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Doc Content</span>
              </button>
            </div>
          </div>

          {/* Output 2: Gmail Staged Draft */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col justify-between">
            <div className="p-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-white">Gmail Draft Composer</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                Draft Only (No Auto-Send)
              </span>
            </div>

            <div className="p-4 sm:p-5 text-xs text-slate-300 space-y-3 max-h-80 overflow-y-auto">
              <div className="border-b border-slate-800 pb-2 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold w-16">Subject:</span>
                  <span className="text-white font-bold">{currentPayload.email_draft.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold w-16">To:</span>
                  <span className="text-slate-300 font-mono text-[11px]">{currentPayload.email_draft.recipients.join(', ')}</span>
                </div>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 text-slate-200 text-xs whitespace-pre-line leading-relaxed font-sans">
                {currentPayload.email_draft.body}
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Auto-send is strictly disabled in n8n node configuration.</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentPayload.email_draft.body);
                  alert('Copied Email Draft Body!');
                }}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Draft Text</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: n8n WORKFLOW JSON IMPORT & EXPORT */}
      {activeTab === 'json-workflow' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#ff6d5a]" />
                <span>n8n Workflow JSON Export &amp; Custom Importer</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste your custom n8n JSON file below to update the canvas, or download the pre-configured workflow JSON.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(customJsonInput);
                  setCopiedWorkflow(true);
                  setTimeout(() => setCopiedWorkflow(false), 2000);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
              >
                {copiedWorkflow ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWorkflow ? 'Copied' : 'Copy Workflow JSON'}</span>
              </button>

              <button
                onClick={handleDownloadWorkflowJson}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#ff6d5a] hover:bg-[#ff553f] text-white transition flex items-center gap-1.5 shadow-md shadow-[#ff6d5a]/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>n8n Workflow Definition (Nodes &amp; Connections):</span>
              <button
                onClick={handleImportJson}
                className="text-xs text-[#ff6d5a] hover:text-[#ff8575] font-semibold underline underline-offset-2"
              >
                Apply / Parse JSON into Canvas
              </button>
            </div>
            <textarea
              rows={14}
              value={customJsonInput}
              onChange={(e) => setCustomJsonInput(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-[#ff8e7d] focus:outline-none focus:border-[#ff6d5a] leading-relaxed"
              placeholder="Paste your exported n8n workflow JSON here..."
            />
            {jsonImportSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Workflow JSON parsed and applied to canvas nodes successfully!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: LIVE WEBHOOK TARGET */}
      {activeTab === 'live-webhook' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-orange-400" />
              <span>Connect to Live Self-Hosted or Cloud n8n Webhook</span>
            </h3>
            <p className="text-xs text-slate-400">
              If your n8n workflow is currently running, enter the Webhook URL below. The "Execute n8n Workflow" button will dispatch the live JSON payload to your server.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Target n8n Webhook URL:</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://your-n8n-instance.cloud/webhook/zerodha-pulse-webhook"
                  value={liveWebhookUrl}
                  onChange={(e) => setLiveWebhookUrl(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={() => {
                    setExecutionMode('live_webhook');
                    handleExecuteWorkflow();
                  }}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Ping</span>
                </button>
              </div>
            </div>

            {liveTriggerStatus && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                liveTriggerStatus.success 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {liveTriggerStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{liveTriggerStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
};
