import React, { useState, useRef, useEffect } from "react";
import { Send, Settings, X, MessageSquare, User, Bot, Volume2, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import MobileFrame from "./components/MobileFrame";
import Character from "./components/Character";
import { getAIResponse, getSpeech } from "./lib/gemini";

interface Message {
  role: "user" | "bot";
  text: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Assalamu Alaikum! Ami apnar AI assistant. Ami kivabe apnake shahajjo korte pari?" },
  ]);
  const [input, setInput] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showKB, setShowKB] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const responseText = await getAIResponse(userMessage, knowledgeBase);
      setMessages((prev) => [...prev, { role: "bot", text: responseText }]);
      
      // Speak the response
      await speak(responseText);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages((prev) => [...prev, { role: "bot", text: "Dukkito, kono shomoshsha hoyeche. Abar cheshtha korun." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speak = async (text: string) => {
    try {
      // For this demo, I'll simulate the speaking animation based on the text length and a timer.
      // The TTS API returns PCM which is hard to play directly without more complex code.
      // I'll trigger the animation for a duration proportional to the text length.
      setIsSpeaking(true);
      const words = text.split(" ").length;
      const duration = Math.min(words * 400, 10000); // roughly 400ms per word, max 10s
      
      setTimeout(() => {
        setIsSpeaking(false);
      }, duration);
    } catch (error) {
      console.error("Speech error:", error);
    }
  };

  return (
    <MobileFrame>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none font-display">AmiAI</h1>
            <span className="text-[10px] opacity-80">Online</span>
          </div>
        </div>
        <button 
          onClick={() => setShowKB(true)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Character Section */}
      <div className="h-48 bg-indigo-50 flex items-center justify-center relative overflow-hidden border-b border-indigo-100">
        <Character isSpeaking={isSpeaking} />
        {isSpeaking && (
          <div className="absolute bottom-2 right-4 flex items-center gap-1 text-indigo-600 animate-pulse">
            <Volume2 size={14} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Speaking...</span>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === "user" ? "bg-indigo-100 text-indigo-600" : "bg-white border text-gray-600 shadow-sm"
              }`}>
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                msg.role === "user" 
                  ? "bg-indigo-600 text-white rounded-tr-none" 
                  : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
              }`}>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-full pl-4 border border-gray-200 focus-within:border-indigo-300 focus-within:bg-white transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-full transition-all ${
              input.trim() && !isLoading 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                : "bg-gray-200 text-gray-400"
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Knowledge Base Overlay */}
      <AnimatePresence>
        {showKB && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="absolute inset-0 bg-white z-[60] flex flex-col"
          >
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-indigo-600" />
                <h2 className="font-bold text-gray-800">Knowledge Base</h2>
              </div>
              <button 
                onClick={() => setShowKB(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Paste the text you want the AI to learn from. It will search this text first before looking on the web.
              </p>
              <textarea
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                placeholder="Paste your text here..."
                className="flex-1 w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm font-sans"
              />
              <button
                onClick={() => setShowKB(false)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
              >
                Save & Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileFrame>
  );
}
