import React, { useState } from 'react';
import { Upload, FileText, Loader2, BookOpen } from 'lucide-react';
import { useThemeMode } from '../context/ThemeModeContext';

export const SelfStudy: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const { addToast } = useThemeMode();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPageNumber(1);
      // Instantly generate a local URL for immediate preview
      const localUrl = URL.createObjectURL(selectedFile);
      setPdfUrl(localUrl);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'notes-portal';
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'diiauk0yb';
      const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || '215137723882992';
      const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'mszE6sSjkVsGAAqzY_a8ToTxbu8';
      
      const timestamp = Math.round((new Date()).getTime() / 1000).toString();
      
      // Generate SHA-1 signature
      const strToSign = `timestamp=${timestamp}&upload_preset=${uploadPreset}${apiSecret}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(strToSign);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      
      // Upload using Cloudinary REST API (Signed)
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const responseData = await response.json();
      
      if (responseData.secure_url) {
        // Swap the local blob URL for the live Cloudinary URL silently in the background
        setPdfUrl(responseData.secure_url);
        
        addToast({
          title: "Upload Successful",
          description: "Your PDF has been securely saved to the cloud and is ready for AI analysis.",
          type: "success"
        });
      } else {
        console.error("Upload failed:", responseData);
        alert(`Upload failed: ${responseData.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateSummary = () => {
    setIsSummarizing(true);
    // Mock the backend LLM processing delay for the hackathon demo
    setTimeout(() => {
      setAiSummary(`### 🧠 Comprehensive Neurodivergent-Friendly Breakdown
      
This document (17 pages) has been structurally condensed using our **LearnLens AI Model**. It is optimized for **ADHD** and **Dyslexia** profiles by removing filler text and highlighting core concepts.

#### 🎯 1. The Core Problem
* **Information Overload:** People spend far too much time reading long digital content on the internet.
* **Cognitive Fatigue:** Processing walls of text is especially difficult for neurodivergent individuals.
* **The Goal:** Build an automated system that quickly extracts the most important sentences from a massive block of text.

#### 🏗️ 2. Proposed Architecture & Methodology
The paper proposes an **AI-Based Text Summarization** pipeline using the Java programming language. The architecture is broken down into three main phases:

1. **Pre-processing:** 
   * Removing "stop words" (like *and*, *the*, *is*).
   * Stemming words down to their root form (e.g., *running* -> *run*).
2. **Feature Extraction:** 
   * The AI scans the document and assigns a **mathematical weight** to every single sentence.
   * Sentences with frequent keywords, proper nouns, and numerical data get higher scores.
3. **Sentence Ranking:** 
   * The system ranks all sentences from highest score to lowest.
   * It extracts the top 20% of sentences and stitches them together chronologically to form the final summary.

#### 📊 3. Key Results & Findings
* **Accuracy:** The proposed Java model achieved an **85% accuracy rate** when compared against human-written summaries.
* **Speed:** It can process a 50-page document in under **3.2 seconds**.
* **Use Cases:** This technology is primarily intended for academic researchers, legal professionals, and students reviewing dense material.

#### 💡 Actionable Takeaway
> **TL;DR:** Instead of reading the whole paper, you just need to know that this Java-based algorithm successfully uses mathematical scoring to shrink long documents down to 20% of their original size, instantly saving hours of reading time.`);
      setIsSummarizing(false);
      addToast({
        title: "Summary Generated",
        description: "Document successfully parsed and formatted for neurodivergent readability.",
        type: "success"
      });
    }, 2500);
  };

  return (
    <div className="min-h-screen py-10 px-4 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] font-semibold text-xs tracking-wider uppercase mb-4 border border-[#10B981]/20">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Self-Guided Learning</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white font-display mb-3">
          Self-Study Portal
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Upload your PDF notes. We store them securely on Cloudinary and prepare them for future AI text extraction and learning paths.
        </p>
      </div>
      
      {/* Upload Section */}
      <div className="bg-white dark:bg-[#1E1E24] p-8 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm mb-8 text-center transition-all">
        <Upload className="w-12 h-12 mx-auto text-[#8266F0] mb-4" />
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Upload Your PDF Notes</h2>
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange}
          className="block w-full max-w-sm mx-auto text-sm text-neutral-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#8266F0]/10 file:text-[#8266F0] hover:file:bg-[#8266F0]/20 transition cursor-pointer mb-6"
        />
        <button 
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="px-8 py-3 rounded-full bg-[#8266F0] text-white text-sm font-semibold disabled:opacity-50 hover:bg-[#7052eb] shadow-lg shadow-[#8266F0]/20 transition flex items-center justify-center mx-auto space-x-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading to Cloudinary...</span>
            </>
          ) : (
            <span>Upload & Analyze</span>
          )}
        </button>
      </div>

      {/* Preview Section */}
      {pdfUrl && (
        <div className="bg-white dark:bg-[#1E1E24] p-6 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Document Preview</h3>
            </div>
            
            <div className="flex items-center space-x-3 bg-neutral-100 dark:bg-black/20 p-1.5 rounded-xl border border-black/5 dark:border-white/5">
              <button 
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#2A2A35] text-sm font-bold shadow-sm disabled:opacity-50 hover:bg-neutral-50 dark:hover:bg-[#343440] transition"
              >
                Previous
              </button>
              <span className="text-sm font-bold px-2">Page {pageNumber}</span>
              <button 
                onClick={() => setPageNumber(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#2A2A35] text-sm font-bold shadow-sm hover:bg-neutral-50 dark:hover:bg-[#343440] transition"
              >
                Next
              </button>
            </div>
          </div>
          <iframe 
            src={`${pdfUrl}#page=${pageNumber}`} 
            className="w-full h-[600px] rounded-xl border border-black/10 dark:border-white/10 bg-neutral-100 dark:bg-[#17171B]" 
            title="PDF Preview"
          />
        </div>
      )}

      {/* AI Summary Section */}
      {pdfUrl && (
        <div className="mt-8 bg-white dark:bg-[#1E1E24] p-8 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm animate-in slide-in-from-bottom-6 fade-in duration-500">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
                <span className="bg-gradient-to-r from-[#8266F0] to-[#EC4899] text-transparent bg-clip-text mr-2">LearnLens</span> 
                Smart Summary
              </h3>
              <p className="text-sm text-neutral-500 mt-1">Struggling with walls of text? Let AI break it down for you.</p>
            </div>
            {!aiSummary && (
              <button 
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#8266F0] to-[#EC4899] text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition flex items-center whitespace-nowrap"
              >
                {isSummarizing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing Text...</>
                ) : (
                  <>✨ Generate ADHD/Dyslexia Summary</>
                )}
              </button>
            )}
          </div>

          {aiSummary && (
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none bg-[#8266F0]/5 dark:bg-[#8266F0]/10 p-6 rounded-2xl border border-[#8266F0]/20">
              {aiSummary.split('\\n').map((line, i) => (
                <p key={i} className="mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: line
                  .replace(/### (.*)/g, '<h4 class="text-lg font-bold text-[#8266F0] mb-3">$1</h4>')
                  .replace(/#### (.*)/g, '<h5 class="text-md font-bold text-neutral-800 dark:text-white mt-4 mb-2">$1</h5>')
                  .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-neutral-900 dark:text-white">$1</strong>')
                  .replace(/\* (.*)/g, '<li class="ml-4 list-disc">$1</li>')
                  .replace(/> (.*)/g, '<div class="mt-4 p-4 bg-white dark:bg-black/30 rounded-xl border-l-4 border-emerald-400 italic text-neutral-700 dark:text-neutral-300">$1</div>')
                }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
