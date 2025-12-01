
import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Server, Cpu, Key, Globe, ShieldCheck } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    model: 'gemini-2.5-flash',
    apiMode: 'official',
    userApiKey: '',
    proxyUrl: '',
    proxyApiKey: ''
  });

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('app_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({
            model: parsed.model || 'gemini-2.5-flash',
            apiMode: parsed.apiMode || 'official',
            userApiKey: parsed.userApiKey || '',
            proxyUrl: parsed.proxyUrl || '',
            proxyApiKey: parsed.proxyApiKey || ''
        });
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    onClose();
    if (window.confirm('设置已保存。是否刷新页面以确保生效？')) {
        window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[2rem] w-full max-w-md shadow-2xl border-4 border-white animate-fade-in-up overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">设置中心</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* API Mode Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
             <button 
               onClick={() => setSettings({ ...settings, apiMode: 'official' })}
               className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${settings.apiMode === 'official' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <ShieldCheck className="w-4 h-4" />
               官方接口
             </button>
             <button 
               onClick={() => setSettings({ ...settings, apiMode: 'proxy' })}
               className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${settings.apiMode === 'proxy' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <Globe className="w-4 h-4" />
               代理接口
             </button>
          </div>

          {/* Conditional Inputs */}
          {settings.apiMode === 'official' ? (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                使用 Google 官方 API。如果你有科学上网环境，推荐使用此模式。
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Key className="w-4 h-4 text-amber-500" />
                  API Key (密钥)
                </label>
                <input
                  type="password"
                  value={settings.userApiKey}
                  onChange={(e) => setSettings({ ...settings, userApiKey: e.target.value })}
                  placeholder="输入你的 Gemini API Key (可选)..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all"
                />
                <p className="text-xs text-gray-400">如果不填，将尝试使用系统默认 Key (Env)。</p>
              </div>
            </div>
          ) : (
             <div className="space-y-4 animate-fade-in">
              <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-sm text-green-800">
                使用第三方代理或中转服务。适合国内直连访问。
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Server className="w-4 h-4 text-green-500" />
                  代理地址 (Base URL)
                </label>
                <input
                  type="text"
                  value={settings.proxyUrl}
                  onChange={(e) => setSettings({ ...settings, proxyUrl: e.target.value })}
                  placeholder="https://open.cherryin.net"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none transition-all"
                />
                <p className="text-xs text-gray-400">填写代理服务商提供的基础地址</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Key className="w-4 h-4 text-amber-500" />
                  代理 API Key
                </label>
                <input
                  type="password"
                  value={settings.proxyApiKey}
                  onChange={(e) => setSettings({ ...settings, proxyApiKey: e.target.value })}
                  placeholder="输入代理服务商提供的 Key..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none transition-all"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 pt-0 mt-auto flex-shrink-0">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-ink-900 text-white rounded-2xl font-bold shadow-lg shadow-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            保存配置
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
