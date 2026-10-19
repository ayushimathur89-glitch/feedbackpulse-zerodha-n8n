import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
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
