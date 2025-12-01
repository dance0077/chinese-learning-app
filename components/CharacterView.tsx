import React, { useState } from 'react';
import { Search, Grid, Book, History, Type as TypeIcon } from 'lucide-react';
import { generateCharacterAnalysis } from '../services/geminiService';
import { CharacterData } from '../types';

const CharacterView: React.FC = () => {
  const [data, setData] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');

  const handleSearch = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setData(null);
    try {
      const result = await generateCharacterAnalysis(input);
      setData(result);
    } catch (error) {
      console.error(error);
      alert('解析失败，请检查输入是否正确');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
      {/* Compact Search Bar */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl md:rounded-3xl shadow-lg shadow-amber-50 border border-amber-100">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="输入一个汉字..." 
          maxLength={4}
          className="flex-1 p-3 md:px-6 text-lg md:text-xl bg-transparent outline-none placeholder-gray-400"
        />
        <button 
          onClick={handleSearch}
          disabled={loading || !input.trim()}
          className="px-6 md:px-8 bg-amber-500 hover:bg-amber-600 text-white rounded-xl md:rounded-2xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? '...' : '解析'}
        </button>
      </div>

      {data && (
        <div className="space-y-4 md:space-y-6 animate-fade-in">
          {/* Main Character Card */}
          <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-amber-100/50 overflow-hidden border border-paper-100">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 md:p-10 text-white flex flex-col items-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="text-base md:text-lg font-medium opacity-90 mb-2 md:mb-3 bg-black/10 px-4 py-1 rounded-full">拼音: {data.pinyin}</div>
              <div className="w-28 h-28 md:w-40 md:h-40 bg-white/20 backdrop-blur-md rounded-2xl md:rounded-3xl flex items-center justify-center border-2 border-white/40 shadow-inner">
                <span className="text-6xl md:text-8xl font-calligraphy leading-none drop-shadow-lg">{data.char}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
              <div className="p-4 md:p-6 text-center group hover:bg-amber-50 transition-colors">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 md:mb-2 font-bold">部首</div>
                <div className="text-xl md:text-3xl font-serif text-ink-900">{data.radical}</div>
              </div>
              <div className="p-4 md:p-6 text-center group hover:bg-amber-50 transition-colors">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 md:mb-2 font-bold">笔画</div>
                <div className="text-xl md:text-3xl font-serif text-ink-900">{data.strokes}</div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-4 md:gap-5">
            <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-paper-200">
              <h3 className="text-base md:text-lg font-bold text-amber-600 mb-2 md:mb-3 flex items-center gap-2">
                <div className="p-1 md:p-1.5 bg-amber-100 rounded-lg">
                  <Book className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                释义
              </h3>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed font-serif">{data.definition}</p>
            </div>

            <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-paper-200">
              <h3 className="text-base md:text-lg font-bold text-orange-600 mb-2 md:mb-3 flex items-center gap-2">
                <div className="p-1 md:p-1.5 bg-orange-100 rounded-lg">
                  <History className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                字源
              </h3>
              <p className="text-gray-700 leading-relaxed bg-paper-50 p-4 rounded-xl border border-paper-100 text-sm md:text-base">{data.etymology}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
               <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-paper-200">
                <h3 className="text-base md:text-lg font-bold text-purple-600 mb-3 md:mb-4 flex items-center gap-2">
                  <div className="p-1 md:p-1.5 bg-purple-100 rounded-lg">
                    <Grid className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  组词
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.vocabulary.map((word, i) => (
                    <span key={i} className="px-2.5 py-1.5 md:px-3 md:py-2 bg-purple-50 text-purple-700 rounded-lg md:rounded-xl text-xs md:text-sm font-bold cursor-default border border-purple-100">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
              
              {data.commonPhrases && data.commonPhrases.length > 0 && (
                <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-paper-200">
                  <h3 className="text-base md:text-lg font-bold text-blue-600 mb-3 md:mb-4 flex items-center gap-2">
                    <div className="p-1 md:p-1.5 bg-blue-100 rounded-lg">
                      <TypeIcon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    常用语
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    {data.commonPhrases.map((phrase, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm md:text-base">
                        <span className="text-blue-400 mt-1.5 text-xs">•</span>
                        <span>{phrase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-12 md:py-24 text-gray-400 bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-amber-100 mx-2 md:mx-4">
          <div className="bg-amber-50 w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Search className="w-8 h-8 md:w-12 md:h-12 text-amber-300" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-600">汉字侦探所</h3>
          <p className="text-sm md:text-lg mt-2">输入不认识的字，一键解析生僻字</p>
        </div>
      )}
    </div>
  );
};

export default CharacterView;