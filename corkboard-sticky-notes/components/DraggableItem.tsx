
import React, { useState, useEffect, useRef } from 'react';
import { Position } from '../types';

interface DraggableItemProps {
  initialPosition: Position;
  onPositionChange: (pos: Position) => void;
  onDragStart?: () => void;
  children: (isDragging: boolean) => React.ReactNode;
  zIndex: number;
  liveUpdate?: boolean; // If true, onPositionChange is called during mousemove
  zoom?: number; // Added zoom prop to handle scaled movement
}

const DraggableItem: React.FC<DraggableItemProps> = ({ 
  initialPosition, 
  onPositionChange, 
  onDragStart,
  children,
  zIndex,
  liveUpdate = false,
  zoom = 1
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState(initialPosition);
  const offset = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const hasMovedSignificant = useRef(false);

  useEffect(() => {
    if (!isDragging) {
      setPos(initialPosition);
    }
  }, [initialPosition, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    // Stop propagation so the background panning doesn't trigger
    e.stopPropagation();

    onDragStart?.();
    setIsDragging(true);
    hasMovedSignificant.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    
    // In scaled space, the offset is different
    offset.current = {
      x: e.clientX - pos.x * zoom,
      y: e.clientY - pos.y * zoom,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedSignificant.current = true;
      }

      // We need to divide the new screen position by zoom to get world coordinates
      const newPos = {
        x: (e.clientX - offset.current.x) / zoom,
        y: (e.clientY - offset.current.y) / zoom,
      };
      setPos(newPos);

      if (liveUpdate) {
        onPositionChange(newPos);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onPositionChange(pos);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, pos, onPositionChange, liveUpdate, zoom]);

  return (
    <div
      className={`absolute transition-shadow ${isDragging ? 'shadow-2xl scale-105 z-[9999]' : 'shadow-lg'}`}
      style={{ 
        left: pos.x, 
        top: pos.y, 
        zIndex: isDragging ? 9999 : zIndex,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      // We pass down a helper to let children know if they should ignore clicks (because it was a drag)
      data-was-dragged={hasMovedSignificant.current}
    >
      {children(isDragging)}
    </div>
  );
};

export default DraggableItem;
