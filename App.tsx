import React, { useState } from 'react';
import { BookOpen, Feather, Search, GraduationCap, Image as ImageIcon, Settings } from 'lucide-react';
import ReadingView from './components/ReadingView';
import PoetryView from './components/PoetryView';
import CharacterView from './components/CharacterView';
import ImageCompositionView from './components/ImageCompositionView';
import DebugConsole from './components/DebugConsole';
import SettingsModal from './components/SettingsModal';
import { AppMode } from './types';

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
          <h3 className="text-red-800 font-bold mb-2">组件加载出错</h3>
          <p className="text-red-600 text-sm mb-4">请刷新页面重试,或检查调试控制台查看详细错误信息。</p>
          <pre className="text-xs bg-red-100 p-3 rounded overflow-auto">{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.READING);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen font-sans selection:bg-bamboo-200 selection:text-bamboo-900 pb-24 md:pb-12 bg-[#fff9f0]">
      
      <DebugConsole />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      {/* Header - Compact on mobile */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-paper-200 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 h-14 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 cursor-default">
            <div className="bg-gradient-to-br from-bamboo-400 to-bamboo-600 text-white p-1.5 md:p-2 rounded-xl md:rounded-2xl shadow-md">
              <GraduationCap className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-ink-900 tracking-tight font-calligraphy">语文大通关</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-2">
              <NavButton 
                active={mode === AppMode.READING} 
                onClick={() => setMode(AppMode.READING)} 
                icon={<BookOpen className="w-5 h-5" />}
                label="阅读闯关" 
                color="text-blue-600 bg-blue-50 hover:bg-blue-100 ring-blue-200"
              />
              <NavButton 
                active={mode === AppMode.POETRY} 
                onClick={() => setMode(AppMode.POETRY)} 
                icon={<Feather className="w-5 h-5" />}
                label="古诗寻宝" 
                color="text-purple-600 bg-purple-50 hover:bg-purple-100 ring-purple-200"
              />
               <NavButton 
                active={mode === AppMode.IMAGE_COMPOSITION} 
                onClick={() => setMode(AppMode.IMAGE_COMPOSITION)} 
                icon={<ImageIcon className="w-5 h-5" />}
                label="看图写话" 
                color="text-pink-600 bg-pink-50 hover:bg-pink-100 ring-pink-200"
              />
              <NavButton 
                active={mode === AppMode.CHARACTERS} 
                onClick={() => setMode(AppMode.CHARACTERS)} 
                icon={<Search className="w-5 h-5" />}
                label="汉字侦探" 
                color="text-amber-600 bg-amber-50 hover:bg-amber-100 ring-amber-200"
              />
            </nav>

            {/* Settings Button (Visible on both mobile and desktop) */}
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 md:p-3 rounded-full hover:bg-gray-100 text-gray-500 hover:text-ink-900 transition-colors"
              title="设置 (Settings)"
            >
              <Settings className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className={mode === AppMode.READING ? 'block animate-fade-in' : 'hidden'}>
          <ErrorBoundary>
            <ReadingView />
          </ErrorBoundary>
        </div>
        <div className={mode === AppMode.POETRY ? 'block animate-fade-in' : 'hidden'}>
          <ErrorBoundary>
            <PoetryView />
          </ErrorBoundary>
        </div>
        <div className={mode === AppMode.IMAGE_COMPOSITION ? 'block animate-fade-in' : 'hidden'}>
          <ErrorBoundary>
            <ImageCompositionView />
          </ErrorBoundary>
        </div>
        <div className={mode === AppMode.CHARACTERS ? 'block animate-fade-in' : 'hidden'}>
          <ErrorBoundary>
            <CharacterView />
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 pb-safe pt-2 px-4 flex justify-between items-end z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <MobileNavButton 
          active={mode === AppMode.READING} 
          onClick={() => setMode(AppMode.READING)} 
          icon={<BookOpen className="w-6 h-6" />}
          label="阅读"
          activeColor="text-blue-600"
        />
        <MobileNavButton 
          active={mode === AppMode.POETRY} 
          onClick={() => setMode(AppMode.POETRY)} 
          icon={<Feather className="w-6 h-6" />}
          label="古诗"
          activeColor="text-purple-600"
        />
        <div className="relative -top-5">
           <button 
             onClick={() => setMode(AppMode.IMAGE_COMPOSITION)}
             className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${mode === AppMode.IMAGE_COMPOSITION ? 'bg-pink-500 text-white scale-110' : 'bg-white text-pink-400 border border-pink-100'}`}
           >
             <ImageIcon className="w-7 h-7" />
           </button>
           <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap ${mode === AppMode.IMAGE_COMPOSITION ? 'text-pink-600' : 'text-gray-400'}`}>看图</span>
        </div>
        <MobileNavButton 
          active={mode === AppMode.CHARACTERS} 
          onClick={() => setMode(AppMode.CHARACTERS)} 
          icon={<Search className="w-6 h-6" />}
          label="汉字"
          activeColor="text-amber-600"
        />
      </div>

    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, color }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-bold whitespace-nowrap
      ${active 
        ? `${color} ring-2 shadow-sm transform scale-105` 
        : 'text-gray-500 hover:bg-gray-50 bg-transparent'}
    `}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MobileNavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; activeColor: string }> = ({ active, onClick, icon, label, activeColor }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 w-16 transition-all ${active ? activeColor : 'text-gray-400'}`}
  >
    <div className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
      {icon}
    </div>
    <span className="text-xs font-bold">{label}</span>
  </button>
);

export default App;