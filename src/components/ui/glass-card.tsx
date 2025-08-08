import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'dark' | 'darker';
  hover?: boolean;
  gradient?: 'purple' | 'blue' | 'cyan' | 'rainbow';
}

const variantClasses = {
  light: 'bg-black/20 backdrop-blur-lg',
  dark: 'bg-black/60 backdrop-blur-xl',
  darker: 'bg-black/80 backdrop-blur-2xl',
};

const gradientClasses = {
  purple: 'from-purple-500/40 via-purple-400/40 to-purple-600/40',
  blue: 'from-blue-500/40 via-blue-400/40 to-blue-600/40',
  cyan: 'from-cyan-500/40 via-cyan-400/40 to-cyan-600/40',
  rainbow: 'from-purple-500/40 via-blue-500/40 to-cyan-500/40',
};

const overlayClasses = {
  light: 'from-white/8 via-white/4 to-transparent',
  dark: 'from-white/4 via-white/2 to-transparent',
  darker: 'from-white/2 via-white/1 to-transparent',
};

const hoverGlowClasses = {
  purple: 'from-purple-500/15 via-purple-400/10 to-purple-600/15',
  blue: 'from-blue-500/15 via-blue-400/10 to-blue-600/15',
  cyan: 'from-cyan-500/15 via-cyan-400/10 to-cyan-600/15',
  rainbow: 'from-purple-500/15 via-blue-500/10 to-cyan-500/15',
};

export function GlassCard({
  children,
  className,
  variant = 'dark',
  hover = true,
  gradient = 'rainbow',
}: GlassCardProps) {
  return (
    <div className={cn(
      'group relative transition-all duration-500 rounded-2xl',
      hover && 'hover:shadow-2xl hover:shadow-purple-500/10',
      className
    )}>
      {/* Gradient border wrapper */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-r rounded-2xl p-[1px]',
        gradientClasses[gradient]
      )}>
        <div className={cn(
          'w-full h-full rounded-2xl',
          variantClasses[variant]
        )} />
      </div>
      
      {/* Frosted glass overlay */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br rounded-2xl',
        overlayClasses[variant]
      )} />
      
      {/* Hover glow effect */}
      {hover && (
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
          hoverGlowClasses[gradient]
        )} />
      )}
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}

// Pre-configured variants for common use cases
export function DashboardCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <GlassCard variant="darker" gradient="rainbow" className={cn('p-6', className)}>
      {children}
    </GlassCard>
  );
}

export function FeatureCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <GlassCard variant="dark" gradient="blue" className={cn('p-6', className)}>
      {children}
    </GlassCard>
  );
}

export function StatCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <GlassCard variant="darker" gradient="purple" className={cn('p-4', className)}>
      {children}
    </GlassCard>
  );
}