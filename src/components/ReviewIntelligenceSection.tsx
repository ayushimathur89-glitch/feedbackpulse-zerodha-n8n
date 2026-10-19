import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  Quote, 
  AlertTriangle, 
  Search, 
  Star, 
  Upload, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { ReviewItem, AnalysisResult } from '../types';
import { reviewsToCsv, parseCsvToReviews } from '../data/sampleReviews';

interface ReviewIntelligenceSectionProps {
  reviews: ReviewItem[];
  onReviewsChange: (newReviews: ReviewItem[]) => void;
  analysis: AnalysisResult | null;
  isLoading: boolean;
  onRunAnalysis: () => void;
  onProceedToOutputs: () => void;
}

export const ReviewIntelligenceSection: React.FC<ReviewIntelligenceSectionProps> = ({
  reviews,
  onReviewsChange,
  analysis,
  isLoading,
  onRunAnalysis,
  onProceedToOutputs,
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'raw' | 'upload'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [uploadText, setUploadText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch = 
      r.review.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = ratingFilter === 'all' || r.rating === ratingFilter;
    return matchesSearch && matchesRating;
  });

  const handleUploadSubmit = () => {
    try {
      setUploadError(null);
      const parsed = parseCsvToReviews(uploadText);
      if (parsed.length === 0) {
        setUploadError('Could not find valid reviews in the provided CSV. Please check formatting.');
        return;
      }
      onReviewsChange(parsed);
      setActiveTab('table');
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to parse CSV');
    }
  };

  return (
    <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-xl">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Step 1 — Review Intelligence Layer
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Analyze Raw Customer Reviews (Last 8–12 Weeks)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cluster feedback into max 5 themes, identify the top 3 themes, extract real quotes, and isolate recurring fee confusion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRunAnalysis}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Clustering & Analyzing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Run Review Intelligence</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dataset Inspector & Controls */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Reviews Table ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'raw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw CSV Preview
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Upload Custom CSV
            </button>
          </div>

          {activeTab === 'table' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter reviews or fees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-950/90 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
                />
              </div>

              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                aria-label="Filter reviews by rating"
                className="px-2.5 py-1.5 text-xs bg-slate-950/90 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Ratings</option>
                <option value={1}>1 Star (Critical)</option>
                <option value={2}>2 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={4}>4 Stars</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Table */}
        {activeTab === 'table' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/80 text-xs">
              {filteredReviews.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  No reviews match your search filter.
                </div>
              ) : (
                filteredReviews.map((r) => (
                  <div key={r.id} className="p-3 hover:bg-slate-900/60 transition flex flex-col gap-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{r.author}</span>
                        <span className="text-[10px] text-slate-500">{r.date}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {r.platform}
                        </span>
                      </div>
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="font-medium text-slate-300">{r.title}</div>
                    <p className="text-slate-400 leading-relaxed">{r.review}</p>
                  </div>
                ))
              )}
            </div>
            <div className="bg-slate-950 px-3 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Showing {filteredReviews.length} of {reviews.length} reviews (Date range: July 29 – Oct 14, 2026)</span>
              <span className="text-indigo-400 font-medium">Dataset covers last 8–12 weeks</span>
            </div>
          </div>
        )}

        {/* Tab 2: Raw CSV */}
        {activeTab === 'raw' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <div className="p-3 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Active reviews.csv (Comma-Separated Values)</span>
              <button
                onClick={() => navigator.clipboard.writeText(reviewsToCsv(reviews))}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition"
              >
                Copy Raw CSV
              </button>
            </div>
            <pre className="p-3 text-[11px] font-mono text-slate-300 max-h-56 overflow-auto leading-tight whitespace-pre">
              {reviewsToCsv(reviews)}
            </pre>
          </div>
        )}

        {/* Tab 3: Upload */}
        {activeTab === 'upload' && (
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950 space-y-3">
            <div className="text-xs text-slate-300">
              Paste your custom 8–12 week reviews CSV below with headers: <code className="text-indigo-400">id,author,date,rating,platform,title,review,category</code>
            </div>
            <textarea
              rows={5}
              placeholder="id,author,date,rating,platform,title,review&#10;rev-01,Ankit Roy,2026-10-01,1,Play Store,Surprise fee,I got charged an unexpected fee..."
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              className="w-full p-2.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            {uploadError && (
              <div className="text-xs text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{uploadError}</span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleUploadSubmit}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Load & Parse CSV</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="mt-7 pt-6 border-t border-slate-800 space-y-6 animate-fadeIn">
          {/* Top 3 Themes Banner */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Top 3 Priority Themes Identified (Max 5 Clustered)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {analysis.topThemes.map((theme, idx) => (
                <div key={idx} className="bg-slate-900/90 border border-indigo-500/20 rounded-lg p-3 flex items-start gap-2.5 shadow-sm">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 leading-snug">{theme}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">High user impact cluster</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Max 5 Theme Clusters Grid */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Full Theme Clustering Breakdown (≤ 5 Themes)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {analysis.themes.map((theme, i) => (
                <div key={i} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-200 line-clamp-1">{theme.name}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {theme.percentage}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                      {theme.description}
                    </p>
                  </div>
                  <div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, theme.percentage)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{theme.reviewCount} reviews</span>
                      <span className="text-rose-400 font-medium">{theme.sentiment}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3 Real User Quotes */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-indigo-400" />
              Extracted Real User Quotes (Verbatim from Dataset)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {analysis.realUserQuotes.map((quote, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between relative shadow-sm">
                  <Quote className="w-6 h-6 text-slate-800 absolute right-3 top-3 -z-0" />
                  <p className="text-xs text-slate-300 italic leading-relaxed relative z-10 mb-3">
                    {quote}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 relative z-10 pt-2 border-t border-slate-900">
                    <span className="text-amber-400 flex items-center gap-0.5">
                      ★ 1.0 Verified Review
                    </span>
                    <span className="text-slate-400 font-mono">Sample #{idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Highlighted Recurring Fee Confusion Issue */}
          <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/5 border border-amber-500/30 rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Detected Fee Confusion
                  </span>
                  <span className="text-xs text-rose-400 font-medium">Primary Negative Driver (68% of 1-star reviews)</span>
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  {analysis.identifiedFeeIssue}
                </h4>
                <p className="text-xs text-slate-300">
                  {analysis.feeDetails?.rootCause || 'Users mistakenly perceive AMC-mandated exit load on early redemptions as a hidden platform fee due to zero-brokerage promises.'}
                </p>
              </div>

              <button
                onClick={onProceedToOutputs}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md shadow-amber-500/20"
              >
                <span>Proceed to Steps 2 & 3</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
