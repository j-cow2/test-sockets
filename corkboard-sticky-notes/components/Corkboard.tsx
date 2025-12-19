
import React, { useState, useRef, useEffect } from 'react';
import { Board, Position, CorkboardItem, Connection, NoteItem, PictureItem, PinItem, RemoteUser, AIOrganizationResponse } from '../types';
import { NOTE_COLORS, PIN_COLORS, DEFAULT_NOTE_WIDTH, DEFAULT_NOTE_HEIGHT, DEFAULT_PICTURE_WIDTH } from '../constants';
import { socketService } from '../services/socketService';
import DraggableItem from './DraggableItem';
import StickyNote from './StickyNote';
import Picture from './Picture';
import Pin from './Pin';
import Yarn from './Yarn';
import { GoogleGenAI, Type } from "@google/genai";

interface CorkboardProps {
  board: Board;
  onUpdate: (board: Partial<Board>) => void;
  onDelete: () => void;
}

const PIN_Z_BASE = 10000;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3.0;
const WORLD_CENTER = 5000; // Conceptual center for placing items

const USER_ID = Math.random().toString(36).substring(2, 9);
const NAMES = ['Detective', 'Agent', 'Insider', 'Whistleblower', 'Seeker', 'Echo', 'Shade'];
const USER_NAME = NAMES[Math.floor(Math.random() * NAMES.length)] + ' ' + (100 + Math.floor(Math.random() * 899));
const USER_COLOR = PIN_COLORS[Math.floor(Math.random() * PIN_COLORS.length)];

const Corkboard: React.FC<CorkboardProps> = ({ board, onUpdate, onDelete }) => {
  const [yarnMode, setYarnMode] = useState<string | null>(null);
  const [isConnectionActive, setIsConnectionActive] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<Record<string, RemoteUser & { noteCursor?: any }>>({});
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  // Dynamic pan/zoom state
  const [panOffset, setPanOffset] = useState<Position>({ 
    x: window.innerWidth / 2 - WORLD_CENTER * 0.5, 
    y: window.innerHeight / 2 - WORLD_CENTER * 0.5 
  });
  const [zoom, setZoom] = useState(0.5);
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef<Position>({ x: 0, y: 0 });

  const [maxZ, setMaxZ] = useState(1000);
  const [maxPinZ, setMaxPinZ] = useState(PIN_Z_BASE);
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Sync cursor position for ambient lighting
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Your investigation is not saved offline.';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const awareness = socketService.connect(
      board.id, 
      { id: USER_ID, name: USER_NAME, color: USER_COLOR },
      (updates) => onUpdate(updates)
    );

    const handlePresence = () => {
      const states = Array.from(awareness.getStates().entries());
      const users: Record<string, any> = {};
      states.forEach(([clientId, state]: [number, any]) => {
        if (state.user && state.user.id !== USER_ID) {
          users[state.user.id] = { ...state.user, cursor: state.cursor, noteCursor: state.noteCursor };
        }
      });
      setRemoteUsers(users);
    };

    awareness.on('change', handlePresence);
    return () => socketService.disconnect();
  }, [board.id]);

  const handleAIOrganize = async () => {
    if (board.items.length < 2) {
      alert("Requires more clues to find a pattern!");
      return;
    }

    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const notes = board.items.filter(i => i.type === 'note') as NoteItem[];
      
      const prompt = `Analyze these investigative clues and group them by shared connection. 
      CLUES:
      ${notes.map(n => `ID: ${n.id} | Data: ${n.content}`).join('\n')}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              groups: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                    centerX: { type: Type.NUMBER },
                    centerY: { type: Type.NUMBER }
                  },
                  required: ['label', 'itemIds', 'centerX', 'centerY']
                }
              },
              suggestedConnections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fromId: { type: Type.STRING },
                    toId: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ['fromId', 'toId']
                }
              }
            }
          }
        }
      });

      const aiResult: AIOrganizationResponse = JSON.parse(response.text);

      aiResult.groups.forEach((group, gIdx) => {
        const baseOffset = { x: WORLD_CENTER + (gIdx - 1) * 800, y: WORLD_CENTER };
        group.itemIds.forEach((id, index) => {
          const item = board.items.find(i => i.id === id);
          if (item) {
            const angle = (index / group.itemIds.length) * 2 * Math.PI;
            const radius = 250 + (index * 20);
            const newPos = {
              x: baseOffset.x + Math.cos(angle) * radius,
              y: baseOffset.y + Math.sin(angle) * radius
            };
            socketService.setItem({ ...item, position: newPos });
          }
        });
      });

      aiResult.suggestedConnections.forEach(conn => {
        socketService.addConnection({
          id: `ai_${Math.random().toString(36).substring(2, 9)}`,
          fromId: conn.fromId,
          toId: conn.toId
        });
      });

    } catch (error) {
      console.error("AI Pattern matching failed:", error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const addItem = (item: CorkboardItem) => {
    const worldX = (window.innerWidth / 2 - panOffset.x) / zoom;
    const worldY = (window.innerHeight / 2 - panOffset.y) / zoom;
    
    const newItem = { ...item, position: { x: worldX, y: worldY } };
    socketService.setItem(newItem);
    if (item.type === 'pin') setMaxPinZ(prev => prev + 1);
    else setMaxZ(prev => prev + 1);
  };

  const handleAddNote = () => {
    addItem({
      id: `note_${Math.random().toString(36).substring(2, 9)}`, 
      type: 'note', position: { x: 0, y: 0 },
      zIndex: maxZ, content: '', color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      width: DEFAULT_NOTE_WIDTH, height: DEFAULT_NOTE_HEIGHT,
      rotation: (Math.random() * 8) - 4
    });
  };

  const handleAddPin = () => {
    addItem({
      id: `pin_${Math.random().toString(36).substring(2, 9)}`, 
      type: 'pin', position: { x: 0, y: 0 },
      zIndex: maxPinZ, color: PIN_COLORS[Math.floor(Math.random() * PIN_COLORS.length)]
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        addItem({
          id: `pic_${Math.random().toString(36).substring(2, 9)}`, 
          type: 'picture', position: { x: 0, y: 0 },
          zIndex: maxZ, url: event.target?.result as string, 
          rotation: (Math.random() * 12) - 6, width: DEFAULT_PICTURE_WIDTH
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportBoard = () => {
    const data = socketService.getSharedData();
    // Use the current board metadata for the export
    const fullBoard = {
      ...data,
      id: board.id,
      createdAt: board.createdAt
    };
    const blob = new Blob([JSON.stringify(fullBoard, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${board.name.replace(/\s+/g, '_')}_corkboard.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleItemClick = (itemId: string, event: React.MouseEvent) => {
    const wasDragged = (event.currentTarget.closest('[data-was-dragged]') as HTMLElement)?.dataset.wasDragged === 'true';
    if (wasDragged || !isConnectionActive) return;

    if (!yarnMode) {
      setYarnMode(itemId);
    } else if (yarnMode !== itemId) {
      socketService.addConnection({ id: `conn_${Math.random().toString(36).substring(2, 9)}`, fromId: yarnMode, toId: itemId });
      setYarnMode(null);
      setIsConnectionActive(false); 
    } else {
      setYarnMode(null);
    }
  };

  const getItemAnchorPos = (id: string): Position | null => {
    const item = board.items.find(i => i.id === id);
    if (!item) return null;
    if (item.type === 'pin') return { x: item.position.x + 12, y: item.position.y + 12 };
    const w = (item as any).width || 200;
    return { x: item.position.x + w / 2, y: item.position.y + 10 };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
    
    const rect = boardRef.current?.getBoundingClientRect();
    if (rect) {
      const worldPos = {
        x: (e.clientX - rect.left - panOffset.x) / zoom,
        y: (e.clientY - rect.top - panOffset.y) / zoom
      };
      setMousePos(worldPos);
      socketService.updateCursor(worldPos);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const delta = -e.deltaY * 0.0012;
    const nextZoom = Math.min(Math.max(zoom + delta, MIN_ZOOM), MAX_ZOOM);
    
    if (nextZoom !== zoom) {
      const newPanX = mouseX - ((mouseX - panOffset.x) / zoom) * nextZoom;
      const newPanY = mouseY - ((mouseY - panOffset.y) / zoom) * nextZoom;
      setZoom(nextZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    }
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden flex flex-col font-sans select-none bg-[#1a1512]">
      {/* Immersive Cinematic Layers */}
      <div className="vignette"></div>
      <div className="ambient-light"></div>
      <div className="board-bezel"></div>
      <div className="film-grain"></div>

      {/* Top Navigation Bar */}
      <div className="bg-stone-900/95 backdrop-blur-2xl text-white px-8 py-5 flex items-center justify-between z-[20000] border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-8">
          <a href="#/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-red-700 rounded-lg flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <span className="text-2xl">📌</span>
            </div>
            <div className="leading-tight">
              <span className="block text-[10px] font-black tracking-[0.5em] text-stone-500 uppercase">Investigative Suite</span>
              <span className="text-2xl font-handwriting font-bold text-stone-100">{board.name}</span>
            </div>
          </a>
          
          <div className="h-10 w-px bg-white/10"></div>
          
          <div className="flex items-center -space-x-3">
            {Object.values(remoteUsers).map(u => (
              <div 
                key={u.id} 
                className="w-10 h-10 rounded-full border-2 border-stone-900 flex items-center justify-center text-[10px] font-black shadow-xl transition-all hover:scale-125 hover:z-[99] cursor-help"
                style={{ backgroundColor: u.color }}
                title={`${u.name} is online`}
              >
                {u.name.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleAIOrganize}
            disabled={isAiProcessing}
            className={`tool-btn bg-stone-100 text-stone-900 border-stone-300 ${isAiProcessing ? 'animate-pulse opacity-50' : 'hover:bg-white'}`}
          >
             {isAiProcessing ? '🕵️ Pattern Seeking...' : '🧶 Find Pattern'}
          </button>
          <div className="w-4"></div>
          <button onClick={handleAddNote} className="tool-btn bg-yellow-400 text-stone-900 border-yellow-600">📝 Note</button>
          <button onClick={() => fileInputRef.current?.click()} className="tool-btn bg-blue-500 text-white border-blue-700">🖼️ Evidence</button>
          <button onClick={handleAddPin} className="tool-btn bg-stone-700 text-white border-stone-800">📍 Pin</button>
          <button 
            onClick={() => { setIsConnectionActive(!isConnectionActive); setYarnMode(null); }}
            className={`tool-btn transition-all duration-300 ${isConnectionActive ? 'bg-red-600 border-red-800 scale-105 shadow-[0_0_30px_rgba(220,38,38,0.4)]' : 'bg-stone-800 border-stone-900'}`}
          >
            🧶 String
          </button>
          <div className="w-4"></div>
          <button 
            onClick={handleExportBoard}
            className="tool-btn bg-stone-200 text-stone-800 border-stone-400 hover:bg-white"
            title="Download Board Data"
          >
            💾 Save
          </button>
          <button onClick={onDelete} className="p-3 text-stone-600 hover:text-red-500 transition-colors rounded-xl hover:bg-white/5">🗑️</button>
        </div>
      </div>

      {/* Infinite Viewport */}
      <div 
        ref={boardRef}
        onMouseDown={(e) => { 
          // Pan if we click on the viewport itself
          if (e.target === boardRef.current || (e.target as HTMLElement).id === 'world-plane') { 
            setIsPanning(true); 
            lastMousePos.current = { x: e.clientX, y: e.clientY }; 
          } 
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsPanning(false)}
        onWheel={handleWheel}
        className={`flex-1 relative overflow-hidden transition-colors duration-500 cork-pattern-base ${isConnectionActive ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ 
          // Truly infinite tiling background that follows pan and zoom
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
          backgroundSize: `${400 * zoom}px ${400 * zoom}px` 
        }}
      >
        <div 
          id="world-plane"
          style={{ 
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, 
            transformOrigin: '0 0', 
            width: '1px', // Collapsed but items are absolute
            height: '1px', 
            position: 'absolute'
          }}
        >
          {/* Collaborative Cursors */}
          {Object.entries(remoteUsers).map(([id, u]) => u.cursor && (
            <div 
              key={id} 
              className="absolute pointer-events-none z-[100000] transition-transform duration-75 ease-out"
              style={{ left: u.cursor.x, top: u.cursor.y }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-2xl">
                <path d="M5.65 12.36L18.94 5L11.57 18.29L10.71 12.77L5.65 12.36Z" fill={u.color} stroke="white" strokeWidth="2" />
              </svg>
              <div className="ml-4 mt-1 px-3 py-1 rounded-full bg-stone-900 border border-white/20 text-[10px] text-white font-bold whitespace-nowrap shadow-2xl">
                {u.name}
              </div>
            </div>
          ))}

          {/* Red Yarn Strings (Below items) */}
          {board.connections.map(conn => {
            const start = getItemAnchorPos(conn.fromId);
            const end = getItemAnchorPos(conn.toId);
            if (!start || !end) return null;
            return (
              <div key={conn.id} className="group/yarn cursor-pointer pointer-events-auto" onClick={(e) => { if(isConnectionActive) { e.stopPropagation(); socketService.deleteConnection(conn.id); } }}>
                <Yarn start={start} end={end} />
                {isConnectionActive && (
                  <div 
                    className="absolute w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-2xl opacity-0 group-hover/yarn:opacity-100 z-[6000] border-2 border-white/20"
                    style={{ left: (start.x + end.x)/2, top: (start.y + end.y)/2 + 30 }}
                  >✕</div>
                )}
              </div>
            );
          })}

          {/* Active Yarn Preview */}
          {isConnectionActive && yarnMode && <Yarn start={getItemAnchorPos(yarnMode)!} end={mousePos} isPreview={true} />}

          {/* Board Content */}
          {board.items.map(item => (
            <DraggableItem
              key={item.id}
              initialPosition={item.position}
              onPositionChange={(pos) => socketService.setItem({ ...item, position: pos })}
              zIndex={item.zIndex}
              zoom={zoom}
            >
              {() => {
                const common = { 
                  isConnectionMode: isConnectionActive, 
                  onClick: (e: any) => handleItemClick(item.id, e), 
                  onDelete: () => socketService.deleteItem(item.id) 
                };
                if (item.type === 'note') {
                  const cursors = Object.entries(remoteUsers)
                    .filter(([_, u]) => u.noteCursor?.itemId === item.id)
                    .map(([id, u]) => ({ userId: id, user: u, ...u.noteCursor }));
                  return (
                    <StickyNote 
                      item={item} {...common}
                      updateContent={(c) => socketService.setItem({ ...item, content: c })}
                      remoteCursors={cursors}
                      onCursorChange={(idx) => socketService.setNoteCursor(item.id, idx)}
                    />
                  );
                }
                if (item.type === 'picture') return <Picture item={item} {...common} />;
                if (item.type === 'pin') return <Pin item={item} isSelected={yarnMode === item.id} {...common} />;
                return null;
              }}
            </DraggableItem>
          ))}
        </div>
      </div>

      {/* Footer / Status Bar */}
      <div className="bg-stone-950 text-stone-600 text-[10px] font-black uppercase tracking-[0.4em] px-10 py-4 flex justify-between z-[20000] border-t border-white/5">
        <div className="flex gap-10 items-center">
          <span className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
             LIVE FREQUENCY SECURED
          </span>
          <span>{board.items.length} LOGS</span>
          <span className="text-stone-400">{Object.keys(remoteUsers).length + 1} AGENTS ON GRID</span>
        </div>
        <div className="flex gap-8 items-center">
          <span className="text-stone-200">{USER_NAME}</span>
          <span className="bg-stone-900 border border-white/5 px-4 py-1.5 rounded-full text-stone-400">MAGNIFICATION: {Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <style>{`
        .tool-btn { @apply flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 border-b-4; }
      `}</style>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};

export default Corkboard;
