import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { tutorTopics, generateTutorResponse } from '@/data/tutorData';
import { Bot, Send, Plus, MessageSquare, Trash2, Sparkles, Brain, Network, MessageSquare as MsgIcon, Shield, Code, Clock } from 'lucide-react';
import type { TutorSession, TutorMessage } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain, Network, MessageSquare: MsgIcon, Sparkles, Shield, Code,
};

export default function PersonalTutor() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [activeSession, setActiveSession] = useState<TutorSession | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, [user]);

  useEffect(() => {
    if (activeSession) {
      setMessages(activeSession.messages || []);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  async function loadSessions() {
    if (!user) return;
    const { data, error } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading sessions:', error.message);
    } else {
      setSessions((data as unknown as TutorSession[]) || []);
    }
    setLoading(false);
  }

  async function createNewSession(topic?: string) {
    if (!user) return null;

    const welcomeMsg: TutorMessage = {
      role: 'tutor',
      content: "Hello! I'm your AI Personal Tutor. What would you like to explore today?",
      timestamp: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('tutor_sessions')
      .insert({
        user_id: user.id,
        title: topic || 'New Conversation',
        messages: [welcomeMsg],
      })
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error creating session:', error.message);
      return null;
    }

    if (data) {
      const newSession = data as unknown as TutorSession;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setMessages([welcomeMsg]);
      return newSession;
    }
    return null;
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from('tutor_sessions').delete().eq('id', id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession?.id === id) {
      setActiveSession(null);
      setMessages([]);
    }
  }

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || !activeSession || isTyping) return;

    const userMsg: TutorMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      // PROPERLY AWAIT THE ASYNC AI RESPONSE
      const tutorResponse = await generateTutorResponse(messageText);

      const tutorMsg: TutorMessage = {
        role: 'tutor',
        content: tutorResponse,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, tutorMsg];
      setMessages(finalMessages);
      setIsTyping(false);

      const newTitle = activeSession.title === 'New Conversation' && messageText.length > 0
        ? messageText.slice(0, 40) + (messageText.length > 40 ? '...' : '')
        : activeSession.title;

      const { data, error } = await supabase
        .from('tutor_sessions')
        .update({
          messages: finalMessages,
          title: newTitle,
        })
        .eq('id', activeSession.id)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error updating session:', error.message);
      } else if (data) {
        const updated = data as unknown as TutorSession;
        setActiveSession(updated);
        setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setIsTyping(false);
    }
  }

  async function startWithTopic(topicPrompt: string, topicName: string) {
    if (!user) return;
    
    const welcomeMsg: TutorMessage = {
      role: 'tutor',
      content: "Hello! I'm your AI Personal Tutor. What would you like to explore today?",
      timestamp: new Date().toISOString(),
    };
    
    const userMsg: TutorMessage = {
      role: 'user',
      content: topicPrompt,
      timestamp: new Date().toISOString(),
    };

    setIsTyping(true);

    try {
      // PROPERLY AWAIT THE ASYNC AI RESPONSE
      const tutorResponse = await generateTutorResponse(topicPrompt);
      const tutorMsg: TutorMessage = {
        role: 'tutor',
        content: tutorResponse,
        timestamp: new Date().toISOString(),
      };

      const initialMessages = [welcomeMsg, userMsg, tutorMsg];

      const { data, error } = await supabase
        .from('tutor_sessions')
        .insert({
          user_id: user.id,
          title: topicName,
          messages: initialMessages,
        })
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error starting with topic:', error.message);
        setIsTyping(false);
        return;
      }

      if (data) {
        const newSession = data as unknown as TutorSession;
        setSessions((prev) => [newSession, ...prev]);
        setActiveSession(newSession);
        setMessages(initialMessages);
      }
    } catch (err) {
      console.error("Error starting topic session:", err);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)] animate-fade-in">
      {/* Session list */}
      <div className="w-64 flex-shrink-0 bg-white rounded-2xl border border-slate-200 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-slate-100">
          <button
            onClick={() => createNewSession()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-400">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No conversations yet
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session)}
                className={`w-full text-left p-3 rounded-lg transition-all group ${
                  activeSession?.id === session.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{session.topic || 'General'}</p>
                  </div>
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col min-w-0">
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">AI Personal Tutor</h2>
                <p className="text-slate-500 mt-2">Choose a topic to start learning, or create a new chat</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tutorTopics.map((topic) => {
                  const Icon = iconMap[topic.icon] || Sparkles;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => startWithTopic(topic.prompt, topic.name)}
                      className="flex items-start gap-3 p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all text-left group"
                    >
                      <div className="w-10 h-10 bg-white group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm">{topic.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{topic.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => createNewSession()}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Start a free-form chat
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 truncate">{activeSession.title}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Tutor · {activeSession.topic || activeSession.title}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-slate-200' : 'bg-gradient-to-br from-blue-500 to-blue-700'
                  }`}>
                    {msg.role === 'user' ? (
                      <span className="text-xs font-bold text-slate-600">You</span>
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    <div className={`text-xs mt-1.5 flex items-center gap-1 ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask your AI tutor anything..."
                  disabled={isTyping}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}