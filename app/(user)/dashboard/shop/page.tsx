'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, Upload, Loader, AlertCircle, X, Star, Gem } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  tier: string;
  superExpiry: string | null;
  modelExpiry: string | null;
  freeExpiry: string | null;
}

interface Package {
  id: string;
  name: string;
  price7Days: number;
  price14Days: number;
  description: string | null;
  isActive: boolean;
}

export default function ShopPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [summary, setSummary] = useState({ totalFreeDays: 0, totalSuperDays: 0, totalModelDays: 0 });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [hasApprovedProfile, setHasApprovedProfile] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [addonModalKind, setAddonModalKind] = useState<'SUPER' | 'MODEL' | null>(null);
  const [addonDays, setAddonDays] = useState<7 | 14 | null>(null);
  const [addonProof, setAddonProof] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [creditsRes, profilesRes, pkgRes] = await Promise.all([
          fetch('/api/credits'),
          fetch('/api/profiles/transfer-profiles', { method: 'POST' }),
          fetch('/api/shop/packages'),
        ]);

        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          setSummary(
            creditsData.summary || {
              totalFreeDays: 0,
              totalSuperDays: 0,
              totalModelDays: 0,
            }
          );
        }

        if (profilesRes.ok) {
          const profilesData = await profilesRes.json();
          const list = profilesData.profiles || [];
          setProfiles(list);
          const approved = list.filter(
            (p: Profile) => p.freeExpiry || p.superExpiry || p.modelExpiry
          );
          setHasApprovedProfile(approved.length > 0);
          if (approved.length > 0) {
            setSelectedProfileId((prev) => prev || approved[0].id);
          }
        }

        if (pkgRes.ok) {
          const data = await pkgRes.json();
          setPackages(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const closeAddonModal = () => {
    setAddonModalKind(null);
    setAddonDays(null);
    setAddonProof('');
    setError('');
  };

  const openAddonModal = (kind: 'SUPER' | 'MODEL') => {
    if (!hasApprovedProfile) {
      setError('ต้องมีโปรไฟล์ที่มีวันใช้งานอยู่ก่อน กรุณาสร้างโพสต์และรออนุมัติ');
      return;
    }
    if (!selectedProfileId) {
      setError('กรุณาเลือกโปรไฟล์');
      return;
    }
    setAddonModalKind(kind);
    setAddonDays(null);
    setAddonProof('');
    setError('');
  };

  const handleAddonProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์ต้องไม่เกิน 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAddonProof(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!hasApprovedProfile || !selectedProfileId) {
      setError('กรุณาเลือกโปรไฟล์');
      return;
    }
    if (!addonModalKind || !addonDays) {
      setError('กรุณาเลือก 7 หรือ 14 วัน');
      return;
    }
    if (!addonProof) {
      setError('กรุณาอัพโหลดสลิป');
      return;
    }

    const type = addonModalKind === 'SUPER' ? 'PURCHASE_SUPER' : 'PURCHASE_MODEL';
    setSubmitting(true);
    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: addonDays,
          type,
          proof: addonProof,
          profileId: selectedProfileId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด');
        return;
      }
      closeAddonModal();
      const creditsRes = await fetch('/api/credits');
      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        setSummary(
          creditsData.summary || {
            totalFreeDays: 0,
            totalSuperDays: 0,
            totalModelDays: 0,
          }
        );
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const superPkg = packages.find((p) => p.name === 'SUPER');
  const modelPkg = packages.find((p) => p.name === 'MODEL');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ร้านค้า</h1>
        <p className="text-gray-500 text-sm mt-1">
          เลือกซื้อวันใช้งานทั่วไป, Super, Model (7 / 14 วัน) — ราคาแก้ไขได้จากแอดมินที่หลังบ้าน
        </p>
      </div>

      {error && !addonModalKind && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-500 text-sm">วันใช้งานทั่วไป</p>
          <p className="text-3xl font-bold text-gray-900">{summary.totalFreeDays}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-500 text-sm">วัน Super</p>
          <p className="text-3xl font-bold text-yellow-600">{summary.totalSuperDays}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-500 text-sm">วัน Model</p>
          <p className="text-3xl font-bold text-gray-600">{summary.totalModelDays}</p>
        </div>
      </div>

      {!hasApprovedProfile && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">ต้องสร้างโพสต์ก่อน</p>
              <p className="mt-1">รออนุมัติแล้วจึงจะซื้อแพ็คเกจได้</p>
              <Link
                href="/dashboard/posts/new"
                className="inline-block mt-3 bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                ไปสร้างโพสต์
              </Link>
            </div>
          </div>
        </div>
      )}

      {hasApprovedProfile && profiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">โปรไฟล์ที่ซื้อแพ็คเกจ</label>
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">เลือกแพ็คเกจ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/topup"
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
            <p className="font-semibold text-gray-900">เติมวันใช้งานทั่วไป</p>
            <p className="text-sm text-gray-500 mt-1">ดูเลขบัญชี + ส่งสลิป</p>
            <p className="text-xs text-primary-600 mt-2 font-medium">ไปหน้าเติมเงิน →</p>
          </Link>

          <button
            type="button"
            onClick={() => openAddonModal('SUPER')}
            className="flex flex-col items-center p-4 border-2 border-yellow-200 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
          >
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
              <Star className="w-8 h-8 text-yellow-600 fill-yellow-400" />
            </div>
            <p className="font-semibold text-gray-900">Super</p>
            <p className="text-sm text-gray-500 text-center mt-1">
              {superPkg ? (
                <>
                  {superPkg.price7Days} บาท / 7 วัน
                  <br />
                  {superPkg.price14Days} บาท / 14 วัน
                </>
              ) : (
                'รอโหลดราคา...'
              )}
            </p>
            <p className="text-xs text-primary-600 mt-2 font-medium">คลิกเลือกแพ็คเกจ</p>
          </button>

          <button
            type="button"
            onClick={() => openAddonModal('MODEL')}
            className="flex flex-col items-center p-4 border-2 border-gray-300 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-colors"
          >
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
              <Gem className="w-8 h-8 text-slate-600" />
            </div>
            <p className="font-semibold text-gray-900">Model</p>
            <p className="text-sm text-gray-500 text-center mt-1">
              {modelPkg ? (
                <>
                  {modelPkg.price7Days} บาท / 7 วัน
                  <br />
                  {modelPkg.price14Days} บาท / 14 วัน
                </>
              ) : (
                'รอโหลดราคา...'
              )}
            </p>
            <p className="text-xs text-primary-600 mt-2 font-medium">คลิกเลือกแพ็คเกจ</p>
          </button>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold">ข้อควรทราบ:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Super/Model ต้องมีวันใช้งานทั่วไปก่อน</li>
              <li>Super/Model ไม่เกินวันใช้งานทั่วไป</li>
              <li>อนุมัติโพสต์แล้วได้รับวันใช้งานฟรี 7 วัน</li>
            </ul>
          </div>
        </div>
      </div>

      {addonModalKind && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              ซื้อ {addonModalKind === 'SUPER' ? 'Super' : 'Model'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">เลือกจำนวนวัน แล้วแนบสลิปโอนเงิน</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAddonSubmit} className="space-y-4">
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">เลือกแพ็คเกจ</p>
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const pkg = addonModalKind === 'SUPER' ? superPkg : modelPkg;
                    const p7 = pkg?.price7Days ?? 5;
                    const p14 = pkg?.price14Days ?? 5;
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setAddonDays(7);
                            setError('');
                          }}
                          className={`p-4 rounded-xl border-2 text-left transition-colors ${
                            addonDays === 7
                              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-bold text-gray-900">7 วัน</p>
                          <p className="text-sm text-gray-600">{p7} บาท</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddonDays(14);
                            setError('');
                          }}
                          className={`p-4 rounded-xl border-2 text-left transition-colors ${
                            addonDays === 14
                              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-bold text-gray-900">14 วัน</p>
                          <p className="text-sm text-gray-600">{p14} บาท</p>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สลิปโอนเงิน <span className="text-red-500">*</span>
                </label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center min-h-[120px] flex flex-col items-center justify-center hover:border-primary-400 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleAddonProofChange}
                    aria-label="อัพโหลดสลิป"
                  />
                  {addonProof ? (
                    <div className="relative z-0 w-full pointer-events-none">
                      <img
                        src={addonProof}
                        alt="สลิป"
                        className="max-h-32 mx-auto rounded-lg object-contain"
                      />
                      <p className="text-xs text-green-600 mt-2">คลิกเพื่อเปลี่ยนรูป</p>
                    </div>
                  ) : (
                    <div className="pointer-events-none py-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">คลิกเพื่อเลือกสลิป</p>
                    </div>
                  )}
                </div>
                {addonProof && (
                  <button
                    type="button"
                    onClick={() => setAddonProof('')}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    ลบรูป
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeAddonModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting || !addonDays}
                  className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex justify-center"
                >
                  {submitting ? <Loader className="w-5 h-5 animate-spin" /> : 'ส่งคำขอ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
