'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  X,
  Camera,
  User,
  Sparkles,
  Map,
  ChevronDown,
} from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import TelegramWidget from '@/components/TelegramWidget';
import ModelCard from '@/components/ModelCard';
import { getProfileDisplayTier, THAI_PROVINCES, cn } from '@/lib/utils';
import { SERVICE_TYPES, APPEARANCES, AGE_RANGES, REGION_LABELS } from '@/lib/categories';

interface Profile {
  id: string;
  name: string;
  age: number;
  province: string;
  district: string | null;
  description: string | null;
  images: string;
  tier: string;
  status: string;
  superExpiry: string | null;
  modelExpiry: string | null;
  freeExpiry: string | null;
  serviceTypes: string;
  appearance: string;
  ageRange: string;
  region: string;
  createdAt: string;
}

const SORT_OPTIONS = [
  { value: 'tier', label: 'ตามระดับสมาชิก' },
  { value: 'latest', label: 'มาใหม่ล่าสุด' },
];

const QUICK_LOCATIONS = [
  'กรุงเทพมหานคร',
  'นนทบุรี',
  'ปทุมธานี',
  'สมุทรปราการ',
  'ชลบุรี',
  'นครปฐม',
  'พระนครศรีอยุธยา',
];

const DATE_RANGE_TABS: { id: 'all' | '1' | '3' | '7'; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: '1', label: 'มาใหม่วันนี้' },
  { id: '3', label: '3 วันที่แล้ว' },
  { id: '7', label: '7 วันที่แล้ว' },
];

function ProfileSection({
  title,
  profiles,
  accent,
  stripeClass,
}: {
  title: string;
  profiles: Profile[];
  accent: string;
  stripeClass: string;
}) {
  if (profiles.length === 0) return null;

  return (
    <section className={cn('py-16 sm:py-20', accent)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h2>
          <div
            className={cn(
              'mx-auto mt-4 h-1.5 w-28 rounded-full bg-gradient-to-r sm:w-36',
              stripeClass
            )}
          />
          <p className="mt-3 text-sm text-gray-500">คัดแล้ว {profiles.length} โปรไฟล์</p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {profiles.map((profile) => {
            const displayTier = getProfileDisplayTier(profile);
            const images = JSON.parse(profile.images || '[]');
            return (
              <ModelCard
                key={profile.id}
                id={profile.id}
                name={profile.name}
                age={profile.age}
                province={profile.province}
                district={profile.district}
                image={images[0] || '/placeholder.jpg'}
                tier={displayTier.tier as 'SUPER' | 'MODEL' | 'FREE' | 'PENDING'}
                tierLabel={displayTier.label}
                daysRemaining={displayTier.daysRemaining}
                featured
              />
            );
          })}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/models"
            className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-white px-8 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
          >
            ดูทั้งหมด
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('tier');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  
  // หมวดหมู่ใหม่
  const [filterServiceType, setFilterServiceType] = useState('');
  const [filterAppearance, setFilterAppearance] = useState('');
  const [filterAgeRange, setFilterAgeRange] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [dateWindow, setDateWindow] = useState<'all' | '1' | '3' | '7'>('all');
  const [telegramHref, setTelegramHref] = useState('https://t.me/ff2community');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.telegramChannel) setTelegramHref(data.telegramChannel);
      })
      .catch(() => {});
  }, []);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterProvince) params.set('province', filterProvince);
      if (filterServiceType) params.set('serviceType', filterServiceType);
      if (filterAppearance) params.set('appearance', filterAppearance);
      if (filterAgeRange) params.set('ageRange', filterAgeRange);
      if (filterRegion) params.set('region', filterRegion);
      params.set('sort', sortBy);

      const res = await fetch(`/api/profiles?${params.toString()}`);
      const data = await res.json();
      if (data.profiles) {
        let filtered = data.profiles;
        if (filterTier) {
          filtered = filtered.filter((p: Profile) => {
            const displayTier = getProfileDisplayTier(p);
            return displayTier.tier === filterTier;
          });
        }
        setProfiles(filtered);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterProvince, filterTier, filterServiceType, filterAppearance, filterAgeRange, filterRegion, sortBy]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleQuickLocation = (location: string) => {
    setFilterProvince(filterProvince === location ? '' : location);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSearchInput('');
    setFilterProvince('');
    setFilterTier('');
    setFilterServiceType('');
    setFilterAppearance('');
    setFilterAgeRange('');
    setFilterRegion('');
    setDateWindow('all');
    setShowFilterPanel(false);
  };

  const hasActiveFilters =
    searchQuery ||
    filterProvince ||
    filterTier ||
    filterServiceType ||
    filterAppearance ||
    filterAgeRange ||
    filterRegion ||
    dateWindow !== 'all';

  const profilesInWindow = useMemo(() => {
    if (dateWindow === 'all') return profiles;
    const days = Number(dateWindow);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return profiles.filter((p) => new Date(p.createdAt).getTime() >= cutoff);
  }, [profiles, dateWindow]);

  const superProfiles = profilesInWindow
    .filter((p) => getProfileDisplayTier(p).tier === 'SUPER')
    .slice(0, 20);
  const modelProfiles = profilesInWindow
    .filter((p) => getProfileDisplayTier(p).tier === 'MODEL')
    .slice(0, 20);
  const freeProfiles = profilesInWindow
    .filter((p) => getProfileDisplayTier(p).tier === 'FREE')
    .slice(0, 20);

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50/90 text-slate-900">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(37,99,235,0.06),transparent_50%)]" />
        <PublicHeader variant="hero" heroLight />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-xl lg:max-w-none">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[2.75rem] lg:leading-[1.15]">
                FF2 — แพลตฟอร์มนางแบบและผู้ขายรูปภาพ
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
                ค้นหาโปรไฟล์ จังหวัด และช่วงเวลาที่ต้องการ ในหน้าเดียว โทนสีและเลย์เอาต์เน้นความโปร่ง อ่านง่าย
              </p>
              <a
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-3 rounded-full border border-sky-200/80 bg-white/90 px-6 py-2.5 text-sm font-semibold text-sky-800 shadow-sm backdrop-blur-sm transition hover:border-sky-300 hover:bg-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0088cc]">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </span>
                เข้ากลุ่ม Telegram
              </a>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-xl shadow-sky-200/40 ring-1 ring-sky-100/80 sm:p-6 sm:rounded-3xl">
              <form onSubmit={handleSearch} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">เลือกจังหวัด</label>
                  <div className="relative">
                    <select
                      value={filterProvince}
                      onChange={(e) => setFilterProvince(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-sky-50/50 py-2.5 pl-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-200"
                    >
                      <option value="">ทุกจังหวัด</option>
                      {THAI_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-gray-600">ช่วงเวลา</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {DATE_RANGE_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDateWindow(tab.id)}
                        className={cn(
                          'rounded-xl py-2 text-center text-xs font-semibold transition sm:text-sm',
                          dateWindow === tab.id
                            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                            : 'bg-sky-50 text-gray-700 hover:bg-sky-100'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">คำค้นหา</label>
                  <div className="mx-auto max-w-md">
                    <div className="relative flex items-center rounded-xl border border-gray-200 bg-sky-50/40 focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                      <Search className="ml-3 h-4 w-4 shrink-0 text-sky-500/80" />
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="ชื่อ, เขต, คำอธิบาย..."
                        className="w-full min-w-0 bg-transparent py-2 pl-2 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    className="w-full rounded-full bg-gradient-to-r from-sky-600 to-blue-600 py-3 text-center text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:opacity-95 sm:flex-1"
                  >
                    ค้นหา
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className={cn(
                      'inline-flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-sm font-semibold transition sm:w-auto sm:px-6',
                      showFilterPanel || hasActiveFilters
                        ? 'border-sky-300 bg-sky-50 text-sky-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                    ตัวกรองขั้นสูง
                    {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                  </button>
                </div>

                <div className="relative pt-2">
                  <div className="absolute left-0 right-0 top-0 border-t border-dashed border-gray-200" />
                  <p className="mb-3 pt-6 text-center text-xs font-medium text-gray-500 sm:text-left">
                    จังหวัดยอดนิยม
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                    {QUICK_LOCATIONS.map((location) => (
                      <button
                        key={location}
                        type="button"
                        onClick={() => handleQuickLocation(location)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm',
                          filterProvince === location
                            ? 'border-sky-400 bg-sky-100 text-sky-900'
                            : 'border-sky-100 bg-sky-50/90 text-gray-700 hover:border-sky-200'
                        )}
                      >
                        <MapPin className="h-3.5 w-3.5 text-sky-600" />
                        {location}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                  <span className="text-sm text-gray-600">เรียงลำดับ</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-xl border-0 bg-transparent text-sm font-semibold text-sky-700 focus:ring-0"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="animate-fade-in border-b border-sky-100/80 bg-gradient-to-b from-sky-50/40 to-background">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xl shadow-sky-100/50 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">ตัวกรอง</h3>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-primary-500 hover:text-primary-600 text-sm"
              >
                <X className="w-4 h-4" />
                ล้างทั้งหมด
              </button>
            </div>
            
            {/* หมวดหมู่: ประเภทบริการ */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera className="w-4 h-4 inline mr-1" />
                ประเภทบริการ
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFilterServiceType(filterServiceType === type.value ? '' : type.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      filterServiceType === type.value
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* หมวดหมู่: ลักษณะทั่วไป */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                ลักษณะทั่วไป
              </label>
              <div className="flex flex-wrap gap-2">
                {APPEARANCES.map((app) => (
                  <button
                    key={app.value}
                    onClick={() => setFilterAppearance(filterAppearance === app.value ? '' : app.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      filterAppearance === app.value
                        ? 'bg-secondary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {app.icon} {app.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* หมวดหมู่: ช่วงอายุ */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Sparkles className="w-4 h-4 inline mr-1" />
                ช่วงอายุ
              </label>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGES.map((age) => (
                  <button
                    key={age.value}
                    onClick={() => setFilterAgeRange(filterAgeRange === age.value ? '' : age.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      filterAgeRange === age.value
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {age.icon} {age.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* หมวดหมู่: ภาค */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Map className="w-4 h-4 inline mr-1" />
                ภาค
              </label>
              <div className="flex flex-wrap gap-2">
                {REGION_LABELS && Object.entries(REGION_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFilterRegion(filterRegion === value ? '' : value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      filterRegion === value
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="block text-sm text-gray-600 mb-1">จังหวัด</label>
                <select
                  value={filterProvince}
                  onChange={(e) => setFilterProvince(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 min-w-[180px]"
                >
                  <option value="">ทุกจังหวัด</option>
                  {THAI_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">ระดับสมาชิก</label>
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 min-w-[160px]"
                >
                  <option value="">ทุกระดับ</option>
                  <option value="SUPER">Super</option>
                  <option value="MODEL">Model</option>
                  <option value="FREE">ผู้ใช้ทั่วไป</option>
                </select>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="border-b border-sky-100/60 bg-sky-50/30">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">พบ {profilesInWindow.length} คน</span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-sky-700 hover:text-blue-700"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-black/[0.04] animate-pulse"
              >
                <div className="aspect-[3/4] bg-gray-200 sm:h-80" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-3/4 rounded-full bg-gray-200" />
                  <div className="h-3 w-1/2 rounded-full bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : profiles.length === 0 && hasActiveFilters ? (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-500 text-lg mb-4">ไม่พบนางแบบที่ค้นหา</p>
            <button
              onClick={clearFilters}
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>
      ) : (
        <>
          <ProfileSection
            title="SUPER STAR 🔥"
            profiles={superProfiles}
            accent="bg-white"
            stripeClass="from-amber-400 to-orange-500"
          />

          <ProfileSection
            title="TOP STAR ⭐"
            profiles={modelProfiles}
            accent="bg-slate-50/90"
            stripeClass="from-sky-500 to-blue-600"
          />

          <ProfileSection
            title="โปรไฟล์แนะนำ"
            profiles={freeProfiles}
            accent="bg-white"
            stripeClass="from-gray-300 to-gray-500"
          />
        </>
      )}

      {/* CTA Section */}
      {!hasActiveFilters && !loading && (
        <section className="bg-gradient-to-br from-sky-600 via-blue-600 to-blue-800 py-20 text-white">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">พร้อมเริ่มต้นหรือยัง?</h2>
            <p className="mt-4 text-lg text-white/90 sm:text-xl">
              สมัครสมาชิกฟรีวันนี้และเริ่มโพสต์รูปของคุณ
            </p>
            <Link
              href="/register"
              className="mt-10 inline-flex rounded-full bg-white px-10 py-3.5 text-sm font-semibold text-sky-700 shadow-lg transition hover:bg-sky-50"
            >
              สมัครสมาชิกฟรี
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-950 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600">
                <span className="text-xl font-bold text-white">F</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">FF2</span>
            </div>
            <p className="text-gray-400 mb-6">
              แพลตฟอร์มออนไลน์สำหรับนางแบบและผู้ขายรูปภาพ
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 FF2. สงวนลิขสิทธิ์ทุกประการ
            </p>
          </div>
        </div>
      </footer>

      <TelegramWidget />
    </div>
  );
}
