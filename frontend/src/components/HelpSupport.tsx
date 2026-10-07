import React from 'react';
import { ArrowLeft, Search, ChevronRight, Bot, Headphones, Mail, HelpCircle, FileText, MapPin, Bell, User, MessageSquare } from 'lucide-react';

export default function HelpSupport({ onNavigateBack, onOpenChatbot, onNavigateTopic }) {
  const topics = [
    {
      id: 'submit',
      title: 'How to Submit a Complaint',
      desc: 'Learn how to report an issue in your area.',
      icon: '🏠',
      tab: 'submit-complaint'
    },
    {
      id: 'track',
      title: 'Track Your Complaint',
      desc: 'Find out how to check the status of your complaint.',
      icon: '💬',
      tab: 'my-complaints'
    },
    {
      id: 'community',
      title: 'Community Issues',
      desc: 'See issues reported in your area.',
      icon: '👥',
      tab: 'community-issues'
    },
    {
      id: 'projects',
      title: 'Projects Near Me',
      desc: 'Learn how local projects work.',
      icon: '📍',
      tab: 'projects-near-me'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      desc: 'Understand notifications and updates.',
      icon: '🔔',
      tab: 'my-complaints'
    },
    {
      id: 'account',
      title: 'Account & Profile',
      desc: 'Manage your profile, location and preferences.',
      icon: '👤',
      tab: 'my-complaints'
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs max-w-xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={onNavigateBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Help & Support</h2>
            <p className="text-slate-500 text-xs font-medium mt-0.5">We're here to help you.</p>
          </div>
        </div>

        <button onClick={onOpenChatbot} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
          <Bot className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Banner Card with Mascot Illustration */}
      <div className="bg-[#eefdf5] border border-emerald-100 rounded-3xl p-5 sm:p-6 flex items-center justify-between shadow-2xs">
        <div className="space-y-1.5 max-w-xs">
          <h3 className="text-base sm:text-lg font-extrabold text-emerald-950">How can we help you today?</h3>
          <p className="text-xs font-medium text-emerald-700 leading-relaxed">
            Find answers, learn how things work, or chat with our AI assistant.
          </p>
        </div>
        <div className="text-4xl hidden sm:block">
          🤖
        </div>
      </div>

      {/* Popular Topics Section */}
      <div className="space-y-3">
        <div className="text-xs font-extrabold text-slate-900">Popular Topics</div>

        <div className="space-y-2">
          {topics.map((t) => (
            <div
              key={t.id}
              onClick={() => onNavigateTopic(t.tab)}
              className="p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-2xs transition-all bg-white cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold border border-blue-100">
                  {t.icon}
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">{t.title}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{t.desc}</div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Need More Help? Grid Cards */}
      <div className="space-y-3">
        <div className="text-xs font-extrabold text-slate-900">Need more help?</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Chat with SmartGov AI */}
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-3">
            <div>
              <div className="text-xs font-extrabold text-slate-900">Chat with SmartGov AI</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Get instant answers to your questions with our AI assistant.</div>
            </div>

            <button
              onClick={onOpenChatbot}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-colors"
            >
              <span>Chat Now</span>
              <Bot className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Contact Support */}
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-3">
            <div>
              <div className="text-xs font-extrabold text-slate-900">Contact Support</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Can't find what you need? We're here to help.</div>
            </div>

            <button
              onClick={() => alert("Support Team Email: support@smartgov.insight\nHelpline: 1800-11-2026")}
              className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors"
            >
              <span>Contact Us</span>
              <Headphones className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Still need help? Bottom Footer Banner */}
      <div className="bg-[#eff6ff] border border-blue-100 p-4 rounded-2xl flex items-center justify-between text-xs text-blue-900 font-medium">
        <span>If you are facing any technical issue or have feedback, let us know. We will get back to you.</span>
        <Mail className="w-5 h-5 text-blue-600 shrink-0 ml-2" />
      </div>

    </div>
  );
}
