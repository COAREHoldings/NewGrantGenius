'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, Send, Minimize2, Maximize2, 
  MessageSquare, Lightbulb, FileText, Target,
  CheckCircle, AlertTriangle, Loader2, Copy, Check
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: <Target className="w-4 h-4" />, label: 'Review Aims', prompt: 'Review my Specific Aims and suggest improvements for clarity and impact.' },
  { icon: <FileText className="w-4 h-4" />, label: 'Check Format', prompt: 'Check my document for NIH formatting compliance (fonts, margins, page limits).' },
  { icon: <Lightbulb className="w-4 h-4" />, label: 'Strengthen Innovation', prompt: 'How can I better highlight the innovation in my research approach?' },
  { icon: <AlertTriangle className="w-4 h-4" />, label: 'Find Weaknesses', prompt: 'What are potential weaknesses a reviewer might identify in my grant?' },
];

export default function GuardianGrantIQ() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Guardian Grant IQ, your AI grant writing assistant. I can help you strengthen your NIH application, check compliance, improve your writing, and answer questions about grant requirements. What can I help you with?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          context: 'grant_assistant'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || "I apologize, but I couldn't process that request. Please try again.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback response for demo
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: getContextualResponse(content),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getContextualResponse(content),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getContextualResponse = (query: string): string => {
    const lower = query.toLowerCase();
    
    if (lower.includes('specific aims') || lower.includes('aims')) {
      return `**Specific Aims Best Practices:**

1. **Opening paragraph**: Start with a compelling hook about the problem's significance (2-3 sentences)

2. **Knowledge gap**: Clearly state what's unknown and why it matters

3. **Central hypothesis**: State your hypothesis clearly and mention preliminary data support

4. **Aims (typically 2-3)**:
   - Each aim should be independent (if one fails, others can proceed)
   - Include approach summary and expected outcomes
   - Show logical progression

5. **Impact statement**: End with how success will advance the field

Would you like me to review your Specific Aims draft?`;
    }
    
    if (lower.includes('format') || lower.includes('compliance') || lower.includes('check')) {
      return `**NIH Format Requirements Checklist:**

✅ **Font**: Arial, Helvetica, Palatino, or Georgia (11pt minimum)
✅ **Margins**: 0.5 inches on all sides
✅ **Line spacing**: Single-spaced (no extra after paragraphs)
✅ **Page limits**:
   - Specific Aims: 1 page
   - Research Strategy: 12 pages
   - Biosketch: 5 pages per person

✅ **Headers/Footers**: Use for PI name and page numbers
✅ **Figures**: Embedded, readable at 100%, properly labeled

Would you like me to check a specific document for compliance?`;
    }
    
    if (lower.includes('innovation') || lower.includes('innovative')) {
      return `**Strengthening Your Innovation Section:**

1. **Be explicit**: Use phrases like "This is innovative because..." or "The novelty lies in..."

2. **Three types of innovation**:
   - Conceptual (new theory/framework)
   - Technical (new method/technology)
   - Application (new use case)

3. **Compare to existing approaches**: Show how yours differs and why it's better

4. **Address skepticism**: If it seems too innovative, explain feasibility

5. **Support with preliminary data**: Show the innovation is achievable

Would you like specific suggestions for your project?`;
    }
    
    if (lower.includes('weakness') || lower.includes('critique') || lower.includes('reviewer')) {
      return `**Common NIH Grant Weaknesses to Address:**

⚠️ **Significance**
- Problem seems incremental, not transformative
- Unclear clinical/translational relevance

⚠️ **Innovation**  
- Approach seems routine or standard
- Not clearly distinguished from prior work

⚠️ **Approach**
- Underpowered statistical analysis
- Missing alternative strategies
- Timeline too ambitious
- Insufficient preliminary data

⚠️ **Investigator**
- Gaps in expertise not addressed
- No collaborators for needed skills

Would you like me to identify potential weaknesses in your specific application?`;
    }
    
    return `I'd be happy to help with that! As your Grant IQ assistant, I can help with:

• **Writing**: Specific Aims, Research Strategy, Significance, Innovation, Approach
• **Compliance**: NIH format checking, page limits, required sections
• **Strategy**: Reviewer anticipation, weakness identification, resubmission tactics
• **Budget**: Justification writing, allowable costs guidance

Please share more details or a specific section you'd like me to review.`;
  };

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.prompt);
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-50 group"
      >
        <Sparkles className="w-6 h-6" />
        <span className="absolute -top-10 right-0 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Grant IQ Assistant
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 transition-all ${
      isMinimized ? 'w-72 h-14' : 'w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <span className="font-semibold text-white">Guardian Grant IQ</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-white" />
            ) : (
              <Minimize2 className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Quick Actions */}
          <div className="px-3 py-2 border-b border-slate-100 flex gap-2 overflow-x-auto">
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(600px - 180px)' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${
                  message.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md' 
                    : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-md'
                } px-4 py-3`}>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => copyMessage(message.id, message.content)}
                      className="mt-2 text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      {copied === message.id ? (
                        <><Check className="w-3 h-3" /> Copied</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your grant..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                rows={2}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
