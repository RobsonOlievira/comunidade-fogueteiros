import React from 'react';
import { Zap, Award } from 'lucide-react';
import { GamificationService } from '@/src/services/gamificationService';

interface XpBarProps {
  nivel: number;
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  conquistas?: number;
}

export default function XpBar({ nivel, xp, size = 'md', showBadge, conquistas }: XpBarProps) {
  const necessario = GamificationService.xpParaProximoNivel(nivel);
  const progresso = GamificationService.progressoParaNivel(xp, nivel);

  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} text-accent-lilac`} />
          <span className={`font-semibold text-accent-lilac ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            Nv. {nivel}
          </span>
        </div>
        <span className={`text-gray-500 ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
          {xp}/{necessario} XP
        </span>
      </div>
      <div className={`w-full rounded-full bg-gray-800 overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} rounded-full bg-gradient-to-r from-primary to-accent-cyan transition-all duration-500`}
          style={{ width: `${progresso}%` }}
        />
      </div>
      {showBadge && conquistas !== undefined && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Award className="w-3 h-3" />
          <span>{conquistas} conquistas</span>
        </div>
      )}
    </div>
  );
}
