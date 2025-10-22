import React from 'react';
import { Scale, Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  systemReady: boolean;
  connectionStatus: 'checking' | 'connecting' | 'connected' | 'initializing' | 'timeout' | 'error';
}

const Header: React.FC<HeaderProps> = ({ systemReady, connectionStatus }) => {
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi size={16} className="text-green-500" />;
      case 'connecting':
      case 'initializing':
        return <Loader2 size={16} className="text-blue-500 animate-spin" />;
      case 'error':
      case 'timeout':
        return <WifiOff size={16} className="text-red-500" />;
      default:
        return <AlertCircle size={16} className="text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'initializing':
        return 'Initializing AI...';
      case 'error':
        return 'Connection Error';
      case 'timeout':
        return 'Connection Timeout';
      default:
        return 'Checking...';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
      case 'initializing':
        return 'text-blue-600';
      case 'error':
      case 'timeout':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Scale size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">NyayaSahayak</h1>
            <p className="text-sm text-gray-600">AI Legal Assistant</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          {systemReady && (
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">AI Ready</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
