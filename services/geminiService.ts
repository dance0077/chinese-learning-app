
import { GoogleGenAI, Type } from "@google/genai";
import { GradeLevel, ReadingArticle, Poem, CharacterData, ImageCompositionData, CompositionEvaluation, AppSettings } from "../types";

// Helper to get settings from localStorage
const getSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem('app_settings');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Failed to load settings", e);
  }
  return {
    model: 'gemini-2.5-flash',
    apiMode: 'official',
    userApiKey: '',
    proxyUrl: '',
    proxyApiKey: ''
  };
};

// Dynamic client creator
const getAIClient = () => {
  const settings = getSettings();
  
  let apiKey = '';
  let baseUrl = '';

  if (settings.apiMode === 'proxy') {
    // Proxy Mode Logic
    apiKey = settings.proxyApiKey;
    baseUrl = settings.proxyUrl;
  } else {
    // Official Mode Logic
    // Prefer User Entered Key > Environment Variable
    apiKey = settings.userApiKey || process.env.API_KEY || '';
  }
  
  if (!apiKey) {
    console.warn("No API Key found. Please configure it in Settings.");
  }

  // Configure Client Options
  const options: any = { apiKey };
  
  // Note: GoogleGenAI SDK doesn't support baseUrl override
  // Proxy mode will use custom fetch calls instead
  
  return {
    client: new GoogleGenAI(options),
    modelName: settings.model || 'gemini-2.5-flash',
    isProxy: settings.apiMode === 'proxy',
    proxyUrl: baseUrl,
    proxyApiKey: apiKey
  };
};

// Map Gemini model names to proxy-compatible names
const mapModelName = (geminiModel: string): string => {
  // For open.cherryin.net proxy, try different model name formats
  // Try with 'google/' prefix
  const modelMap: Record<string, string> = {
    'gemini-2.5-flash': 'google/gemini-2.5-pro',
    'gemini-2.5-pro': 'google/gemini-2.5-pro',
    'gemini-1.5-flash': 'google/gemini-1.5-pro',
    'gemini-1.5-pro': 'google/gemini-1.5-pro'
  };
  
  return modelMap[geminiModel] || 'google/gemini-2.5-pro'; // Default fallback
};

// Helper function to call proxy API (OpenAI-compatible format)
const callProxyAPI = async (modelName: string, proxyUrl: string, apiKey: string, messages: any[], responseFormat?: any) => {
  const endpoint = `${proxyUrl}/v1/chat/completions`;
  const mappedModel = mapModelName(modelName);
  
  const requestBody: any = {
    model: mappedModel,
    messages: messages,
    temperature: 0.7,  // Lower temperature for faster, more focused responses
    max_tokens: 2000   // Limit response length for faster generation
  };
  
  if (responseFormat) {
    requestBody.response_format = responseFormat;
  }
  
  console.log('[Proxy API] Request:', {
    endpoint,
    model: mappedModel,
    messageCount: messages.length
  });
  
  // Add timeout control (30 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('[Proxy API] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Proxy API] Error response:', errorText);
      throw new Error(`Proxy API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    // Reduce verbose logging
    console.log('[Proxy API] Success');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[Proxy API] Unexpected response format:', data);
      throw new Error('Invalid response format from proxy API');
    }
    
    return data.choices[0].message.content;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接或稍后重试');
    }
    throw error;
  }
};

const imageModelName = 'gemini-2.5-flash-image';

// Helper to clean JSON string from Markdown code blocks
const cleanJson = (text: string): string => {
  if (!text) return '{}';
  let cleaned = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  return cleaned.trim();
};

const alertError = (msg: string, error: any) => {
  console.error(msg, error);
  
  const settings = getSettings();
  const hasKey = (settings.apiMode === 'proxy' && settings.proxyApiKey) || 
                 (settings.apiMode === 'official' && (settings.userApiKey || process.env.API_KEY));
  
  if (!hasKey) {
    alert(`${msg}\n原因：未检测到有效的 API Key。\n请点击右上角“设置”按钮配置 Key。`);
  } else {
    // Log detailed error to console for DebugConsole to pick up
    console.error(`[API Error] ${msg}:`, error);
  }
};

// --- Reading Comprehension ---

export const generateReadingComprehension = async (
  grade: GradeLevel,
  topic: string
): Promise<ReadingArticle> => {
  const { client, modelName, isProxy, proxyUrl, proxyApiKey } = getAIClient();

  const prompt = `请为${grade}的小学生生成一篇语文阅读理解练习。
  主题:${topic || '适合儿童的有趣话题(如动物、童话、校园生活、自然科学)'}。
  
  要求:
  1. 输出必须是标准的 JSON 格式。
  2. 所有内容(标题、文章、问题、选项、解析)必须使用**简体中文**。
  3. content字段必须是完整的文章字符串，不能是对象或数组。
  4. 文章要生动有趣,符合${grade}的阅读水平,长度150-300字。
  5. 包含3个单项选择题,考察对文章的理解。
  
  Strictly follow the JSON schema.`;

  try {
    if (isProxy && proxyUrl) {
      // Use proxy API
      const responseText = await callProxyAPI(
        modelName,
        proxyUrl,
        proxyApiKey,
        [{ role: 'user', content: prompt }],
        { type: 'json_object' }
      );
      const result = JSON.parse(cleanJson(responseText));
      
      console.log('[Reading] Parsed result:', result);
      
      // Ensure content is a string
      if (typeof result.content === 'object' && result.content !== null) {
        // If content is an object or array, convert to string
        if (Array.isArray(result.content)) {
          result.content = result.content.join('\n\n');
        } else {
          result.content = Object.values(result.content).join('\n\n');
        }
      }
      
      if (!result.content || typeof result.content !== 'string') {
        throw new Error('Invalid content format');
      }
      
      // Fix questions format for reading comprehension
      if (result.questions && Array.isArray(result.questions)) {
        result.questions = result.questions.map((q: any, index: number) => {
          // Rename question_text to question if needed
          if (q.question_text && !q.question) {
            q.question = q.question_text;
          }
          
          // Convert options array format if needed (remove A. B. C. D. prefixes)
          if (q.options && Array.isArray(q.options)) {
            q.options = q.options.map((opt: string) => {
              // Remove "A. ", "B. ", etc. prefixes
              return opt.replace(/^[A-D]\.\s*/, '');
            });
          }
          
          // Convert options object to array if needed
          if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
            q.options = Object.values(q.options).map((opt: any) => 
              typeof opt === 'string' ? opt.replace(/^[A-D]\.\s*/, '') : opt
            );
          }
          
          // Convert answer letter to index
          if (typeof q.answer === 'string' && q.answer.match(/^[A-D]$/)) {
            q.correctAnswerIndex = q.answer.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
          } else if (typeof q.correctAnswerIndex === 'undefined') {
            q.correctAnswerIndex = 0;
          }
          
          // Ensure id exists
          if (!q.id) {
            q.id = index;
          }
          
          // Ensure explanation exists
          if (!q.explanation) {
            q.explanation = '暂无解析';
          }
          
          return q;
        });
      }
      
      console.log('[Reading] Processed result:', result);
      
      return result as ReadingArticle;
    } else {
      // Use official Google API
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              content: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswerIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                  },
                  required: ["id", "question", "options", "correctAnswerIndex", "explanation"]
                }
              }
            },
            required: ["title", "content", "questions"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      return JSON.parse(cleanJson(text)) as ReadingArticle;
    }
  } catch (e) {
    alertError("阅读理解生成失败", e);
    throw e;
  }
};

// --- Ancient Poetry ---

export const generatePoetryAnalysis = async (query: string): Promise<Poem> => {
  const { client, modelName, isProxy, proxyUrl, proxyApiKey } = getAIClient();

  const prompt = `请生成关于中国古诗的详细赏析。
  查询内容:"${query}"。
  如果查询为空,请随机选择一首适合小学生的著名古诗(唐诗或宋词)。
  
  要求:
  1. 所有内容必须使用**简体中文**。
  2. 提供标题、作者、朝代、诗句内容。
  3. content字段必须是字符串数组，每个元素是一句诗。
  4. translation字段必须是字符串，不能是对象。
  5. analysis字段必须是字符串，不能是对象，应该是完整的段落文字。
  6. tags字段必须是字符串数组。
  7. 提供2个选择题用于测试理解。`;

  try {
    if (isProxy && proxyUrl) {
      // Use proxy API
      const responseText = await callProxyAPI(
        modelName,
        proxyUrl,
        proxyApiKey,
        [{ role: 'user', content: prompt }],
        { type: 'json_object' }
      );
      const result = JSON.parse(cleanJson(responseText));
      
      // Ensure content is an array
      if (typeof result.content === 'string') {
        result.content = result.content.split('\n').filter((line: string) => line.trim());
      }
      
      // Ensure analysis is a string
      if (typeof result.analysis === 'object' && result.analysis !== null) {
        // If analysis is an object, convert it to a formatted string
        result.analysis = Object.entries(result.analysis)
          .map(([key, value]) => `${value}`)
          .join('\n\n');
      }
      
      // Ensure tags is an array
      if (!Array.isArray(result.tags)) {
        result.tags = [];
      }
      
      // Fix questions format if needed
      if (result.questions && Array.isArray(result.questions)) {
        result.questions = result.questions.map((q: any, index: number) => {
          // Convert options object to array if needed
          if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
            q.options = Object.values(q.options);
          }
          
          // Convert answer letter to index
          if (typeof q.answer === 'string' && q.answer.match(/^[A-D]$/)) {
            q.correctAnswerIndex = q.answer.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
          } else if (typeof q.correctAnswerIndex === 'undefined') {
            q.correctAnswerIndex = 0;
          }
          
          // Ensure id exists
          if (!q.id) {
            q.id = index;
          }
          
          // Ensure explanation exists
          if (!q.explanation) {
            q.explanation = '暂无解析';
          }
          
          return q;
        });
      }
      
      console.log('[Poetry] Processed result:', result);
      
      return result as Poem;
    } else {
      // Use official Google API
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              dynasty: { type: Type.STRING },
              content: { type: Type.ARRAY, items: { type: Type.STRING } },
              translation: { type: Type.STRING },
              analysis: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswerIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                  },
                  required: ["id", "question", "options", "correctAnswerIndex", "explanation"]
                }
              }
            },
            required: ["title", "author", "dynasty", "content", "translation", "analysis", "questions"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      return JSON.parse(cleanJson(text)) as Poem;
    }
  } catch (e) {
    alertError("古诗生成失败", e);
    throw e;
  }
};

// --- Character Analysis ---

export const generateCharacterAnalysis = async (char: string): Promise<CharacterData> => {
  const { client, modelName, isProxy, proxyUrl, proxyApiKey } = getAIClient();

  const prompt = `请深度解析汉字 "${char}"。
  如果输入的是词语,请分析第一个字或最难的字。
  
  请提供以下信息(必须全中文):
  1. char: 要分析的汉字(单个字)
  2. pinyin: 汉字的拼音(带声调)
  3. radical: 部首
  4. strokes: 笔画数(必须是准确的数字)
  5. definition: 请用简体中文详细解释该字的含义
  6. etymology: 请用简体中文讲述该字的起源和演变故事
  7. vocabulary: 3-5个常见词语组成的数组,例如: ["词语1", "词语2", "词语3"]
  8. commonPhrases: 1-2个成语或例句组成的数组,例如: ["成语或例句1", "成语或例句2"]
  
  重要要求:
  - strokes 必须是准确的数字类型
  - vocabulary 必须是具体的词语数组,不能为空
  - commonPhrases 必须是具体的成语或例句数组
  
  Output must be in JSON format like:
  {
    "char": "汉",
    "pinyin": "hàn",
    "radical": "氵",
    "strokes": 5,
    "definition": "汉族;汉朝;男子",
    "etymology": "汉字的起源故事...",
    "vocabulary": ["汉字", "汉语", "汉族", "汉朝"],
    "commonPhrases": ["好汉不吃眼前亏", "汉语言文化"]
  }`;

  try {
    if (isProxy && proxyUrl) {
      // Use proxy API
      const responseText = await callProxyAPI(
        modelName,
        proxyUrl,
        proxyApiKey,
        [{ role: 'user', content: prompt }],
        { type: 'json_object' }
      );
      const result = JSON.parse(cleanJson(responseText));
      
      console.log('[Character] Parsed result:', result);
      console.log('[Character] char:', result.char);
      console.log('[Character] pinyin:', result.pinyin);
      console.log('[Character] radical:', result.radical);
      console.log('[Character] strokes:', result.strokes);
      console.log('[Character] vocabulary:', result.vocabulary);
      
      // Ensure all required fields exist
      if (!result.char || typeof result.char !== 'string') {
        result.char = char;
      }
      
      if (!result.pinyin || typeof result.pinyin !== 'string') {
        result.pinyin = 'unknown';
      }
      
      if (!result.radical || typeof result.radical !== 'string') {
        result.radical = '无';
      }
      
      if (!result.strokes) {
        result.strokes = 0;
      }
      
      if (!result.definition || typeof result.definition !== 'string') {
        result.definition = '暂无释义';
      }
      
      if (!result.etymology || typeof result.etymology !== 'string') {
        result.etymology = '暂无字源信息';
      }
      
      // Ensure vocabulary is an array
      if (!Array.isArray(result.vocabulary)) {
        result.vocabulary = [];
      }
      
      // Ensure commonPhrases is an array
      if (!Array.isArray(result.commonPhrases)) {
        result.commonPhrases = [];
      }
      
      console.log('[Character] Final processed result:', result);
      
      return result as CharacterData;
    } else {
      // Use official Google API
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              char: { type: Type.STRING },
              pinyin: { type: Type.STRING },
              radical: { type: Type.STRING },
              strokes: { type: Type.INTEGER },
              definition: { type: Type.STRING },
              etymology: { type: Type.STRING },
              vocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
              commonPhrases: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["char", "pinyin", "radical", "strokes", "definition", "etymology", "vocabulary"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      return JSON.parse(cleanJson(text)) as CharacterData;
    }
  } catch (e) {
    alertError("汉字解析失败", e);
    throw e;
  }
};

// --- Image Composition ---

const SCENES = [
  { topic: "春天放风筝", url: "https://images.unsplash.com/photo-1530138948689-0ae6eb352655?q=80&w=1000&auto=format&fit=crop" },
  { topic: "图书馆看书", url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000&auto=format&fit=crop" },
  { topic: "雨天撑伞", url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1000&auto=format&fit=crop" },
  { topic: "和宠物玩耍", url: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?q=80&w=1000&auto=format&fit=crop" },
  { topic: "快乐的烹饪", url: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=1000&auto=format&fit=crop" },
];

export const generateImageCompositionTask = async (customTopic?: string): Promise<ImageCompositionData> => {
  const { client, modelName, isProxy, proxyUrl, proxyApiKey } = getAIClient();

  let topic = customTopic;
  if (!topic) {
    const TOPICS = [
      "森林里的运动会", "小兔子拔萝卜", "海底世界大冒险", "太空探险", 
      "雨后的彩虹", "快乐的生日派对", "堆雪人", "大扫除", "去动物园", "公园里的野餐",
      "恐龙乐园", "机器人朋友"
    ];
    topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  }

  let imageUrl = "";

  // Try to generate image with both official API and proxy
  try {
    console.log('[ImageComposition] ========== 开始图片生成流程 ==========');
    console.log('[ImageComposition] Topic:', topic);
    console.log('[ImageComposition] isProxy:', isProxy);
    console.log('[ImageComposition] proxyUrl:', proxyUrl);
    
    const imagePrompt = `Create a lively, colorful, children's book style illustration for a primary school writing prompt (Look at Picture and Write).
    Subject: ${topic}.
    Style: Cute, expressive characters, vibrant colors, clear action, detailed background but not cluttered. No text in the image.
    Aspect Ratio: 1:1.`;

    if (isProxy && proxyUrl) {
      // Try using proxy API for image generation
      console.log('[ImageComposition] 使用代理模式生成图片...');
      console.log('[ImageComposition] Attempting image generation via proxy with google/gemini-2.5-flash-image...');
      
      try {
        // Step 1: Try to generate image using image model
        const imageGenerationPrompt = `Generate an image: ${imagePrompt}`;
        console.log('[ImageComposition] Image prompt:', imageGenerationPrompt.substring(0, 100) + '...');
        
        const requestUrl = `${proxyUrl}/v1/chat/completions`;
        console.log('[ImageComposition] Request URL:', requestUrl);
        
        const requestBody = {
          model: 'google/gemini-2.5-flash-image',
          messages: [{ role: 'user', content: imageGenerationPrompt }]
        };
        console.log('[ImageComposition] Request body:', JSON.stringify(requestBody, null, 2));
        
        console.log('[ImageComposition] 发送图片生成请求...');
        const imageResponse = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${proxyApiKey}`
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('[ImageComposition] 收到响应, status:', imageResponse.status, imageResponse.statusText);
        
        if (imageResponse.ok) {
          const data = await imageResponse.json();
          console.log('[ImageComposition] ===== 完整的图片生成响应 =====');
          console.log('[ImageComposition] Full response data:', JSON.stringify(data, null, 2));
          console.log('[ImageComposition] ===== 响应结构分析 =====');
          
          // Try to extract image URL or data from response
          const content = data.choices?.[0]?.message?.content;
          console.log('[ImageComposition] Response content type:', typeof content);
          console.log('[ImageComposition] Response content:', content);
          
          // Check if there are other fields in the response
          console.log('[ImageComposition] data.choices:', data.choices);
          console.log('[ImageComposition] data.data:', data.data);
          console.log('[ImageComposition] data.images:', data.images);
          console.log('[ImageComposition] Full message object:', data.choices?.[0]?.message);
          
          if (content) {
            // Check if response contains image URL or base64
            if (typeof content === 'string') {
              console.log('[ImageComposition] Content is string, checking format...');
              
              // Check for markdown image format: ![alt](url)
              const markdownImageMatch = content.match(/!\[.*?\]\((data:image\/[^;]+;base64,[^)]+)\)/);
              if (markdownImageMatch && markdownImageMatch[1]) {
                imageUrl = markdownImageMatch[1];
                console.log('[ImageComposition] Found base64 in markdown format');
              }
              // Direct URL
              else if (content.startsWith('http://') || content.startsWith('https://')) {
                imageUrl = content.trim();
                console.log('[ImageComposition] Found direct URL:', imageUrl);
              } 
              // Base64 data URL
              else if (content.startsWith('data:image')) {
                imageUrl = content;
                console.log('[ImageComposition] Found base64 data URL');
              } 
              // Try to extract URL from markdown or text
              else if (content.includes('http')) {
                const urlMatch = content.match(/https?:\/\/[^\s\)\]"']+/i);
                if (urlMatch) {
                  imageUrl = urlMatch[0];
                  console.log('[ImageComposition] Extracted URL from text:', imageUrl);
                }
              }
              // Check if content is just base64 without data URL prefix
              else if (content.length > 100 && !content.includes(' ')) {
                // Likely base64, add data URL prefix
                imageUrl = `data:image/png;base64,${content}`;
                console.log('[ImageComposition] Added data URL prefix to base64');
              }
            }
            // If content is an object, check for image field
            else if (typeof content === 'object') {
              if (content.url) {
                imageUrl = content.url;
                console.log('[ImageComposition] Found URL in object:', imageUrl);
              } else if (content.image_url) {
                imageUrl = content.image_url;
                console.log('[ImageComposition] Found image_url in object:', imageUrl);
              } else if (content.data) {
                imageUrl = `data:image/png;base64,${content.data}`;
                console.log('[ImageComposition] Found base64 data in object');
              }
            }
          }
          
          console.log('[ImageComposition] Final extracted imageUrl:', imageUrl);
        } else {
          const errorText = await imageResponse.text();
          console.warn('[ImageComposition] Image generation failed:', errorText);
        }
      } catch (proxyError) {
        console.warn('[ImageComposition] Proxy image generation error:', proxyError);
      }
    } else {
      // Use official Google API
      const imageResponse = await client.models.generateContent({
        model: imageModelName,
        contents: {
          parts: [{ text: imagePrompt }]
        },
      });

      if (imageResponse.candidates?.[0]?.content?.parts) {
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    }
  } catch (e) {
    console.warn("Image generation failed, falling back to static images.", e);
  }

  let isGenerated = !!imageUrl;
  if (!imageUrl) {
    console.log('[ImageComposition] No AI-generated image, using fallback static images');
    if (customTopic) {
      const scene = SCENES[Math.floor(Math.random() * SCENES.length)];
      imageUrl = scene.url;
      console.log('[ImageComposition] Custom topic, random fallback image:', scene.topic);
    } else {
      const scene = SCENES[Math.floor(Math.random() * SCENES.length)];
      topic = scene.topic;
      imageUrl = scene.url;
      console.log('[ImageComposition] Random topic and image:', scene.topic);
    }
  }
  
  console.log('[ImageComposition] Final imageUrl:', imageUrl);
  console.log('[ImageComposition] Final topic:', topic);

  try {
    const guidePromptText = `这张图片是关于 "${topic}" 的小学看图写话练习。
    请仔细观察图片内容(如果有图片),生成以下内容(全部使用简体中文):
    1. 写作小锦囊(引导学生观察图片中的时间、地点、人物、事情)。
    2. 5-8个好词(形容词、动词),需与图片内容贴切。
    3. 一篇范文(约100-150字),描述图片发生的故事。
    
    Return as JSON. Ensure strict Simplified Chinese.`;

    let guideData;
    
    if (isProxy && proxyUrl) {
      // Use proxy API for text generation with google/gemini-2.5-pro
      console.log('[ImageComposition] Using google/gemini-2.5-pro for text generation...');
      
      const responseText = await callProxyAPI(
        'google/gemini-2.5-pro',  // Use Pro model for reasoning
        proxyUrl,
        proxyApiKey,
        [{ role: 'user', content: guidePromptText }],
        { type: 'json_object' }
      );
      guideData = JSON.parse(cleanJson(responseText));
      
      console.log('[ImageComposition] Parsed guideData:', guideData);
      
      // Ensure tips object exists with all required fields
      if (!guideData.tips || typeof guideData.tips !== 'object') {
        guideData.tips = {
          time: '某个温暖的下午',
          location: '公园',
          characters: '小朋友',
          event: topic
        };
      } else {
        // Ensure each field exists
        guideData.tips.time = guideData.tips.time || '某个日子';
        guideData.tips.location = guideData.tips.location || '某个地方';
        guideData.tips.characters = guideData.tips.characters || '主人公';
        guideData.tips.event = guideData.tips.event || topic;
      }
      
      // Ensure vocabulary is an array
      if (!Array.isArray(guideData.vocabulary)) {
        guideData.vocabulary = ['快乐', '美丽', '有趣'];
      }
      
      // Ensure sampleText exists
      if (!guideData.sampleText || typeof guideData.sampleText !== 'string') {
        guideData.sampleText = `这是一个关于${topic}的故事。`;
      }
    } else {
      // Use official Google API
      const parts: any[] = [];
      if (isGenerated && imageUrl.startsWith('data:')) {
           const base64Data = imageUrl.split(',')[1];
           const mimeType = imageUrl.split(';')[0].split(':')[1];
           parts.push({
               inlineData: {
                   mimeType: mimeType,
                   data: base64Data
               }
           });
      }
      
      parts.push({ text: guidePromptText });

      const guideResponse = await client.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tips: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  location: { type: Type.STRING },
                  characters: { type: Type.STRING },
                  event: { type: Type.STRING }
                },
                required: ["time", "location", "characters", "event"]
              },
              vocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
              sampleText: { type: Type.STRING }
            },
            required: ["tips", "vocabulary", "sampleText"]
          }
        }
      });

      guideData = JSON.parse(cleanJson(guideResponse.text!));
    }
    
    return {
      imageUrl,
      topic: topic || "看图写话",
      ...guideData
    };
  } catch (e) {
    alertError("看图写话文本生成失败", e);
    throw e;
  }
};

export const evaluateComposition = async (studentText: string, topic: string): Promise<CompositionEvaluation> => {
  const { client, modelName, isProxy, proxyUrl, proxyApiKey } = getAIClient();

  const prompt = `请批改这篇小学生作文。
  题目:${topic}
  学生作文:"${studentText}"
  
  请提供(使用简体中文):
  1. 评分 (0-100)
  2. 老师评语(鼓励性、温暖、有帮助)。
  3. 闪光点列表(例如:好词好句、表达清晰)。
  4. 建议加油列表(改进建议)。
  
  Tone: Encouraging, warm, helpful.`;

  try {
    if (isProxy && proxyUrl) {
      // Use proxy API
      const responseText = await callProxyAPI(
        modelName,
        proxyUrl,
        proxyApiKey,
        [{ role: 'user', content: prompt }],
        { type: 'json_object' }
      );
      const result = JSON.parse(cleanJson(responseText));
      
      console.log('[Evaluation] Raw result:', result);
      
      // Map Chinese field names to English
      const evaluation: CompositionEvaluation = {
        score: result.评分 || result.score || 0,
        comment: result.老师评语 || result.comment || '',
        goodPoints: result.闪光点列表 || result.goodPoints || [],
        suggestions: result.建议加油列表 || result.suggestions || []
      };
      
      console.log('[Evaluation] Processed result:', evaluation);
      
      return evaluation;
    } else {
      // Use official Google API
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              comment: { type: Type.STRING },
              goodPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["score", "comment", "goodPoints", "suggestions"]
          }
        }
      });
      
      return JSON.parse(cleanJson(response.text!)) as CompositionEvaluation;
    }
  } catch (e) {
    alertError("作文批改失败", e);
    throw e;
  }
};
