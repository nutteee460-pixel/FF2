'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Clock, Image as ImageIcon } from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import { getDaysRemaining, getProfileDisplayTier } from '@/lib/utils';

interface Profile {
  id: string;
  name: string;
  age: number;
  province: string;
  images: string;
  tier: string;
  status: string;
  superExpiry: string | null;
  modelExpiry: string | null;
  freeExpiry: string | null;
  createdAt: string;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyerBlocked, setBuyerBlocked] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const s = await fetch('/api/auth/session');
        const d = await s.json();
        if (d.user?.accountType === 'BUYER' && d.user.role !== 'ADMIN') {
          setBuyerBlocked(true);
          setLoading(false);
          return;
        }
      } catch {
        /* continue */
      }
      fetchProfiles();
    };
    init();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/profiles/my');
      const data = await res.json();
      if (data.profiles) {
        setProfiles(data.profiles);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบโปรไฟล์?')) return;
    
    try {
      await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
      setProfiles(profiles.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (buyerBlocked) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                  FF2
                </span>
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-primary-500">
                กลับสู่แดชบอร์ด
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-xl shadow-md p-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">บัญชีผู้ใช้งาน</h2>
            <p className="text-gray-500">
              ไม่มีหน้ารายการโปรไฟล์สำหรับประเภทนี้ — ใช้งานในฐานะผู้ซื้อได้จากหน้าแรก
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                FF2
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-primary-500">
                กลับสู่แดชบอร์ด
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">โปรไฟล์ของฉัน ({profiles.length}/50)</h1>
          <Link
            href="/dashboard/profiles/new"
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>สร้างโปรไฟล์ใหม่</span>
          </Link>
        </div>

        {profiles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">ยังไม่มีโปรไฟล์</h2>
            <p className="text-gray-500 mb-6">สร้างโปรไฟล์เพื่อเริ่มต้นการขายรูป</p>
            <Link
              href="/dashboard/profiles/new"
              className="inline-flex items-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>สร้างโปรไฟล์แรก</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => {
              const displayTier = getProfileDisplayTier(profile);
              const images = JSON.parse(profile.images || '[]');
              
              return (
                <div key={profile.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="relative h-48 bg-gray-100">
                    {images.length > 0 ? (
                      <img src={images[0]} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <TierBadge tier={displayTier.tier as any} size="sm" showDays daysRemaining={displayTier.daysRemaining} />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
                        <p className="text-sm text-gray-500">{profile.age} ปี • {profile.province}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>สร้างเมื่อ {new Date(profile.createdAt).toLocaleDateString('th-TH')}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/profiles/${profile.id}`}
                        className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>แก้ไข</span>
                      </Link>
                      <Link
                        href={`/dashboard/posts?profile=${profile.id}`}
                        className="flex-1 flex items-center justify-center space-x-1 bg-primary-100 text-primary-700 px-3 py-2 rounded-lg hover:bg-primary-200 transition-colors"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>โพสต์</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(profile.id)}
                        className="flex items-center justify-center space-x-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
