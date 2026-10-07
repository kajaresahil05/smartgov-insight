import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Send, Bot, Sparkles, Navigation, ArrowRight } from 'lucide-react';

export default function SmartGovChatbot({ userId, onNavigateBack, onNavigateTab }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I am SmartGov AI Assistant, your official help assistant inside SmartGov Insight. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    'How do I submit a complaint?',
    'How can I track my complaint?',
    'What is Community Issues?',
    'How do I change my location?',
    'How do I change my password?',
    'What can I do on SmartGov?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendQuery = async (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, user_id: userId || 1 })
      });

      const json = await res.json();
      setIsTyping(false);

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: json.answer || "I can assist you with complaint registration, ticket tracking, and projects.",
        action_button: json.action_button,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);

    } catch (e) {
      setIsTyping(false);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "I'm sorry, I'm unable to answer right now. Please try again or use the Help & Support options.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: "Conversation cleared. Hello! I am SmartGov AI Assistant. How can I help you today?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs max-w-xl mx-auto flex flex-col h-[660px]">
      
      {/* Header Bar matching prompt Section 20 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
        <div className="flex items-center space-x-3">
          <button onClick={onNavigateBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-sm shadow-emerald-200">
              🤖
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>SmartGov AI</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              </h2>
              <p className="text-slate-500 text-[11px] font-medium">Your SmartGov Citizen Assistant</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          title="Clear Conversation"
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center space-x-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Main Chat Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        
        {/* Welcome Mascot Card */}
        <div className="bg-[#f5f3ff] border border-purple-100 rounded-3xl p-4 flex items-center space-x-4 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
            🤖
          </div>
          <div>
            <div className="text-xs font-extrabold text-purple-950">SmartGov AI Assistant 👋</div>
            <div className="text-[11px] font-medium text-purple-800 mt-0.5 leading-snug">
              Official citizen support for complaints, tracking, projects, community issues & settings.
            </div>
          </div>
        </div>

        {/* Suggested Questions Section matching Section 20 */}
        {messages.length <= 2 && (
          <div className="space-y-2 pt-1">
            <div className="text-xs font-extrabold text-slate-700">Suggested Questions</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendQuery(q)}
                  className="text-left p-2.5 rounded-2xl bg-[#eefdf5] border border-emerald-100 hover:bg-emerald-100/60 text-[11px] font-bold text-emerald-900 flex items-center justify-between transition-colors shadow-2xs"
                >
                  <span className="truncate pr-1">{q}</span>
                  <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation Message Bubble Trajectory */}
        <div className="space-y-3.5 pt-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-3xl p-4 text-xs font-medium leading-relaxed space-y-2 ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                  : 'bg-slate-100/90 border border-slate-200/60 text-slate-800 rounded-bl-none'
              }`}>
                <div className="whitespace-pre-line">{m.text}</div>
                
                {/* Inline Action Navigation Button if returned by backend API */}
                {m.action_button && (
                  <div className="pt-1">
                    <button
                      onClick={() => onNavigateTab(m.action_button.tab)}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
                    >
                      <span>[{m.action_button.label}]</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className={`text-[10px] text-right ${m.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {m.time} {m.sender === 'user' && '✓✓'}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-500 rounded-2xl px-4 py-2.5 text-xs font-bold animate-pulse">
                SmartGov AI is typing...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

      </div>

      {/* Input Box & Footer Disclaimer */}
      <div className="shrink-0 space-y-2 pt-2 border-t border-slate-100">
        <form onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }} className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask me anything about SmartGov Insight..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 shadow-2xs"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim()}
            className="absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="text-[10px] text-slate-400 text-center font-medium">
          SmartGov AI Assistant • Real-time Citizen Help Desk
        </div>
      </div>

    </div>
  );
}
