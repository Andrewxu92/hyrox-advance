// 运动员选择器组件
import { useState, useEffect } from 'react';
import { User, Search, Plus } from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age?: number;
  weight?: number;
}

interface AthleteSelectorProps {
  onAthleteSelect: (athlete: Athlete) => void;
  currentAthleteId?: string;
}

export default function AthleteSelector({ 
  onAthleteSelect,
  currentAthleteId 
}: AthleteSelectorProps) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/athletes`);
      const data = await res.json();

      if (data.success) {
        setAthletes(data.data || []);
      } else {
        setError(data.error || 'Failed to load athletes');
      }
    } catch (err) {
      setError('无法连接到服务器。请确保后端服务运行中。');
      console.error('Error loading athletes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = athletes.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (athlete: Athlete) => {
    onAthleteSelect(athlete);
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-800">运动员</h3>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索运动员..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* 运动员列表 */}
      {!loading && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredAthletes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无运动员，您可以：
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>先添加新运动员</li>
                <li>搜索更多运动员</li>
              </ol>
            </div>
          ) : (
            filteredAthletes.map((athlete) => (
              <button
                key={athlete.id}
                onClick={() => handleSelect(athlete)}
                className={`w-full p-3 rounded-lg transition ${
                  currentAthleteId === athlete.id
                    ? 'bg-orange-50 border-2 border-orange-500'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      athlete.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                    }`}>
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{athlete.name}</div>
                      <div className="text-sm text-gray-500">
                        {athlete.gender === 'male' ? '男性' : '女性'} • {athlete.age || '-'}岁
                      </div>
                    </div>
                  </div>
                  {currentAthleteId === athlete.id && (
                    <span className="text-orange-500 text-sm font-medium">已选择</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
