'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Check } from 'lucide-react';
import TierBadge from './TierBadge';
import { cn } from '@/lib/utils';

interface ModelCardProps {
  id: string;
  name: string;
  age: number;
  province: string;
  district?: string | null;
  image: string;
  tier: 'SUPER' | 'MODEL' | 'FREE' | 'PENDING';
  tierLabel: string;
  daysRemaining?: number;
  /** การ์ดโฆษณาแบบโปรไฟล์ — มุมโค้งใหญ่ ระยะห่างชัด */
  featured?: boolean;
}

export default function ModelCard({
  id,
  name,
  age,
  province,
  district,
  image,
  tier,
  tierLabel: _tierLabel,
  daysRemaining,
  featured = false,
}: ModelCardProps) {
  const showVerified = tier !== 'PENDING';

  return (
    <Link href={`/profile/${id}`} className="group block">
      <div
        className={cn(
          'cursor-pointer overflow-hidden bg-white transition-all duration-300',
          featured
            ? 'rounded-3xl shadow-lg ring-1 ring-black/[0.06] hover:-translate-y-1 hover:shadow-2xl'
            : 'card-hover animate-fade-in rounded-xl shadow-md'
        )}
      >
        <div
          className={cn(
            'relative bg-gradient-to-b from-gray-100 to-gray-50',
            featured ? 'aspect-[3/4] sm:h-80 sm:aspect-auto' : 'h-64'
          )}
        >
          <Image
            src={image || '/placeholder.jpg'}
            alt={name}
            fill
            className={cn('object-cover', featured ? 'rounded-t-3xl' : '')}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
          />

          {showVerified && featured && (
            <div
              className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white"
              title="ยืนยันโปรไฟล์"
            >
              <Check className="h-4 w-4 stroke-[3]" />
            </div>
          )}

          <div className="absolute right-3 top-3 max-w-[min(12rem,55%)]">
            <TierBadge
              tier={tier}
              size="sm"
              showDays={!featured && tier !== 'PENDING'}
              daysRemaining={daysRemaining}
              compact={featured}
            />
          </div>

          {featured && (
            <div className="absolute bottom-3 left-3 right-3 flex justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-nong-purple shadow-sm backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                {province}
              </span>
            </div>
          )}
        </div>

        <div className={cn('space-y-2', featured ? 'p-5' : 'p-4')}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-gray-900 group-hover:text-nong-purple">
                {name}
              </h3>
              {featured && district ? (
                <p className="mt-0.5 truncate text-sm text-gray-500">{district}</p>
              ) : null}
            </div>
            <span className={cn('shrink-0 text-gray-500', featured ? 'text-sm' : 'text-sm')}>{age} ปี</span>
          </div>

          {!featured && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="mr-1 h-4 w-4 shrink-0" />
              <span className="truncate">{province}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
