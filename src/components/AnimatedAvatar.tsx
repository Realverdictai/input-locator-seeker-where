/**
 * Animated Avatar Component
 * 
 * Simple animated avatar with talking states
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedAvatarProps {
  isSpeaking: boolean;
  className?: string;
}

export function AnimatedAvatar({ isSpeaking, className }: AnimatedAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    let phase = 0;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw head (circle)
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 80, 0, Math.PI * 2);
      ctx.fill();

      // Draw eyes
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(width / 2 - 25, height / 2 - 20, 12, 0, Math.PI * 2);
      ctx.arc(width / 2 + 25, height / 2 - 20, 12, 0, Math.PI * 2);
      ctx.fill();

      // Draw pupils
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.beginPath();
      ctx.arc(width / 2 - 25, height / 2 - 20, 6, 0, Math.PI * 2);
      ctx.arc(width / 2 + 25, height / 2 - 20, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw mouth (animated when speaking)
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      if (isSpeaking) {
        // Animated talking mouth
        const mouthHeight = Math.sin(phase) * 10 + 15;
        ctx.arc(width / 2, height / 2 + 20, 30, 0.2, Math.PI - 0.2);
        ctx.lineTo(width / 2 - 20, height / 2 + 20 + mouthHeight);
        ctx.lineTo(width / 2 + 20, height / 2 + 20 + mouthHeight);
        phase += 0.2;
      } else {
        // Closed smile
        ctx.arc(width / 2, height / 2 + 20, 30, 0.2, Math.PI - 0.2);
      }
      
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpeaking]);

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="rounded-full border-4 border-primary/20 shadow-lg"
      />
    </div>
  );
}