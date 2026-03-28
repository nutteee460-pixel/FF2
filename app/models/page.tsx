'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, MapPin, X } from 'lucide-react';
import ModelCard from '@/components/ModelCard';
import { getProfileDisplayTier } from '@/lib/utils';

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

export default function ModelsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('tier');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterProvince) params.set('province', filterProvince);
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
  }, [searchQuery, filterProvince, sortBy, filterTier]);

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
    setShowFilterPanel(false);
  };

  const hasActiveFilters = searchQuery || filterProvince || filterTier;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                FF2
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center space-x-1 text-gray-600 hover:text-primary-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">กลับหน้าแรก</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="bg-gradient-to-br from-primary-500 to-secondary-600 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">นางแบบทั้งหมด</h1>
            <p className="text-white/90 text-lg">
              แพลตฟอร์มออนไลน์สำหรับนางแบบและผู้ขายรูปภาพ
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full flex flex-col sm:flex-row items-stretch sm:items-center overflow-hidden border border-white/20">
              <div className="flex-1 flex items-center px-4 py-3 sm:py-0 sm:h-14">
                <Search className="w-5 h-5 text-white/80 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="ค้นหาชื่อ, สถานที่..."
                  className="flex-1 bg-transparent text-white placeholder-white/70 focus:outline-none text-base"
                />
              </div>
              <div className="hidden sm:block w-px bg-white/30 min-h-[24px]" />
              <div className="flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-white px-4 py-3 sm:py-4 focus:outline-none cursor-pointer border-0 appearance-none focus:ring-0 text-base [&>option]:text-gray-900"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="w-px bg-white/30 h-6 mx-2" />
                <button
                  type="button"
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`flex items-center gap-2 px-4 py-3 sm:py-4 transition-colors ${
                    showFilterPanel || hasActiveFilters
                      ? 'bg-white/20'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  <span className="font-medium">ตัวกรอง</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Location Tags */}
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_LOCATIONS.map((location) => (
              <button
                key={location}
                type="button"
                onClick={() => handleQuickLocation(location)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filterProvince === location
                    ? 'bg-white text-primary-600'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                <MapPin className="w-4 h-4" />
                {location}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="bg-white shadow-md border-b animate-fade-in">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
            <div className="flex flex-wrap gap-4">
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
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">ผลลัพธ์ {profiles.length} คน</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse"
              >
                <div className="h-64 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">ไม่พบนางแบบในขณะนี้</p>
            <button
              onClick={clearFilters}
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              ล้างตัวกรอง
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                  image={images[0] || '/placeholder.jpg'}
                  tier={displayTier.tier as any}
                  tierLabel={displayTier.label}
                  daysRemaining={displayTier.daysRemaining}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const THAI_PROVINCES = [
  'กรุงเทพมหานคร',
  'สมุทรปราการ',
  'นนทบุรี',
  'ปทุมธานี',
  'พระนครศรีอยุธยา',
  'อ่างทอง',
  'ลพบุรี',
  'สิงห์บุรี',
  'ชัยนาท',
  'สระบุรี',
  'ชลบุรี',
  'ระยอง',
  'จันทบุรี',
  'ตราด',
  'นครปฐม',
  'สมุทรสาคร',
  'สมุทรสงคราม',
  'เพชรบุรี',
  'ประจวบคีรีขันธ์',
  'หนองคาย',
  'มหาสารคาม',
  'ร้อยเอ็ด',
  'อุดรธานี',
  'ขอนแก่น',
  'นครราชสีมา',
  'บุรีรัมย์',
  'สุรินทร์',
  'ศรีสะเกษ',
  'ยโสธร',
  'อำนาจเจริญ',
  'หนองบัวลำภู',
  'ลำพูน',
  'เชียงใหม่',
  'ลำปาง',
  'อุตรดิตถ์',
  'แพร่',
  'น่าน',
  'พะเยา',
  'เชียงราย',
  'แม่ฮ่องสอน',
  'ตาก',
  'สุโขทัย',
  'พิษณุโลก',
  'พิจิตร',
  'อุทัยธานี',
  'เพชรบูรณ์',
  'ราชบุรี',
  'กาฬสินธุ์',
  'สกลนคร',
  'นครพนม',
  'มุกดาหาร',
  'บึงกาฬ',
  'นครสวรรค์',
  'อุบลราชธานี',
];
