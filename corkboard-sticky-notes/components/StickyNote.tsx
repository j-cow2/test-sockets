
import React, { useRef, useState, useMemo } from 'react';
import { NoteItem, RemoteUser, UserCursor } from '../types';
import { GoogleGenAI } from "@google/genai";

interface StickyNoteProps {
  item: NoteItem;
  updateContent: (content: string) => void;
  onDelete: () => void;
  onClick?: (e: React.MouseEvent) => void;
  isConnectionMode?: boolean;
  remoteCursors?: (UserCursor & { user: RemoteUser })[];
  onCursorChange?: (index: number) => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({ 
  item, 
  updateContent, 
  onDelete, 
  onClick, 
  isConnectionMode,
  remoteCursors = [],
  onCursorChange
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleAIEnhance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.content.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I have a sticky note for a conspiracy/brainstorming board that says: "${item.content}". 
        Make it sound more urgent, cryptic, or summarized for a rapid-fire brainstorm. 
        Max 15 words. Just give me the text.`,
        config: {
          systemInstruction: "You are an intense investigative journalist or detective. Your notes are punchy and direct."
        }
      });
      updateContent(response.text?.trim() || item.content);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSelect = () => {
    if (textareaRef.current && onCursorChange) {
      onCursorChange(textareaRef.current.selectionStart);
    }
  };

  const activeUsers = useMemo(() => {
    const users: Record<string, RemoteUser> = {};
    remoteCursors.forEach(c => {
      if (c.user) users[c.userId] = c.user;
    });
    return Object.values(users);
  }, [remoteCursors]);

  return (
    <div 
      onClick={onClick}
      className={`relative p-5 pt-12 flex flex-col group transition-all duration-300 ${isConnectionMode ? 'cursor-pointer ring-8 ring-red-500/20 rounded-sm' : ''}`}
      style={{ 
        backgroundColor: item.color, 
        width: item.width, 
        height: item.height,
        transform: `rotate(${item.rotation}deg)`,
        boxShadow: '2px 15px 30px -10px rgba(0,0,0,0.4), inset 0 0 50px rgba(0,0,0,0.05)',
        clipPath: 'polygon(1% 2%, 98% 0%, 100% 98%, 2% 100%)', // Rough edges
      }}
    >
      {/* Tooling */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-50 translate-y-[-10px] group-hover:translate-y-0">
        <button 
          onClick={handleAIEnhance}
          disabled={isEnhancing}
          title="Detect Truth (AI)"
          className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-all active:scale-90 ${isEnhancing ? 'bg-amber-100 animate-bounce' : 'bg-white hover:bg-stone-100 text-stone-800'}`}
        >
          {isEnhancing ? '🕵️' : '🔍'}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="bg-red-600 text-white rounded-lg w-8 h-8 flex items-center justify-center shadow-lg hover:bg-red-700 active:scale-90"
        >
          ✕
        </button>
      </div>

      {/* User Presence */}
      {activeUsers.length > 0 && (
        <div className="absolute top-3 left-3 flex -space-x-2 pointer-events-none z-30">
          {activeUsers.map(user => (
            <div 
              key={user.id}
              className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-md animate-in fade-in zoom-in"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      )}
      
      <textarea
        ref={textareaRef}
        disabled={isConnectionMode || isEnhancing}
        className={`w-full h-full bg-transparent border-none resize-none focus:ring-0 font-handwriting text-2xl leading-[1.1] text-stone-800 placeholder-stone-400/40 ${isConnectionMode ? 'pointer-events-none' : ''}`}
        value={item.content}
        onSelect={handleSelect}
        onKeyUp={handleSelect}
        onClick={handleSelect}
        onFocus={handleSelect}
        onChange={(e) => {
          updateContent(e.target.value);
          handleSelect();
        }}
        placeholder="Evidence..."
      />

      {/* Character-level Cursors */}
      <div className="absolute inset-5 top-12 pointer-events-none overflow-hidden select-none z-20">
        {remoteCursors.map(c => (
          <div 
            key={c.userId}
            className="absolute w-[2px] h-7 animate-pulse"
            style={{ 
              top: Math.floor(c.index / 15) * 30, // Estimating line breaks
              left: (c.index % 15) * 12, 
              backgroundColor: c.user.color 
            }}
          >
            <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] text-white font-bold whitespace-nowrap" style={{ backgroundColor: c.user.color }}>
              {c.user.name}
            </div>
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-3 right-4 opacity-30 text-[9px] font-black uppercase tracking-tighter italic pointer-events-none">
        {isEnhancing ? 'DECRYPTING...' : 'TOP SECRET'}
      </div>
    </div>
  );
};

export default StickyNote;
