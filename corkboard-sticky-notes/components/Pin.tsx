
import React from 'react';
import { PinItem } from '../types';

interface PinProps {
  item: PinItem;
  isSelected?: boolean;
  onDelete: () => void;
  onClick?: (e: React.MouseEvent) => void;
  isConnectionMode?: boolean;
}

const Pin: React.FC<PinProps> = ({ item, isSelected, onDelete, onClick, isConnectionMode }) => {
  return (
    <div 
      className={`relative group p-2 -m-2 transition-transform ${isConnectionMode ? 'cursor-pointer hover:scale-125' : ''}`}
      onClick={onClick}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] z-10 shadow-lg"
      >
        ✕
      </button>

      <div 
        className={`w-6 h-6 rounded-full border-2 border-stone-800 shadow-xl flex items-center justify-center transition-all ${
          isSelected ? 'ring-4 ring-red-400 ring-opacity-70 scale-125' : 'hover:scale-110'
        } ${isConnectionMode ? 'animate-pulse ring-2 ring-red-500/30' : ''}`}
        style={{ backgroundColor: item.color }}
      >
        {/* Subtle highlight for plastic look */}
        <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40 translate-x-1 -translate-y-1"></div>
        {/* Needle center */}
        <div className="w-1 h-1 rounded-full bg-stone-900/30"></div>
      </div>
      
      {/* Visual spike shadow for depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-stone-900/40 blur-[1px] rotate-45 transform-gpu -z-10 origin-top"></div>
    </div>
  );
};

export default Pin;
