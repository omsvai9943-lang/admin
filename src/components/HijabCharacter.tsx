import { motion } from "motion/react";

interface HijabCharacterProps {
  isSpeaking: boolean;
  isListening?: boolean;
}

export default function HijabCharacter({ isSpeaking, isListening }: HijabCharacterProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative">
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative w-full max-w-[400px] aspect-[1/2] flex flex-col items-center"
      >
        <svg
          viewBox="0 0 200 400"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body/Dress (Abaya) */}
          <path
            d="M60 180 L40 380 L160 380 L140 180 Z"
            fill="#312E81"
          />
          
          {/* Hijab (Head & Shoulders) */}
          <path
            d="M50 140 C50 60, 150 60, 150 140 C150 180, 160 200, 140 210 C120 220, 80 220, 60 210 C40 200, 50 180, 50 140 Z"
            fill="#4F46E5"
          />
          
          {/* Face Oval */}
          <path
            d="M75 100 C75 80, 125 80, 125 100 C125 140, 115 160, 100 160 C85 160, 75 140, 75 100 Z"
            fill="#FDE68A"
          />

          {/* Eyes */}
          <g>
            <circle cx="88" cy="115" r="4" fill="black" />
            <circle cx="112" cy="115" r="4" fill="black" />
            {/* Eyelashes/Brows */}
            <path d="M82 108 Q88 105 94 108" stroke="black" strokeWidth="1" fill="none" />
            <path d="M106 108 Q112 105 118 108" stroke="black" strokeWidth="1" fill="none" />
          </g>

          {/* Mouth */}
          <motion.ellipse
            cx="100"
            cy="140"
            rx="8"
            ry={isSpeaking ? 6 : 1}
            fill="#991B1B"
            animate={isSpeaking ? {
              ry: [1, 8, 2, 10, 1],
            } : {
              ry: 1
            }}
            transition={isSpeaking ? {
              duration: 0.3,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
          />

          {/* Hands (Slightly visible) */}
          <circle cx="55" cy="300" r="8" fill="#FDE68A" />
          <circle cx="145" cy="300" r="8" fill="#FDE68A" />
        </svg>

        {/* Listening Indicator */}
        {isListening && (
          <motion.div
            className="absolute top-20 flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-indigo-400 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Background Glow */}
      <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-[120px] -z-10" />
    </div>
  );
}
