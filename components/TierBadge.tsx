'use client';

import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: 'SUPER' | 'MODEL' | 'FREE' | 'PENDING';
  size?: 'sm' | 'md' | 'lg';
  showDays?: boolean;
  daysRemaining?: number;
  /** การ์ดหน้าแรกแบบไดเรกทอรี — ข้อความสั้น สไตล์ nongnong */
  compact?: boolean;
}

export default function TierBadge({
  tier,
  size = 'md',
  showDays = false,
  daysRemaining = 0,
  compact = false,
}: TierBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const tierConfig = {
    SUPER: {
      label: compact ? 'SUPER STAR 🔥' : '⭐ Super',
      className: compact
        ? 'bg-gradient-to-r from-amber-300 to-amber-500 text-gray-900 shadow-sm'
        : 'badge-super',
    },
    MODEL: {
      label: compact ? 'TOP STAR ⭐' : '💎 Model',
      className: compact
        ? 'bg-gradient-to-r from-nong-purple to-nong-magenta text-white shadow-sm'
        : 'badge-model',
    },
    FREE: {
      label: compact ? 'แนะนำ' : '👤 ผู้ใช้ทั่วไป',
      className: compact ? 'bg-gray-600/90 text-white' : 'badge-free',
    },
    PENDING: {
      label: '⏳ รอตรวจสอบ',
      className: 'bg-yellow-500 text-white',
    },
  };

  const config = tierConfig[tier];

  return (
    <div className="inline-flex items-center gap-2">
      <span className={cn('rounded-full font-medium', sizeClasses[size], config.className)}>
        {config.label}
      </span>
      {showDays && daysRemaining > 0 && (
        <span className="text-sm text-gray-500">
          {daysRemaining} วัน
        </span>
      )}
    </div>
  );
}
