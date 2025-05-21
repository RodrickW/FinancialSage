import React from 'react';

export function ChessKingLogo({ className = "w-6 h-6", color = "text-white" }: { className?: string, color?: string }) {
  return (
    <div className={`${className} ${color}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v5M7.5 4.5L9 7h6l1.5-2.5L19 7a2 2 0 1 1-4 0" />
        <path d="M5 20l2-7h10l2 7H5zM5 20h14" />
        <path d="M8 12h8" />
      </svg>
    </div>
  );
}

export function ChessCrownLogo({ className = "w-6 h-6", color = "text-white" }: { className?: string, color?: string }) {
  return (
    <div className={`${className} ${color}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 10l3 3v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7l3-3-1-3H4l-1 3z" />
        <path d="M12 2L8 7M12 2l4 5M12 2v7" />
      </svg>
    </div>
  );
}

export default ChessKingLogo;