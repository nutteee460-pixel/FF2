'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, FileText, Star, Gem, User, Plus, Minus, RefreshCw } from 'lucide-react';
import { useAdminGuard } from '@/components/useAdminGuard';

interface ProfileCredit {
  id: string;
  name: string;
  freeExpiry: string | null;
  superExpiry: string | null;
  modelExpiry: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    lineId: string;
  };
  posts: {
    id: string;
    title: string;
    status: string;
  }[];
}

function calcDaysLeft(expiry: string | null): number {
  if (!expiry) return 0;
  const d = new Date(expiry);
  const now = new Date();
  if (d <= now) return 0;
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ label, days }: { label: string; days: number }) {
  const color =
    days === 0
      ? 'bg-gray-100 text-gray-500'
      : days <= 3
      ? 'bg-red-100 text-red-700'
      : days <= 7
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {days === 0 ? <Minus className="w-3 h-3" /> : <span>⭐</span>}
      {label}: {days} วัน
    </span>
  );
}

export default function AdminProfilesPage() {
  useAdminGuard();
  const [posts, setPosts] = useState<ProfileCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<ProfileCredit | null>(null);
  const [creditDays, setCreditDays] = useState(7);
  const [creditKind, setCreditKind] = useState<'FREE' | 'SUPER' | 'MODEL'>('FREE');
  const [creditAction, setCreditAction] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchProfiles(undefined, true);
  }, []);

  const buildProfileMap = (rawPosts: any[]): ProfileCredit[] => {
    const profileMap = new Map<string, ProfileCredit>();
    rawPosts.forEach((post: any) => {
      const p = post.profile;
      if (!profileMap.has(p.id)) {
        profileMap.set(p.id, {
          id: p.id,
          name: p.name,
          freeExpiry: p.freeExpiry,
          superExpiry: p.superExpiry,
          modelExpiry: p.modelExpiry,
          user: p.user,
          posts: [],
        });
      }
      profileMap.get(p.id)!.posts.push({
        id: post.id,
        title: post.title,
        status: post.status,
      });
    });
    return Array.from(profileMap.values());
  };

  const fetchProfiles = async (q?: string, initial = false) => {
    if (initial) setLoading(true);
    else setListLoading(true);
    try {
      const url = q
        ? `/api/admin/profiles?q=${encodeURIComponent(q)}`
        : '/api/admin/profiles';
      const res = await fetch(url);
      const data = await res.json();
      if (data.posts) {
        setPosts(buildProfileMap(data.posts));
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfiles(searchTerm, false);
  };

  const effectiveDays = Math.min(3650, Math.max(1, Math.floor(Number(creditDays)) || 1));

  const handleCreditAction = async () => {
    if (!selectedProfile) return;
    const day = effectiveDays;
    setSubmitting(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          action: creditAction,
          kind: creditKind,
          days: day,
        }),
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setMsg(data.message);
        const p = data.profile;
        const nextProfile: ProfileCredit = {
          ...selectedProfile,
          freeExpiry: p.freeExpiry,
          superExpiry: p.superExpiry,
          modelExpiry: p.modelExpiry,
        };
        setSelectedProfile(nextProfile);
        setPosts((prev) =>
          prev.map((row) => (row.id === nextProfile.id ? { ...row, ...nextProfile } : row))
        );
      } else {
        setMsg(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch {
      setMsg('เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold">FF2 Admin</span>
            </Link>
            <Link href="/admin" className="text-gray-300 hover:text-white">
              กลับสู่แดชบอร์ด
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">จัดการโปรไฟล์</h1>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="ค้นหาด้วยชื่อโพสต์ หรือชื่อโปรไฟล์..."
              />
            </div>
            <button
              type="submit"
              className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              ค้นหา
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); fetchProfiles('', false); }}
                className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                ล้าง
              </button>
            )}
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profiles List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden relative">
              {listLoading && (
                <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
                </div>
              )}
              <div className="p-4 border-b bg-gray-50">
                <p className="text-sm text-gray-600">
                  {posts.length} โปรไฟล์
                </p>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {posts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    ไม่พบโปรไฟล์
                  </div>
                ) : (
                  posts.map((profile) => (
                    <div
                      key={profile.id}
                      onClick={() => setSelectedProfile(profile)}
                      className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedProfile?.id === profile.id ? 'bg-blue-50 border-l-4 border-primary-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{profile.name}</p>
                            <p className="text-sm text-gray-500">{profile.user.email}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <ExpiryBadge label="ทั่วไป" days={calcDaysLeft(profile.freeExpiry)} />
                              <ExpiryBadge label="Super" days={calcDaysLeft(profile.superExpiry)} />
                              <ExpiryBadge label="Model" days={calcDaysLeft(profile.modelExpiry)} />
                            </div>
                            {profile.posts.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                โพสต์ {profile.posts.length} รายการ
                              </p>
                            )}
                          </div>
                        </div>
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Credit Management Panel */}
          <div className="lg:col-span-1">
            {selectedProfile ? (
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
                <h2 className="text-lg font-bold text-gray-900 mb-1">จัดการวันใช้งาน</h2>
                <p className="text-sm text-gray-500 mb-4">{selectedProfile.name}</p>

                {/* Current Days */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-1">
                  <p className="text-sm font-medium text-gray-700 mb-2">วันใช้งานปัจจุบัน</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">ทั่วไป:</span>
                    <span className="font-bold text-gray-900">{calcDaysLeft(selectedProfile.freeExpiry)} วัน</span>
                    {selectedProfile.freeExpiry && (
                      <span className="text-xs text-gray-400">
                        → {new Date(selectedProfile.freeExpiry).toLocaleDateString('th-TH')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Super:</span>
                    <span className="font-bold text-yellow-700">{calcDaysLeft(selectedProfile.superExpiry)} วัน</span>
                    {selectedProfile.superExpiry && (
                      <span className="text-xs text-gray-400">
                        → {new Date(selectedProfile.superExpiry).toLocaleDateString('th-TH')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Gem className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-600">Model:</span>
                    <span className="font-bold text-purple-700">{calcDaysLeft(selectedProfile.modelExpiry)} วัน</span>
                    {selectedProfile.modelExpiry && (
                      <span className="text-xs text-gray-400">
                        → {new Date(selectedProfile.modelExpiry).toLocaleDateString('th-TH')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Credit Form */}
                <div className="space-y-3">
                  <div>
                    <p className="block text-sm font-medium text-gray-700 mb-1">ประเภทวันใช้งาน</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['FREE', 'SUPER', 'MODEL'] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setCreditKind(k)}
                          className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                            creditKind === k
                              ? k === 'SUPER'
                                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                : k === 'MODEL'
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {k === 'FREE' ? 'ทั่วไป' : k === 'SUPER' ? 'Super' : 'Model'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="block text-sm font-medium text-gray-700 mb-1">การดำเนินการ</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCreditAction('ADD')}
                        className={`py-2 rounded-lg text-sm font-medium border flex items-center justify-center gap-1 transition-colors ${
                          creditAction === 'ADD'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        เพิ่ม
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreditAction('REMOVE')}
                        className={`py-2 rounded-lg text-sm font-medium border flex items-center justify-center gap-1 transition-colors ${
                          creditAction === 'REMOVE'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                        ลด
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreditAction('SET')}
                        className={`py-2 rounded-lg text-sm font-medium border flex items-center justify-center gap-1 transition-colors ${
                          creditAction === 'SET'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        ตั้งค่า
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="block text-sm font-medium text-gray-700 mb-1">จำนวนวัน</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 3, 7, 14].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setCreditDays(d)}
                          className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                            creditDays === d
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {d} วัน
                        </button>
                      ))}
                    </div>
                    <label className="block text-xs text-gray-500 mt-2 mb-1">หรือระบุจำนวนวันเอง (1–3650)</label>
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      value={creditDays}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') {
                          setCreditDays(1);
                          return;
                        }
                        const n = parseInt(v, 10);
                        if (Number.isFinite(n)) setCreditDays(Math.min(3650, Math.max(1, n)));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>

                  {msg && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
                      {msg}
                    </div>
                  )}

                  <button
                    onClick={handleCreditAction}
                    disabled={submitting}
                    className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        {creditAction === 'ADD' && <Plus className="w-5 h-5" />}
                        {creditAction === 'REMOVE' && <Minus className="w-5 h-5" />}
                        {creditAction === 'SET' && <RefreshCw className="w-5 h-5" />}
                        {creditAction === 'ADD'
                          ? `เพิ่ม ${effectiveDays} วัน`
                          : creditAction === 'REMOVE'
                          ? `ลด ${effectiveDays} วัน`
                          : `ตั้งค่า ${effectiveDays} วัน`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-500 sticky top-4">
                เลือกโปรไฟล์เพื่อจัดการวันใช้งาน
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
