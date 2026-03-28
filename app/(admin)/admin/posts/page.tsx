'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Image as ImageIcon, Search, CalendarDays } from 'lucide-react';
import { useAdminGuard } from '@/components/useAdminGuard';

interface ProfileRow {
  id: string;
  name: string;
  age: number;
  province: string;
  freeExpiry: string | null;
  superExpiry: string | null;
  modelExpiry: string | null;
  tier: string;
  status: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    lineId: string;
  };
}

interface Post {
  id: string;
  title: string;
  images: string;
  lineId?: string;
  contactName?: string | null;
  province?: string | null;
  district?: string | null;
  status: string;
  createdAt: string;
  profile: ProfileRow;
}

function daysLeft(iso: string | null | undefined): number {
  if (!iso) return 0;
  const exp = new Date(iso);
  const now = new Date();
  if (exp <= now) return 0;
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const creditTypeLabel = (t: string) =>
  t === 'FREE'
    ? 'ทั่วไป (ยืนยันตัวตน)'
    : t === 'SUPER'
      ? 'Super'
      : 'Model';

export default function AdminPostsPage() {
  useAdminGuard();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchInput, setSearchInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [expirySaving, setExpirySaving] = useState<string | null>(null);

  const fetchPosts = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const url = q.trim()
        ? `/api/admin/profiles?q=${encodeURIComponent(q.trim())}`
        : '/api/admin/profiles';
      const res = await fetch(url);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(searchQ);
  }, [searchQ, fetchPosts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQ(searchInput);
  };

  const handleUpdateStatus = async (postId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(status === 'APPROVED' ? 'อนุมัติโพสต์นี้?' : 'ปฏิเสธโพสต์นี้?')) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, status } : p))
        );
      }
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const applyProfilePatch = (profileId: string, patch: Partial<ProfileRow>) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.profile.id === profileId ? { ...p, profile: { ...p.profile, ...patch } } : p
      )
    );
  };

  const handleExpiryAdjust = async (
    profileId: string,
    kind: 'FREE' | 'SUPER' | 'MODEL',
    action: 'ADD' | 'REMOVE' | 'SET',
    days: number
  ) => {
    const key = `${profileId}-${kind}-${action}`;
    setExpirySaving(key);
    try {
      const res = await fetch('/api/admin/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, kind, action, days }),
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        applyProfilePatch(profileId, {
          freeExpiry: data.profile.freeExpiry,
          superExpiry: data.profile.superExpiry,
          modelExpiry: data.profile.modelExpiry,
        });
      } else {
        alert(data.message || 'ไม่สำเร็จ');
      }
    } catch {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setExpirySaving(null);
    }
  };

  const filteredPosts = useMemo(() => {
    return filter === 'ALL' ? posts : posts.filter((p) => p.status === filter);
  }, [posts, filter]);

  if (loading && posts.length === 0) {
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">จัดการโพสต์</h1>
        </div>

        <form onSubmit={handleSearchSubmit} className="bg-white rounded-xl shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ค้นหาตามชื่อโพสต์ (หัวข้อที่แสดงหน้าโปรไฟล์หน้าบ้าน)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="พิมพ์ชื่อโพสต์แล้วกดค้นหา..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
            >
              ค้นหา
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchQ('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              ล้าง
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ค้นหาได้ทั้งชื่อโพสต์และชื่อโปรไฟล์ · ด้านล่าง: ปรับวันใช้งานทั่วไป / Super / Model ของโปรไฟล์ที่ผูกกับโพสต์
          </p>
        </form>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL'
                  ? 'ทั้งหมด'
                  : status === 'PENDING'
                    ? 'รอตรวจ'
                    : status === 'APPROVED'
                      ? 'อนุมัติ'
                      : 'ปฏิเสธ'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const images = JSON.parse(post.images || '[]');
            const prof = post.profile;
            return (
              <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="relative h-48 bg-gray-100">
                  {images.length > 0 ? (
                    <img src={images[0]} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {post.status === 'APPROVED' ? (
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> อนุมัติ
                      </span>
                    ) : post.status === 'REJECTED' ? (
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> ปฏิเสธ
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" /> รอตรวจ
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    โปรไฟล์: {prof.name} ({prof.age} ปี)
                  </p>
                  <p className="text-xs text-gray-500 mb-3">อีเมลเจ้าของ: {prof.user?.email || '-'}</p>
                  {(post.contactName || post.province || post.district) && (
                    <p className="text-sm text-gray-600 mb-1">
                      {post.contactName && <span>ชื่อโพสต์: {post.contactName} · </span>}
                      {post.province && <span>{post.province}</span>}
                      {post.district && <span> · {post.district}</span>}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mb-2">จังหวัด (โปรไฟล์): {prof.province}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    LINE (ตามโพสต์): {post.lineId || prof.user?.lineId || '-'}
                  </p>

                  <div className="border-t border-gray-100 pt-3 mt-2 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <CalendarDays className="w-4 h-4 text-primary-500" />
                      จัดการวันใช้งานโปรไฟล์
                    </div>
                    {(['FREE', 'SUPER', 'MODEL'] as const).map((kind) => {
                      const iso =
                        kind === 'FREE'
                          ? prof.freeExpiry
                          : kind === 'SUPER'
                            ? prof.superExpiry
                            : prof.modelExpiry;
                      const left = daysLeft(iso);
                      return (
                        <div key={kind} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{creditTypeLabel(kind)}</span>
                            <span className="text-gray-600">เหลือ ~{left} วัน</span>
                          </div>
                          <ExpiryRow
                            profileId={prof.id}
                            kind={kind}
                            saving={expirySaving}
                            onAction={handleExpiryAdjust}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {post.status === 'PENDING' && (
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleUpdateStatus(post.id, 'APPROVED')}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>อนุมัติ</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(post.id, 'REJECTED')}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>ปฏิเสธ</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPosts.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500">ไม่มีโพสต์ที่ตรงกับเงื่อนไข</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExpiryRow({
  profileId,
  kind,
  saving,
  onAction,
}: {
  profileId: string;
  kind: 'FREE' | 'SUPER' | 'MODEL';
  saving: string | null;
  onAction: (
    profileId: string,
    kind: 'FREE' | 'SUPER' | 'MODEL',
    action: 'ADD' | 'REMOVE' | 'SET',
    days: number
  ) => void;
}) {
  const [days, setDays] = useState('7');

  const busy = (action: string) =>
    saving === `${profileId}-${kind}-${action}`;

  const n = () => Math.max(1, parseInt(days, 10) || 1);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={1}
        max={3650}
        value={days}
        onChange={(e) => setDays(e.target.value)}
        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
      />
      <span className="text-gray-500">วัน</span>
      <button
        type="button"
        disabled={!!saving}
        onClick={() => onAction(profileId, kind, 'ADD', n())}
        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
      >
        {busy('ADD') ? '...' : '+เพิ่ม'}
      </button>
      <button
        type="button"
        disabled={!!saving}
        onClick={() => onAction(profileId, kind, 'REMOVE', n())}
        className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 disabled:opacity-50"
      >
        {busy('REMOVE') ? '...' : '-ลด'}
      </button>
      <button
        type="button"
        disabled={!!saving}
        onClick={() => onAction(profileId, kind, 'SET', n())}
        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
      >
        {busy('SET') ? '...' : 'ตั้งจากวันนี้'}
      </button>
    </div>
  );
}
