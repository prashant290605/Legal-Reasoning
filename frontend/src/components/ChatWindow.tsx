import React, { useEffect, useRef, useState } from 'react';
import { User, Bot, ThumbsUp, ThumbsDown, Scale, BookOpen, Gavel, ChevronRight, TrendingUp, Sparkles, Cpu } from 'lucide-react';

interface Chat {
  id: number;
  title: string;
  timestamp: number;
  messages: Message[];
}

interface Message {
  id: string | number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  legalContext?: any;
  followUps?: string[];
  processingInfo?: any;
  isError?: boolean;
}

interface WelcomeScreenProps {
  chats: Chat[];
  onNewChat: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ chats, onNewChat }) => {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const hasActivity = chats.length > 0;

  const handleSuggestionClick = (suggestion: string) => {
    console.log('Suggestion clicked:', suggestion);
  };

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-radial from-blue-50/20 via-slate-50/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="max-w-4xl w-full text-center animate-fade-in">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-4 sm:mb-6 tracking-tight px-4 sm:px-0">
            {greeting}! Welcome to NyayaSahayak
          </h1>
          
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8 px-4 sm:px-0">
            <p className="text-gray-700 text-center mt-4 text-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 mr-2" /> AI Analysis &nbsp;&nbsp; | &nbsp;&nbsp; <BookOpen className="w-5 h-5 mr-2" /> Case Law Research &nbsp;&nbsp; | &nbsp;&nbsp; <Gavel className="w-5 h-5 mr-2" /> Expert Guidance
            </p>
          </div>
        </div>
      </div>

      {!hasActivity && (
        <div className="p-4 sm:p-8 pt-0 relative">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up text-center" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <TrendingUp size={20} className="text-blue-600" />
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Suggested Questions</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4 sm:mb-6 leading-relaxed">
                Get started with these commonly asked legal questions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => handleSuggestionClick("What are my rights under Article 21?")}
                  className="p-3 bg-slate-50 hover:bg-blue-50 rounded-xl text-sm text-slate-700 hover:text-blue-700 transition-all duration-200 text-left hover:shadow-sm border border-slate-100 hover:border-blue-200 min-h-[48px] flex items-center"
                >
                  What are my rights under Article 21?
                </button>
                <button 
                  onClick={() => handleSuggestionClick("How to register property in India?")}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl text-sm text-slate-700 hover:text-emerald-700 transition-all duration-200 text-left hover:shadow-sm border border-slate-100 hover:border-emerald-200 min-h-[48px] flex items-center"
                >
                  How to register property in India?
                </button>
                <button 
                  onClick={() => handleSuggestionClick("Grounds for divorce in Hindu Marriage Act")}
                  className="p-3 bg-slate-50 hover:bg-indigo-50 rounded-xl text-sm text-slate-700 hover:text-indigo-700 transition-all duration-200 text-left hover:shadow-sm border border-slate-100 hover:border-indigo-200 min-h-[48px] flex items-center"
                >
                  Grounds for divorce in Hindu Marriage Act
                </button>
                <button 
                  onClick={() => handleSuggestionClick("What makes a contract enforceable?")}
                  className="p-3 bg-slate-50 hover:bg-amber-50 rounded-xl text-sm text-slate-700 hover:text-amber-700 transition-all duration-200 text-left hover:shadow-sm border border-slate-100 hover:border-amber-200 min-h-[48px] flex items-center"
                >
                  What makes a contract enforceable?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TypingIndicator: React.FC = () => (
  <div className="flex items-start space-x-3 animate-fade-in">
    <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
      <Bot size={16} className="text-white" />
    </div>
    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-lg p-4 shadow-sm">
      <div className="flex items-center space-x-2 mb-2">
        <Sparkles size={12} className="text-blue-500 animate-pulse" />
        <span className="text-xs font-medium text-gray-600">AI is analyzing your legal query...</span>
      </div>
      <div className="typing-indicator">
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
    </div>
  </div>
);

interface MessageProps {
  message: Message;
  onFollowUpClick: (followUpQuery: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, onFollowUpClick }) => {
  const isUser = message.type === 'user';

  const formatMessage = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h3 key={index} className="font-bold text-lg mb-4 mt-6 first:mt-0 text-gray-900">
            {line.replace(/\*\*/g, '')}
          </h3>
        );
      }
      if (line.startsWith('*') && line.endsWith('*')) {
        return (
          <h4 key={index} className="font-semibold text-base mb-3 mt-4 first:mt-0 text-gray-800">
            {line.replace(/\*/g, '')}
          </h4>
        );
      }
      if (line.trim() === '') {
        return <div key={index} className="h-3"></div>;
      }
      return (
        <p key={index} className="mb-2 last:mb-0 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className={`flex items-start space-x-4 animate-slide-up ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
        isUser ? 'bg-gray-700' : 'bg-gray-900'
      }`}>
        {isUser ? (
          <User size={18} className="text-white" />
        ) : (
          <Bot size={18} className="text-white" />
        )}
      </div>

      <div className={`max-w-4xl ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        {!isUser && (
          <div className="flex items-center space-x-2 mb-3">
            <Scale size={14} className="text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">NyayaSahayak AI</span>
            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Legal Expert
            </div>
          </div>
        )}

        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
          {formatMessage(message.content)}
        </div>

        {!isUser && message.followUps && message.followUps.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles size={16} className="text-blue-500" />
              <p className="text-sm font-semibold text-gray-700">Related Questions:</p>
            </div>
            {message.followUps.slice(0, 3).map((followUp, index) => (
              <button
                key={index}
                onClick={() => onFollowUpClick(followUp)}
                className="block w-full text-left p-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-xl text-sm text-gray-700 hover:text-gray-900 transition-all duration-300 group shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className="line-clamp-2 flex-1 font-medium">{followUp}</span>
                  <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-3 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        )}

        {!isUser && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500 font-medium">Was this helpful?</span>
              <button className="p-2 hover:bg-green-50 rounded-lg transition-all duration-200 hover-lift">
                <ThumbsUp size={16} className="text-gray-400 hover:text-green-600" />
              </button>
              <button className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200 hover-lift">
                <ThumbsDown size={16} className="text-gray-400 hover:text-red-600" />
              </button>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
              Schedule Human Legal Consultation →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onFollowUpClick: (followUpQuery: string) => void;
  chats: Chat[];
  onNewChat: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onFollowUpClick, chats, onNewChat }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return <WelcomeScreen chats={chats} onNewChat={onNewChat} />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            onFollowUpClick={onFollowUpClick}
          />
        ))}
        
        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
