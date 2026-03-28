'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Clock, Image as ImageIcon, BadgeCheck, Upload, X, Building2 } from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import { getDaysRemaining, getProfileDisplayTier } from '@/lib/utils';

interface VerifyPackage {
  name: string;
  price7Days: number;
  price15Days: number;
  price30Days: number;
}

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

  const [verifyForProfile, setVerifyForProfile] = useState<Profile | null>(null);
  const [verifyDays, setVerifyDays] = useState<7 | 15 | 30>(7);
  const [verifyPkg, setVerifyPkg] = useState<VerifyPackage | null>(null);
  const [verifyProof, setVerifyProof] = useState('');
  const [bank, setBank] = useState<{ bankName: string; bankAccount: string; bankNumber: string } | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const loadVerifyContext = useCallback(async () => {
    try {
      const [pkgRes, settingsRes] = await Promise.all([
        fetch('/api/shop/packages'),
        fetch('/api/settings'),
      ]);
      if (pkgRes.ok) {
        const list = await pkgRes.json();
        const v = Array.isArray(list) ? list.find((p: VerifyPackage) => p.name === 'VERIFY') : null;
        setVerifyPkg(
          v || {
            name: 'VERIFY',
            price7Days: 50,
            price15Days: 90,
            price30Days: 150,
          }
        );
      } else {
        setVerifyPkg({
          name: 'VERIFY',
          price7Days: 50,
          price15Days: 90,
          price30Days: 150,
        });
      }
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setBank({
          bankName: s.bankName || '',
          bankAccount: s.bankAccount || '',
          bankNumber: s.bankNumber || '',
        });
      }
    } catch {
      setVerifyPkg({
        name: 'VERIFY',
        price7Days: 50,
        price15Days: 90,
        price30Days: 150,
      });
    }
  }, []);

  useEffect(() => {
    if (verifyForProfile) {
      setVerifyProof('');
      setVerifyError('');
      setVerifyDays(7);
      loadVerifyContext();
    }
  }, [verifyForProfile, loadVerifyContext]);

  const priceForVerifyDays = (d: 7 | 15 | 30) => {
    if (!verifyPkg) return d === 7 ? 50 : d === 15 ? 90 : 150;
    if (d === 7) return verifyPkg.price7Days;
    if (d === 15) return verifyPkg.price15Days;
    return verifyPkg.price30Days;
  };

  const handleVerifyProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setVerifyError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setVerifyError('ไฟล์ต้องไม่เกิน 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setVerifyProof(reader.result as string);
      setVerifyError('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const submitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyForProfile) return;
    setVerifyError('');
    if (!verifyProof.startsWith('data:image/')) {
      setVerifyError('กรุณาอัพโหลดสลิปโอนเงิน');
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'VERIFY_IDENTITY',
          amount: verifyDays,
          profileId: verifyForProfile.id,
          proof: verifyProof,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVerifyError(data.message || 'ส่งคำขอไม่สำเร็จ');
        return;
      }
      window.alert(data.message || 'ส่งคำขอสำเร็จ รอการตรวจสอบ');
      setVerifyForProfile(null);
    } catch {
      setVerifyError('เกิดข้อผิดพลาด');
    } finally {
      setVerifyLoading(false);
    }
  };

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
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (buyerBlocked) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">บัญชีผู้ใช้งาน</h2>
          <p className="text-gray-500">
            ไม่มีหน้ารายการโปรไฟล์สำหรับประเภทนี้ — ใช้งานในฐานะผู้ซื้อได้จากหน้าแรก
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
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
                    <div className="flex flex-col gap-2">
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
                          type="button"
                          onClick={() => handleDelete(profile.id)}
                          className="flex items-center justify-center space-x-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVerifyForProfile(profile)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-amber-400 bg-amber-50 text-amber-900 font-medium hover:bg-amber-100 transition-colors"
                      >
                        <BadgeCheck className="w-4 h-4" />
                        ส่งคำขอยืนยันตัวตน
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {verifyForProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">ส่งคำขอยืนยันตัวตน</h2>
              <button
                type="button"
                onClick={() => setVerifyForProfile(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitVerify} className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                โปรไฟล์: <strong>{verifyForProfile.name}</strong> — เลือกระยะเวลาแล้วโอนตามยอดด้านล่าง จากนั้นแนบสลิป
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([7, 15, 30] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setVerifyDays(d)}
                    className={`py-3 rounded-lg border-2 text-center transition-colors ${
                      verifyDays === d
                        ? 'border-primary-500 bg-primary-50 text-primary-800'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold">{d} วัน</div>
                    <div className="text-sm text-gray-600">{priceForVerifyDays(d)} บาท</div>
                  </button>
                ))}
              </div>
              {bank && (bank.bankName || bank.bankNumber) && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
                  <div className="flex items-center gap-2 font-medium text-gray-800">
                    <Building2 className="w-4 h-4" />
                    บัญชีโอนเงิน
                  </div>
                  {bank.bankName && <p>ธนาคาร: {bank.bankName}</p>}
                  {bank.bankAccount && <p>ชื่อบัญชี: {bank.bankAccount}</p>}
                  {bank.bankNumber && <p>เลขที่: {bank.bankNumber}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สลิปโอนเงิน</label>
                <label className="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">เลือกรูปสลิป</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleVerifyProof} />
                </label>
                {verifyProof && (
                  <p className="text-xs text-green-600 mt-1">แนบรูปแล้ว</p>
                )}
              </div>
              {verifyError && <p className="text-sm text-red-600">{verifyError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyForProfile(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="flex-1 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50"
                >
                  {verifyLoading ? 'กำลังส่ง...' : 'ส่งคำขอ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
