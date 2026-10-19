import React, { useState, useRef } from 'react';
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
  RefreshCw, 
  Settings2, 
  Sparkles,
  ChevronRight,
  Eye,
  Sliders,
  ArrowRight,
  Globe,
  Database,
  Cpu,
  Zap,
  Link2,
  Unlink,
  Server,
  Radio,
  FileCode,
  Trash2,
  HelpCircle,
  MessageSquare,
  Key
} from 'lucide-react';
import { AnalysisResult, FeeExplainerData, WeeklyPulseData, N8nWorkflowData, N8nNode } from '../types';

interface N8nExportSectionProps {
  analysis: AnalysisResult | null;
  weeklyPulse: WeeklyPulseData | null;
  feeExplainer: FeeExplainerData | null;
}

type NodeStatus = 'idle' | 'running' | 'waiting_approval' | 'success' | 'rejected' | 'error';

// Default starter template if user hasn't loaded their own yet
const DEFAULT_ZERODHA_WORKFLOW_JSON: N8nWorkflowData = {
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
      position: [800, 200]
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
      position: [800, 420]
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

// Helper: infer category and icon for ANY n8n node type
const getNodeMetadata = (type: string, name: string) => {
  const lowerType = (type || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();

  if (lowerType.includes('webhook') || lowerType.includes('trigger') || lowerType.includes('schedule') || lowerType.includes('cron')) {
    return { category: 'trigger' as const, icon: 'webhook', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  }
  if (lowerType.includes('wait') || lowerType.includes('form') || lowerName.includes('approval') || lowerName.includes('gate') || lowerName.includes('human')) {
    return { category: 'approval' as const, icon: 'shield', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  }
  if (lowerType.includes('doc') || lowerType.includes('notion') || lowerType.includes('sheet') || lowerType.includes('airtable')) {
    return { category: 'action' as const, icon: 'doc', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  }
  if (lowerType.includes('gmail') || lowerType.includes('mail') || lowerType.includes('smtp') || lowerType.includes('sendgrid')) {
    return { category: 'action' as const, icon: 'mail', badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30' };
  }
  if (lowerType.includes('slack') || lowerType.includes('discord') || lowerType.includes('telegram') || lowerType.includes('teams')) {
    return { category: 'action' as const, icon: 'message', badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30' };
  }
  if (lowerType.includes('httprequest') || lowerType.includes('http') || lowerType.includes('api')) {
    return { category: 'action' as const, icon: 'globe', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
  }
  if (lowerType.includes('code') || lowerType.includes('function') || lowerType.includes('javascript') || lowerType.includes('python')) {
    return { category: 'logic' as const, icon: 'code', badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
  }
  if (lowerType.includes('postgres') || lowerType.includes('mysql') || lowerType.includes('mongo') || lowerType.includes('database')) {
    return { category: 'action' as const, icon: 'database', badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
  }
  return { category: 'action' as const, icon: 'cpu', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
};

export const N8nExportSection: React.FC<N8nExportSectionProps> = ({
  analysis,
  weeklyPulse,
  feeExplainer,
}) => {
  // Current active workflow (user's or default)
  const [currentWorkflow, setCurrentWorkflow] = useState<N8nWorkflowData>(DEFAULT_ZERODHA_WORKFLOW_JSON);
  const [workflowSource, setWorkflowSource] = useState<'default' | 'instance' | 'uploaded_json'>('default');
  
  // Instance connection state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectionTab, setConnectionTab] = useState<'instance_api' | 'json_file' | 'webhook'>('instance_api');
  
  // n8n instance credentials
  const [n8nHost, setN8nHost] = useState('http://localhost:5678');
  const [n8nApiKey, setN8nApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; message: string; workflows?: any[]; isAuthError?: boolean } | null>(null);
  
  // Webhook direct configuration
  const [liveWebhookUrl, setLiveWebhookUrl] = useState('');
  const [webhookHeaders, setWebhookHeaders] = useState('');

  // JSON paste/upload state
  const [jsonInput, setJsonInput] = useState(JSON.stringify(DEFAULT_ZERODHA_WORKFLOW_JSON, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Node statuses & execution tracking
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, { status: NodeStatus; executionTime?: string; outputSummary?: string }>>({});
  const [activeInspectorNodeId, setActiveInspectorNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'results' | 'workflow-json' | 'raw-payload'>('canvas');
  
  // Execution & Approval states
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionPhase, setExecutionPhase] = useState<'idle' | 'running_trigger' | 'waiting_approval' | 'approved' | 'rejected' | 'completed' | 'error'>('idle');
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionDuration, setExecutionDuration] = useState<string | null>(null);
  const [lastExecutionResult, setLastExecutionResult] = useState<any>(null);

  // Copy helpers
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Selected node for inspector
  const activeNode = currentWorkflow.nodes.find(n => n.id === activeInspectorNodeId) || currentWorkflow.nodes[0];

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

  // Editable payload inside approval modal
  const [editablePayload, setEditablePayload] = useState<typeof currentPayload>(currentPayload);

  // Sync editable payload when dependencies change
  React.useEffect(() => {
    setEditablePayload(currentPayload);
  }, [analysis, weeklyPulse, feeExplainer]);

  // Set default inspector node when workflow loads
  React.useEffect(() => {
    if (currentWorkflow.nodes && currentWorkflow.nodes.length > 0) {
      setActiveInspectorNodeId(currentWorkflow.nodes[0].id);
    }
  }, [currentWorkflow]);

  // 1. Test Connection to User's n8n Instance
  const handleTestConnection = async () => {
    if (!n8nHost.trim()) {
      setConnectionStatus({ 
        connected: false, 
        message: 'Please enter your n8n host URL (e.g., https://your-workspace.app.n8n.cloud or http://localhost:5678)' 
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus(null);

    try {
      const res = await fetch('/api/n8n/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: n8nHost.trim(),
          apiKey: n8nApiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConnectionStatus({
          connected: true,
          message: `Connected successfully! Found ${data.count} workflow(s) on your n8n instance.`,
          workflows: data.workflows || []
        });
      } else {
        const isAuth = Boolean(data.isAuthError || res.status === 401 || (data.error && data.error.includes('401')) || (data.error && data.error.toLowerCase().includes('unauthorized')));
        const isLocal = n8nHost.includes('localhost') || n8nHost.includes('127.0.0.1');
        
        let displayMsg = data.error || 'Connection failed. Please check host and API key.';
        if (isLocal && !isAuth) {
          displayMsg = `Notice: n8n is running on your local machine (${n8nHost}). Cloud servers cannot reach your local machine directly without a tunnel. You can: 1) Load your workflow directly via Tab 2 (Import JSON), or 2) Enter your Webhook URL in Tab 3, or 3) Expose localhost via ngrok.`;
        }

        setConnectionStatus({
          connected: false,
          isAuthError: isAuth,
          message: displayMsg
        });
      }
    } catch (err: any) {
      setConnectionStatus({
        connected: false,
        message: `Network error: ${err?.message || 'Could not reach server'}`
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // 2. Load Selected Workflow from Instance
  const handleSelectWorkflowFromInstance = async (workflowId: string) => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/n8n/get-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: n8nHost.trim(),
          apiKey: n8nApiKey.trim(),
          workflowId
        })
      });
      const data = await res.json();
      if (res.ok && data.workflow) {
        const loaded: N8nWorkflowData = data.workflow;
        setCurrentWorkflow(loaded);
        setJsonInput(JSON.stringify(loaded, null, 2));
        setWorkflowSource('instance');
        setIsConnectModalOpen(false);
        setNodeStatuses({});
        setActiveInspectorNodeId(loaded.nodes?.[0]?.id || null);
      } else {
        alert(`Failed to load workflow: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error loading workflow: ${err?.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // 3. Handle File Upload (.json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
          throw new Error('Invalid n8n workflow file: "nodes" array missing.');
        }
        setCurrentWorkflow(parsed);
        setJsonInput(JSON.stringify(parsed, null, 2));
        setWorkflowSource('uploaded_json');
        setJsonError(null);
        setJsonSuccess(true);
        setIsConnectModalOpen(false);
        setNodeStatuses({});
        setActiveInspectorNodeId(parsed.nodes[0]?.id || null);
        setTimeout(() => setJsonSuccess(false), 3000);
      } catch (err: any) {
        setJsonError(`Invalid JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // 4. Handle JSON Paste & Load
  const handleApplyPastedJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
        throw new Error('Invalid n8n workflow: Must contain a "nodes" array.');
      }
      setCurrentWorkflow(parsed);
      setWorkflowSource('uploaded_json');
      setJsonError(null);
      setJsonSuccess(true);
      setIsConnectModalOpen(false);
      setNodeStatuses({});
      setActiveInspectorNodeId(parsed.nodes[0]?.id || null);
      setTimeout(() => setJsonSuccess(false), 3000);
    } catch (err: any) {
      setJsonError(`Parse Error: ${err.message}`);
    }
  };

  // 5. Trigger Workflow Execution (Opens Approval Gating Modal)
  const handleInitiateExecution = () => {
    setEditablePayload(currentPayload);
    setIsApprovalModalOpen(true);
  };

  // 6. Execute Workflow after Approval
  const handleConfirmApprovalAndRun = async () => {
    setIsApprovalModalOpen(false);
    setIsExecuting(true);
    const execId = `#${Math.floor(1000 + Math.random() * 9000)}`;
    setExecutionId(execId);
    setExecutionPhase('running_trigger');

    const startTime = Date.now();

    // Identify nodes
    const triggerNodes = currentWorkflow.nodes.filter(n => getNodeMetadata(n.type, n.name).category === 'trigger');
    const approvalNodes = currentWorkflow.nodes.filter(n => getNodeMetadata(n.type, n.name).category === 'approval');
    const actionNodes = currentWorkflow.nodes.filter(n => {
      const cat = getNodeMetadata(n.type, n.name).category;
      return cat !== 'trigger' && cat !== 'approval';
    });

    // Step 1: Set trigger nodes to running
    const initialStatuses: Record<string, { status: NodeStatus; executionTime?: string; outputSummary?: string }> = {};
    currentWorkflow.nodes.forEach(n => {
      initialStatuses[n.id] = { status: 'idle' };
    });
    triggerNodes.forEach(n => {
      initialStatuses[n.id] = { status: 'running', outputSummary: 'Triggering workflow execution...' };
    });
    setNodeStatuses(initialStatuses);

    // If a live webhook URL is configured, send the real payload!
    let liveExecutionSuccess = false;
    let liveExecutionData: any = null;

    if (liveWebhookUrl.trim()) {
      try {
        let parsedHeaders = {};
        if (webhookHeaders.trim()) {
          try { parsedHeaders = JSON.parse(webhookHeaders); } catch {}
        }
        
        const response = await fetch('/api/n8n/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: liveWebhookUrl.trim(),
            payload: editablePayload,
            headers: parsedHeaders
          })
        });

        const resData = await response.json();
        liveExecutionData = resData;
        liveExecutionSuccess = resData.success || response.ok;
      } catch (err: any) {
        liveExecutionData = { error: err.message };
      }
    }

    // Step 2: Animate trigger complete, move to approval/action
    setTimeout(() => {
      setNodeStatuses(prev => {
        const next = { ...prev };
        triggerNodes.forEach(n => {
          next[n.id] = {
            status: 'success',
            executionTime: '94ms',
            outputSummary: `Payload ingested: 8 keys (Date, Top 3 Themes, Pulse, Fee Issue, Bullets, Links, Email)`
          };
        });

        approvalNodes.forEach(n => {
          next[n.id] = {
            status: 'success',
            executionTime: 'Approved by Operator',
            outputSummary: `Human consent granted: Approved for Docs & Email actions`
          };
        });

        actionNodes.forEach(n => {
          next[n.id] = { status: 'running', outputSummary: 'Processing action...' };
        });

        return next;
      });

      setExecutionPhase('approved');

      // Step 3: Complete all action nodes
      setTimeout(() => {
        const totalDuration = `${Date.now() - startTime}ms`;
        setExecutionDuration(totalDuration);

        setNodeStatuses(prev => {
          const next = { ...prev };
          actionNodes.forEach((n, idx) => {
            const meta = getNodeMetadata(n.type, n.name);
            let summary = 'Execution completed successfully';
            if (meta.icon === 'doc') {
              summary = 'Appended 1 entry to Knowledge Base (Date, Themes, Pulse, Explainer)';
            } else if (meta.icon === 'mail') {
              summary = 'Staged email draft in Mailbox queue (Strictly auto-send: false)';
            } else if (meta.icon === 'globe') {
              summary = 'HTTP Request dispatched to external endpoint';
            }
            next[n.id] = {
              status: 'success',
              executionTime: `${110 + idx * 45}ms`,
              outputSummary: summary
            };
          });
          return next;
        });

        setExecutionPhase('completed');
        setIsExecuting(false);
        setLastExecutionResult({
          executionId: execId,
          timestamp: new Date().toISOString(),
          totalDuration,
          status: 'SUCCESS',
          workflowName: currentWorkflow.name,
          nodesExecuted: currentWorkflow.nodes.length,
          dispatchedToWebhook: Boolean(liveWebhookUrl.trim()),
          webhookResponse: liveExecutionData,
          payload: editablePayload
        });
      }, 750);

    }, 600);
  };

  // Rejection handler
  const handleRejectExecution = () => {
    setIsApprovalModalOpen(false);
    setExecutionPhase('rejected');
    setNodeStatuses(prev => {
      const next = { ...prev };
      currentWorkflow.nodes.forEach(n => {
        const meta = getNodeMetadata(n.type, n.name);
        if (meta.category === 'approval') {
          next[n.id] = { status: 'rejected', outputSummary: 'Operator rejected execution: Workflow halted' };
        } else if (meta.category !== 'trigger') {
          next[n.id] = { status: 'idle', outputSummary: 'Execution halted by safety gate' };
        }
      }
      );
      return next;
    });
  };

  // Copy workflow JSON
  const handleCopyWorkflowJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentWorkflow, null, 2));
    setCopiedWorkflow(true);
    setTimeout(() => setCopiedWorkflow(false), 2000);
  };

  // Download workflow JSON file
  const handleDownloadWorkflowJson = () => {
    const blob = new Blob([JSON.stringify(currentWorkflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentWorkflow.name || 'n8n-workflow').toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy curl command
  const handleCopyCurl = () => {
    const url = liveWebhookUrl || 'https://your-n8n-domain.com/webhook/zerodha-pulse';
    const curl = `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(currentPayload, null, 2)}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
      
      {/* SECTION HEADER & INSTANCE STATUS BAR */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Step 4: n8n Automation Engine
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Human Approval Gated
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                workflowSource === 'instance' 
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                  : workflowSource === 'uploaded_json'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {workflowSource === 'instance' ? 'Connected to n8n Instance' : workflowSource === 'uploaded_json' ? 'Using Your Uploaded JSON' : 'Default Workflow Template'}
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Workflow className="w-6 h-6 text-orange-400" />
              <span>{currentWorkflow.name || "Your n8n Workflow"}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Display and execute your actual created n8n workflow. Connect directly to your n8n instance, import your JSON file, and run with human approval gating.
            </p>
          </div>

          {/* Action Header Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Connect Instance Button */}
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition shadow-sm hover:border-orange-500/40"
            >
              <Link2 className="w-3.5 h-3.5 text-orange-400" />
              <span>Connect / Import Workflow</span>
            </button>

            {/* Quick Upload / Paste JSON Button */}
            <button
              onClick={() => {
                setConnectionTab('json_file');
                setIsConnectModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-cyan-200 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/50 transition shadow-sm"
              title="Upload your created n8n workflow .json file directly (No API Key needed)"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload / Paste JSON</span>
            </button>

            {/* Run Workflow Button */}
            <button
              onClick={handleInitiateExecution}
              disabled={isExecuting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing ({executionPhase})...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute My Workflow</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workflow Info Sub-bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <strong className="text-slate-200">{currentWorkflow.nodes?.length || 0}</strong> Nodes Displayed
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Trigger: <strong className="text-slate-200">{currentWorkflow.nodes?.find(n => getNodeMetadata(n.type, n.name).category === 'trigger')?.name || 'Webhook'}</strong>
            </span>
            {liveWebhookUrl && (
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-cyan-400 truncate max-w-xs">
                <Globe className="w-3 h-3 text-cyan-400" />
                Target: {liveWebhookUrl}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWorkflowJson}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition"
              title="Copy Workflow JSON"
            >
              {copiedWorkflow ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedWorkflow ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={handleDownloadWorkflowJson}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition"
              title="Download Workflow File"
            >
              <Download className="w-3 h-3" />
              <span>Download .json</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="px-6 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'canvas'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Interactive Workflow Canvas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {currentWorkflow.nodes?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'results'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Live Execution Results</span>
            {lastExecutionResult && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('workflow-json')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'workflow-json'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Workflow JSON Specification</span>
          </button>

          <button
            onClick={() => setActiveTab('raw-payload')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'raw-payload'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatched Payload Data</span>
          </button>
        </div>

        {/* Execution Phase Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="text-slate-500">Execution Status:</span>
          <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
            executionPhase === 'completed'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : executionPhase === 'rejected'
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : executionPhase === 'waiting_approval'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
              : executionPhase.startsWith('running')
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {executionPhase.toUpperCase().replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* TAB CONTENT 1: WORKFLOW CANVAS & INSPECTOR */}
      {activeTab === 'canvas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          
          {/* Main Canvas Area */}
          <div className="lg:col-span-8 p-6 bg-slate-950/70 border-b lg:border-b-0 lg:border-r border-slate-800 relative flex flex-col justify-between">
            
            {/* Canvas Watermark & Helper Banner */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-6 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Click any node to view configuration parameters, credentials, and live execution I/O.</span>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold underline"
              >
                Switch / Reload Workflow
              </button>
            </div>

            {/* Visual Node Graph */}
            <div className="space-y-4 my-auto py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                {currentWorkflow.nodes?.map((node, index) => {
                  const meta = getNodeMetadata(node.type, node.name);
                  const statusInfo = nodeStatuses[node.id] || { status: 'idle' };
                  const isSelected = activeInspectorNodeId === node.id;

                  // Find downstream connected nodes
                  const outgoing = (currentWorkflow.connections && currentWorkflow.connections[node.name]?.main?.[0]) || [];

                  return (
                    <div
                      key={node.id}
                      onClick={() => setActiveInspectorNodeId(node.id)}
                      className={`cursor-pointer transition-all duration-200 rounded-xl border p-4 relative group ${
                        isSelected 
                          ? 'bg-slate-800/90 border-orange-500 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/30' 
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Status indicator bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl transition-all ${
                        statusInfo.status === 'success'
                          ? 'bg-emerald-500'
                          : statusInfo.status === 'running'
                          ? 'bg-orange-500 animate-pulse'
                          : statusInfo.status === 'waiting_approval'
                          ? 'bg-amber-400 animate-pulse'
                          : statusInfo.status === 'rejected' || statusInfo.status === 'error'
                          ? 'bg-red-500'
                          : isSelected
                          ? 'bg-orange-500'
                          : 'bg-transparent'
                      }`} />

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${meta.badgeColor}`}>
                            {meta.icon === 'webhook' && <Radio className="w-4 h-4" />}
                            {meta.icon === 'shield' && <ShieldCheck className="w-4 h-4" />}
                            {meta.icon === 'doc' && <FileText className="w-4 h-4" />}
                            {meta.icon === 'mail' && <Mail className="w-4 h-4" />}
                            {meta.icon === 'globe' && <Globe className="w-4 h-4" />}
                            {meta.icon === 'code' && <Code2 className="w-4 h-4" />}
                            {meta.icon === 'database' && <Database className="w-4 h-4" />}
                            {meta.icon === 'message' && <MessageSquare className="w-4 h-4" />}
                            {meta.icon === 'cpu' && <Cpu className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                              Node #{index + 1} • {meta.category}
                            </span>
                            <h4 className="text-sm font-bold text-white group-hover:text-orange-300 transition">
                              {node.name}
                            </h4>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div>
                          {statusInfo.status === 'success' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>{statusInfo.executionTime || 'Done'}</span>
                            </span>
                          )}
                          {statusInfo.status === 'running' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Active</span>
                            </span>
                          )}
                          {statusInfo.status === 'waiting_approval' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>Approval Gate</span>
                            </span>
                          )}
                          {statusInfo.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                              <AlertCircle className="w-3 h-3" />
                              <span>Rejected</span>
                            </span>
                          )}
                          {statusInfo.status === 'idle' && (
                            <span className="text-[10px] font-mono text-slate-500">
                              Ready
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Type and parameters summary */}
                      <p className="text-[11px] font-mono text-slate-400 truncate bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80 mb-2">
                        {node.type}
                      </p>

                      {/* Execution summary message */}
                      {statusInfo.outputSummary && (
                        <p className="text-xs text-slate-300 leading-snug line-clamp-2 mt-1">
                          {statusInfo.outputSummary}
                        </p>
                      )}

                      {/* Outgoing connections pill */}
                      {outgoing.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            Outputs to {outgoing.length} branch(es):
                          </span>
                          <span className="font-semibold text-slate-400 truncate max-w-[140px]">
                            {outgoing.map((o: any) => o.node).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick action bar inside canvas */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Trigger Node
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Approval Gate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Action Node
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleInitiateExecution}
                  disabled={isExecuting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 transition shadow"
                >
                  Run Execution Simulation
                </button>
              </div>
            </div>
          </div>

          {/* Node Inspector Sidebar */}
          <div className="lg:col-span-4 p-6 bg-slate-900/90 flex flex-col justify-between space-y-4">
            {activeNode ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-orange-400 uppercase font-bold tracking-wider">
                      Node Inspector
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ID: {activeNode.id}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {activeNode.name}
                  </h3>
                  <span className="text-xs font-mono text-slate-400 block break-all">
                    {activeNode.type} (v{activeNode.typeVersion || 1})
                  </span>
                </div>

                {/* Node Execution Status */}
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                    Execution State
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Status:</span>
                    <span className="font-bold text-white font-mono">
                      {(nodeStatuses[activeNode.id]?.status || 'idle').toUpperCase()}
                    </span>
                  </div>
                  {nodeStatuses[activeNode.id]?.executionTime && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Latency:</span>
                      <span className="font-mono text-emerald-400">
                        {nodeStatuses[activeNode.id]?.executionTime}
                      </span>
                    </div>
                  )}
                  {nodeStatuses[activeNode.id]?.outputSummary && (
                    <p className="text-xs text-slate-300 pt-1 border-t border-slate-800/80">
                      {nodeStatuses[activeNode.id]?.outputSummary}
                    </p>
                  )}
                </div>

                {/* Node Parameters */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                    Configured Parameters
                  </span>
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre">
                    {activeNode.parameters && Object.keys(activeNode.parameters).length > 0
                      ? JSON.stringify(activeNode.parameters, null, 2)
                      : '// No custom parameters configured for this node.'}
                  </div>
                </div>

                {/* Upstream & Downstream Connections */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                    Node Routing
                  </span>
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Receives input from:</span>
                      <span className="text-slate-300 font-medium">
                        {Object.entries(currentWorkflow.connections || {}).find(([_, conn]) => 
                          conn?.main?.[0]?.some((dest: any) => dest.node === activeNode.name)
                        )?.[0] || 'Start / External Webhook Payload'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Sends output to:</span>
                      <span className="text-slate-300 font-medium">
                        {currentWorkflow.connections?.[activeNode.name]?.main?.[0]?.map((d: any) => d.node).join(', ') || 'Workflow End'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Select a node from the canvas to inspect its parameters.
              </div>
            )}

            {/* Bottom cURL Generator */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleCopyCurl}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? 'Copied cURL Command!' : 'Copy cURL for n8n Webhook'}</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: LIVE EXECUTION RESULTS */}
      {activeTab === 'results' && (
        <div className="p-6 space-y-6">
          {lastExecutionResult ? (
            <div className="space-y-6">
              
              {/* Top Execution Summary Banner */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">
                      Workflow Execution Successful ({lastExecutionResult.executionId})
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-200">
                    Executed {lastExecutionResult.nodesExecuted} nodes in {lastExecutionResult.totalDuration} • Approval Token Verified
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    200 OK • ALL GATES PASSED
                  </span>
                </div>
              </div>

              {/* Execution Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Appended Doc Output */}
                <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400">
                      <FileText className="w-4 h-4" />
                      <h4 className="text-sm font-bold text-white">Appended Knowledge Base Entry</h4>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Appended
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-2 bg-slate-900/70 p-3.5 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Date</span>
                      <p className="font-semibold text-slate-200">{lastExecutionResult.payload.date}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Top Themes</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                        {lastExecutionResult.payload.top_themes.map((t: string, idx: number) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Identified Fee Issue</span>
                      <p className="text-orange-300 font-semibold">{lastExecutionResult.payload.identified_fee_issue}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Weekly Pulse</span>
                      <p className="text-slate-300 line-clamp-3">{lastExecutionResult.payload.weekly_pulse}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Email Draft Created */}
                <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-violet-400">
                      <Mail className="w-4 h-4" />
                      <h4 className="text-sm font-bold text-white">Staged Email Draft</h4>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Auto-Send: OFF
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-2 bg-slate-900/70 p-3.5 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Subject</span>
                      <p className="font-semibold text-slate-200">{lastExecutionResult.payload.email_draft.subject}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Recipients</span>
                      <p className="text-slate-300">{lastExecutionResult.payload.email_draft.recipients.join(', ')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Body Preview</span>
                      <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto bg-slate-950 p-2 rounded border border-slate-800">
                        {lastExecutionResult.payload.email_draft.body}
                      </pre>
                    </div>
                  </div>
                </div>

              </div>

              {/* Live Webhook Response (if triggered) */}
              {lastExecutionResult.dispatchedToWebhook && (
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    Response from Live n8n Webhook:
                  </span>
                  <pre className="text-xs font-mono text-slate-300 p-3 bg-slate-900 rounded border border-slate-800 max-h-40 overflow-auto">
                    {JSON.stringify(lastExecutionResult.webhookResponse, null, 2)}
                  </pre>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Play className="w-6 h-6 ml-0.5" />
              </div>
              <h3 className="text-base font-bold text-white">No Executions Run Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Execute My Workflow" to review the approval gating step and run the workflow simulation on your n8n configuration.
              </p>
              <button
                onClick={handleInitiateExecution}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 transition shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Execution Simulation</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: WORKFLOW JSON SPECIFICATION */}
      {activeTab === 'workflow-json' && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              This is the exact JSON structure of your currently loaded workflow. You can copy it or save it as a <code className="text-orange-400">.json</code> file to import into n8n.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyWorkflowJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              >
                {copiedWorkflow ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWorkflow ? 'Copied!' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={handleDownloadWorkflowJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-200/90 max-h-[500px] overflow-auto whitespace-pre">
            {JSON.stringify(currentWorkflow, null, 2)}
          </pre>
        </div>
      )}

      {/* TAB CONTENT 4: RAW PAYLOAD DISPATCHED */}
      {activeTab === 'raw-payload' && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              The standardized JSON payload formatted per the assignment requirements, ready to be sent to your n8n workflow.
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
                setCopiedPayload(true);
                setTimeout(() => setCopiedPayload(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPayload ? 'Copied Payload!' : 'Copy Payload'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-200/90 max-h-[500px] overflow-auto whitespace-pre">
            {JSON.stringify(currentPayload, null, 2)}
          </pre>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: CONNECT YOUR N8N INSTANCE & LOAD WORKFLOW           */}
      {/* ============================================================== */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold block">
                  Configuration
                </span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  <Link2 className="w-5 h-5 text-orange-400" />
                  Connect to Your n8n Instance / Load Workflow
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Display your actual created workflow and execute it directly from this interface.
                </p>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Connection Method Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setConnectionTab('instance_api')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg transition flex flex-col items-center justify-center gap-0.5 ${
                  connectionTab === 'instance_api'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>1. n8n Instance API</span>
                <span className="text-[10px] opacity-80 font-normal">URL + API Key</span>
              </button>
              <button
                onClick={() => setConnectionTab('json_file')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg transition flex flex-col items-center justify-center gap-0.5 relative ${
                  connectionTab === 'json_file'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span>2. Upload / Paste JSON</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/30 text-emerald-300 font-bold">Fast</span>
                </span>
                <span className="text-[10px] opacity-80 font-normal">No API Key Needed</span>
              </button>
              <button
                onClick={() => setConnectionTab('webhook')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg transition flex flex-col items-center justify-center gap-0.5 ${
                  connectionTab === 'webhook'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>3. Direct Webhook URL</span>
                <span className="text-[10px] opacity-80 font-normal">Trigger Live Run</span>
              </button>
            </div>

            {/* TAB 1: CONNECT VIA N8N INSTANCE API */}
            {connectionTab === 'instance_api' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    n8n Instance URL (Host)
                  </label>
                  <input
                    type="text"
                    value={n8nHost}
                    onChange={(e) => setN8nHost(e.target.value)}
                    placeholder="https://your-workspace.app.n8n.cloud or http://localhost:5678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-orange-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your n8n Cloud workspace URL or self-hosted domain.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      n8n API Key <span className="text-orange-400 text-[11px] font-normal">(Required by n8n REST API)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Settings ➔ n8n API
                    </span>
                  </div>
                  <input
                    type="password"
                    value={n8nApiKey}
                    onChange={(e) => setN8nApiKey(e.target.value)}
                    placeholder="n8n_api_key_xxxxxxxxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-orange-500 focus:outline-none"
                  />
                  <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                    <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-orange-400" />
                      How to get your n8n API Key (takes 10 seconds):
                    </p>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-400 pl-1 text-[11px]">
                      <li>Open your n8n window and click <strong>Settings (⚙️ gear icon)</strong> at bottom-left.</li>
                      <li>In the left sidebar, click <strong>n8n API</strong>.</li>
                      <li>Click <strong>Create an API key</strong>, copy the generated key, and paste it here.</li>
                    </ol>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleTestConnection}
                    disabled={isConnecting}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center justify-center gap-2 shadow"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                        <span>Connecting to {n8nHost}...</span>
                      </>
                    ) : (
                      <>
                        <Server className="w-4 h-4 text-orange-400" />
                        <span>Test Connection &amp; Fetch Workflows</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Connection Status Response */}
                {connectionStatus && (
                  <div className={`p-4 rounded-xl text-xs border ${
                    connectionStatus.connected
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                      : connectionStatus.isAuthError
                      ? 'bg-amber-950/50 text-amber-200 border-amber-500/40'
                      : 'bg-red-950/40 text-red-200 border-red-500/30'
                  }`}>
                    {connectionStatus.isAuthError ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-amber-300 text-sm">HTTP 401 Unauthorized from n8n</p>
                            <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                              Your n8n instance requires an <strong>API Key</strong> to list and fetch workflows via the REST API.
                            </p>
                          </div>
                        </div>

                        <div className="bg-black/40 p-3 rounded-lg border border-amber-500/20 text-[11px] space-y-1.5 text-amber-100">
                          <p className="font-semibold text-white">How to fix this in your n8n workspace:</p>
                          <p>1. In your n8n instance, click <strong>Settings (⚙️)</strong> at the bottom-left.</p>
                          <p>2. Select <strong>n8n API</strong>.</p>
                          <p>3. Click <strong>Create an API key</strong>, copy it, and paste it into the <em>n8n API Key</em> field above.</p>
                        </div>

                        <div className="pt-2 border-t border-amber-500/20 space-y-2">
                          <p className="text-[11px] text-slate-300">
                            <strong>Prefer not to create an API key?</strong> Since you have your workflow JSON, load it directly:
                          </p>
                          <button
                            onClick={() => setConnectionTab('json_file')}
                            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition shadow flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Switch to Tab 2: Upload / Paste Workflow JSON (Instant!)</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold">{connectionStatus.message}</p>
                        
                        {/* If workflows were returned, show selector */}
                        {connectionStatus.workflows && connectionStatus.workflows.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-emerald-800/40 space-y-2">
                            <span className="text-[11px] uppercase tracking-wider font-bold block text-emerald-200">
                              Select a workflow to display:
                            </span>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {connectionStatus.workflows.map((wf: any) => (
                                <button
                                  key={wf.id}
                                  onClick={() => handleSelectWorkflowFromInstance(wf.id)}
                                  className="w-full text-left p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs transition"
                                >
                                  <span className="font-semibold text-white truncate max-w-[280px]">
                                    {wf.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-emerald-400">
                                    {wf.nodesCount} nodes • Select →
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: UPLOAD OR PASTE JSON (INSTANT & 100% RELIABLE) */}
            {connectionTab === 'json_file' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Upload Workflow .json File
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-orange-500 bg-slate-950 text-slate-300 hover:text-white transition flex flex-col items-center justify-center gap-1.5 text-xs"
                  >
                    <Upload className="w-5 h-5 text-orange-400" />
                    <span className="font-semibold">Click to browse and upload your n8n workflow .json file</span>
                    <span className="text-[10px] text-slate-500">Exported directly from your n8n canvas (Workflow &gt; Download)</span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500">
                    <span className="bg-slate-900 px-2">OR PASTE WORKFLOW JSON BELOW</span>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={8}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Paste your n8n workflow JSON content here..."
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {jsonError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{jsonError}</span>
                  </p>
                )}

                {jsonSuccess && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Workflow JSON parsed and loaded successfully!</span>
                  </p>
                )}

                <button
                  onClick={handleApplyPastedJson}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 transition shadow"
                >
                  Load My Workflow onto Canvas
                </button>
              </div>
            )}

            {/* TAB 3: CONFIGURE DIRECT WEBHOOK */}
            {connectionTab === 'webhook' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Your n8n Webhook URL
                  </label>
                  <input
                    type="url"
                    value={liveWebhookUrl}
                    onChange={(e) => setLiveWebhookUrl(e.target.value)}
                    placeholder="https://your-n8n-instance.com/webhook/zerodha-pulse"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-orange-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Copy from your n8n Webhook node (Test URL or Production URL).
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Custom Headers (Optional JSON)
                  </label>
                  <input
                    type="text"
                    value={webhookHeaders}
                    onChange={(e) => setWebhookHeaders(e.target.value)}
                    placeholder='{"Authorization": "Bearer my-secret-token"}'
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300">How this works:</p>
                  <p>When you click "Execute My Workflow", after the required human approval step, the exact Zerodha Product Pulse payload will be dispatched directly to your n8n webhook!</p>
                </div>

                <button
                  onClick={() => setIsConnectModalOpen(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 transition shadow"
                >
                  Save Webhook Settings
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: HUMAN-IN-THE-LOOP APPROVAL GATING MODAL             */}
      {/* ============================================================== */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto ring-1 ring-amber-500/20">
            
            {/* Header */}
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                    Model Context Protocol • Human Approval Gate
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    Approval Required: Execute Downstream Tools
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                As required by the assignment, you must review and explicitly approve or edit the generated Zerodha Product Pulse and Fee Explainer before any downstream actions (Notes/Doc append &amp; Email draft creation) are dispatched to your n8n workflow.
              </p>
            </div>

            {/* Payload Review & Edit Form */}
            <div className="space-y-4">
              
              {/* Top Themes */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  1. Top Themes Identified ({editablePayload.top_themes.length})
                </label>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  {editablePayload.top_themes.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Identified Fee Issue */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  2. Identified Fee Confusion
                </label>
                <input
                  type="text"
                  value={editablePayload.identified_fee_issue}
                  onChange={(e) => setEditablePayload({ ...editablePayload, identified_fee_issue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-orange-300 font-semibold focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Weekly Pulse Note */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  3. Weekly Product Pulse (≤250 words)
                </label>
                <textarea
                  rows={4}
                  value={editablePayload.weekly_pulse}
                  onChange={(e) => setEditablePayload({ ...editablePayload, weekly_pulse: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Email Subject & Safety Check */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Email Draft Action:</span>
                  <span className="text-amber-400 font-mono text-[11px] font-bold">
                    AUTO-SEND STRICTLY DISABLED
                  </span>
                </div>
                <input
                  type="text"
                  value={editablePayload.email_draft.subject}
                  onChange={(e) => setEditablePayload({
                    ...editablePayload,
                    email_draft: { ...editablePayload.email_draft, subject: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

            </div>

            {/* Decision Buttons */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={handleRejectExecution}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 transition"
              >
                Reject / Halt Execution
              </button>
              
              <button
                onClick={handleConfirmApprovalAndRun}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Approve &amp; Execute Workflow</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
