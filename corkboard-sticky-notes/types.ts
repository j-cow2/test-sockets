
export type ItemType = 'note' | 'picture' | 'pin';

export interface Position {
  x: number;
  y: number;
}

export interface BaseItem {
  id: string;
  type: ItemType;
  position: Position;
  zIndex: number;
}

export interface NoteItem extends BaseItem {
  type: 'note';
  content: string;
  color: string;
  width: number;
  height: number;
  rotation: number;
}

export interface PictureItem extends BaseItem {
  type: 'picture';
  url: string;
  rotation: number;
  width: number;
  caption?: string;
}

export interface PinItem extends BaseItem {
  type: 'pin';
  color: string;
}

export type CorkboardItem = NoteItem | PictureItem | PinItem;

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  color?: string;
}

export interface Board {
  id: string;
  name: string;
  password?: string;
  items: CorkboardItem[];
  connections: Connection[];
  createdAt: number;
  lastModified: number;
}

export interface AppState {
  boards: Record<string, Board>;
}

export interface RemoteUser {
  id: string;
  name: string;
  color: string;
  lastSeen: number;
  cursor?: Position;
}

export interface UserCursor {
  userId: string;
  itemId: string;
  index: number;
}

export interface AIOrganizationResponse {
  groups: {
    label: string;
    itemIds: string[];
    centerX: number;
    centerY: number;
  }[];
  suggestedConnections: {
    fromId: string;
    toId: string;
    reason: string;
  }[];
}
