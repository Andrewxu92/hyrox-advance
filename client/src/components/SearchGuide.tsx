import { useState } from 'react';
import { Search, Loader2, AlertCircle, User, Globe, Keyboard, Lightbulb, Link2 } from 'lucide-react';

interface SearchGuideProps {
  onSearch: (name: string) => void;
  onUrlSubmit?: (url: string) => void;
  loading: boolean;
  /** 外层容器 class，便于嵌入深色页面 */
  className?: string;
}

const POPULAR_NAMES = [
  { cn: '张三', en: 'Zhang San' },
  { cn: '李四', en: 'Li Si' },
  { cn: '王五', en: 'Wang Wu' },
];

const SEARCH_TIPS = [
  { icon: '📝', title: '试试拼音', desc: '如：Liang Xu 或 Xu Liang' },
  { icon: '🌍', title: '英文名', desc: '如：Andrew Xu 或 Xu Andrew' },
  { icon: '👤', title: '姓或名', desc: '单独搜索"Xu"或"Liang"' },
];

function SearchGuide({ onSearch, onUrlSubmit, loading, className = '' }: SearchGuideProps) {
  const [searchName, setSearchName] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [showTips, setShowTips] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'url'>('search');

  const handleSearch = () => {
    if (!searchName.trim()) {
      setError('请输入姓名');
      return;
    }
    setError('');
    onSearch(searchName.trim());
  };

  const handleUrlSubmit = () => {
    if (!resultUrl.trim()) {
      setUrlError('请输入比赛链接');
      return;
    }
    
    // 验证链接格式
    const url = resultUrl.trim();
    const isValid = url.match(/\/result\/[A-Z0-9]+/i) || url.match(/^[A-Z0-9]{10,20}$/i);
    
    if (!isValid) {
      setUrlError('链接格式不正确，请检查');
      return;
    }
    
    setUrlError('');
    onUrlSubmit?.(url);
  };

  // 生成可能的搜索变体
  const generateVariations = (name: string): string[] => {
    const variations: string[] = [];
    const parts = name.split(/\s+/);
    
    // 原始输入
    variations.push(name);
    
    // 如果只有一个词，尝试加空格分姓和名
    if (parts.length === 1 && name.length >= 2) {
      // 假设前1-2个字是姓
      variations.push(name.slice(0, 1) + ' ' + name.slice(1));
      variations.push(name.slice(0, 2) + ' ' + name.slice(2));
    }
    
    // 如果有空格，尝试交换顺序
    if (parts.length === 2) {
      variations.push(parts[1] + ' ' + parts[0]);
    }
    
    return [...new Set(variations)];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tab切换 */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeTab === 'search'
                ? 'text-hyrox-red-dark border-b-2 border-hyrox-red bg-hyrox-red/10'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              按姓名搜索
            </span>
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeTab === 'url'
                ? 'text-hyrox-red-dark border-b-2 border-hyrox-red bg-hyrox-red/10'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Link2 className="w-4 h-4" />
              粘贴比赛链接
            </span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'search' ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                输入你的姓名
              </label>
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => {
                      setSearchName(e.target.value);
                      setError('');
                    }}
                    placeholder="姓名 / 拼音 / 英文名"
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-hyrox-red focus:ring-0"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  {searchName && (
                    <button
                      onClick={() => setSearchName('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-hyrox-red text-white px-5 py-3 rounded-xl font-medium hover:bg-hyrox-red-dark transition disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>

              {/* 搜索提示 */}
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                支持中文、拼音、英文名
                <button 
                  onClick={() => setShowTips(!showTips)}
                  className="text-hyrox-red hover:underline ml-1"
                >
                  {showTips ? '隐藏' : '查看更多'}
                </button>
              </p>

              {/* 展开提示 */}
              {showTips && (
                <div className="mt-4 space-y-2 p-4 bg-blue-50 rounded-xl">
                  {SEARCH_TIPS.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-lg">{tip.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{tip.title}</div>
                        <div className="text-xs text-gray-500">{tip.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                粘贴 hyresult.com 比赛链接
              </label>
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={resultUrl}
                    onChange={(e) => {
                      setResultUrl(e.target.value);
                      setUrlError('');
                    }}
                    placeholder="https://www.hyresult.com/result/..."
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-hyrox-red focus:ring-0"
                    onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  />
                  {resultUrl && (
                    <button
                      onClick={() => setResultUrl('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={handleUrlSubmit}
                  disabled={loading}
                  className="bg-hyrox-red text-white px-5 py-3 rounded-xl font-medium hover:bg-hyrox-red-dark transition disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '获取'}
                </button>
              </div>

              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-gray-600">
                <p className="font-medium text-blue-800 mb-1">💡 如何获取链接？</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>访问 <a href="https://www.hyresult.com" target="_blank" className="text-hyrox-red underline">hyresult.com</a></li>
                  <li>搜索你的名字并进入比赛结果页面</li>
                  <li>复制浏览器地址栏的链接</li>
                  <li>粘贴到上方输入框</li>
                </ol>
                <p className="mt-2 text-gray-400">示例：https://www.hyresult.com/result/LR3MS4JI44D0BD</p>
              </div>

              {/* 错误提示 */}
              {urlError && (
                <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {urlError}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 搜索失败后的建议 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          找不到成绩？试试这些方法
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <span className="w-6 h-6 bg-hyrox-red/20 text-hyrox-red-dark rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <div>
              <span className="font-medium">去官网确认</span>
              <p className="text-gray-500 text-xs mt-1">
                访问 <a href="https://www.hyresult.com/rankings" target="_blank" className="text-hyrox-red underline">hyresult.com</a> 查看你注册时用的姓名
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 text-sm">
            <span className="w-6 h-6 bg-hyrox-red/20 text-hyrox-red-dark rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <div>
              <span className="font-medium">尝试不同格式</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {searchName && generateVariations(searchName).map((v, i) => (
                  <button
                    key={i}
                    onClick={() => onSearch(v)}
                    className="text-xs bg-white px-2 py-1 rounded border hover:bg-hyrox-red/10 hover:border-hyrox-red/30 transition"
                  >
                    {v}
                  </button>
                ))}
                {!searchName && (
                  <>
                    <span className="text-xs bg-white px-2 py-1 rounded border">Xu Liang</span>
                    <span className="text-xs bg-white px-2 py-1 rounded border">Liang Xu</span>
                    <span className="text-xs bg-white px-2 py-1 rounded border">Xu</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 text-sm">
            <span className="w-6 h-6 bg-hyrox-red/20 text-hyrox-red-dark rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <div>
              <span className="font-medium">手动输入成绩</span>
              <p className="text-gray-500 text-xs mt-1">
                如果官网搜索不到，可以使用"快速估算"模式手动输入
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 数据来源说明 */}
      <p className="text-xs text-gray-400 text-center">
        数据来自 hyresult.com 官网 · 需要已参加过正式比赛
      </p>
    </div>
  );
}

export default SearchGuide;