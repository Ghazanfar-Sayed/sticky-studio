import React, { useState, useRef } from 'react';
import { Upload, Play, FileText, X } from 'lucide-react';

interface ScriptInputProps {
  onAnalyze: (script: string) => void;
  isAnalyzing: boolean;
}

const ScriptInput: React.FC<ScriptInputProps> = ({ onAnalyze, isAnalyzing }) => {
  const [script, setScript] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = () => {
    if (!script.trim()) return;
    onAnalyze(script);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setScript(text);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const clearScript = () => setScript('');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Script Editor
        </h2>
        <div className="flex items-center gap-2">
           <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-slate-600 hover:text-indigo-600 flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
            disabled={isAnalyzing}
          >
            <Upload className="w-4 h-4" />
            Load File
          </button>
          <input
            type="file"
            accept=".txt,.md,.csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex-1 p-4 relative">
        <textarea
          className="w-full h-full resize-none outline-none text-slate-700 font-mono text-sm p-2 rounded-md border border-transparent focus:border-indigo-100 focus:bg-slate-50 transition-all"
          placeholder="Enter your script here... 
Example:
A man walks into a room. He sees a giant cake. He eats the cake. He is happy."
          value={script}
          onChange={(e) => setScript(e.target.value)}
          disabled={isAnalyzing}
        />
        {script && (
            <button 
                onClick={clearScript}
                className="absolute top-6 right-6 text-slate-400 hover:text-red-500"
            >
                <X className="w-4 h-4" />
            </button>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !script.trim()}
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium text-white transition-all ${
            isAnalyzing || !script.trim()
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-[0.98]'
          }`}
        >
          {isAnalyzing ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              Analyzing & Generating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Generate Storyboard
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ScriptInput;
