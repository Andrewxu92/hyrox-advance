// 运动员管理页面
import { useState, useEffect } from 'react';
import { User, Plus, Edit, Trash2, Save, X, Search, Trophy } from 'lucide-react';
import AthleteSelector from '../components/AthleteSelector';

interface Athlete {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age?: number;
  weight?: number;
  height?: number;
  experienceLevel?: string;
  targetTime?: number;
}

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
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
        setError(data.error || '加载运动员失败');
      }
    } catch (err) {
      setError('无法连接到服务器。请确保后端服务运行中。');
      console.error('Error loading athletes:', err);
    } finally {
      setLoading(false);
    }

    // 重新选择当前运动员（如果存在）
    if (selectedAthlete) {
      setSelectedAthlete(athletes.find(a => a.id === selectedAthlete.id) || null);
    }
  };

  const saveAthlete = async (athlete: Athlete) => {
    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const method = athlete.id ? 'PUT' : 'POST';
      const url = athlete.id 
        ? `${API_URL}/api/athletes/${athlete.id}`
        : `${API_URL}/api/athletes`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(athlete),
      });

      const data = await res.json();

      if (data.success) {
        loadAthletes();
        setShowAddForm(false);
        setEditingAthlete(null);
      } else {
        setError(data.error || '保存失败');
      }
    } catch (err) {
      setError('保存运动员失败');
      console.error('Error saving athlete:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAthlete = async (id: string) => {
    if (!confirm('确定要删除这个运动员吗？所有相关成绩也会被删除。')) return;

    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/athletes/${id}`, { method: 'DELETE' });

      const data = await res.json();

      if (data.success) {
        loadAthletes();
        setSelectedAthlete(null);
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError('删除运动员失败');
      console.error('Error deleting athlete:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = athletes.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <User className="w-8 h-8 text-orange-500" />
          运动员管理
        </h2>
        <p className="text-gray-500 mt-1">管理您的运动员数据和成绩记录</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：运动员列表 */}
        <div className="lg:col-span-1 space-y-4">
          {/* 搜索和新建 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索运动员..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button
              onClick={() => {
                setEditingAthlete({ id: '', name: '', gender: 'male' });
                setShowAddForm(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>新建</span>
            </button>
          </div>

          {/* 运动员列表 */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            {loading && !athletes.length ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
                加载中...
              </div>
            ) : filteredAthletes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无运动员</p>
              </div>
            ) : (
              <div className="divide-y dividing-gray-200 max-h-96 overflow-y-auto">
                {filteredAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                      selectedAthlete?.id === athlete.id ? 'bg-orange-50' : ''
                    }`}
                    onClick={() => setSelectedAthlete(athlete)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          athlete.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                        }`}>
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{athlete.name}</div>
                          <div className="text-sm text-gray-500">
                            {athlete.gender === 'male' ? '男' : '女'} • {athlete.age || '-'}岁
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAthlete(athlete);
                            setShowAddForm(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAthlete(athlete.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：详情 */}
        <div className="lg:col-span-2">
          {selectedAthlete ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {selectedAthlete.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedAthlete.experienceLevel === 'elite'
                      ? 'bg-yellow-100 text-yellow-800'
                      : selectedAthlete.experienceLevel === 'advanced'
                      ? 'bg-green-100 text-green-800'
                      : selectedAthlete.experienceLevel === 'intermediate'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedAthlete.experienceLevel?.charAt(0).toUpperCase() + 
                     selectedAthlete.experienceLevel?.slice(1) || '未设置'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500">性别</p>
                  <p className="font-medium text-gray-800">
                    {selectedAthlete.gender === 'male' ? '男' : '女'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">年龄</p>
                  <p className="font-medium text-gray-800">
                    {selectedAthlete.age || '-'} 岁
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">体重</p>
                  <p className="font-medium text-gray-800">
                    {selectedAthlete.weight || '-'} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">身高</p>
                  <p className="font-medium text-gray-800">
                    {selectedAthlete.height || '-'} cm
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-orange-500" />
                  <h4 className="font-semibold text-gray-800">目标时间</h4>
                </div>
                {selectedAthlete.targetTime ? (
                  <div className="flex items-center gap-2 text-lg text-gray-800">
                    <span>{Math.floor(selectedAthlete.targetTime / 60)}分</span>
                    <span>{selectedAthlete.targetTime % 60}秒</span>
                  </div>
                ) : (
                  <p className="text-gray-500">未设置目标时间</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">选择一名运动员</h3>
              <p className="text-gray-500">
                从左侧列表选择一名运动员，或点击"新建"添加新运动员
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 添加/编辑表单 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingAthlete?.id ? '编辑运动员' : '新建运动员'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAthlete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <AthleteForm
                athlete={editingAthlete}
                onSave={saveAthlete}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingAthlete(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 运动员表单组件
function AthleteForm({ 
  athlete, 
  onSave, 
  onCancel 
}: { 
  athlete: Athlete | null; 
  onSave: (athlete: Athlete) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Athlete>(
    athlete || {
      name: '',
      gender: 'male',
      age: undefined,
      weight: undefined,
      height: undefined,
      experienceLevel: 'none',
      targetTime: undefined,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 姓名 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          姓名 *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          placeholder="请输入运动员姓名"
        />
      </div>

      {/* 性别 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          性别 *
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, gender: 'male' })}
            className={`px-4 py-2 rounded-lg border ${
              formData.gender === 'male'
                ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium'
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            男
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, gender: 'female' })}
            className={`px-4 py-2 rounded-lg border ${
              formData.gender === 'female'
                ? 'bg-pink-100 border-pink-500 text-pink-700 font-medium'
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            女
          </button>
        </div>
      </div>

      {/* 年龄 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          年龄
        </label>
        <input
          type="number"
          min="1"
          max="120"
          value={formData.age || ''}
          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          placeholder="例如：30"
        />
      </div>

      {/* 体重 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          体重 (kg)
        </label>
        <input
          type="number"
          min="1"
          max="300"
          step="0.1"
          value={formData.weight || ''}
          onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          placeholder="例如：75"
        />
      </div>

      {/* 身高 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          身高 (cm)
        </label>
        <input
          type="number"
          min="1"
          max="250"
          value={formData.height || ''}
          onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || undefined })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          placeholder="例如：180"
        />
      </div>

      {/* 经验等级 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          经验等级
        </label>
        <select
          value={formData.experienceLevel || 'none'}
          onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as any })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="none">新手 (无经验)</option>
          <option value="beginner">初级</option>
          <option value="intermediate">中级</option>
          <option value="advanced">高级</option>
          <option value="elite">精英</option>
        </select>
      </div>

      {/* 目标时间 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          目标时间 (秒)
        </label>
        <input
          type="number"
          min="1"
          value={formData.targetTime || ''}
          onChange={(e) => setFormData({ ...formData, targetTime: parseInt(e.target.value) || undefined })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          placeholder="例如：5400 (90分钟)"
        />
        <p className="text-xs text-gray-500 mt-1">
          例如：90分钟 = 5400秒，120分钟 = 7200秒
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 rounded-lg font-medium transition"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          取消
        </button>
      </div>
    </form>
  );
}
