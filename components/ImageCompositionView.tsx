import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Sparkles, PenTool, Send, MessageCircle, Lightbulb, BookOpen, CheckCircle, Palette } from 'lucide-react';
import { generateImageCompositionTask, evaluateComposition } from '../services/geminiService';
import { ImageCompositionData, CompositionEvaluation } from '../types';

const ImageCompositionView: React.FC = () => {
  const [data, setData] = useState<ImageCompositionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [studentText, setStudentText] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<CompositionEvaluation | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setData(null);
    setEvaluation(null);
    setStudentText('');
    try {
      const result = await generateImageCompositionTask(customTopic);
      setData(result);
    } catch (error) {
      console.error(error);
      // alert handled in service
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!studentText.trim() || !data) return;
    setEvaluating(true);
    setEvaluation(null);
    try {
      const result = await evaluateComposition(studentText, data.topic);
      setEvaluation(result);
      setTimeout(() => {
         const el = document.getElementById('evaluation-result');
         el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error(error);
      // alert handled in service
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-10">
      {/* Header / Start Button */}
      <div className="text-center space-y-4 md:space-y-6">
        {!data && !loading && (
          <div className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-pink-200 shadow-sm mx-2 md:mx-4">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-8 animate-bounce-slow">
              <Palette className="w-10 h-10 md:w-14 md:h-14 text-pink-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-ink-900 mb-2 md:mb-4">AI 绘图写话大挑战</h2>
            <p className="text-gray-500 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-lg px-4">
              AI 老师会根据你的想法（或随机）画一幅画，你来写故事！
            </p>

            <div className="max-w-md mx-auto space-y-4">
               <div className="relative">
                 <input 
                  type="text" 
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="想写什么？(例如：小猫踢足球，留空则随机)"
                  className="w-full px-6 py-3 rounded-full border border-pink-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-50 outline-none text-center text-ink-800 placeholder-pink-200"
                 />
               </div>
               
               <button
                onClick={handleGenerate}
                className="w-full px-8 py-3 md:py-4 bg-pink-500 hover:bg-pink-600 text-white text-lg md:text-xl rounded-full font-bold shadow-xl shadow-pink-200 hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                {customTopic ? '开始生成图片' : '随机生成挑战'}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-16 md:py-24 flex flex-col items-center bg-white rounded-[2rem] border border-pink-100 shadow-sm mx-4">
            <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin mb-4 md:mb-6"></div>
            <p className="text-lg md:text-xl text-ink-900 font-bold mb-2">AI 正在努力绘画中...</p>
            <p className="text-sm md:text-base text-gray-400">正在生成独一无二的场景插图</p>
          </div>
        )}
      </div>

      {data && (
        <div className="space-y-6 md:space-y-8 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            {/* Image Section */}
            <div className="space-y-3 md:space-y-4">
              <div className="bg-white p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-gray-200 border border-gray-100">
                <div className="aspect-square bg-gray-50 rounded-[1rem] md:rounded-[1.5rem] overflow-hidden relative group">
                    <img 
                      src={data.imageUrl} 
                      alt={data.topic} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md">
                      AI Generated
                    </div>
                </div>
                <div className="mt-3 text-center pb-1">
                  <span className="inline-block px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm md:text-base font-bold border border-pink-100">
                    主题：{data.topic}
                  </span>
                </div>
              </div>

              <div className="text-center">
                 <button 
                  onClick={() => setData(null)}
                  className="px-4 py-2 text-gray-400 hover:text-pink-600 text-xs md:text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors bg-white hover:bg-pink-50 rounded-full border border-transparent hover:border-pink-100"
                 >
                   <ImageIcon className="w-3 h-3 md:w-4 md:h-4" /> 换一题 (重新生成)
                 </button>
              </div>
            </div>

            {/* Guide Section */}
            <div className="space-y-4 md:space-y-6">
              {/* Writing Compass */}
              <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-paper-100">
                <h3 className="text-base md:text-xl font-bold text-ink-900 mb-3 md:mb-5 flex items-center gap-2">
                  <div className="p-1 md:p-1.5 bg-amber-100 rounded-lg">
                    <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                  </div>
                  写话小锦囊
                </h3>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <TipCard label="⏰ 时间" text={data.tips.time} color="blue" />
                  <TipCard label="📍 地点" text={data.tips.location} color="green" />
                  <TipCard label="👤 人物" text={data.tips.characters} color="orange" />
                  <TipCard label="✨ 事情" text={data.tips.event} color="purple" />
                </div>
              </div>

              {/* Vocabulary Bank */}
              <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-paper-100">
                <h3 className="text-base md:text-xl font-bold text-ink-900 mb-3 md:mb-5 flex items-center gap-2">
                  <div className="p-1 md:p-1.5 bg-pink-100 rounded-lg">
                    <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-pink-600" />
                  </div>
                  词语百宝箱
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.vocabulary.map((word, i) => (
                    <span key={i} className="px-2.5 py-1.5 md:px-3.5 md:py-2 bg-pink-50 text-pink-700 rounded-lg md:rounded-xl text-xs md:text-sm font-bold border border-pink-100">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Writing Area */}
          <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-lg shadow-blue-50/50 border border-paper-100">
            <h3 className="text-lg md:text-xl font-bold text-ink-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
               <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                 <PenTool className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
               </div>
              小小作家展示台
            </h3>
            
            <textarea
              ref={textareaRef}
              value={studentText}
              onChange={(e) => setStudentText(e.target.value)}
              placeholder="请在这里写下你的故事... (记得用上百宝箱里的词语哦！)"
              className="w-full h-48 md:h-56 p-4 md:p-6 bg-paper-50 rounded-2xl md:rounded-3xl border-2 border-paper-100 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none text-base md:text-lg leading-relaxed resize-none mb-4 md:mb-6 font-serif text-ink-800 transition-all placeholder-gray-400"
            />
            
            <div className="flex justify-between items-center px-1">
              <span className="text-gray-400 text-xs md:text-sm font-medium">字数: {studentText.length}</span>
              <button
                onClick={handleSubmit}
                disabled={!studentText.trim() || evaluating}
                className="px-6 py-2.5 md:px-8 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full font-bold shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95 text-sm md:text-base"
              >
                {evaluating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    批改中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    提交批改
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Evaluation Result */}
          {evaluation && (
            <div id="evaluation-result" className="animate-fade-in-up bg-gradient-to-br from-white to-orange-50 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-orange-100 shadow-2xl relative overflow-hidden">
               {/* Decorative background */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
               
               <div className="flex flex-col md:flex-row gap-6 md:gap-10 relative z-10">
                 {/* Score */}
                 <div className="flex-shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-center bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-orange-100 w-full md:w-64">
                    <div className="text-xs md:text-base text-gray-500 font-bold md:mb-2 uppercase tracking-wide">本次得分</div>
                    <div className="text-5xl md:text-7xl font-black text-stamp-500 font-calligraphy md:mb-2">{evaluation.score}</div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Sparkles key={i} className={`w-4 h-4 md:w-5 md:h-5 ${i < Math.round(evaluation.score / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                 </div>

                 <div className="flex-1 space-y-4 md:space-y-8">
                    <div>
                      <h4 className="flex items-center gap-2 font-bold text-lg md:text-xl text-ink-900 mb-2 md:mb-3">
                        <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                        老师评语
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-white/60 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-orange-100/50 text-base md:text-lg">
                        {evaluation.comment}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                       <EvaluationBox title="闪光点" icon={<CheckCircle className="w-4 h-4 md:w-5 md:h-5" />} color="green" points={evaluation.goodPoints} />
                       <EvaluationBox title="建议加油" icon={<Lightbulb className="w-4 h-4 md:w-5 md:h-5" />} color="amber" points={evaluation.suggestions} />
                    </div>
                 </div>
               </div>

               {/* Sample Text Accordion (Optional) */}
               <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-orange-200/50">
                 <h4 className="font-bold text-ink-900 mb-3 md:mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                    参考范文
                 </h4>
                 <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl border border-paper-100 text-gray-700 font-serif leading-loose text-base md:text-lg shadow-sm">
                   {data.sampleText}
                 </div>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TipCard: React.FC<{ label: string; text: string; color: string }> = ({ label, text, color }) => {
  const colorStyles: any = {
    blue: "bg-blue-50 border-blue-100 text-blue-500 text-blue-900",
    green: "bg-green-50 border-green-100 text-green-500 text-green-900",
    orange: "bg-orange-50 border-orange-100 text-orange-500 text-orange-900",
    purple: "bg-purple-50 border-purple-100 text-purple-500 text-purple-900"
  };
  const style = colorStyles[color];
  const [bgClass, borderClass, labelClass, textClass] = style.split(' ');

  return (
    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border ${bgClass} ${borderClass}`}>
      <div className={`text-xs md:text-sm font-bold mb-1 ${labelClass}`}>{label}</div>
      <div className={`text-sm md:text-base font-medium leading-tight ${textClass}`}>{text}</div>
    </div>
  );
}

const EvaluationBox: React.FC<{ title: string; icon: React.ReactNode; color: string; points: string[] }> = ({ title, icon, color, points }) => {
  const bgClass = color === 'green' ? 'bg-green-50/50 border-green-100 text-green-700' : 'bg-amber-50/50 border-amber-100 text-amber-700';
  const dotClass = color === 'green' ? 'bg-green-400' : 'bg-amber-400';

  return (
    <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border ${bgClass}`}>
      <h5 className="font-bold mb-2 text-sm md:text-base flex items-center gap-2">
        {icon}
        {title}
      </h5>
      <ul className="space-y-1 md:space-y-2">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dotClass}`} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ImageCompositionView;