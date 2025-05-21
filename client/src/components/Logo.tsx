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
        <path d="M12 1L8 5H3l2 7h14l2-7h-5l-4-4z" />
        <path d="M5 16v3h14v-3H5z" />
        <path d="M5 21v1h14v-1H5z" />
      </svg>
    </div>
  );
}

export default ChessKingLogo;