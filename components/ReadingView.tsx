import React, { useState, useCallback } from 'react';
import { BookOpen, RefreshCw, CheckCircle, XCircle, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';
import { GradeLevel, ReadingArticle } from '../types';
import { generateReadingComprehension } from '../services/geminiService';

const ReadingView: React.FC = () => {
  const [article, setArticle] = useState<ReadingArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const [grade, setGrade] = useState<GradeLevel>(GradeLevel.THREE);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showQuestions, setShowQuestions] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const fetchArticle = useCallback(async (isRandom = false) => {
    setLoading(true);
    setArticle(null);
    setSelectedAnswers({});
    setShowQuestions(false);
    setShowResults(false);
    
    const queryGrade = isRandom 
      ? Object.values(GradeLevel)[Math.floor(Math.random() * Object.values(GradeLevel).length)]
      : grade;
      
    if (isRandom) setGrade(queryGrade);

    try {
      const data = await generateReadingComprehension(queryGrade, '');
      setArticle(data);
    } catch (error) {
      console.error(error);
      alert('生成文章失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [grade]);

  const handleFinishReading = () => {
    setShowQuestions(true);
    setTimeout(() => {
      const element = document.getElementById('questions-section');
      element?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleOptionSelect = (questionId: number, optionIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const checkAnswers = () => {
    setShowResults(true);
    setTimeout(() => {
        const element = document.getElementById('questions-section');
        element?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Controls - More compact on mobile */}
      <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border-2 border-blue-50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
             {Object.values(GradeLevel).map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap border ${
                    grade === g 
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                      : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200'
                  }`}
                >
                  {g}
                </button>
              ))}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => fetchArticle(false)} 
              disabled={loading}
              className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold shadow-blue-100 shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 text-sm md:text-base"
            >
              {loading ? <RefreshCw className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <BookOpen className="w-4 h-4 md:w-5 md:h-5" />}
              {loading ? '准备中' : '开始阅读'}
            </button>
            <button 
              onClick={() => fetchArticle(true)} 
              disabled={loading}
              className="px-4 py-3 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-2xl font-bold shadow-amber-50 shadow-lg active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
              <span>随机挑战</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {article && (
        <div className="space-y-6">
          {/* Article Card */}
          <div className="bg-white p-5 md:p-10 rounded-3xl shadow-xl shadow-blue-50 border border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
            
            <div className="mb-4 md:mb-8 text-center mt-2">
              <h2 className="text-xl md:text-3xl font-serif font-bold text-ink-900 mb-2">{article.title}</h2>
              {article.author && (
                <div className="inline-block px-3 py-0.5 bg-gray-50 rounded-lg text-gray-500 text-xs md:text-sm font-medium">
                  {article.author}
                </div>
              )}
            </div>
            
            <div className="prose prose-lg md:prose-xl max-w-none text-ink-800 leading-relaxed font-serif text-justify whitespace-pre-wrap bg-paper-50 p-4 md:p-8 rounded-2xl border border-paper-100 text-base md:text-lg">
              {article.content}
            </div>

            {!showQuestions && (
              <div className="mt-6 md:mt-10 flex justify-center">
                <button
                  onClick={handleFinishReading}
                  className="w-full md:w-auto px-8 py-3 bg-ink-900 hover:bg-ink-800 text-white rounded-full font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>我读完了，去答题</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Questions Section */}
          {showQuestions && (
            <div id="questions-section" className="space-y-4 md:space-y-6 animate-fade-in-up pb-8">
              <div className="flex items-center gap-2 px-1">
                <HelpCircle className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg md:text-2xl font-black text-ink-900">闯关挑战</h3>
              </div>
              
              <div className="grid gap-4 md:gap-6">
                {article.questions.map((q, qIndex) => (
                  <div key={q.id} className="bg-white p-4 md:p-8 rounded-3xl border border-blue-50 shadow-sm">
                    <div className="flex gap-3 mb-4">
                      <span className="bg-blue-100 text-blue-600 w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-sm md:text-lg font-black flex-shrink-0 mt-0.5">
                        {qIndex + 1}
                      </span>
                      <p className="font-bold text-base md:text-xl text-ink-900 leading-snug">
                        {q.question}
                      </p>
                    </div>

                    <div className="space-y-2 md:space-y-3 pl-0 md:pl-11">
                      {q.options.map((opt, optIndex) => {
                        let btnClass = "w-full text-left p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group text-sm md:text-base ";
                        
                        if (showResults) {
                          if (optIndex === q.correctAnswerIndex) {
                            btnClass += "bg-green-50 border-green-400 text-green-700 font-bold";
                          } else if (selectedAnswers[q.id] === optIndex) {
                            btnClass += "bg-red-50 border-red-400 text-red-700";
                          } else {
                            btnClass += "bg-white border-transparent opacity-50";
                          }
                        } else {
                          if (selectedAnswers[q.id] === optIndex) {
                            btnClass += "bg-blue-50 border-blue-400 text-blue-700 ring-1 ring-blue-400 font-bold";
                          } else {
                            btnClass += "bg-white border-gray-100 active:bg-gray-50 text-gray-600";
                          }
                        }

                        return (
                          <button
                            key={optIndex}
                            onClick={() => handleOptionSelect(q.id, optIndex)}
                            disabled={showResults}
                            className={btnClass}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 md:w-8 md:h-8 rounded-full border flex items-center justify-center text-xs md:text-sm font-bold transition-colors ${selectedAnswers[q.id] === optIndex ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-400 bg-white'}`}>
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {showResults && optIndex === q.correctAnswerIndex && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                            {showResults && selectedAnswers[q.id] === optIndex && optIndex !== q.correctAnswerIndex && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    
                    {showResults && (
                      <div className="mt-4 md:mt-6 md:ml-11 p-4 bg-amber-50 rounded-xl text-ink-800 border border-amber-100 animate-fade-in text-sm md:text-base">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-amber-800">老师解析：</span>
                            <span className="text-gray-700 ml-1">{q.explanation}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!showResults && (
                <div className="sticky bottom-20 md:static flex justify-center pt-4 md:pt-8 z-30 pointer-events-none">
                  <button
                    onClick={checkAnswers}
                    disabled={Object.keys(selectedAnswers).length < article.questions.length}
                    className="pointer-events-auto w-full md:w-auto px-8 py-3 md:px-12 md:py-4 bg-gradient-to-r from-stamp-500 to-red-500 text-white text-lg md:text-xl rounded-full font-bold shadow-xl shadow-red-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-6 h-6" />
                    提交答案
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {!article && !loading && (
        <div className="text-center py-12 md:py-24 bg-white rounded-[2rem] border-2 border-dashed border-blue-100 shadow-sm mx-2 md:mx-4">
          <div className="bg-blue-50 w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 animate-bounce-slow">
            <BookOpen className="w-10 h-10 md:w-14 md:h-14 text-blue-400" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-ink-900 mb-2">准备好开始阅读了吗？</h3>
          <p className="text-gray-400 mb-8 text-sm md:text-lg px-4">选择年级，点击开始，开启你的阅读之旅！</p>
          <button 
            onClick={() => fetchArticle(true)}
            className="px-6 py-3 bg-white border-2 border-blue-200 hover:border-blue-400 text-blue-600 rounded-full font-bold transition-all shadow-sm active:bg-blue-50 flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            试试手气 (随机一篇)
          </button>
        </div>
      )}
    </div>
  );
};

export default ReadingView;