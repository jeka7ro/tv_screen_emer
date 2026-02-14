import React, { useEffect, useState } from 'react';

export const ValentineHearts = ({ enabled = true, intensity = 'medium' }) => {
    const [hearts, setHearts] = useState([]);

    useEffect(() => {
        if (!enabled) {
            setHearts([]);
            return;
        }

        const heartCount = intensity === 'low' ? 10 : intensity === 'high' ? 30 : 20;
        const interval = intensity === 'low' ? 3000 : intensity === 'high' ? 1000 : 2000;

        // Generate initial hearts
        const initialHearts = Array.from({ length: heartCount }, (_, i) => createHeart(i));
        setHearts(initialHearts);

        // Add new hearts periodically
        const heartInterval = setInterval(() => {
            setHearts(prev => {
                const newHeart = createHeart(Date.now());
                return [...prev.slice(-heartCount + 1), newHeart];
            });
        }, interval);

        return () => clearInterval(heartInterval);
    }, [enabled, intensity]);

    const createHeart = (id) => ({
        id,
        left: Math.random() * 100,
        animationDuration: 5 + Math.random() * 5,
        size: 15 + Math.random() * 20,
        delay: Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.4,
        rotation: Math.random() * 360,
    });

    if (!enabled) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {hearts.map(heart => (
                <div
                    key={heart.id}
                    className="absolute animate-fall"
                    style={{
                        left: `${heart.left}%`,
                        top: '-50px',
                        fontSize: `${heart.size}px`,
                        animationDuration: `${heart.animationDuration}s`,
                        animationDelay: `${heart.delay}s`,
                        opacity: heart.opacity,
                        transform: `rotate(${heart.rotation}deg)`,
                    }}
                >
                    ❤️
                </div>
            ))}
            <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
        </div>
    );
};
