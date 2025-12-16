"use client";

import React, { useState, useEffect } from 'react';
import { 
   MessageCircle, Wand2, Zap, Languages
} from 'lucide-react';
export default function AIDemo() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generateEstimate = async () => {
    if (!inputText.trim()) {
      alert("Please enter some vehicle issues first!");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    
    const apiKey = ""; // Injected by environment
    const prompt = `
      You are an AI assistant for a Garage Management Software called 'Wrench Cloud'. 
      The mechanic has provided these notes about a car: "${inputText}".
      
      Please generate two things in a JSON format (no markdown formatting, just raw json):
      1. "line_items": An array of likely repair items based on the notes. Each item should have a "desc" (description) and "price" (estimated price in Indian Rupees ₹ as a string).
      2. "whatsapp_msg": A polite, professional WhatsApp message to the customer explaining the issues, the proposed fix, and asking for approval to proceed. Keep it friendly.

      Example Output Structure:
      {
          "line_items": [{"desc": "Oil Change", "price": "₹ 1,500"}],
          "whatsapp_msg": "Hello! We checked your car..."
      }
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const aiText = data.candidates[0].content.parts[0].text;
      const jsonStr = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(jsonStr);

      // Calculate pseudo-total
      let total = 0;
      parsedData.line_items.forEach((item: { price: string }) => {
        const num = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        total += num;
      });

      setResult({ ...parsedData, total });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate estimate.");
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <section id="ai-demo" className="py-20 relative overflow-hidden bg-gradient-to-b from-[#0f0f0f] to-black border-t border-[#22c55e]/10">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#22c55e]/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-xs font-bold uppercase tracking-wider mb-6 border border-[#22c55e]/20">
              <Wand2 size={14} /> Powered by Gemini AI
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Smart Estimates in <br />
              <span className="bg-gradient-to-r from-white to-[#22c55e] bg-clip-text text-transparent">Seconds, Not Minutes.</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Stop typing manually. Just tell Wrench Cloud the problem, and our Gemini-powered AI will draft a professional itemized estimate and a polite WhatsApp message for your customer instantly.
            </p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center text-[#22c55e]">
                  <Zap size={12} />
                </div>
                <span className="text-gray-300">Auto-suggests parts & labor based on symptoms.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center text-[#22c55e]">
                  <MessageCircle size={12} />
                </div>
                <span className="text-gray-300">Drafts polite, professional WhatsApp updates automatically.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center text-[#22c55e]">
                  <Languages size={12} />
                </div>
                <span className="text-gray-300">Translate technical jargon into simple customer language.</span>
              </li>
            </ul>
          </div>

          {/* Right Demo Box */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#22c55e] to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#18181b] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Wand2 className="text-[#22c55e]" size={20} /> Try the AI Assistant
                </h3>
                <span className="text-xs text-gray-500 font-mono">LIVE DEMO</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Mechanic's Rough Notes</label>
                  <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={3} 
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-4 text-white focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] focus:outline-none transition-all resize-none placeholder-gray-600" 
                    placeholder="E.g., Customer says brakes are making grinding noise and AC is blowing hot air. Suggest replacement parts."
                  ></textarea>
                </div>

                <button 
                  onClick={generateEstimate}
                  disabled={loading}
                  className={`w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Wand2 size={18} className="text-[#22c55e]" /> 
                  {loading ? 'Generating...' : 'Generate Estimate & Message ✨'}
                </button>
              </div>

              {loading && (
                <div className="mt-6 text-center py-8">
                  <div className="inline-block w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-[#22c55e] text-sm animate-pulse">Analyzing symptoms & checking parts database...</p>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {result && !loading && (
                <div className="mt-6 space-y-4 animate-fade-in-up">
                  {/* Invoice Preview */}
                  <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-bold">Draft Estimate</div>
                    <div className="text-sm text-gray-300 space-y-2 font-mono">
                      <div className="flex justify-between border-b border-white/10 pb-1 mb-1 font-bold text-xs text-white">
                        <span>ITEM</span><span>EST. COST</span>
                      </div>
                      {result.line_items.map((item, i) => (
                        <div key={i} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                          <span>{item.desc}</span>
                          <span className="text-white">{item.price}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-white font-bold">
                      <span>Total Est.</span>
                      <span className="text-[#22c55e]">₹ {result.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* WhatsApp Message */}
                  <div className="bg-[#075E54]/20 rounded-lg p-4 border border-[#25D366]/30 relative">
                    <WhatsAppIcon className="absolute top-3 right-3 text-[#25D366] w-5 h-5" />
                    <div className="text-xs text-[#25D366] uppercase tracking-widest mb-2 font-bold">WhatsApp Draft</div>
                    <p className="text-sm text-white/90 italic leading-relaxed">{result.whatsapp_msg}</p>
                    <button onClick={copyToClipboard} className="mt-3 text-xs flex items-center gap-1 text-[#25D366] hover:underline">
                      <Copy size={12} /> Copy to clipboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}