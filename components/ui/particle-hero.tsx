"use client";

import React from 'react';

interface ParticleHeroProps {
  children?: React.ReactNode;
  className?: string;
}

const ParticleHero: React.FC<ParticleHeroProps> = ({ children, className = '' }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = { x: null as number | null, y: null as number | null, radius: 200 };

    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      color: string;

      constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx!.fillStyle = this.color;
        ctx!.fill();
      }

      update() {
        if (this.x > canvas!.width || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > canvas!.height || this.y < 0) {
          this.directionY = -this.directionY;
        }

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius + this.size) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= forceDirectionX * force * 5;
            this.y -= forceDirectionY * force * 5;
          }
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    function init() {
      particles = [];
      const numberOfParticles = (canvas!.height * canvas!.width) / 12000;
      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 2 + 0.5;
        const x = Math.random() * (canvas!.width - size * 4) + size * 2;
        const y = Math.random() * (canvas!.height - size * 4) + size * 2;
        const directionX = Math.random() * 0.3 - 0.15;
        const directionY = Math.random() * 0.3 - 0.15;
        // ProfiFP blue tones
        const colors = [
          'rgba(0, 158, 226, 0.8)',   // #009EE2
          'rgba(26, 159, 221, 0.6)',   // #1a9fdd
          'rgba(36, 52, 113, 0.7)',    // #243471
          'rgba(130, 142, 175, 0.5)',  // #818EAF
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x, y, directionX, directionY, size, color));
      }
    }

    const resizeCanvas = () => {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      init();
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const connect = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const distance =
            (particles[a].x - particles[b].x) * (particles[a].x - particles[b].x) +
            (particles[a].y - particles[b].y) * (particles[a].y - particles[b].y);

          if (distance < (canvas!.width / 7) * (canvas!.height / 7)) {
            const opacityValue = 1 - distance / 20000;

            if (mouse.x !== null && mouse.y !== null) {
              const dx = particles[a].x - mouse.x;
              const dy = particles[a].y - mouse.y;
              const distMouse = Math.sqrt(dx * dx + dy * dy);

              if (distMouse < mouse.radius) {
                ctx!.strokeStyle = `rgba(0, 158, 226, ${opacityValue * 0.8})`;
              } else {
                ctx!.strokeStyle = `rgba(36, 52, 113, ${opacityValue * 0.5})`;
              }
            } else {
              ctx!.strokeStyle = `rgba(36, 52, 113, ${opacityValue * 0.5})`;
            }

            ctx!.lineWidth = 0.8;
            ctx!.beginPath();
            ctx!.moveTo(particles[a].x, particles[a].y);
            ctx!.lineTo(particles[b].x, particles[b].y);
            ctx!.stroke();
          }
        }
      }
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      // Dark navy gradient background
      const gradient = ctx!.createLinearGradient(0, 0, canvas!.width, canvas!.height);
      gradient.addColorStop(0, '#0e1a3d');
      gradient.addColorStop(0.5, '#162459');
      gradient.addColorStop(1, '#0e1a3d');
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect();
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default ParticleHero;
