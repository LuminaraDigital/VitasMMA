import React from 'react';
import { motion } from 'motion/react';

export default function Logo({ size, className = "" }: { size?: number, className?: string }) {
  const style = size ? { width: size, height: size, perspective: '1000px' } : { perspective: '1000px' };
  
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`} 
      style={style}
    >
      {/* Central Planet/Core (3D Sphere) */}
      <motion.div
        className="absolute rounded-full z-10"
        style={{ 
          width: '45%', 
          height: '45%',
          background: 'radial-gradient(circle at 30% 30%, #FF5F5F, #FF2A2A 40%, #800000 80%, #200000 100%)',
          boxShadow: `
            inset -6px -6px 12px rgba(0,0,0,0.8),
            inset 6px 6px 12px rgba(255,255,255,0.3),
            0 0 30px rgba(255,42,42,0.5)
          `
        }}
        animate={{
          y: [0, -4, 0],
          rotateY: [0, 360],
        }}
        transition={{
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          rotateY: { duration: 10, repeat: Infinity, ease: "linear" }
        }}
      >
        {/* Specular Highlight (Glossy look) */}
        <div 
          className="absolute top-[10%] left-[15%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-white/50 to-transparent blur-[1px]"
        />
        
        {/* Subtle Surface Texture/Atmosphere */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.5)_100%)]" />
          {/* Surface Detail (Clouds/Texture) */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
        </div>
      </motion.div>

      {/* Orbiting Ring 1 (Blue) */}
      <motion.div
        className="absolute rounded-full"
        style={{ 
          width: '90%', 
          height: '90%',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          transformStyle: 'preserve-3d',
          rotateX: 75,
          rotateY: 10
        }}
        animate={{ rotateZ: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#00E5FF] rounded-full shadow-[0_0_10px_#00E5FF]"
        />
      </motion.div>

      {/* Orbiting Ring 2 (Red) */}
      <motion.div
        className="absolute rounded-full"
        style={{ 
          width: '85%', 
          height: '85%',
          border: '1px solid rgba(255, 42, 42, 0.2)',
          transformStyle: 'preserve-3d',
          rotateX: 15,
          rotateY: 75
        }}
        animate={{ rotateZ: -360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#FF2A2A] rounded-full shadow-[0_0_10px_#FF2A2A]"
        />
      </motion.div>

      {/* Orbiting Ring 3 (Blue/Teal) */}
      <motion.div
        className="absolute rounded-full"
        style={{ 
          width: '80%', 
          height: '80%',
          border: '1px solid rgba(0, 229, 255, 0.15)',
          transformStyle: 'preserve-3d',
          rotateX: 45,
          rotateY: -45
        }}
        animate={{ rotateZ: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      >
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#00E5FF] rounded-full shadow-[0_0_10px_#00E5FF]"
        />
      </motion.div>

      {/* Glowing Aura */}
      <div className="absolute w-full h-full bg-[#FF2A2A]/5 rounded-full blur-2xl animate-pulse"></div>
    </div>
  );
}
