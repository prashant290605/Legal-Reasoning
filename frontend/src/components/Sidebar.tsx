import React from 'react';
import { Plus, MessageSquare, Trash2, Clock } from 'lucide-react';

interface Chat {
  id: number;
  title: string;
  timestamp: number;
  messages: any[];
}

interface SidebarProps {
  chats: Chat[];
  currentChatId: number | null;
  onNewChat: () => void;
  onLoadChat: (chatId: number) => void;
  isOpen: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  currentChatId,
  onNewChat,
  onLoadChat,
  isOpen
}) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 font-medium"
        >
          <Plus size={18} />
          <span>New Legal Query</span>
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No previous consultations</p>
            <p className="text-xs text-gray-400 mt-1">Start a new legal query to begin</p>
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onLoadChat(chat.id)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-all duration-200 group hover:bg-gray-50 ${
                  currentChatId === chat.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium truncate ${
                      currentChatId === chat.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {chat.title}
                    </h4>
                    <div className="flex items-center space-x-1 mt-1">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(chat.timestamp)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all duration-200"
                  >
                    <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">NyayaSahayak</h3>
          <p className="text-xs text-gray-600">AI Legal Assistant</p>
          <div className="mt-2 flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500">System Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
