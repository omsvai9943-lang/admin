import React, { useState, useRef, useEffect } from "react";
import { Send, Settings, X, MessageSquare, User, Bot, Volume2, Info, Mic, MicOff, ArrowLeft, Play, Sparkles, Lock, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import Character from "./components/Character";
import HijabCharacter from "./components/HijabCharacter";
import { getAIResponse, getSpeech } from "./lib/gemini";

interface Message {
  role: "user" | "bot";
  text: string;
}

type AppMode = "menu" | "chatbot" | "live";

export default function App() {
  const [mode, setMode] = useState<AppMode>("menu");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "আসসালামু আলাইকুম! আমি রাজকন্যা, আপনার AI সহকারী। আমি আপনাকে কীভাবে সাহায্য করতে পারি?" },
  ]);
  const [input, setInput] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showKB, setShowKB] = useState(false);
  const [kbPassword, setKbPassword] = useState("");
  const [isKbUnlocked, setIsKbUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to play PCM audio from base64
  const playPCM = async (base64Data: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioContext = audioContextRef.current;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Int16Array(len / 2);
      for (let i = 0; i < len; i += 2) {
        bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
      }

      const audioBuffer = audioContext.createBuffer(1, bytes.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < bytes.length; i++) {
        channelData[i] = bytes[i] / 32768;
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      setIsSpeaking(true);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (error) {
      console.error("Error playing PCM:", error);
      setIsSpeaking(false);
      fallbackSpeak(liveTranscript || messages[messages.length - 1].text);
    }
  };

  const fallbackSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'bn-BD';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Initialize Speech Recognition for Live Mode
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "bn-BD";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");
        
        setLiveTranscript(transcript);
        
        if (event.results[0].isFinal) {
          handleLiveInput(transcript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert("Please allow microphone access to use voice features.");
        }
      };
    }
  }, []);

  const handleSend = async (textOverride?: string) => {
    const userMessage = textOverride || input.trim();
    if (!userMessage || isLoading) return;

    if (!textOverride) setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const responseText = await getAIResponse(userMessage, knowledgeBase);
      setMessages((prev) => [...prev, { role: "bot", text: responseText }]);
      await speak(responseText);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages((prev) => [...prev, { role: "bot", text: "দুঃখিত, কোনো সমস্যা হয়েছে। আবার চেষ্টা করুন।" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiveInput = async (text: string) => {
    setIsLoading(true);
    try {
      const responseText = await getAIResponse(text, knowledgeBase);
      setLiveTranscript(responseText);
      await speak(responseText);
    } catch (error) {
      console.error("Live AI error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setLiveTranscript("");
      recognitionRef.current?.start();
      setIsListening(true);
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }
  };

  const speak = async (text: string) => {
    try {
      const base64PCM = await getSpeech(text);
      if (base64PCM) {
        await playPCM(base64PCM);
      } else {
        fallbackSpeak(text);
      }
    } catch (error) {
      console.error("Speech error:", error);
      fallbackSpeak(text);
    }
  };

  const handleKbUnlock = () => {
    if (kbPassword === "994369") {
      setIsKbUnlocked(true);
    } else {
      alert("ভুল পাসওয়ার্ড!");
    }
  };

  if (mode === "menu") {
    return (
      <div className="min-h-screen bg-indigo-50 flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chatbot Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("chatbot")}
              className="bg-white p-8 rounded-[32px] shadow-xl border border-indigo-100 flex flex-col items-center text-center gap-6 group"
            >
              <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
                <MessageSquare size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-display">রাজকন্যা চ্যাটবট</h2>
                <p className="text-gray-500 mt-2 text-sm">সহজ চ্যাট ইন্টারফেসের মাধ্যমে সাহায্য নিন।</p>
              </div>
              <div className="mt-auto px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold uppercase tracking-wider">
                চ্যাট শুরু করুন
              </div>
            </motion.button>

            {/* Live Mode Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("live")}
              className="bg-indigo-600 p-8 rounded-[32px] shadow-xl border border-indigo-500 flex flex-col items-center text-center gap-6 group text-white"
            >
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-900/20 group-hover:-rotate-6 transition-transform">
                <Sparkles size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display">লাইভ মোড</h2>
                <p className="text-indigo-100 mt-2 text-sm">অ্যানিমেটেড চরিত্রের সাথে সরাসরি কথা বলুন।</p>
              </div>
              <div className="mt-auto px-6 py-2 bg-white/20 text-white rounded-full text-sm font-bold uppercase tracking-wider">
                লাইভ শুরু করুন
              </div>
            </motion.button>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-6 text-center text-gray-500 text-sm border-t border-indigo-100">
          <p>Powered by <span className="font-bold text-indigo-600">রাজকন্যা AI</span></p>
          <button 
            onClick={() => {
              setShowKB(true);
              setIsKbUnlocked(false);
              setKbPassword("");
            }}
            className="mt-4 text-xs text-indigo-400 hover:text-indigo-600 underline transition-colors"
          >
            অ্যাডমিন প্যানেল
          </button>
        </footer>

        {/* KB Modal */}
        <AnimatePresence>
          {showKB && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <Settings size={18} className="text-indigo-600" />
                    তথ্য যোগ করুন
                  </h2>
                  <button onClick={() => setShowKB(false)} className="p-2 hover:bg-gray-200 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6">
                  {!isKbUnlocked ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">পাসওয়ার্ড দিন</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="password"
                            value={kbPassword}
                            onChange={(e) => setKbPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                            placeholder="******"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleKbUnlock}
                        className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200"
                      >
                        আনলক করুন
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <textarea
                        value={knowledgeBase}
                        onChange={(e) => setKnowledgeBase(e.target.value)}
                        placeholder="এখানে আপনার তথ্যগুলো লিখুন..."
                        className="w-full h-64 p-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                      />
                      <button
                        onClick={() => setShowKB(false)}
                        className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200"
                      >
                        সেভ করুন
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (mode === "live") {
    return (
      <div className="fixed inset-0 bg-indigo-950 flex flex-col items-center justify-center overflow-hidden">
        <button 
          onClick={() => setMode("menu")}
          className="absolute top-8 left-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="w-full h-full flex flex-col items-center justify-center p-12">
          <div className="w-full max-w-2xl h-[70vh]">
            <HijabCharacter isSpeaking={isSpeaking} isListening={isListening} />
          </div>

          <AnimatePresence>
            {liveTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-8 max-w-2xl text-center"
              >
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-white shadow-2xl">
                  <p className="text-lg font-medium leading-relaxed">
                    {liveTranscript}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                isListening 
                  ? "bg-red-500 text-white ring-8 ring-red-500/20" 
                  : "bg-white text-indigo-600 ring-8 ring-white/10"
              }`}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="p-4 border-b flex items-center justify-between bg-indigo-600 text-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setMode("menu")} className="p-2 hover:bg-white/10 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold font-display">রাজকন্যা AI</h1>
            <span className="text-[10px] opacity-80 uppercase tracking-widest">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMode("live")}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold transition-all"
          >
            <Sparkles size={14} />
            লাইভ মোড
          </button>
          <button 
            onClick={() => {
              setShowKB(true);
              setIsKbUnlocked(false);
              setKbPassword("");
            }}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Character Section (Optional for Chat) */}
      <div className="h-40 bg-indigo-50 flex items-center justify-center relative overflow-hidden border-b border-indigo-100">
        <Character isSpeaking={isSpeaking} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-[90%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                msg.role === "user" ? "bg-indigo-600 text-white" : "bg-white border text-indigo-600"
              }`}>
                {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
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
            <div className="bg-white border border-gray-100 p-4 rounded-3xl rounded-tl-none shadow-sm flex gap-1">
              <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex items-center gap-3 bg-gray-100 p-2 rounded-3xl border border-gray-200 focus-within:border-indigo-300 focus-within:bg-white transition-all shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="আপনার প্রশ্ন লিখুন..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-2xl transition-all ${
              input.trim() && !isLoading 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                : "bg-gray-200 text-gray-400"
            }`}
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-2 uppercase tracking-widest">Powered by রাজকন্যা AI</p>
      </div>
    </div>
  );
}
