import { useState, useEffect, useRef, useCallback } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  projectId: string;
  projectName: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface SuggestedPrompt {
  label: string;
  prompt: string;
  icon: string;
}

const CONVERSATIONS_KEY = 'devdash-ai-assistant-conversations';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { label: 'Why did my last deploy fail?', prompt: 'Analyze my last deployment and explain why it failed. What can I do to fix it?', icon: '🚀' },
  { label: 'Generate commit message', prompt: 'Generate a conventional commit message for my current changes based on the git diff.', icon: '📝' },
  { label: 'Review recent changes', prompt: 'Review my recent code changes and suggest improvements for code quality, performance, and security.', icon: '🔍' },
  { label: 'Suggest performance improvements', prompt: 'Analyze my project and suggest performance improvements based on the current setup and dependencies.', icon: '⚡' },
  { label: 'Explain this error', prompt: 'Explain the following error and suggest how to fix it:\n\n', icon: '🐛' },
];

export default function AIAssistant() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [contextOpen, setContextOpen] = useState(false);
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [deployLog, setDeployLog] = useState('');
  const [showDeployAnalyzer, setShowDeployAnalyzer] = useState(false);
  const [showCommitGen, setShowCommitGen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const c = localStorage.getItem(CONVERSATIONS_KEY);
      if (c) {
        const parsed = JSON.parse(c) as Conversation[];
        setConversations(parsed);
        if (parsed.length > 0) setActiveConversation(parsed[0]);
      }
    } catch { /* ignore */ }

    // Load projects
    void (async () => {
      try {
        const list = await window.devdash.projects.list();
        setProjects(list.map(p => ({ id: p.id, name: p.name })));
        if (list.length > 0 && !selectedProject) setSelectedProject(list[0].id);
      } catch { /* ignore */ }
    })();

    // Check Ollama availability
    void (async () => {
      try {
        const result = await window.devdash.ollama.listModels();
        setOllamaAvailable(result.ok);
      } catch {
        setOllamaAvailable(false);
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const createConversation = useCallback(() => {
    const projectName = projects.find(p => p.id === selectedProject)?.name || 'General';
    const conv: Conversation = {
      id: generateId(),
      projectId: selectedProject,
      projectName,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations(prev => [conv, ...prev]);
    setActiveConversation(conv);
    return conv;
  }, [selectedProject, projects]);

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversation?.id === id) {
      setActiveConversation(conversations.length > 1 ? conversations.find(c => c.id !== id) || null : null);
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    let conv = activeConversation;
    if (!conv) {
      conv = createConversation();
    }

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    const updatedConv = {
      ...conv,
      messages: [...conv.messages, userMsg],
      updatedAt: Date.now(),
    };
    setActiveConversation(updatedConv);
    setConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c));
    setInput('');
    setIsStreaming(true);

    // Try to use Ollama/AI
    try {
      const messages = updatedConv.messages.map(m => ({ role: m.role, content: m.content }));
      const settings = await window.devdash.settings.get();

      let responseContent = '';

      // Try the unified AI provider first
      try {
        const result = await window.devdash.ai.chat(messages, { temperature: settings.ollamaTemperature || 0.7 });
        if (result.ok) {
          responseContent = result.content;
        } else {
          throw new Error(result.error || 'AI chat failed');
        }
      } catch {
        // Fallback to Ollama
        if (ollamaAvailable) {
          const streamId = generateId();
          const result = await window.devdash.ollama.chat({
            streamId,
            chatId: updatedConv.id,
            model: settings.ollamaDefaultModel || 'llama3',
            messages,
            temperature: settings.ollamaTemperature || 0.7,
            systemPrompt: settings.ollamaSystemPrompt || 'You are a helpful AI development assistant.',
          });
          if (result.ok && result.content) {
            responseContent = result.content;
          } else {
            responseContent = generateFallbackResponse(text);
          }
        } else {
          responseContent = generateFallbackResponse(text);
        }
      }

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
      };

      const finalConv = {
        ...updatedConv,
        messages: [...updatedConv.messages, assistantMsg],
        updatedAt: Date.now(),
      };
      setActiveConversation(finalConv);
      setConversations(prev => prev.map(c => c.id === finalConv.id ? finalConv : c));
    } catch {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please check your AI settings and try again.',
        timestamp: Date.now(),
      };
      const finalConv = {
        ...updatedConv,
        messages: [...updatedConv.messages, errorMsg],
        updatedAt: Date.now(),
      };
      setActiveConversation(finalConv);
      setConversations(prev => prev.map(c => c.id === finalConv.id ? finalConv : c));
    }

    setIsStreaming(false);
  }, [activeConversation, isStreaming, createConversation, ollamaAvailable]);

  const generateFallbackResponse = (query: string): string => {
    const lower = query.toLowerCase();
    if (lower.includes('deploy') && lower.includes('fail')) {
      return "Based on common deploy failures, here are likely causes:\n\n1. **Build errors** — Check for TypeScript/compilation errors\n2. **Missing env vars** — Verify all required environment variables are set\n3. **Dependency issues** — Run `npm ci` to ensure clean install\n4. **Memory limits** — Build might exceed platform memory limits\n\nCheck your deploy logs in the Deploys tab for specific error messages.";
    }
    if (lower.includes('commit') && lower.includes('message')) {
      return "Here's a suggested commit message format:\n\n```\nfeat(scope): brief description\n\n- Detail about what changed\n- Why it changed\n- Any breaking changes\n```\n\nUse conventional commits: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`";
    }
    if (lower.includes('performance')) {
      return "Here are common performance improvements:\n\n1. **Code splitting** — Lazy load routes and heavy components\n2. **Image optimization** — Use WebP, proper sizing, lazy loading\n3. **Bundle analysis** — Check for large dependencies\n4. **Caching** — Implement proper cache headers\n5. **Database** — Add indexes, optimize queries\n\nRun the Performance tab for detailed metrics.";
    }
    return "I can help with:\n\n- Analyzing deploy failures\n- Generating commit messages\n- Code review suggestions\n- Performance optimization\n- Error explanations\n\nConnect Ollama or configure an AI provider in Settings for full AI capabilities. What would you like help with?";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const applyPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Code blocks
      if (line.startsWith('```')) {
        return <span key={i} className="text-[#666]">{line}</span>;
      }
      // Headers
      if (line.startsWith('# ')) return <span key={i} className="font-bold text-white block mt-2">{line.slice(2)}</span>;
      if (line.startsWith('## ')) return <span key={i} className="font-semibold text-white block mt-1.5">{line.slice(3)}</span>;
      // Bold
      const boldProcessed = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      // Code inline
      const codeProcessed = boldProcessed.replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-[#1a1a1a] text-[#0070F3] text-[11px] font-mono">$1</code>');
      // List items
      if (line.startsWith('- ') || line.match(/^\d+\./)) {
        return <span key={i} className="block pl-3" dangerouslySetInnerHTML={{ __html: codeProcessed }} />;
      }
      return <span key={i} className="block" dangerouslySetInnerHTML={{ __html: codeProcessed }} />;
    });
  };

  // No AI available screen
  if (!ollamaAvailable) {
    // Still show the UI but with a notice
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${ollamaAvailable ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            {ollamaAvailable ? 'AI Connected' : 'Fallback Mode'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Project selector */}
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="rounded border border-[#333] bg-[#0A0A0A] px-2 py-1 text-xs text-white focus:border-[#0070F3] focus:outline-none"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={() => setContextOpen(!contextOpen)} className={`btn-soft text-xs ${contextOpen ? 'border-[#0070F3] text-[#0070F3]' : ''}`}>
            Context
          </button>
          <button onClick={() => setShowDeployAnalyzer(!showDeployAnalyzer)} className="btn-soft text-xs">
            Deploy Log
          </button>
          <button onClick={() => setShowCommitGen(!showCommitGen)} className="btn-soft text-xs">
            Commit Gen
          </button>
          <button onClick={createConversation} className="btn-primary text-xs">
            + New Chat
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-3">
        {/* Conversation list sidebar */}
        <div className="w-48 shrink-0 flex flex-col border-r border-[#222] pr-3 overflow-y-auto">
          <p className="text-[10px] text-[#555] mb-2 uppercase tracking-wider">Conversations</p>
          {conversations.length === 0 ? (
            <p className="text-xs text-[#444]">No conversations yet</p>
          ) : (
            <div className="flex flex-col gap-1">
              {conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveConversation(c)}
                  className={`text-left p-2 rounded text-xs transition-colors group ${activeConversation?.id === c.id ? 'bg-[#0070F3]/10 text-white border border-[#0070F3]/30' : 'text-[#888] hover:bg-[#111] border border-transparent'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{c.projectName}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                      className="opacity-0 group-hover:opacity-100 text-[#666] hover:text-red-400 text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                  <span className="text-[10px] text-[#555]">{c.messages.length} msgs</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Context panel */}
          {contextOpen && (
            <div className="mb-3 p-3 rounded border border-[#222] bg-[#0A0A0A] max-h-32 overflow-y-auto">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Project Context</p>
              {selectedProject ? (
                <div className="text-xs text-[#888] space-y-0.5">
                  <p>Project: <span className="text-white">{projects.find(p => p.id === selectedProject)?.name}</span></p>
                  <p>Recent deploys, errors, and file structure are included in AI context</p>
                </div>
              ) : (
                <p className="text-xs text-[#555]">Select a project to include context</p>
              )}
            </div>
          )}

          {/* Deploy log analyzer */}
          {showDeployAnalyzer && (
            <div className="mb-3 p-3 rounded border border-[#222] bg-[#0A0A0A]">
              <p className="text-xs text-[#888] mb-2">Paste deploy log for AI analysis:</p>
              <textarea
                value={deployLog}
                onChange={e => setDeployLog(e.target.value)}
                placeholder="Paste your deploy log here..."
                className="w-full h-20 rounded border border-[#333] bg-[#111] px-3 py-2 text-xs text-white placeholder-[#555] focus:border-[#0070F3] focus:outline-none resize-none font-mono"
              />
              <button
                onClick={() => { if (deployLog.trim()) { void sendMessage(`Analyze this deploy log and summarize the issues:\n\n${deployLog}`); setShowDeployAnalyzer(false); setDeployLog(''); } }}
                className="btn-primary text-xs mt-2"
              >
                Analyze
              </button>
            </div>
          )}

          {/* Commit message generator */}
          {showCommitGen && (
            <div className="mb-3 p-3 rounded border border-[#222] bg-[#0A0A0A]">
              <p className="text-xs text-[#888] mb-2">Generate commit message from changes:</p>
              <button
                onClick={() => { void sendMessage('Generate a conventional commit message for my current staged changes. Suggest a concise, descriptive message following the format: type(scope): description'); setShowCommitGen(false); }}
                className="btn-primary text-xs"
              >
                Generate from Git Diff
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-3 space-y-3">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="text-center">
                  <p className="text-sm text-[#666]">Start a conversation with AI Assistant</p>
                  <p className="text-xs text-[#444] mt-1">Ask about your projects, debug issues, or get suggestions</p>
                  {!ollamaAvailable && (
                    <p className="text-xs text-yellow-400 mt-2">Connect Ollama or configure an AI provider in Settings for full capabilities</p>
                  )}
                </div>
                {/* Suggested prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                  {SUGGESTED_PROMPTS.map(sp => (
                    <button
                      key={sp.label}
                      onClick={() => applyPrompt(sp.prompt)}
                      className="text-left p-3 rounded border border-[#222] bg-[#111] hover:border-[#333] transition-colors"
                    >
                      <span className="text-sm mr-1.5">{sp.icon}</span>
                      <span className="text-xs text-[#ccc]">{sp.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {activeConversation.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-[#0070F3] text-white' : 'bg-[#111] border border-[#222] text-[#ccc]'}`}>
                      <div className="text-xs leading-relaxed whitespace-pre-wrap">
                        {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                      </div>
                      <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-[#555]'}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                      {msg.role === 'assistant' && (
                        <div className="flex gap-2 mt-1.5 pt-1.5 border-t border-[#222]">
                          <button
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="text-[10px] text-[#555] hover:text-white"
                          >
                            Copy
                          </button>
                          <button className="text-[10px] text-[#555] hover:text-[#0070F3]">
                            Auto-fix
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="bg-[#111] border border-[#222] rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#444] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-[#444] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-[#444] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-[#222] pt-3">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStreaming ? 'Waiting for response...' : 'Ask about your project...'}
                disabled={isStreaming}
                rows={2}
                className="flex-1 rounded border border-[#333] bg-[#0A0A0A] px-3 py-2 text-sm text-white placeholder-[#555] focus:border-[#0070F3] focus:outline-none resize-none disabled:opacity-50"
              />
              <button
                onClick={() => void sendMessage(input)}
                disabled={isStreaming || !input.trim()}
                className="btn-primary self-end px-4 py-2 disabled:opacity-50"
              >
                Send
              </button>
            </div>
            <p className="text-[10px] text-[#444] mt-1">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  );
}
