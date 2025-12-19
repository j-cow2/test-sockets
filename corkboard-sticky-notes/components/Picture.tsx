
import React from 'react';
import { PictureItem } from '../types';

interface PictureProps {
  item: PictureItem;
  onDelete: () => void;
  onClick?: (e: React.MouseEvent) => void;
  isConnectionMode?: boolean;
}

const Picture: React.FC<PictureProps> = ({ item, onDelete, onClick, isConnectionMode }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative p-3 pb-10 bg-[#f8f8f8] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] group border border-stone-300 transition-all ${
        isConnectionMode ? 'cursor-pointer hover:scale-[1.02] ring-4 ring-red-500/40 ring-offset-2' : ''
      }`}
      style={{ 
        width: item.width,
        transform: `rotate(${item.rotation}deg)`,
        backgroundImage: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.02) 100%)'
      }}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-sm z-50 shadow-xl border-2 border-white hover:scale-110 active:scale-95"
      >
        ✕
      </button>
      
      <div className="overflow-hidden bg-stone-200 border border-stone-400 aspect-[4/3] flex items-center justify-center relative">
        <img 
          src={item.url} 
          alt="Clue" 
          className="w-full h-full object-cover pointer-events-none grayscale-[0.2] sepia-[0.1]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/400/300';
          }}
        />
        {/* Subtle light reflections */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
      </div>

      {item.caption && (
        <div className="mt-2 text-center font-handwriting text-xl text-stone-700 leading-none">
          {item.caption}
        </div>
      )}

      {/* Masking tape visual effect */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-yellow-100/40 backdrop-blur-sm border border-yellow-200/50 -rotate-2 opacity-60"></div>

      {isConnectionMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-600/20 border-2 border-red-600 animate-ping pointer-events-none" />
      )}
    </div>
  );
};

export default Picture;
