'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { formatTime } from '@/lib/utils';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('query');

  const chatSession = useAppStore((state) => state.chatSession);
  const addChatMessage = useAppStore((state) => state.addChatMessage);
  const clearChatSession = useAppStore((state) => state.clearChatSession);
  const foodLogs = useAppStore((state) => state.foodLogs);
  const symptoms = useAppStore((state) => state.symptoms);
  const experiments = useAppStore((state) => state.experiments);
  const realizations = useAppStore((state) => state.realizations);
  const sources = useAppStore((state) => state.sources);

  const [input, setInput] = useState(queryParam || '');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatSession?.messages]);

  // Auto-send query if provided in URL
  useEffect(() => {
    if (queryParam && input && !chatSession?.messages.length) {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }
  }, [queryParam]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    addChatMessage({
      role: 'user',
      content: userMessage,
    });

    setIsLoading(true);

    try {
      // Prepare user data
      const userData = {
        foodLogs: foodLogs.slice(0, 50), // Last 50 entries
        symptoms: symptoms.slice(0, 50),
        experiments: experiments,
        realizations: realizations,
      };

      // Prepare chat history
      const chatHistory = chatSession?.messages || [];
      const updatedHistory = [
        ...chatHistory,
        { role: 'user' as const, content: userMessage },
      ];

      // Call API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          userData,
          chatHistory: chatHistory.slice(-10), // Last 10 messages for context
          sources: sources.filter(s => s.content).slice(0, 10), // Only send sources with content
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add assistant message
      addChatMessage({
        role: 'assistant',
        content: data.response,
      });
    } catch (error: any) {
      console.error('Chat error:', error);
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 max-w-2xl flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">AI Chat</h1>
        {chatSession && chatSession.messages.length > 0 && (
          <button
            onClick={clearChatSession}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Clear Chat
          </button>
        )}
      </div>

      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> This AI has access to all your logged data and remembers our conversation. It can help you understand patterns, but cannot provide medical advice. Always consult healthcare professionals for medical concerns.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {(!chatSession || chatSession.messages.length === 0) ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Start a conversation! Ask me about:
            </p>
            <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside space-y-1">
              <li>Patterns in your food and symptom logs</li>
              <li>&quot;What should I stop eating?&quot; or &quot;What should I start eating?&quot;</li>
              <li>&quot;Is my digestion relatively good?&quot;</li>
              <li>Help organizing your realizations</li>
              <li>Questions about your diet experiments</li>
              <li>Summary of recent entries</li>
            </ul>
          </div>
        ) : (
          chatSession.messages.map((message) => {
            // Ensure timestamp is a Date object
            const timestamp = message.timestamp instanceof Date 
              ? message.timestamp 
              : new Date(message.timestamp);
            
            return (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold opacity-75">
                    {message.role === 'user' ? 'You' : 'AI'}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user'
                      ? 'text-primary-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {formatTime(timestamp)}
                </p>
              </div>
              </div>
            );
          })
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-gray-500 dark:text-gray-400">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me about your data..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-2xl mx-auto px-4 py-6"><p>Loading...</p></div>}>
      <ChatPageContent />
    </Suspense>
  );
}


