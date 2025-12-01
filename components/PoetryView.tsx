import React, { useState } from 'react';
import { Feather, Search, Sparkles, HelpCircle, CheckCircle, XCircle, ArrowRight, ChevronDown } from 'lucide-react';
import { generatePoetryAnalysis } from '../services/geminiService';
import { Poem } from '../types';

const PoetryView: React.FC = () => {
  const [poem, setPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (useRandom = false) => {
    // If not using random mode and query is empty, show alert
    if (!useRandom && !query.trim()) {
      alert('请输入诗名或作者');
      return;
    }
    
    setLoading(true);
    setPoem(null);
    setShowQuiz(false);
    setSelectedAnswers({});
    setShowResults(false);
    try {
      const q = useRandom ? '' : query;
      const data = await generatePoetryAnalysis(q);
      setPoem(data);
      if (useRandom) setQuery('');
    } catch (error) {
      console.error(error);
      alert('获取古诗失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId: number, optionIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const checkAnswers = () => {
    setShowResults(true);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Search Bar - Compact */}
      <div className="flex flex-col gap-3">
        <div className="bg-white p-2 rounded-full shadow-lg shadow-purple-50 border border-purple-100 flex items-center gap-2 pl-4">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="输入诗名或作者..." 
            className="flex-1 py-2 md:py-3 outline-none bg-transparent placeholder-gray-400 text-base md:text-lg"
          />
          <button 
            onClick={() => handleSearch(false)}
            disabled={loading}
            className="p-3 md:p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-all shadow-md active:scale-95 disabled:opacity-70 flex-shrink-0"
          >
            {loading ? <div className="animate-spin w-5 h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full" /> : <Search className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
        </div>

        <button 
          onClick={() => handleSearch(true)}
          disabled={loading}
          className="mx-auto text-sm md:text-base px-6 py-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 rounded-full font-bold border border-amber-200 flex items-center gap-2 active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>随机每日一诗</span>
        </button>
      </div>

      {/* Poem Display */}
      {poem && (
        <div className="relative animate-fade-in space-y-6">
          {/* Main Poem Card */}
          <div className="relative bg-paper-50 rounded-[2rem] md:rounded-[3rem] shadow-xl shadow-paper-200 border border-paper-200 overflow-hidden">
            {/* Header */}
            <div className="text-center pt-8 md:pt-12 pb-4 relative z-10 px-4">
              <h2 className="text-3xl md:text-5xl font-calligraphy text-ink-900 mb-3 tracking-wider">{poem.title}</h2>
              <div className="flex items-center justify-center gap-2">
                 <span className="px-2 py-0.5 bg-white/60 border border-paper-200 rounded-md text-xs md:text-sm font-medium text-gray-600">{poem.dynasty}</span>
                 <span className="text-base md:text-lg font-serif font-bold text-gray-700">{poem.author}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 md:px-16 pb-8 md:pb-12 relative z-10">
              <div className="text-center space-y-4 md:space-y-6 mb-8 md:mb-12 bg-white/40 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/50 shadow-sm backdrop-blur-sm">
                {poem.content.map((line, idx) => (
                  <p key={idx} className="text-xl md:text-3xl font-serif text-ink-900 leading-relaxed tracking-widest">
                    {line}
                  </p>
                ))}
              </div>

              {/* Collapsible Details Sections */}
              <div className="space-y-3 md:space-y-4">
                <details className="group bg-white rounded-2xl md:rounded-3xl border border-paper-100 shadow-sm overflow-hidden">
                  <summary className="flex items-center justify-between p-4 md:p-6 cursor-pointer list-none bg-purple-50/30 hover:bg-purple-50 transition-colors">
                    <h3 className="text-base md:text-lg font-bold text-purple-700 flex items-center gap-2">
                      <div className="p-1 md:p-1.5 bg-purple-100 rounded-lg">
                        <Feather className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </div>
                      查看译文
                    </h3>
                    <ChevronDown className="w-5 h-5 text-purple-300 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-4 md:p-6 pt-0 border-t border-purple-50/50">
                    <p className="text-gray-700 leading-loose font-serif text-base md:text-lg mt-3">
                      {poem.translation}
                    </p>
                  </div>
                </details>

                <details className="group bg-white rounded-2xl md:rounded-3xl border border-paper-100 shadow-sm overflow-hidden">
                  <summary className="flex items-center justify-between p-4 md:p-6 cursor-pointer list-none bg-amber-50/30 hover:bg-amber-50 transition-colors">
                    <h3 className="text-base md:text-lg font-bold text-amber-700 flex items-center gap-2">
                      <div className="p-1 md:p-1.5 bg-amber-100 rounded-lg">
                        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </div>
                      古诗赏析
                    </h3>
                    <ChevronDown className="w-5 h-5 text-amber-300 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-4 md:p-6 pt-0 border-t border-amber-50/50">
                    <div className="text-gray-700 leading-loose text-justify text-base md:text-lg mt-3">
                      {poem.analysis}
                    </div>
                  </div>
                </details>
              </div>
            </div>

             {/* Quiz Toggle */}
            {!showQuiz && (
              <button 
                className="w-full bg-purple-50 hover:bg-purple-100 p-4 md:p-6 text-center border-t border-purple-100 transition-colors flex items-center justify-center gap-2 group"
                onClick={() => {
                  setShowQuiz(true);
                  setTimeout(() => {
                    const el = document.getElementById('poem-quiz');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                 <span className="text-purple-800 font-bold text-base md:text-lg group-hover:scale-105 transition-transform">背熟了吗？来做个小测试</span>
                 <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* Quiz Section */}
          {showQuiz && poem.questions && (
            <div id="poem-quiz" className="animate-fade-in-up space-y-4 md:space-y-6 pb-8">
               <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="bg-stamp-500 text-white p-1.5 md:p-2 rounded-lg rotate-6 shadow-md">
                     <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-ink-900">古诗闯关</h3>
               </div>

               <div className="grid gap-4 md:gap-5">
                  {poem.questions.map((q, qIndex) => (
                    <div key={q.id} className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-purple-50">
                      <p className="font-bold text-base md:text-lg text-ink-900 mb-3">{qIndex + 1}. {q.question}</p>
                      <div className="space-y-2 md:space-y-3">
                         {q.options.map((opt, optIndex) => {
                           let btnClass = "w-full text-left p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all flex items-center justify-between text-sm md:text-base ";
                           if (showResults) {
                             if (optIndex === q.correctAnswerIndex) btnClass += "bg-green-50 border-green-400 text-green-700";
                             else if (selectedAnswers[q.id] === optIndex) btnClass += "bg-red-50 border-red-400 text-red-700";
                             else btnClass += "bg-gray-50 border-transparent text-gray-400";
                           } else {
                             if (selectedAnswers[q.id] === optIndex) btnClass += "bg-purple-50 border-purple-400 text-purple-700 font-bold";
                             else btnClass += "bg-white border-gray-100 hover:bg-purple-50 hover:border-purple-200 text-gray-600";
                           }

                           return (
                             <button
                               key={optIndex}
                               onClick={() => handleOptionSelect(q.id, optIndex)}
                               disabled={showResults}
                               className={btnClass}
                             >
                               <span>{String.fromCharCode(65+optIndex)}. {opt}</span>
                               {showResults && optIndex === q.correctAnswerIndex && <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />}
                               {showResults && selectedAnswers[q.id] === optIndex && optIndex !== q.correctAnswerIndex && <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />}
                             </button>
                           )
                         })}
                      </div>
                      {showResults && (
                        <div className="mt-3 text-sm text-gray-700 bg-amber-50 p-3 md:p-4 rounded-xl border border-amber-100">
                          <span className="font-bold text-amber-600">💡 解析：</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
               </div>

               {!showResults && (
                 <div className="sticky bottom-20 md:static flex justify-center pt-2 md:pt-4 z-30 pointer-events-none">
                    <button 
                      onClick={checkAnswers}
                      disabled={Object.keys(selectedAnswers).length < poem.questions.length}
                      className="pointer-events-auto px-8 py-3 md:px-10 md:py-4 bg-stamp-500 text-white rounded-full font-bold hover:bg-red-500 shadow-xl shadow-red-200 transition-transform active:scale-95 disabled:opacity-50 w-full md:w-auto text-lg"
                    >
                      提交答案
                    </button>
                 </div>
               )}
            </div>
          )}
        </div>
      )}

       {!poem && !loading && (
        <div className="text-center py-12 md:py-24 text-gray-400 bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-purple-100 mx-2 md:mx-4">
          <div className="bg-purple-50 w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Feather className="w-8 h-8 md:w-12 md:h-12 text-purple-300" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-600">每日一诗</h3>
          <p className="mt-2 text-sm md:text-base">品味经典古诗词，感受文化之美</p>
        </div>
      )}
    </div>
  );
};

export default PoetryView;