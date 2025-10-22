import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import Header from './components/Header';

const apiService = {
  baseUrl: 'http://localhost:8000',

  async processQuery(query: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/legal-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        query: data.query,
        answer: data.answer,
        legalContext: data.legalContext,
        followUps: data.followUps,
        timestamp: data.timestamp,
        processingInfo: data.processingInfo
      };
    } catch (error) {
      console.error('API Error:', error);
      throw new Error(`Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getSuggestions(query: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/suggestions?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Suggestions API Error:', error);
      return [];
    }
  },

  async checkStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Status check failed:', error);
      return { system_ready: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

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

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [systemReady, setSystemReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connecting' | 'connected' | 'initializing' | 'timeout' | 'error'>('checking');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        setConnectionStatus('connecting');
        
        const healthCheck = await apiService.checkHealth();
        
        if (healthCheck.status === 'healthy') {
          const statusCheck = await apiService.checkStatus();
          
          if (statusCheck.system_ready) {
            setSystemReady(true);
            setConnectionStatus('connected');
          } else {
            setConnectionStatus('initializing');
            
            const pollStatus = setInterval(async () => {
              const status = await apiService.checkStatus();
              if (status.system_ready) {
                setSystemReady(true);
                setConnectionStatus('connected');
                clearInterval(pollStatus);
              }
            }, 5000); // Check every 5 seconds
            
            setTimeout(() => {
              clearInterval(pollStatus);
              if (!systemReady) {
                setConnectionStatus('timeout');
              }
            }, 120000);
          }
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error('Failed to initialize system:', error);
        setConnectionStatus('error');
      }
    };
    
    initializeSystem();
    
    const savedChats = localStorage.getItem('nyayasahayak-chats');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, [systemReady]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('nyayasahayak-chats', JSON.stringify(chats));
    }
  }, [chats]);

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isLoading || !systemReady) return;

    if (!currentChatId) {
      const newChatId = Date.now();
      const newChat: Chat = {
        id: newChatId,
        title: query.length > 40 ? query.substring(0, 37) + '...' : query,
        timestamp: Date.now(),
        messages: []
      };
      
      setChats(prevChats => [newChat, ...prevChats]);
      setCurrentChatId(newChatId);
      setMessages([]);
    }

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: query,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiService.processQuery(query);
      
      const assistantMessage: Message = {
        id: response.id,
        type: 'assistant',
        content: response.answer,
        legalContext: response.legalContext,
        followUps: response.followUps,
        timestamp: response.timestamp,
        processingInfo: response.processingInfo
      };

      setMessages(prev => [...prev, assistantMessage]);

      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, userMessage, assistantMessage] }
            : chat
        )
      );

    } catch (error) {
      console.error('Error processing query:', error);
      
      const errorMessage: Message = {
        id: Date.now(),
        type: 'assistant',
        content: `I apologize, but I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease ensure the backend server is running and try again.`,
        isError: true,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleLoadChat = (chatId: number) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages || []);
    }
  };

  const handleFollowUpClick = (followUpQuery: string) => {
    handleSendMessage(followUpQuery);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* ChatGPT-style Toggle Button - Fixed at top-left corner */}
      <button
        onClick={handleToggleSidebar}
        className={`
          fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm
          hover:bg-gray-50 transition-all duration-200 group
          ${sidebarOpen ? 'left-[336px]' : 'left-4'}
        `}
        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        style={{
          transition: 'left 0.3s ease-in-out, background-color 0.2s ease-in-out'
        }}
      >
        {sidebarOpen ? (
          <X size={18} className="text-gray-600 group-hover:text-gray-800" />
        ) : (
          <Menu size={18} className="text-gray-600 group-hover:text-gray-800" />
        )}
      </button>

      {/* Sidebar */}
      <div className={`
        transition-all duration-300 ease-in-out overflow-hidden
        ${sidebarOpen ? 'w-80' : 'w-0'}
      `}>
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onLoadChat={handleLoadChat}
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
        />
      </div>

      {/* Main Content - Expands to full width when sidebar is closed */}
      <div className={`
        flex-1 flex flex-col transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'ml-0' : 'ml-0'}
      `}>
        {/* Header */}
        <Header 
          systemReady={systemReady} 
          connectionStatus={connectionStatus}
        />

        {/* Chat Window */}
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          onFollowUpClick={handleFollowUpClick}
          chats={chats}
          onNewChat={handleNewChat}
        />

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          systemReady={systemReady}
          getSuggestions={apiService.getSuggestions}
        />
      </div>
    </div>
  );
}

export default App;
