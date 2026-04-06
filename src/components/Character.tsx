import { motion } from "motion/react";

interface CharacterProps {
  isSpeaking: boolean;
}

export default function Character({ isSpeaking }: CharacterProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative">
      <svg
        viewBox="0 0 200 400"
        className="w-full h-full max-h-[300px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body */}
        <rect x="60" y="180" width="80" height="150" rx="40" fill="#4F46E5" />
        
        {/* Arms */}
        <rect x="40" y="200" width="20" height="100" rx="10" fill="#4338CA" />
        <rect x="140" y="200" width="20" height="100" rx="10" fill="#4338CA" />
        
        {/* Legs */}
        <rect x="70" y="320" width="25" height="60" rx="12" fill="#3730A3" />
        <rect x="105" y="320" width="25" height="60" rx="12" fill="#3730A3" />

        {/* Head */}
        <circle cx="100" cy="120" r="60" fill="#6366F1" />
        
        {/* Eyes */}
        <circle cx="80" cy="110" r="6" fill="white" />
        <circle cx="120" cy="110" r="6" fill="white" />
        <circle cx="80" cy="110" r="3" fill="black" />
        <circle cx="120" cy="110" r="3" fill="black" />

        {/* Mouth */}
        <motion.ellipse
          cx="100"
          cy="145"
          rx="15"
          ry={isSpeaking ? 10 : 2}
          fill="#1F2937"
          animate={isSpeaking ? {
            ry: [2, 12, 4, 15, 2],
          } : {
            ry: 2
          }}
          transition={isSpeaking ? {
            duration: 0.4,
            repeat: Infinity,
            ease: "easeInOut"
          } : {}}
        />
        
        {/* Blush */}
        <circle cx="60" cy="135" r="8" fill="#F472B6" fillOpacity="0.3" />
        <circle cx="140" cy="135" r="8" fill="#F472B6" fillOpacity="0.3" />
      </svg>
      
      {/* Floating Aura */}
      <motion.div
        className="absolute inset-0 bg-indigo-500/10 rounded-full blur-3xl -z-10"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
