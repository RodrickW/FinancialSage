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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor">
        {/* More detailed ornate crown */}
        <path d="M5 42l5-20 10 10 7-18 7 18 10-10 5 20z" />
        <path d="M5 42h44v6H5z" />
        <path d="M7 52h40v5H7z" />
        <path d="M15 20a3 3 0 100-6 3 3 0 000 6zM32 15a3 3 0 100-6 3 3 0 000 6zM49 20a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    </div>
  );
}

export default ChessKingLogo;