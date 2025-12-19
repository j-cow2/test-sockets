
import React from 'react';
import { Position } from '../types';

interface YarnProps {
  start: Position;
  end: Position;
  isPreview?: boolean;
  color?: string;
}

const Yarn: React.FC<YarnProps> = ({ start, end, isPreview = false, color = "#cc0000" }) => {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Conspiracy board yarn should have a significant droop to feel real
  // Vertical cables droop less, horizontal more
  const horizontalFactor = Math.abs(dx) / (distance + 1);
  const droopAmount = isPreview 
    ? Math.min(distance * 0.1, 20) 
    : (Math.min(distance * 0.4, 180) * horizontalFactor + 10);
  
  const pathData = `M ${start.x} ${start.y} Q ${midX} ${midY + droopAmount} ${end.x} ${end.y}`;

  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible" 
      style={{ zIndex: isPreview ? 10001 : 500 }}
    >
      <defs>
        <filter id="yarnShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="2" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shadow */}
      {!isPreview && (
        <path
          d={pathData}
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="4"
          className="blur-[3px] translate-y-3 translate-x-1"
        />
      )}

      {/* Main Yarn Fiber */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={isPreview ? "2" : "3.5"}
        strokeLinecap="round"
        strokeDasharray={isPreview ? "5, 5" : "none"}
        style={{ filter: isPreview ? 'none' : 'url(#yarnShadow)' }}
      />
      
      {/* Texture highlight for "string" look */}
      {!isPreview && (
        <path
          d={pathData}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="1, 8"
        />
      )}
    </svg>
  );
};

export default Yarn;
