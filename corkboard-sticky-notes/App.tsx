
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { AppState, Board } from './types';
import { loadAppState, saveAppState, createNewBoard } from './services/storageService';
import Corkboard from './components/Corkboard';

const HomePage: React.FC<{ 
  state: AppState; 
  onCreate: (name: string, password?: string) => string;
}> = ({ state, onCreate }) => {
  const [newBoardName, setNewBoardName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    const newId = onCreate(newBoardName);
    setNewBoardName('');
    setShowCreate(false);
    navigate(`/board/${newId}`);
  };

  const boards = (Object.values(state.boards) as Board[]).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="min-h-screen cork-texture flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rounded-3xl p-10 max-w-xl w-full border border-white/40">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">📍</div>
          <h1 className="text-6xl font-handwriting font-bold text-gray-800 mb-2">CorkCork</h1>
          <p className="text-stone-500 italic">Collaborative Brainstorming. Enhanced by AI.</p>
        </div>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-2">
            <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em]">Active Rooms</h2>
            <button 
              onClick={() => setShowCreate(!showCreate)}
              className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-all active:scale-95"
            >
              {showCreate ? 'Close' : '+ New Room'}
            </button>
          </div>

          {showCreate && (
            <form onSubmit={onSubmit} className="bg-stone-100 p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 border border-stone-200">
              <div>
                <label className="block text-[10px] font-black text-stone-500 mb-1 uppercase tracking-wider">Room Name</label>
                <input 
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-stone-900 outline-none shadow-inner"
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  placeholder="Creative Explosion..."
                  required
                />
              </div>
              <button type="submit" className="w-full bg-stone-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-xl transition-all">
                Launch Collaboration
              </button>
            </form>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {boards.length === 0 ? (
              <div className="text-center py-8 text-stone-300 font-medium">
                No rooms yet. Start one above.
              </div>
            ) : (
              boards.map(b => (
                <button
                  key={b.id}
                  onClick={() => navigate(`/board/${b.id}`)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-stone-50 border border-stone-100 rounded-2xl transition-all hover:shadow-lg group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-150 transition-transform"></div>
                    <span className="font-bold text-stone-800">{b.name}</span>
                  </div>
                  <span className="text-xs font-bold text-stone-300 group-hover:text-stone-900 transition-colors uppercase tracking-widest">Enter &rarr;</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="mt-8 text-white/50 text-[10px] uppercase font-bold tracking-[0.3em]">Built for scale & imagination</div>
    </div>
  );
};

const BoardWrapper: React.FC<{ 
  state: AppState; 
  onUpdate: (board: Board) => void;
  onDelete: (id: string) => void;
}> = ({ state, onUpdate, onDelete }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(() => {
    return id ? state.boards[id] || null : null;
  });

  useEffect(() => {
    if (!board && id) {
      const newB = createNewBoard("Unnamed Board");
      newB.id = id;
      setBoard(newB);
    }
  }, [board, id]);

  if (!board) return null;

  const handleBoardUpdate = (updates: Partial<Board>) => {
    setBoard(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      // Sync back to App component's state
      onUpdate(updated);
      return updated;
    });
  };

  return <Corkboard 
    board={board} 
    onUpdate={handleBoardUpdate} 
    onDelete={() => {
      if (confirm(`Destroy this room? All collaborative state will be lost.`)) {
        onDelete(board.id);
        navigate('/');
      }
    }} 
  />;
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(loadAppState());

  const handleCreateBoard = (name: string): string => {
    const board = createNewBoard(name);
    setAppState(prev => {
      const newState = { ...prev, boards: { ...prev.boards, [board.id]: board } };
      saveAppState(newState);
      return newState;
    });
    return board.id;
  };

  const handleUpdateBoard = (board: Board) => {
    setAppState(prev => {
      const newState = { ...prev, boards: { ...prev.boards, [board.id]: board } };
      saveAppState(newState);
      return newState;
    });
  };

  const handleDeleteBoard = (id: string) => {
    setAppState(prev => {
      const newBoards = { ...prev.boards };
      delete newBoards[id];
      const newState = { ...prev, boards: newBoards };
      saveAppState(newState);
      return newState;
    });
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage state={appState} onCreate={handleCreateBoard} />} />
        <Route path="/board/:id" element={<BoardWrapper state={appState} onUpdate={handleUpdateBoard} onDelete={handleDeleteBoard} />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
