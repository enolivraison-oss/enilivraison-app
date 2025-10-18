import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  const bubbles = Array.from({ length: 15 });

  return (
    <div className="animated-bg">
      {bubbles.map((_, i) => {
        const size = Math.random() * 200 + 50;
        const duration = Math.random() * 20 + 15;
        const delay = Math.random() * 10;
        const initialX = Math.random() * 100;
        const initialY = Math.random() * 100;
        const finalX = Math.random() * 100;
        const finalY = Math.random() * 100;

        return (
          <motion.div
            key={i}
            style={{
              width: size,
              height: size,
              left: `${initialX}vw`,
              top: `${initialY}vh`,
              background: 'rgba(74, 222, 128, 0.05)',
              borderRadius: '50%',
              position: 'absolute',
            }}
            animate={{
              x: [`${initialX}vw`, `${finalX}vw`, `${initialX}vw`],
              y: [`${initialY}vh`, `${finalY}vh`, `${initialY}vh`],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
              delay: delay,
            }}
          />
        );
      })}
    </div>
  );
};

export default AnimatedBackground;