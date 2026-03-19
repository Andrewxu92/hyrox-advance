import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TimeSelectorProps {
  value: number; // 秒数
  onChange: (seconds: number) => void;
  maxHours?: number;
  maxMinutes?: number;
  maxSeconds?: number;
  label?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

// 生成选项数组
const generateOptions = (max: number, prefix: string = '') => {
  const options = [];
  for (let i = 0; i <= max; i++) {
    options.push({
      value: i,
      label: i.toString().padStart(2, '0'),
    });
  }
  return options;
};

function TimeSelector({
  value,
  onChange,
  maxHours = 2,
  maxMinutes = 59,
  maxSeconds = 59,
  label,
  showLabels = true,
  size = 'md',
  disabled = false,
  className = '',
}: TimeSelectorProps) {
  // 将秒数转换为时分秒
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // 选项数组
  const hourOptions = useMemo(() => generateOptions(maxHours), [maxHours]);
  const minuteOptions = useMemo(() => generateOptions(maxMinutes), [maxMinutes]);
  const secondOptions = useMemo(() => generateOptions(maxSeconds), [maxSeconds]);

  // 从秒数更新时分秒
  useEffect(() => {
    const h = Math.floor(value / 3600);
    const m = Math.floor((value % 3600) / 60);
    const s = value % 60;
    setHours(h);
    setMinutes(m);
    setSeconds(s);
  }, [value]);

  // 时分秒变化时更新总秒数
  const handleChange = (type: 'hours' | 'minutes' | 'seconds', newValue: number) => {
    let newHours = hours;
    let newMinutes = minutes;
    let newSeconds = seconds;

    if (type === 'hours') newHours = newValue;
    if (type === 'minutes') newMinutes = newValue;
    if (type === 'seconds') newSeconds = newValue;

    const totalSeconds = newHours * 3600 + newMinutes * 60 + newSeconds;
    onChange(totalSeconds);
  };

  // 尺寸样式
  const sizeStyles = {
    sm: {
      select: 'py-2 px-2 text-sm',
      label: 'text-xs',
      separator: 'text-sm',
    },
    md: {
      select: 'py-3 px-3 text-base',
      label: 'text-sm',
      separator: 'text-base',
    },
    lg: {
      select: 'py-4 px-4 text-xl font-bold',
      label: 'text-sm',
      separator: 'text-xl font-bold',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className={`time-selector ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {/* 小时 */}
        <div className="flex flex-col items-center">
          {showLabels && (
            <span className={`${styles.label} text-gray-400 mb-1`}>时</span>
          )}
          <div className="relative">
            <select
              value={hours}
              onChange={(e) => handleChange('hours', parseInt(e.target.value))}
              disabled={disabled}
              className={`
                appearance-none bg-gray-800 border-2 border-gray-700 rounded-xl
                text-white text-center cursor-pointer
                focus:border-hyrox-red focus:ring-2 focus:ring-hyrox-red/20
                hover:border-gray-600 transition-all
                ${styles.select}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              aria-label="小时"
            >
              {hourOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* 分隔符 */}
        <span className={`${styles.separator} text-gray-500 mt-4`}>:</span>

        {/* 分钟 */}
        <div className="flex flex-col items-center">
          {showLabels && (
            <span className={`${styles.label} text-gray-400 mb-1`}>分</span>
          )}
          <div className="relative">
            <select
              value={minutes}
              onChange={(e) => handleChange('minutes', parseInt(e.target.value))}
              disabled={disabled}
              className={`
                appearance-none bg-gray-800 border-2 border-gray-700 rounded-xl
                text-white text-center cursor-pointer
                focus:border-hyrox-red focus:ring-2 focus:ring-hyrox-red/20
                hover:border-gray-600 transition-all
                ${styles.select}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              aria-label="分钟"
            >
              {minuteOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* 分隔符 */}
        <span className={`${styles.separator} text-gray-500 mt-4`}>:</span>

        {/* 秒 */}
        <div className="flex flex-col items-center">
          {showLabels && (
            <span className={`${styles.label} text-gray-400 mb-1`}>秒</span>
          )}
          <div className="relative">
            <select
              value={seconds}
              onChange={(e) => handleChange('seconds', parseInt(e.target.value))}
              disabled={disabled}
              className={`
                appearance-none bg-gray-800 border-2 border-gray-700 rounded-xl
                text-white text-center cursor-pointer
                focus:border-hyrox-red focus:ring-2 focus:ring-hyrox-red/20
                hover:border-gray-600 transition-all
                ${styles.select}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              aria-label="秒"
            >
              {secondOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeSelector;

// 紧凑型时间选择器 - 用于表格或列表
export function TimeSelectorCompact({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (seconds: number) => void;
  disabled?: boolean;
}) {
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;

  const handleChange = (type: string, newValue: number) => {
    let h = hours, m = minutes, s = seconds;
    if (type === 'h') h = newValue;
    if (type === 'm') m = newValue;
    if (type === 's') s = newValue;
    onChange(h * 3600 + m * 60 + s);
  };

  return (
    <div className="flex items-center gap-1">
      <select
        value={hours}
        onChange={(e) => handleChange('h', parseInt(e.target.value))}
        disabled={disabled}
        className="w-14 py-1.5 px-1 text-center bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-hyrox-red"
      >
        {Array.from({ length: 3 }, (_, i) => (
          <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
        ))}
      </select>
      <span className="text-gray-500">:</span>
      <select
        value={minutes}
        onChange={(e) => handleChange('m', parseInt(e.target.value))}
        disabled={disabled}
        className="w-14 py-1.5 px-1 text-center bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-hyrox-red"
      >
        {Array.from({ length: 60 }, (_, i) => (
          <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
        ))}
      </select>
      <span className="text-gray-500">:</span>
      <select
        value={seconds}
        onChange={(e) => handleChange('s', parseInt(e.target.value))}
        disabled={disabled}
        className="w-14 py-1.5 px-1 text-center bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-hyrox-red"
      >
        {Array.from({ length: 60 }, (_, i) => (
          <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
        ))}
      </select>
    </div>
  );
}
