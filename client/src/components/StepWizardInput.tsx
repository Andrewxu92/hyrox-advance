import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepWizard, HYROX_WIZARD_STEPS } from './StepWizard';
import { DataImportExport } from './DataImportExport';
import { useFormAutoSave } from '../hooks/useLocalStorage';
import { useApiHandler, withRetry } from '../hooks/useApiHandler';
import { LoadingOverlay } from './ui/Loading';
import TimeSelector from './ui/TimeSelector';
import { AlertCircle, Trash2, RefreshCw, Timer, Dumbbell } from 'lucide-react';

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
  { key: 'sledPull', label: 'Sled Pull', icon: '⛓️' },
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
    skiErg: 0, sledPush: 0, sledPull: 0, burpeeBroadJump: 0,
    rowing: 0, farmersCarry: 0, sandbagLunges: 0, wallBalls: 0
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
        skiErg: 0, sledPush: 0, sledPull: 0, burpeeBroadJump: 0,
        rowing: 0, farmersCarry: 0, sandbagLunges: 0, wallBalls: 0
      });
      setCurrentStep(0);
    }
  }, [clearSavedData]);

  const formatSecondsToTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSplitChange = (key: string, seconds: number) => {
    setSplits(prev => ({ ...prev, [key]: seconds }));
  };

  const getTotalTime = useCallback(() => {
    return Object.values(splits).reduce((sum, val) => sum + val, 0);
  }, [splits]);

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 0:
        return !!athleteInfo.gender;
      case 1:
        return splits.run1 > 0 && splits.run2 > 0 && splits.run3 > 0 && splits.run4 > 0;
      case 2:
        return splits.run5 > 0 && splits.run6 > 0 && splits.run7 > 0 && splits.run8 > 0;
      case 3:
        return stations.every(s => splits[s.key] > 0);
      case 4:
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
        const API_URL = import.meta.env.VITE_API_URL || '';
        
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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                姓名 <span className="text-gray-500">(选填)</span>
              </label>
              <input
                type="text"
                value={athleteInfo.name}
                onChange={(e) => setAthleteInfo({ ...athleteInfo, name: e.target.value })}
                placeholder="你的名字"
                className="form-input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                性别 *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAthleteInfo({ ...athleteInfo, gender: 'male' })}
                  className={`py-4 px-4 rounded-xl border-2 transition font-medium ${
                    athleteInfo.gender === 'male'
                      ? 'border-hyrox-red bg-hyrox-red/10 text-hyrox-red-light'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  男
                </button>
                <button
                  onClick={() => setAthleteInfo({ ...athleteInfo, gender: 'female' })}
                  className={`py-4 px-4 rounded-xl border-2 transition font-medium ${
                    athleteInfo.gender === 'female'
                      ? 'border-hyrox-red bg-hyrox-red/10 text-hyrox-red-light'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  女
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  年龄 <span className="text-gray-500">(选填)</span>
                </label>
                <input
                  type="number"
                  value={athleteInfo.age}
                  onChange={(e) => setAthleteInfo({ ...athleteInfo, age: e.target.value })}
                  placeholder="30"
                  className="form-input-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  体重(kg) <span className="text-gray-500">(选填)</span>
                </label>
                <input
                  type="number"
                  value={athleteInfo.weight}
                  onChange={(e) => setAthleteInfo({ ...athleteInfo, weight: e.target.value })}
                  placeholder="70"
                  className="form-input-dark"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-400 mb-4">输入前四轮1km跑步用时</p>
            <div className="grid grid-cols-2 gap-4">
              {['run1', 'run2', 'run3', 'run4'].map((run, idx) => (
                <div key={run} className="sport-card p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                    第{idx + 1}轮跑步 *
                  </label>
                  <TimeSelector
                    value={splits[run]}
                    onChange={(seconds) => handleSplitChange(run, seconds)}
                    maxHours={0}
                    maxMinutes={20}
                    size="sm"
                    showLabels={true}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-400 mb-4">输入后四轮1km跑步用时</p>
            <div className="grid grid-cols-2 gap-4">
              {['run5', 'run6', 'run7', 'run8'].map((run, idx) => (
                <div key={run} className="sport-card p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                    第{idx + 5}轮跑步 *
                  </label>
                  <TimeSelector
                    value={splits[run]}
                    onChange={(seconds) => handleSplitChange(run, seconds)}
                    maxHours={0}
                    maxMinutes={20}
                    size="sm"
                    showLabels={true}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-400 mb-4">输入各站点用时</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stations.map((station) => (
                <div key={station.key} className="sport-card p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                    {station.icon} {station.label} *
                  </label>
                  <TimeSelector
                    value={splits[station.key]}
                    onChange={(seconds) => handleSplitChange(station.key, seconds)}
                    maxHours={0}
                    maxMinutes={10}
                    size="sm"
                    showLabels={true}
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
            <div className="sport-card p-4 bg-gradient-to-br from-hyrox-red/10 to-hyrox-red/5 border-hyrox-red/20">
              <h4 className="font-semibold text-hyrox-red-light mb-3 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                成绩概览
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">运动员</span>
                  <span className="font-medium text-white">{athleteInfo.name || '未命名'} ({athleteInfo.gender === 'male' ? '男' : '女'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">总用时</span>
                  <span className="font-bold text-hyrox-red-light">{formatSecondsToTime(totalTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">跑步总用时</span>
                  <span className="font-medium text-white">{formatSecondsToTime(totalRuns)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">站点总用时</span>
                  <span className="font-medium text-white">{formatSecondsToTime(totalStations)}</span>
                </div>
              </div>
            </div>

            <div className="sport-card p-4">
              <h4 className="font-semibold text-white mb-3">跑步成绩</h4>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                {['run1', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7', 'run8'].map((run, idx) => (
                  <div key={run} className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-gray-500 text-xs">R{idx + 1}</div>
                    <div className="font-medium text-white">{formatSecondsToTime(splits[run])}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sport-card p-4">
              <h4 className="font-semibold text-white mb-3">站点成绩</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {stations.map((station) => (
                  <div key={station.key} className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <div className="text-gray-500 text-xs">{station.icon} {station.label}</div>
                    <div className="font-medium text-white">{formatSecondsToTime(splits[station.key])}</div>
                  </div>
                ))}
              </div>
            </div>

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
          className="mb-4 text-xs text-gray-500 text-center"
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
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-lg text-sm border border-red-500/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">{apiError.title}</div>
                <div className="text-red-300/80">{apiError.message}</div>
              </div>
            </div>
            {apiError.retryable && (
              <button
                onClick={clearError}
                className="flex items-center justify-center gap-2 text-sm text-hyrox-red-light hover:text-hyrox-red-light py-2"
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
          className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition"
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
