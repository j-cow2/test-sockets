
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { CorkboardItem, Connection, Position, Board } from '../types';

class CollabService {
  private doc: Y.Doc | null = null;
  private provider: any = null;
  private itemsMap: Y.Map<any> | null = null;
  private connectionsArray: Y.Array<any> | null = null;
  private metaMap: Y.Map<any> | null = null;
  private boardId: string | null = null;

  connect(boardId: string, user: { id: string; name: string; color: string }, onUpdate: (data: Partial<Board>) => void) {
    if (this.doc) this.disconnect();

    this.boardId = boardId;
    this.doc = new Y.Doc();
    
    this.provider = new WebrtcProvider(`cork-cork-room-${boardId}`, this.doc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com']
    });

    this.itemsMap = this.doc.getMap('items');
    this.connectionsArray = this.doc.getArray('connections');
    this.metaMap = this.doc.getMap('metadata');

    this.provider.awareness.setLocalStateField('user', user);

    // Helper to notify of any changes with a full snapshot of shared data
    const notify = () => {
      if (!this.itemsMap || !this.connectionsArray || !this.metaMap) return;
      onUpdate({
        items: Array.from(this.itemsMap.values()) as CorkboardItem[],
        connections: this.connectionsArray.toArray() as Connection[],
        name: this.metaMap.get('name') || ''
      });
    };

    // Listen for changes on any of the shared types
    this.itemsMap.observe(notify);
    this.connectionsArray.observe(notify);
    this.metaMap.observe(notify);

    // Initial sync
    notify();

    return this.provider.awareness;
  }

  disconnect() {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    if (this.doc) {
      this.doc.destroy();
      this.doc = null;
    }
    this.itemsMap = null;
    this.connectionsArray = null;
    this.metaMap = null;
  }

  // State Updates
  setItem(item: CorkboardItem) {
    this.itemsMap?.set(item.id, item);
  }

  deleteItem(itemId: string) {
    this.itemsMap?.delete(itemId);
    const conns = (this.connectionsArray?.toArray() || []) as Connection[];
    const toDelete = conns.map((c, i) => (c.fromId === itemId || c.toId === itemId) ? i : -1).filter(i => i !== -1);
    toDelete.sort((a, b) => b - a).forEach(i => this.connectionsArray?.delete(i));
  }

  addConnection(connection: Connection) {
    const conns = (this.connectionsArray?.toArray() || []) as Connection[];
    const exists = conns.some(c => 
      (c.fromId === connection.fromId && c.toId === connection.toId) ||
      (c.fromId === connection.toId && c.toId === connection.fromId)
    );
    if (!exists) {
      this.connectionsArray?.push([connection]);
    }
  }

  deleteConnection(connectionId: string) {
    const conns = (this.connectionsArray?.toArray() || []) as Connection[];
    const index = conns.findIndex(c => c.id === connectionId);
    if (index !== -1) {
      this.connectionsArray?.delete(index);
    }
  }

  updateCursor(pos: Position) {
    this.provider?.awareness.setLocalStateField('cursor', pos);
  }

  setNoteCursor(itemId: string, index: number) {
    this.provider?.awareness.setLocalStateField('noteCursor', { itemId, index });
  }

  setBoardName(name: string) {
    this.metaMap?.set('name', name);
  }

  getSharedData() {
    return {
      items: Array.from(this.itemsMap?.values() || []) as CorkboardItem[],
      connections: (this.connectionsArray?.toArray() || []) as Connection[],
      name: this.metaMap?.get('name') || ''
    };
  }
}

export const socketService = new CollabService();
