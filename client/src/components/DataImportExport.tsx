import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, FileJson, FileSpreadsheet, AlertCircle, Check, X, Copy } from 'lucide-react';

interface DataImportExportProps {
  data: any;
  onImport: (data: any) => void;
  className?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: any;
}

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      if (value && !isNaN(Number(value))) {
        obj[header] = Number(value);
      } else if (value === 'true') {
        obj[header] = true;
      } else if (value === 'false') {
        obj[header] = false;
      } else {
        obj[header] = value;
      }
    });
    results.push(obj);
  }
  return results;
}

function convertToCSV(data: any): string {
  if (!data || typeof data !== 'object') return '';
  const flattenData = (obj: any, prefix = ''): Record<string, any> => {
    const result: Record<string, any> = {};
    for (const key in obj) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(result, flattenData(obj[key], newKey));
      } else {
        result[newKey] = obj[key];
      }
    }
    return result;
  };
  const flatData = flattenData(data);
  const headers = Object.keys(flatData);
  const values = headers.map(h => {
    const val = flatData[h];
    if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val ?? '';
  });
  return [headers.join(','), values.join(',')].join('\n');
}

function validateData(data: any): ValidationResult {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['无效的数据格式'] };
  }
  const requiredFields = ['athleteInfo', 'splits'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`缺少必需字段: ${field}`);
    }
  }
  if (data.athleteInfo) {
    if (!data.athleteInfo.gender || !['male', 'female'].includes(data.athleteInfo.gender)) {
      errors.push('athleteInfo.gender 必须是 "male" 或 "female"');
    }
  }
  if (data.splits) {
    const runFields = Array.from({ length: 8 }, (_, i) => `run${i + 1}`);
    const stationFields = ['skiErg', 'sledPush', 'sledPull', 'burpeeBroadJump', 'rowing', 'farmersCarry', 'sandbagLunges', 'wallBalls'];
    const allFields = [...runFields, ...stationFields];
    for (const field of allFields) {
      if (!(field in data.splits)) {
        errors.push(`splits 缺少字段: ${field}`);
      } else if (typeof data.splits[field] !== 'number' || data.splits[field] < 0) {
        errors.push(`splits.${field} 必须是正数`);
      }
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : undefined
  };
}

export function DataImportExport({ data, onImport, className = '' }: DataImportExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('export');
  const [importText, setImportText] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      setValidationResult(null);
    };
    reader.readAsText(file);
  }, []);

  const handleImport = useCallback(() => {
    if (!importText.trim()) {
      showToast('请输入数据', 'error');
      return;
    }
    let parsedData: any;
    try {
      parsedData = JSON.parse(importText);
    } catch {
      try {
        const csvData = parseCSV(importText);
        if (csvData.length > 0) {
          parsedData = csvData[0];
        } else {
          throw new Error('CSV 解析失败');
        }
      } catch {
        showToast('无法解析数据，请检查格式', 'error');
        return;
      }
    }
    const result = validateData(parsedData);
    setValidationResult(result);
    if (result.valid && result.data) {
      onImport(result.data);
      showToast('数据导入成功', 'success');
      setIsOpen(false);
      setImportText('');
    }
  }, [importText, onImport]);

  const handleExport = useCallback((format: 'json' | 'csv') => {
    let content: string;
    let filename: string;
    let mimeType: string;
    const timestamp = new Date().toISOString().slice(0, 10);
    const athleteName = data?.athleteInfo?.name || 'athlete';
    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      filename = `hyrox_${athleteName}_${timestamp}.json`;
      mimeType = 'application/json';
    } else {
      content = convertToCSV(data);
      filename = `hyrox_${athleteName}_${timestamp}.csv`;
      mimeType = 'text/csv';
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`已导出为 ${format.toUpperCase()}`, 'success');
  }, [data]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('已复制到剪贴板', 'success');
    } catch {
      showToast('复制失败', 'error');
    }
  }, [data]);

  return (
    <div className={className}>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-hyrox-red-dark transition"
      >
        <Upload className="w-4 h-4" />
        导入/导出数据
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">数据导入/导出</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('export')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition ${
                    activeTab === 'export'
                      ? 'text-hyrox-red-dark border-b-2 border-hyrox-red'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  导出数据
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition ${
                    activeTab === 'import'
                      ? 'text-hyrox-red-dark border-b-2 border-hyrox-red'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  导入数据
                </button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto flex-1">
                {activeTab === 'export' ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">当前数据</h4>
                      <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleExport('json')}
                        className="flex items-center justify-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                      >
                        <FileJson className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-medium">导出 JSON</div>
                          <div className="text-xs text-blue-600">完整数据结构</div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center justify-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                      >
                        <FileSpreadsheet className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-medium">导出 CSV</div>
                          <div className="text-xs text-green-600">表格格式</div>
                        </div>
                      </button>
                    </div>

                    <button
                      onClick={handleCopyToClipboard}
                      className="w-full flex items-center justify-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-hyrox-red hover:text-hyrox-red-dark transition"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? '已复制' : '复制 JSON 到剪贴板'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-hyrox-red transition">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">拖拽文件到此处或点击上传</p>
                      <input
                        type="file"
                        accept=".json,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-block px-4 py-2 bg-hyrox-red text-white rounded-lg cursor-pointer hover:bg-hyrox-red-dark transition"
                      >
                        选择文件
                      </label>
                    </div>

                    <div className="text-center text-sm text-gray-500">或</div>

                    <textarea
                      value={importText}
                      onChange={(e) => {
                        setImportText(e.target.value);
                        setValidationResult(null);
                      }}
                      placeholder="粘贴 JSON 或 CSV 数据..."
                      className="w-full h-40 p-3 border-2 border-gray-200 rounded-lg focus:border-hyrox-red focus:outline-none resize-none text-sm font-mono"
                    />

                    {validationResult && !validationResult.valid && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-700 mb-2">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">验证失败</span>
                        </div>
                        <ul className="text-sm text-red-600 space-y-1">
                          {validationResult.errors.map((error, idx) => (
                            <li key={idx}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={handleImport}
                      disabled={!importText.trim()}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-hyrox-red text-white rounded-lg hover:bg-hyrox-red-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      导入数据
                    </button>

                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium mb-1">支持格式：</p>
                      <ul className="space-y-1">
                        <li>• JSON: 完整的 HYROX 数据对象</li>
                        <li>• CSV: 包含所有必需字段的表格</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DataImportExport;