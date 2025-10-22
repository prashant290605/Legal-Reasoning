import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MicOff } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  systemReady: boolean;
  getSuggestions: (query: string) => Promise<string[]>;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  systemReady,
  getSuggestions
}) => {
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && systemReady) {
      onSendMessage(message.trim());
      setMessage('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    if (value.trim().length > 2) {
      suggestionsTimeoutRef.current = setTimeout(async () => {
        try {
          const newSuggestions = await getSuggestions(value.trim());
          setSuggestions(newSuggestions);
          setShowSuggestions(newSuggestions.length > 0);
        } catch (error) {
          console.error('Failed to get suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
  };

  const handleFileUpload = () => {
    console.log('File upload clicked');
  };

  useEffect(() => {
    return () => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, []);

  const getPlaceholderText = () => {
    if (!systemReady) {
      return 'AI system is initializing...';
    }
    if (isLoading) {
      return 'Processing your query...';
    }
    return 'Ask your legal question here...';
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4 relative">
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={handleFileUpload}
            className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
            title="Upload document"
          >
            <Paperclip size={20} />
          </button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholderText()}
              disabled={!systemReady || isLoading}
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                !systemReady || isLoading
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-900'
              }`}
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>

          {/* Voice Recording Button */}
          <button
            type="button"
            onClick={handleVoiceToggle}
            className={`flex-shrink-0 p-3 rounded-lg transition-all duration-200 ${
              isRecording
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || !systemReady || isLoading}
            className={`flex-shrink-0 p-3 rounded-xl transition-all duration-200 ${
              message.trim() && systemReady && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <Send size={20} />
          </button>
        </form>

        {/* Status Text */}
        <div className="mt-2 text-center">
          {!systemReady ? (
            <p className="text-xs text-amber-600">
              🔄 AI system is initializing... Please wait.
            </p>
          ) : isLoading ? (
            <p className="text-xs text-blue-600">
              ⚡ Processing your legal query...
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
