import React from "react";

interface MobileFrameProps {
  children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="relative w-full max-w-[380px] h-[780px] bg-white rounded-[48px] border-[12px] border-gray-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-50 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-gray-800 rounded-full" />
          <div className="w-8 h-1 bg-gray-800 rounded-full" />
        </div>
        
        {/* Status Bar */}
        <div className="h-10 bg-white flex items-center justify-between px-8 pt-4 font-display">
          <span className="text-xs font-semibold">9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2 bg-black rounded-sm" />
            <div className="w-3 h-3 bg-black rounded-full" />
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {children}
        </div>
        
        {/* Home Indicator */}
        <div className="h-6 bg-white flex items-center justify-center pb-2">
          <div className="w-32 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  );
}
