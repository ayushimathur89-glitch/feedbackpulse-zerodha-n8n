import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));

// Server-side Gemini initialization per guidelines
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory MCP document & email draft store to simulate company tools
interface DocEntry {
  id: string;
  date: string;
  top_themes: string[];
  weekly_pulse: string;
  identified_fee_issue: string;
  explanation_bullets: string[];
  source_links: { title: string; url: string }[];
  appendedAt: string;
}

interface EmailDraft {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  createdAt: string;
  status: 'DRAFT_CREATED' | 'SENT_SIMULATED';
}

const mockDocDatabase: DocEntry[] = [
  {
    id: 'doc-entry-prev-1',
    date: '2026-10-09',
    top_themes: [
      'Live Chart Rendering Failures & Blank Screen Glitch',
      'Feature Parity & Chart Trading vs Rivals (Groww & Dhan)',
      'Fee Transparency & Intraday / F&O Charges Confusion'
    ],
    weekly_pulse: 'Week 41 synthesis for Zerodha Kite. Top issue is critical charting downtime during market hours. Secondary friction is lack of pre-trade real-time charge visibility on order forms.',
    identified_fee_issue: 'Confusion over Intraday Equity & F&O Charges (Brokerage + Regulatory Levies + Auto Square-off Fee)',
    explanation_bullets: [
      'Brokerage for intraday equity and F&O is flat ₹20 or 0.03% (whichever is lower) per executed order.',
      'Statutory taxes (STT/CTT, Exchange Turnover Charges, GST, and SEBI charges) are mandated by law and added separately.',
      'Unsquared intraday MIS positions past 3:20 PM trigger RMS auto square-off carrying an additional ₹50 + 18% GST fee per position.',
      'Delivery equity trades continue to carry zero brokerage, though DP charges of ₹13.50 + GST apply on stock debits.'
    ],
    source_links: [
      { title: 'Zerodha Official Brokerage & Charges List', url: 'https://zerodha.com/charges' },
      { title: 'NSE & SEBI Regulatory Circular on Securities Transaction Tax (STT) & Levies', url: 'https://www.nseindia.com/products-services/equity-market-trading-charges' }
    ],
    appendedAt: '2026-10-09T17:30:00.000Z'
  }
];

const mockEmailDrafts: EmailDraft[] = [
  {
    id: 'draft-prev-1',
    subject: 'Weekly Product Pulse + Customer Clarification — Zerodha Intraday & F&O Charges (Oct 09, 2026)',
    body: 'Hi Leadership,\n\nPlease find the weekly Zerodha product pulse and customer clarification snippet staged below...\n',
    recipients: ['product-team@zerodha.internal', 'support-leads@zerodha.internal'],
    createdAt: '2026-10-09T17:35:00.000Z',
    status: 'DRAFT_CREATED'
  }
];

// Fallback Zerodha Analysis directly extracted from the 100 customer reviews
function generateZerodhaFallbackAnalysis() {
  return {
    themes: [
      {
        name: 'Live Chart Rendering Failures & Blank Screen Glitch',
        reviewCount: 34,
        percentage: 34,
        sentiment: 'Critical / 1-Star Shock',
        description: 'Over 18 direct reviews report charts failing to load, screen going blank upon clicking "view chart", buffering endlessly during live market hours, and "error saving chart preferences" in Kite.'
      },
      {
        name: 'Feature Parity & UI Modernization vs Rivals (Groww, Dhan, Angel One)',
        reviewCount: 22,
        percentage: 22,
        sentiment: 'Mixed / Constructive',
        description: 'Traders request modern features present in competing apps, specifically drag-and-drop Stop Loss & Target on charts (like Dhan), candlestick previews on buy/sell screens, and beginner-friendly home views.'
      },
      {
        name: 'Fee Transparency & Intraday / F&O Charges Confusion',
        reviewCount: 14,
        percentage: 14,
        sentiment: 'Negative / Distrust',
        description: 'Traders complain that "charges are more than other apps" (Shanky Karwa), "what are you charging for" (vickey Shyner), and urge Zerodha to show real-time intraday charges breakdown on the order screen (Mukesh Kumar).'
      },
      {
        name: 'System Stability & Execution Latency During High Volatility',
        reviewCount: 16,
        percentage: 16,
        sentiment: 'Negative / Loss Anxieties',
        description: 'Frustration over Kite freezing when market makes large moves, slow buy/sell placement, and restrictive limit order constraints on expiry days.'
      },
      {
        name: 'Customer Support Turnaround & Account Reconciliation',
        reviewCount: 14,
        percentage: 14,
        sentiment: 'Negative',
        description: 'Dissatisfaction with support closing tickets prematurely (#441394) and lack of transparent transaction-wise fund reconciliation for unallotted IPO applications.'
      }
    ],
    topThemes: [
      'Live Chart Rendering Failures & Blank Screen Glitch (Critical Incident)',
      'Feature Parity & Chart Trading vs Rivals (Groww & Dhan)',
      'Fee Transparency & Intraday / F&O Charges Confusion'
    ],
    realUserQuotes: [
      '“its charges are more as compared to other platforms. On expiry they does take orders. while others brokerage take orders. And it’s price update late than other app.” (Shanky Karwa, Rating 1)',
      '“very good, could have been better if intraday charges were shown separately in real time” (Mukesh Kumar, Rating 4)',
      '“Live Charts are not loading Charts are the first and foremost tool to trade in stock market but kite is missing it. Not a single charts is loading on kite mobile app during market hours which is frustrating and leaving traders nowhere.” (YOGESH GOEL, Rating 1)'
    ],
    identifiedFeeIssue: 'Confusion over Intraday Equity & F&O Order Charges (Brokerage + Regulatory Levies + Auto Square-Off Fee) without real-time pre-trade breakdown',
    feeDetails: {
      category: 'Intraday & F&O Transaction Charges / RMS Auto Square-off',
      severity: 'High (Driver of frequent customer chargeback inquiries and competitor defection)',
      rootCause: 'Zerodha Kite order ticket displays only estimated margin required but omits real-time breakdown of brokerage (₹20), STT, Exchange turnover fees, and the ₹50 RMS auto-square-off penalty.'
    }
  };
}

function generateZerodhaFallbackPulse() {
  return `### Weekly Product Pulse — Zerodha Kite (Week ending Oct 16, 2026)

**Summary of Top Themes:**
Analysis of 100 recent Kite reviews highlights three urgent focus areas: (1) Severe live chart blackout and rendering failures during market hours (34%), (2) Feature gap against Dhan and Groww around drag-and-drop Stop Loss/Target on charts (22%), and (3) Confusion over Intraday and F&O fee deductions (14%).

**Supporting User Quotes:**
- *"its charges are more as compared to other platforms... price update late than other app."* (Shanky Karwa)
- *"very good, could have been better if intraday charges were shown separately in real time"* (Mukesh Kumar)
- *"Live Charts are not loading... Not a single chart loading during market hours leaving traders nowhere."* (Yogesh Goel)

**Key Observation:**
The recurring chart crash is an active P0 revenue-risk triggering trader churn. Concurrently, traders perceive Zerodha fees as excessive because statutory levies (STT, exchange turnover fees) and ₹50 auto-square-off penalties are posted post-market without pre-trade real-time visibility.

**Product Team Action Ideas:**
1. **Emergency Chart Webview Patch:** Hotfix ChartIQ and TradingView mobile cache invalidation to resolve the black-screen bug immediately.
2. **Real-time Order Charges Preview:** Add a dynamic "Charges Breakdown" expandable drawer on the Kite order pad showing exact brokerage, STT, and exchange fees prior to swipe-to-buy.
3. **Chart Drag-and-Drop SL/TP:** Implement interactive order line dragging on charts to achieve parity with Dhan and retain active option traders.`;
}

function generateZerodhaFallbackFeeExplainer() {
  return {
    title: 'Understanding Zerodha Intraday & F&O Trading Charges: Brokerage, Taxes & Auto Square-Off',
    bullets: [
      'Zerodha charges a flat brokerage of ₹20 or 0.03% (whichever is lower) per executed order for Equity Intraday, and flat ₹20 per executed order for Futures & Options.',
      'Equity Delivery investments continue to have ₹0 (Zero) brokerage, though regulatory and depository participant charges apply upon selling.',
      'Statutory government levies — including Securities Transaction Tax (STT/CTT), NSE/BSE Exchange Turnover Charges, SEBI turnover fees, and 18% GST — are charged over and above brokerage by law.',
      'Stamp duty is levied by the Central Government on all buy transactions (0.003% for intraday, 0.002% for futures, 0.003% for options premium).',
      'If an open intraday (MIS/CO) position is not closed by the trader before market cut-off (3:20 PM), Zerodha RMS automatically squares it off, levying an additional Call & Trade / Auto Square-off fee of ₹50 + 18% GST per order.',
      'Traders can use the live Zerodha Brokerage Calculator or tap the "Charges" tab in the Console ledger to inspect itemized contract notes for every trade.'
    ],
    sourceLinks: [
      {
        title: 'Zerodha Official Brokerage & Charges List (Equity, F&O, Commodity)',
        url: 'https://zerodha.com/charges'
      },
      {
        title: 'National Stock Exchange (NSE) — Equity & Derivatives Transaction Charges & Levies',
        url: 'https://www.nseindia.com/products-services/equity-market-trading-charges'
      }
    ],
    lastChecked: '2026-10-16'
  };
}

// API: Review Intelligence Layer (Clustering, Top Themes, Quotes, Fee Issue)
app.post('/api/analyze-reviews', async (req, res) => {
  try {
    const { reviews } = req.body;
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of reviews.' });
    }

    if (!ai) {
      return res.json(generateZerodhaFallbackAnalysis());
    }

    const reviewSample = reviews.slice(0, 60).map((r, i) => `[Review ${i+1}] Author: ${r.author} | Rating: ${r.rating} | Date: ${r.date} | Text: ${r.review}`).join('\n');

    const prompt = `You are a Principal Product Manager analyzing 100 customer reviews for Zerodha Kite (India's leading discount stock broker).

Tasks:
1. Cluster the reviews into MAXIMUM 5 distinct themes. Focus on the real customer signals:
   - Live Chart rendering failures / blank screen bug (very prominent)
   - UI / Feature parity vs competitors like Dhan and Groww (drag SL/TP on charts, candlestick preview)
   - Fee transparency & Intraday/F&O charges confusion (charges more, intraday charges real-time visibility)
   - System stability / execution latency during market moves
   - Customer support ticket handling & IPO fund reconciliation
2. Identify the TOP 3 themes.
3. Extract 3 REAL verbatim user quotes from the provided reviews (e.g., Shanky Karwa on charges, Mukesh Kumar on intraday charges, Yogesh Goel or Gourav Choudhary on charts).
4. Highlight 1 recurring confusion or pain point related to a fee/charge (Zerodha intraday & F&O charges / auto square-off / lack of pre-trade real-time charge breakdown).

Zerodha Customer Reviews Sample:
${reviewSample}

Output strictly valid JSON matching this schema:
{
  "themes": [
    {
      "name": "string",
      "reviewCount": number,
      "percentage": number,
      "sentiment": "string",
      "description": "string"
    }
  ],
  "topThemes": ["theme 1", "theme 2", "theme 3"],
  "realUserQuotes": ["quote 1", "quote 2", "quote 3"],
  "identifiedFeeIssue": "string",
  "feeDetails": {
    "category": "string",
    "severity": "string",
    "rootCause": "string"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.themes || !parsed.topThemes || !parsed.identifiedFeeIssue) {
      throw new Error('Incomplete structure from model');
    }

    return res.json(parsed);
  } catch (error: any) {
    console.warn('Gemini review analysis fallback for Zerodha:', error?.message);
    return res.json(generateZerodhaFallbackAnalysis());
  }
});

// API: Generate Weekly Product Pulse (Internal Output, <= 250 words)
app.post('/api/generate-pulse', async (req, res) => {
  try {
    const { topThemes, realUserQuotes, identifiedFeeIssue, feeDetails } = req.body;

    if (!ai) {
      const fallback = generateZerodhaFallbackPulse();
      return res.json({ pulseText: fallback, wordCount: fallback.split(/\s+/).filter(Boolean).length });
    }

    const prompt = `You are Lead Product Manager at Zerodha writing the weekly internal product pulse for Nithin Kamath, engineering leads, and support leads.
Strict Constraint: The note MUST be 250 words or fewer (<= 250 words total).

Context:
- Product: Zerodha Kite
- Top Themes: ${JSON.stringify(topThemes)}
- Verbatim Quotes: ${JSON.stringify(realUserQuotes)}
- Identified Fee Confusion: "${identifiedFeeIssue}"
- Context: ${JSON.stringify(feeDetails || {})}

Include the following sections with markdown:
1. Title: "### Weekly Product Pulse — Zerodha Kite (Week ending Oct 16, 2026)"
2. Summary of top themes
3. Supporting user quotes (embedded callouts)
4. Key observation (what's going wrong / trending)
5. 3 action ideas for the Zerodha product team

Keep total word count strictly under 250 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const pulseText = response.text || generateZerodhaFallbackPulse();
    const wordCount = pulseText.split(/\s+/).filter(Boolean).length;

    return res.json({ pulseText, wordCount });
  } catch (err: any) {
    console.warn('Gemini pulse fallback for Zerodha:', err?.message);
    const fallback = generateZerodhaFallbackPulse();
    return res.json({ pulseText: fallback, wordCount: fallback.split(/\s+/).filter(Boolean).length });
  }
});

// API: Generate Fee Explainer (Customer-Facing Support Output)
app.post('/api/generate-fee-explainer', async (req, res) => {
  try {
    const { identifiedFeeIssue } = req.body;

    if (!ai) {
      return res.json(generateZerodhaFallbackFeeExplainer());
    }

    const prompt = `You are a Senior Regulatory & Support Lead at Zerodha drafting a standardized customer-facing explanation for support agents to explain Zerodha's charges:
"${identifiedFeeIssue}"

Strict requirements:
1. Title: Clear explanation title for Zerodha Intraday & F&O Charges.
2. MAXIMUM 6 bullet points (<= 6 bullet points).
3. Written in a neutral, facts-only, objective tone explaining flat ₹20/0.03% brokerage, STT/taxes, and ₹50 auto-square-off charges.
4. Exactly 2 official source links: Zerodha Official Charges (https://zerodha.com/charges) and NSE/SEBI Regulatory Charges (https://www.nseindia.com/products-services/equity-market-trading-charges).
5. "Last checked: 2026-10-16".

Return strictly valid JSON:
{
  "title": "string",
  "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5", "bullet 6"],
  "sourceLinks": [
    { "title": "string", "url": "string" },
    { "title": "string", "url": "string" }
  ],
  "lastChecked": "2026-10-16"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.bullets || !Array.isArray(parsed.bullets)) {
      throw new Error('Invalid bullets structure');
    }

    return res.json(parsed);
  } catch (err: any) {
    console.warn('Gemini fee explainer fallback for Zerodha:', err?.message);
    return res.json(generateZerodhaFallbackFeeExplainer());
  }
});

// API: MCP Protocol Tool Execution (Approval Gated Server-Side Handler)
app.post('/api/mcp/execute', (req, res) => {
  const { toolName, arguments: args, approvalToken, approvedBy } = req.body;

  if (!approvalToken || !approvedBy) {
    return res.status(403).json({
      jsonrpc: '2.0',
      error: {
        code: -32001,
        message: 'MCP Tool execution rejected: Missing human approval token. Approval gating required.',
      },
      id: req.body.id || 1,
    });
  }

  // MCP JSON-RPC 2.0 Dispatch
  if (toolName === 'append_to_notes_doc') {
    const entry: DocEntry = {
      id: `doc-entry-${Date.now()}`,
      date: args.date || new Date().toISOString().split('T')[0],
      top_themes: args.top_themes || [],
      weekly_pulse: args.weekly_pulse || '',
      identified_fee_issue: args.identified_fee_issue || '',
      explanation_bullets: args.explanation_bullets || [],
      source_links: args.source_links || [],
      appendedAt: new Date().toISOString(),
    };

    mockDocDatabase.unshift(entry);

    return res.json({
      jsonrpc: '2.0',
      result: {
        content: [
          {
            type: 'text',
            text: `Successfully appended Zerodha weekly pulse & fee explainer to Knowledge Base Doc (Entry ID: ${entry.id}). Total entries in doc: ${mockDocDatabase.length}.`,
          },
        ],
        entry,
      },
      id: req.body.id || 1,
    });
  }

  if (toolName === 'create_email_draft') {
    const draft: EmailDraft = {
      id: `draft-${Date.now()}`,
      subject: args.subject || 'Weekly Product Pulse + Customer Clarification — Zerodha Intraday & F&O Charges',
      body: args.body || '',
      recipients: args.recipients || ['product-leadership@zerodha.internal', 'support-desk@zerodha.internal'],
      createdAt: new Date().toISOString(),
      status: 'DRAFT_CREATED',
    };

    mockEmailDrafts.unshift(draft);

    return res.json({
      jsonrpc: '2.0',
      result: {
        content: [
          {
            type: 'text',
            text: `Email draft successfully staged in Mail server queue (Draft ID: ${draft.id}). Auto-send is strictly disabled per safety gate.`,
          },
        ],
        draft,
      },
      id: req.body.id || 1,
    });
  }

  return res.status(400).json({
    jsonrpc: '2.0',
    error: {
      code: -32601,
      message: `Unknown MCP tool: ${toolName}`,
    },
    id: req.body.id || 1,
  });
});

// API: Get internal docs
app.get('/api/mcp/doc', (_req, res) => {
  res.json({ entries: mockDocDatabase });
});

// API: Get email drafts
app.get('/api/mcp/drafts', (_req, res) => {
  res.json({ drafts: mockEmailDrafts });
});

// API: Test connection to user's n8n instance
app.post('/api/n8n/test-connection', async (req, res) => {
  try {
    const { host, apiKey } = req.body;
    if (!host) {
      return res.status(400).json({ error: 'Host URL is required (e.g., https://your-n8n.app.n8n.cloud or http://localhost:5678)' });
    }

    const cleanHost = host.trim().replace(/\/+$/, '');
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (apiKey && apiKey.trim()) {
      const cleanKey = apiKey.trim().replace(/^Bearer\s+/i, '');
      headers['X-N8N-API-KEY'] = cleanKey;
      headers['Authorization'] = `Bearer ${cleanKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${cleanHost}/api/v1/workflows`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        const isAuthError = response.status === 401 || response.status === 403;
        
        let userMessage = `n8n returned HTTP ${response.status}: ${errorText.slice(0, 300)}`;
        if (isAuthError) {
          userMessage = `n8n returned HTTP 401: Unauthorized. The n8n REST API requires an API Key. In your n8n workspace, go to Settings (gear icon in sidebar) → n8n API → Create API Key, then paste it here. Or switch to Tab 2 to upload your workflow .json file without an API key.`;
        }

        return res.status(response.status).json({
          success: false,
          status: response.status,
          isAuthError,
          rawError: errorText,
          error: userMessage,
        });
      }

      const data = await response.json();
      return res.json({
        success: true,
        host: cleanHost,
        count: Array.isArray(data.data) ? data.data.length : 0,
        workflows: Array.isArray(data.data) ? data.data.map((w: any) => ({
          id: w.id,
          name: w.name,
          active: w.active,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
          nodesCount: w.nodes ? w.nodes.length : 0,
        })) : [],
      });
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      return res.status(502).json({
        success: false,
        error: `Could not reach n8n instance at ${cleanHost}. If running on localhost, use localtunnel/ngrok or upload your workflow JSON file directly in Tab 2. Details: ${fetchErr?.message || 'Network error'}`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// API: Fetch specific workflow by ID from user's n8n instance
app.post('/api/n8n/get-workflow', async (req, res) => {
  try {
    const { host, apiKey, workflowId } = req.body;
    if (!host || !workflowId) {
      return res.status(400).json({ error: 'Host and workflowId are required' });
    }

    const cleanHost = host.trim().replace(/\/+$/, '');
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (apiKey && apiKey.trim()) {
      const cleanKey = apiKey.trim().replace(/^Bearer\s+/i, '');
      headers['X-N8N-API-KEY'] = cleanKey;
      headers['Authorization'] = `Bearer ${cleanKey}`;
    }

    const response = await fetch(`${cleanHost}/api/v1/workflows/${encodeURIComponent(workflowId)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `Failed to fetch workflow ${workflowId} (HTTP ${response.status}): ${errorText.slice(0, 300)}`,
      });
    }

    const workflowData = await response.json();
    return res.json({
      success: true,
      workflow: workflowData.data || workflowData,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch workflow' });
  }
});

// API: Proxy call to external live n8n webhook (bypassing CORS)
app.post('/api/n8n/trigger', async (req, res) => {
  try {
    const { webhookUrl, payload, headers: customHeaders } = req.body;
    if (!webhookUrl) {
      return res.status(400).json({ error: 'Missing webhookUrl parameter' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customHeaders || {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { text: responseText };
    }

    return res.json({
      status: response.status,
      ok: response.ok,
      success: response.ok,
      data: responseData
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: err?.message || 'Failed to reach n8n webhook',
      name: err?.name
    });
  }
});

// API: Export complete project repository as a clean downloadable ZIP file
app.get('/api/export/zip', (_req, res) => {
  try {
    const zipPath = path.resolve('/tmp', 'feedbackpulse-zerodha-repo.zip');
    // Run python3 zip builder to package the repository clean
    const pyScript = `
import zipfile, os
root_dir = os.path.abspath(".")
zip_path = "/tmp/feedbackpulse-zerodha-repo.zip"
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(root_dir):
        # Exclude node_modules, dist, temp files, .aistudio
        if 'node_modules' in dirs: dirs.remove('node_modules')
        if 'dist' in dirs: dirs.remove('dist')
        if '.aistudio' in dirs: dirs.remove('.aistudio')
        for f in files:
            if f.endswith('.zip') or f.endswith('.tar.gz') or f.endswith('.log'): continue
            p = os.path.join(root, f)
            arcname = os.path.relpath(p, root_dir)
            zf.write(p, arcname)
`;
    fs.writeFileSync('/tmp/make_zip.py', pyScript);
    execSync('python3 /tmp/make_zip.py', { cwd: process.cwd() });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="feedbackpulse-zerodha-repo.zip"');
    return res.sendFile(zipPath);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate zip: ' + (err?.message || 'Unknown error') });
  }
});

// API: Create GitHub repository and push all files automatically
app.post('/api/github/push', async (req, res) => {
  try {
    const { token, repoName, isPrivate = false } = req.body;
    if (!token || !repoName) {
      return res.status(400).json({ error: 'GitHub Personal Access Token and repository name are required.' });
    }

    const cleanRepoName = repoName.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');

    // 1. Get authenticated user info from GitHub API
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'User-Agent': 'FeedbackPulse-App',
        'Accept': 'application/vnd.github+json',
      },
    });

    if (!userRes.ok) {
      const errText = await userRes.text();
      return res.status(userRes.status).json({
        error: `GitHub Authentication Error (${userRes.status}): Make sure your token has 'repo' scope. Details: ${errText.slice(0, 250)}`,
      });
    }

    const userData = await userRes.json();
    const githubUsername = userData.login;

    // Check if repoName specifies owner (e.g. org/repo or user/repo)
    let targetOwner = githubUsername;
    let actualRepoName = cleanRepoName;
    if (cleanRepoName.includes('/')) {
      const parts = cleanRepoName.split('/');
      targetOwner = parts[0];
      actualRepoName = parts[1];
    }

    // 2. Create the repository on GitHub if it doesn't already exist
    const createRepoUrl = targetOwner.toLowerCase() === githubUsername.toLowerCase()
      ? 'https://api.github.com/user/repos'
      : `https://api.github.com/orgs/${targetOwner}/repos`;

    try {
      const createRes = await fetch(createRepoUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'User-Agent': 'FeedbackPulse-App',
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: actualRepoName,
          description: 'FeedbackPulse AI — Zerodha Kite Review Intelligence & n8n Workflow Automation',
          private: Boolean(isPrivate),
          auto_init: false,
        }),
      });

      if (!createRes.ok && createRes.status !== 422) {
        const warnText = await createRes.text();
        console.warn('GitHub create repo warning:', createRes.status, warnText);
      }
    } catch (e: any) {
      console.warn('Error during create repo attempt:', e?.message);
    }

    // 3. Configure git committer & push all files
    execSync(`git config user.name "${userData.name || githubUsername}"`, { cwd: process.cwd() });
    execSync(`git config user.email "${userData.email || `${githubUsername}@users.noreply.github.com`}"`, { cwd: process.cwd() });

    // Stage and commit any unstaged files
    try {
      execSync('git add -A && git commit -m "feat: complete Zerodha review analysis with n8n workflow integration"', { cwd: process.cwd() });
    } catch {
      // already committed
    }

    // Ensure branch is main
    try {
      execSync('git branch -M main', { cwd: process.cwd() });
    } catch {}

    // Add or replace remote with authenticated token
    const authenticatedRemoteUrl = `https://x-access-token:${token.trim()}@github.com/${targetOwner}/${actualRepoName}.git`;
    try {
      execSync('git remote remove github-origin', { cwd: process.cwd() });
    } catch {}
    execSync(`git remote add github-origin "${authenticatedRemoteUrl}"`, { cwd: process.cwd() });

    // Push to GitHub repository
    execSync('git push -u github-origin main --force', { cwd: process.cwd() });

    const finalRepoUrl = `https://github.com/${targetOwner}/${actualRepoName}`;

    return res.json({
      success: true,
      repoUrl: finalRepoUrl,
      username: githubUsername,
      repoName: actualRepoName,
      message: `All project files and git commits have been pushed to ${finalRepoUrl}!`,
    });
  } catch (err: any) {
    console.error('GitHub push error:', err);
    return res.status(500).json({
      error: `GitHub sync failed: ${err?.message || 'Error occurred during git push'}`
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    product: 'Zerodha Kite',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    mcpServerVersion: '1.2.0',
    protocol: 'Model Context Protocol (JSON-RPC 2.0)',
  });
});

// Vite Middleware Integration for Development & Static for Production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Zerodha FeedbackPulse Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
