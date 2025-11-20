import React, { useState } from 'react';
import { Scene } from '../types';
import { Download, RefreshCw, ImageOff, Package, ExternalLink } from 'lucide-react';
import JSZip from 'jszip';

interface StoryboardViewerProps {
  scenes: Scene[];
  onRegenerateImage: (sceneId: number, prompt: string) => void;
}

const StoryboardViewer: React.FC<StoryboardViewerProps> = ({ scenes, onRegenerateImage }) => {
  const [isZipping, setIsZipping] = useState(false);

  const hasImages = scenes.some(s => s.imageUrl);

  const handleDownloadAll = async (forCanva: boolean = false) => {
    if (!hasImages) return;
    
    setIsZipping(true);
    try {
        const zip = new JSZip();
        const folder = zip.folder("stickfig-storyboard");
        
        let count = 0;
        scenes.forEach((scene, i) => {
            if (scene.imageUrl) {
                 // scene.imageUrl is "data:image/jpeg;base64,..."
                 const base64Data = scene.imageUrl.split(',')[1];
                 folder?.file(`scene-${i + 1}.jpg`, base64Data, { base64: true });
                 count++;
            }
        });
    
        if (count === 0) {
            setIsZipping(false);
            return;
        }
    
        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "stickfig_storyboard.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        if (forCanva) {
             // Open Canva Storyboard create page
             window.open('https://www.canva.com/create/storyboards/', '_blank');
        }

    } catch (error) {
        console.error("Error creating zip:", error);
        alert("Could not create download. Please try again.");
    } finally {
        setIsZipping(false);
    }
  };
  
  if (scenes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <ImageOff className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-lg font-medium">No storyboard generated yet</p>
        <p className="text-sm">Enter a script and hit Generate to start</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3 px-1">
        <h3 className="text-lg font-semibold text-slate-700">Storyboard Scenes</h3>
        
        <div className="flex items-center gap-2">
            <button
                onClick={() => handleDownloadAll(false)}
                disabled={!hasImages || isZipping}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Download all images as ZIP"
            >
                <Package className="w-4 h-4" />
                {isZipping ? 'Zipping...' : 'Download ZIP'}
            </button>
            
            <button
                onClick={() => handleDownloadAll(true)}
                disabled={!hasImages || isZipping}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 border border-indigo-600 rounded-md text-sm text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Download assets and open Canva"
            >
                <ExternalLink className="w-4 h-4" />
                Open in Canva
            </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-4">
          {scenes.map((scene, index) => (
            <div key={scene.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow duration-300">
              {/* Image Area */}
              <div className="aspect-square bg-slate-100 relative border-b border-slate-100">
                {scene.isLoadingImage ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 animate-pulse">
                    <div className="w-12 h-12 border-4 border-slate-300 border-t-indigo-500 rounded-full animate-spin mb-2"></div>
                    <span className="text-xs font-medium tracking-wider uppercase">Sketching...</span>
                  </div>
                ) : scene.error ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4 text-center">
                      <ImageOff className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs">{scene.error}</span>
                       <button 
                          onClick={() => onRegenerateImage(scene.id, scene.visualPrompt)}
                          className="mt-2 text-xs bg-white border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-50 transition"
                       >
                          Retry
                       </button>
                  </div>
                ) : scene.imageUrl ? (
                  <div className="relative w-full h-full group-image">
                      <img
                      src={scene.imageUrl}
                      alt={`Scene ${index + 1}`}
                      className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                           <a 
                              href={scene.imageUrl} 
                              download={`stick-fig-scene-${index+1}.jpg`}
                              className="bg-white/90 p-1.5 rounded-full text-slate-700 hover:text-indigo-600 shadow-sm block"
                              title="Download Image"
                           >
                               <Download className="w-4 h-4" />
                           </a>
                      </div>
                  </div>
                ) : null}
                
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                  Scene {index + 1}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-slate-700 text-sm leading-relaxed flex-1">
                  {scene.description}
                </p>
                
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                   <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Action</span>
                   <button 
                      onClick={() => onRegenerateImage(scene.id, scene.visualPrompt)}
                      disabled={scene.isLoadingImage}
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-indigo-50"
                      title="Regenerate Image"
                   >
                      <RefreshCw className={`w-4 h-4 ${scene.isLoadingImage ? 'animate-spin' : ''}`} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryboardViewer;