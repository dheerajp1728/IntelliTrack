import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useAnimationFrame,
} from "framer-motion";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

interface InfiniteGridProps {
  onGetStarted?: () => void;
  onLearnMore?: () => void;
}

export const InfiniteGrid = ({ onGetStarted, onLearnMore }: InfiniteGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const speedX = 0.5;
  const speedY = 0.5;

  useAnimationFrame(() => {
    const currentX = gridOffsetX.get();
    const currentY = gridOffsetY.get();
    gridOffsetX.set((currentX + speedX) % 40);
    gridOffsetY.set((currentY + speedY) % 40);
  });

  const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative w-full h-screen flex flex-col items-center justify-center overflow-hidden",
        "bg-[#0d0d0d]"
      )}
    >
      {/* Background grid (subtle) */}
      <div className="absolute inset-0 z-0 opacity-[0.12]">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </div>

      {/* Mouse-reveal grid */}
      <motion.div
        className="absolute inset-0 z-0 opacity-30"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </motion.div>

      {/* Glow blobs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute right-[-20%] top-[-20%] w-[40%] h-[40%] rounded-full bg-orange-500/20 blur-[120px]" />
        <div className="absolute right-[10%] top-[-10%] w-[20%] h-[20%] rounded-full bg-orange-400/15 blur-[100px]" />
        <div className="absolute left-[-10%] bottom-[-20%] w-[40%] h-[40%] rounded-full bg-blue-500/15 blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl mx-auto space-y-6 pointer-events-none">
        <div className="space-y-3">
          <p className="text-orange-500 text-sm font-semibold tracking-widest uppercase">
            Agile Intelligence Platform
          </p>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight" style={{ letterSpacing: '0.08em', fontFamily: '"Saira Stencil", sans-serif' }}>
            INTELLITRACT
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto">
            Modern sprint monitoring and intelligent task assignment
            for high-performing engineering teams.
          </p>
        </div>

        <div className="flex gap-4 items-center pointer-events-auto pt-2">
          <LiquidMetalButton label="Get Started" onClick={onGetStarted} />
          <button
            onClick={onLearnMore}
            className="px-8 py-3 bg-white/5 text-gray-300 font-semibold rounded-md border border-gray-700 hover:bg-white/10 transition-all active:scale-95"
          >
            Learn More
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 z-10 flex flex-col items-center gap-2 pointer-events-none">
        <span className="text-gray-500 text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 rounded-full border-2 border-gray-600 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 bg-gray-600 rounded-full" />
        </motion.div>
      </div>
    </div>
  );
};

const GridPattern = ({
  offsetX,
  offsetY,
}: {
  offsetX: any;
  offsetY: any;
}) => {
  return (
    <svg className="w-full h-full text-gray-600">
      <defs>
        <motion.pattern
          id="grid-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
};
