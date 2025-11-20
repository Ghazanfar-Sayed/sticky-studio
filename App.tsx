import React, { useState, useCallback } from 'react';
import { PenTool, Sparkles } from 'lucide-react';
import ScriptInput from './components/ScriptInput';
import StoryboardViewer from './components/StoryboardViewer';
import ChatAssistant from './components/ChatAssistant';
import { analyzeScript, generateStickFigureImage } from './services/geminiService';
import { Scene } from './types';

const App: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRegenerateImage = useCallback(async (sceneId: number, prompt: string) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isLoadingImage: true, error: undefined } : s));

    try {
      const base64Image = await generateStickFigureImage(prompt);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, imageUrl: base64Image, isLoadingImage: false } : s));
    } catch (error) {
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isLoadingImage: false, error: 'Failed to generate' } : s));
    }
  }, []);

  const handleAnalyzeScript = useCallback(async (script: string) => {
    setIsAnalyzing(true);
    setScenes([]); // Clear previous scenes

    try {
      // 1. Analyze script to get breakdown and prompts
      const analysis = await analyzeScript(script);
      
      // Initialize scenes with loading state for images
      const initialScenes: Scene[] = analysis.scenes.map(s => ({
        id: s.scene_number,
        description: s.description,
        visualPrompt: s.visual_prompt,
        isLoadingImage: true,
      }));

      setScenes(initialScenes);
      setIsAnalyzing(false); 

      // 2. Trigger image generation for each scene in parallel (or batched if needed to avoid rate limits)
      // We'll fire them off individually.
      initialScenes.forEach(scene => {
        handleRegenerateImage(scene.id, scene.visualPrompt);
      });

    } catch (error) {
      console.error("Script analysis failed", error);
      alert("Failed to analyze script. Please check your API key and try again.");
      setIsAnalyzing(false);
    }
  }, [handleRegenerateImage]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">StickFig <span className="text-indigo-600">Studio</span></h1>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 py-1 px-3 rounded-full border border-slate-200">
             <Sparkles className="w-3.5 h-3.5 text-amber-500" />
             <span>Powered by Gemini 3 Pro & Imagen 4</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-7rem)]">
          
          {/* Left Column: Script Input */}
          <div className="lg:col-span-1 h-full">
             <ScriptInput onAnalyze={handleAnalyzeScript} isAnalyzing={isAnalyzing} />
          </div>

          {/* Right Column: Storyboard Viewer */}
          <div className="lg:col-span-2 h-full bg-slate-100 rounded-xl border border-slate-200 p-6 shadow-inner">
             <StoryboardViewer scenes={scenes} onRegenerateImage={handleRegenerateImage} />
          </div>

        </div>
      </main>
      
      {/* Chat Assistant */}
      <ChatAssistant />

    </div>
  );
};

export default App;
