'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { getChatHistory, addChatMessage, clearChatHistory, ChatMessage } from '@/lib/services/chatService';
import { generateCoachResponse } from '@/lib/services/coachService';
import { MessageCircle, Send, Trash2, Leaf, User } from 'lucide-react';
import { toast } from 'sonner';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  user_id: '',
  role: 'assistant',
  content: 'Hi! I\'m your EcoSphere sustainability coach. Ask me anything about reducing your carbon footprint, eco-friendly products, green transport, or sustainable living.',
  created_at: '',
};

export default function CoachPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const loadHistory = async () => {
    try {
      const history = await getChatHistory(supabase, 50);
      setMessages([WELCOME_MESSAGE, ...history]);
    } catch (error: any) {
      // History load failure is non-fatal; keep welcome message
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setInput('');
    setLoading(true);
    setThinking(true);

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: '',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      await addChatMessage(supabase, 'user', content);
      const response = generateCoachResponse(content);

      // Simulate brief thinking delay for natural feel
      await new Promise((r) => setTimeout(r, 600));

      const saved = await addChatMessage(supabase, 'assistant', response.content);
      const assistantMsg: ChatMessage = {
        ...saved,
        content: response.content,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setThinking(false);
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearChatHistory(supabase);
      setMessages([WELCOME_MESSAGE]);
      toast.success('Chat history cleared');
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear history');
    }
  };

  const suggestions = messages.length <= 1
    ? ['How do I reduce my carbon footprint?', 'Tips for eco-friendly commuting', 'What is the most sustainable diet?']
    : (() => {
        const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && m.id !== 'welcome');
        const resp = lastAssistant ? generateCoachResponse(lastAssistant.content) : null;
        return resp?.suggestions || [];
      })();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Coach</h1>
          <p className="text-gray-600 mt-1">Get personalized sustainability guidance</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleClear} className="text-gray-600">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      <Card className="shadow-lg flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span>Conversation</span>
          </CardTitle>
          <CardDescription>Ask about transport, energy, diet, products, and more</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-gray-200' : 'bg-gradient-to-br from-green-500 to-emerald-600'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Leaf className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`px-4 py-2 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </CardContent>

        {suggestions.length > 0 && !thinking && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 border-t">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex space-x-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your sustainability question..."
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()} className="bg-green-600 hover:bg-green-700">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
