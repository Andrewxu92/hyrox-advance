import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepWizard, HYROX_WIZARD_STEPS } from './StepWizard';
import { DataImportExport } from './DataImportExport';
import { useFormAutoSave } from '../hooks/useLocalStorage';
import { useApiHandler, withRetry } from '../hooks/useApiHandler';
import { LoadingOverlay } from './ui/Loading';
import { AlertCircle, Trash2, RefreshCw, User, Timer, Dumbbell } from 'lucide-react';

interface AthleteInfo {
  name: string;
  gender: 'male' | 'female';
  age: string;
  weight: string;
}

interface Splits {
  [key: string]: number;
}

interface FormData {
  athleteInfo: AthleteInfo;
  splits: Splits;
}

interface StepWizardInputProps {
  onAnalysis: (analysis: any) => void;
}

const stations = [
  { key: 'skiErg', label: 'SkiErg', icon: '⛷️' },
  { key: 'sledPush', label: 'Sled Push', icon: '🛷' },
  { key: 'burpeeBroadJump', label: 'Burpee跳', icon: '🦘' },
  { key: 'rowing', label: '划船', icon: '🚣' },
  { key: 'farmersCarry', label: '农夫走', icon: '🪣' },
  { key: 'sandbagLunges', label: '沙袋箭步', icon: '🎒' },
  { key: 'wallBalls', label: '药球', icon: '🏐' },
];

const STORAGE_KEY = 'hyrox_wizard_form';

function StepWizardInput({ onAnalysis }: StepWizardInputProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('AI正在分析...');
  const [loadingSubMessage, setLoadingSubMessage] = useState('');

  const [athleteInfo, setAthleteInfo] = useState<AthleteInfo>({
    name: '',
    gender: 'male',
    age: '',
    weight: ''
  });

  const [splits, setSplits] = useState<Splits>({
    run1: 0, run2: 0, run3: 0, run4: 0,
    run5: 0, run6: 0, run7: 0, run8: 0,
    skiErg: 0, sledPush: 0, burpeeBroadJump: 0, rowing: 0,
    farmersCarry: 0, sandbagLunges: 0, wallBalls: 0
  });

  const { isLoading: isAnalyzing, error: apiError, execute, clearError } = useApiHandler();

  // Auto-save form data
  const formData = { athleteInfo, splits };
  const { isSaving, lastSaved, clearSavedData } = useFormAutoSave({
    key: STORAGE_KEY,
    data: formData,
    delay: 1500,
    enabled: true
  });

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.data) {
          if (parsed.data.athleteInfo) {
            setAthleteInfo(parsed.data.athleteInfo);
          }
          if (parsed.data.splits) {
            setSplits(prev => ({ ...prev, ...parsed.data.splits }));
          }
        }
      } catch (e) {
        console.error('Failed to load saved form data:', e);
      }
    }
  }, []);

  const handleClearData = useCallback(() => {
    if (confirm('确定要清除所有数据吗？此操作不可恢复。')) {
      clearSavedData();
      setAthleteInfo({ name: '', gender: 'male', age: '', weight: '' });
      setSplits({
        run1: 0, run2: 0, run3: 0, run4: 0,
        run5: 0, run6: 0, run7: 0, run8: 0,
        skiErg: 0, sledPush: 0, burpeeBroadJump: 0, rowing: 0,
        farmersCarry: 0, sandbagLunges: 0, wallBalls: 0
      });
      setCurrentStep(0);
    }
  }, [clearSavedData]);

  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(timeStr) || 0;
  };

  const formatSecondsToTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSplitChange = (key: string, value: string) => {
    const seconds = parseTimeToSeconds(value);
    setSplits(prev => ({ ...prev, [key]: seconds }));
  };

  const getTotalTime = useCallback(() => {
    return Object.values(splits).reduce((sum, val) => sum + val, 0);
  }, [splits]);

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 0: // Athlete info
        return !!athleteInfo.gender;
      case 1: // Runs 1-4
        return splits.run1 > 0 && splits.run2 > 0 && splits.run3 > 0 && splits.run4 > 0;
      case 2: // Runs 5-8
        return splits.run5 > 0 && splits.run6 > 0 && splits.run7 > 0 && splits.run8 > 0;
      case 3: // Stations
        return stations.every(s => splits[s.key] > 0);
      case 4: // Confirm
        return true;
      default:
        return true;
    }
  }, [athleteInfo, splits]);

  const handleComplete = useCallback(async () => {
    setLoadingMessage('AI正在分析你的成绩...');
    setLoadingSubMessage('生成个性化训练建议和进步空间预测');
    setShowLoadingOverlay(true);

    try {
      await execute(async () => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        
        const response = await withRetry(async () => {
          const res = await fetch(`${API_URL}/api/analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              splits,
              athleteInfo: {
                ...athleteInfo,
                age: athleteInfo.age ? parseInt(athleteInfo.age) : undefined,
                weight: athleteInfo.weight ? parseInt(athleteInfo.weight) : undefined
              },
              isEstimated: false
            })
          });
          
          if (!res.ok) throw new Error('API请求失败');
          return res;
        }, {
          maxRetries: 2,
          delay: 1000
        });

        const result = await response.json();
        
        if (result.success) {
          // Save to history
          const historyKey = 'hyrox_history';
          const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
          history.unshift({
            timestamp: Date.now(),
            type: 'detailed',
            athleteInfo,
            splits
          });
          localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 10)));
          
          onAnalysis(result.data);
        } else {
          throw new Error(result.error || '分析失败');
        }
      });
    } finally {
      setShowLoadingOverlay(false);
    }
  }, [execute, splits, athleteInfo, onAnalysis]);

  const handleImport = useCallback((importedData: any) => {
    if (importedData.athleteInfo) {
      setAthleteInfo(prev => ({ ...prev, ...importedData.athleteInfo }));
    }
    if (importedData.splits) {
      setSplits(prev => ({ ...prev, ...importedData.splits }));
    }
  }, []);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓名 <span className="text-gray-400">(选填)</span>
              </label>
              <input
                type="text"
                value={athleteInfo.name}
                onChange={(e) => setAthleteInfo({ ...athleteInfo, name: e.target.value })}
                placeholder="你的名字"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性别 *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAthleteInfo({ ...athleteInfo, gender: 'male' })}
                  className={`py-3 px-4 rounded-xl border-2 transition ${
                    athleteInfo.gender === 'male'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  男
                </button>
                <button
                  onClick={() => setAthleteInfo({ ...athleteInfo, gender: 'female' })}
                  className={`py-3 px-4 rounded-xl border-2 transition ${
                    athleteInfo.gender === 'female'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  女
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年龄 <span className="text-gray-400">(选填)</span>
                </label>
                <input
                  type="number"
                  value={athleteInfo.age}
                  onChange={(e) => setAthleteInfo({ ...athleteInfo, age: e.target.value })}
                  placeholder="30"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  体重(kg) <span className="text-gray-400">(选填)</span>
                </label>
                <input
                  type="number"
                  value={athleteInfo.weight}
                  onChange={(e) => setAthleteInfo({ ...athleteInfo, weight: e.target.value })}
                  placeholder="70"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">输入前四轮1km跑步用时（格式：时:分:秒）</p>
            <div className="grid grid-cols-2 gap-4">
              {['run1', 'run2', 'run3', 'run4'].map((run, idx) => (
                <div key={run}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    第{idx + 1}轮跑步 *
                  </label>
                  <input
                    type="text"
                    value={splits[run] ? formatSecondsToTime(splits[run]) : ''}
                    onChange={(e) => handleSplitChange(run, e.target.value)}
                    placeholder="4:30"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">输入后四轮1km跑步用时（格式：时:分:秒）</p>
            <div className="grid grid-cols-2 gap-4">
              {['run5', 'run6', 'run7', 'run8'].map((run, idx) => (
                <div key={run}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    第{idx + 5}轮跑步 *
                  </label>
                  <input
                    type="text"
                    value={splits[run] ? formatSecondsToTime(splits[run]) : ''}
                    onChange={(e) => handleSplitChange(run, e.target.value)}
                    placeholder="4:30"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">输入各站点用时（格式：时:分:秒）</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stations.map((station) => (
                <div key={station.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {station.icon} {station.label} *
                  </label>
                  <input
                    type="text"
                    value={splits[station.key] ? formatSecondsToTime(splits[station.key]) : ''}
                    onChange={(e) => handleSplitChange(station.key, e.target.value)}
                    placeholder="2:30"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        const totalTime = getTotalTime();
        const totalRuns = ['run1', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7', 'run8']
          .reduce((sum, key) => sum + splits[key], 0);
        const totalStations = stations.reduce((sum, s) => sum + splits[s.key], 0);

        return (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-xl p-4">
              <h4 className="font-semibold text-orange-800 mb-3">成绩概览</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">运动员</span>
                  <span className="font-medium">{athleteInfo.name || '未命名'} ({athleteInfo.gender === 'male' ? '男' : '女'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">总用时</span>
                  <span className="font-bold text-orange-600">{formatSecondsToTime(totalTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">跑步总用时</span>
                  <span className="font-medium">{formatSecondsToTime(totalRuns)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">站点总用时</span>
                  <span className="font-medium">{formatSecondsToTime(totalStations)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-3">跑步成绩</h4>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                {['run1', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7', 'run8'].map((run, idx) => (
                  <div key={run} className="bg-white rounded-lg p-2">
                    <div className="text-gray-500 text-xs">R{idx + 1}</div>
                    <div className="font-medium">{formatSecondsToTime(splits[run])}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-3">站点成绩</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {stations.map((station) => (
                  <div key={station.key} className="bg-white rounded-lg p-2 text-center">
                    <div className="text-gray-500 text-xs">{station.icon} {station.label}</div>
                    <div className="font-medium">{formatSecondsToTime(splits[station.key])}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Import/Export */}
            <div className="flex justify-center pt-2">
              <DataImportExport
                data={{ athleteInfo, splits }}
                onImport={handleImport}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Loading Overlay */}
      <AnimatePresence>
        {showLoadingOverlay && (
          <LoadingOverlay
            visible={showLoadingOverlay}
            message={loadingMessage}
            subMessage={loadingSubMessage}
          />
        )}
      </AnimatePresence>

      {/* Auto-save status */}
      {lastSaved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-xs text-gray-400 text-center"
        >
          {isSaving ? '保存中...' : `上次保存: ${lastSaved.toLocaleTimeString()}`}
        </motion.div>
      )}

      {/* Error display */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">{apiError.title}</div>
                <div className="text-red-500">{apiError.message}</div>
              </div>
            </div>
            {apiError.retryable && (
              <button
                onClick={clearError}
                className="flex items-center justify-center gap-2 text-sm text-orange-600 hover:text-orange-700 py-2"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear data button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleClearData}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition"
        >
          <Trash2 className="w-4 h-4" />
          清除数据
        </button>
      </div>

      {/* Step Wizard */}
      <StepWizard
        steps={HYROX_WIZARD_STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleComplete}
        onCancel={() => setCurrentStep(0)}
        isLoading={isAnalyzing}
        loadingMessage="AI分析中..."
        showProgress={true}
        allowSkip={false}
      >
        {renderStepContent()}
      </StepWizard>
    </div>
  );
}

export default StepWizardInput;
