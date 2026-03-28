'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Upload, Clock, CheckCircle, XCircle, Loader, AlertCircle, X } from 'lucide-react';

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

interface CreditHistory {
  id: string;
  amount: number;
  type: string;
  status: string;
  proof: string | null;
  createdAt: string;
  adminNotes: string | null;
}

export default function CreditsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [history, setHistory] = useState<CreditHistory[]>([]);
  const [summary, setSummary] = useState({ totalFreeDays: 0, totalSuperDays: 0, totalModelDays: 0 });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [hasApprovedProfile, setHasApprovedProfile] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [topupAmount, setTopupAmount] = useState('');
  const [topupProof, setTopupProof] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [addonModalKind, setAddonModalKind] = useState<'SUPER' | 'MODEL' | null>(null);
  const [addonDays, setAddonDays] = useState<7 | 14 | null>(null);
  const [addonProof, setAddonProof] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Credits & history
      const creditsRes = await fetch('/api/credits');
      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        setHistory(creditsData.history || []);
        setSummary(
          creditsData.summary || {
            totalFreeDays: 0,
            totalSuperDays: 0,
            totalModelDays: 0,
          }
        );
      }
    } catch (e) {
      console.error('Error fetching credits:', e);
    }

    try {
      // Profiles for transfer
      const profilesRes = await fetch('/api/profiles/transfer-profiles', { method: 'POST' });
      if (profilesRes.ok) {
        const profilesData = await profilesRes.json();
        setProfiles(profilesData.profiles || []);
        // Check if user has any approved profile
        const approved = (profilesData.profiles || []).filter((p: Profile) => p.freeExpiry || p.superExpiry || p.modelExpiry);
        setHasApprovedProfile(approved.length > 0);
        if (approved.length > 0 && !selectedProfileId) {
          setSelectedProfileId(approved[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching profiles:', e);
    }

    try {
      // Packages
      const packagesRes = await fetch('/api/admin/packages');
      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(Array.isArray(packagesData) ? packagesData : []);
      }
    } catch (e) {
      console.error('Error fetching packages:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์ต้องไม่เกิน 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setTopupProof(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearProof = () => {
    setTopupProof('');
  };

  const closeAddonModal = () => {
    setAddonModalKind(null);
    setAddonDays(null);
    setAddonProof('');
    setError('');
    setSuccess('');
  };

  const openAddonModal = (kind: 'SUPER' | 'MODEL') => {
    if (!hasApprovedProfile) {
      setError('ต้องมีโปรไฟล์ที่มีวันใช้งานอยู่ก่อน กรุณาสร้างโพสต์และรออนุมัติ');
      return;
    }
    if (!selectedProfileId) {
      setError('กรุณาเลือกโปรไฟล์ที่ต้องการซื้อวันใช้งาน');
      return;
    }
    setAddonModalKind(kind);
    setAddonDays(null);
    setAddonProof('');
    setError('');
    setSuccess('');
  };

  const handleAddonProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG)');
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
    setSuccess('');

    if (!hasApprovedProfile) {
      setError('ต้องมีโปรไฟล์ที่มีวันใช้งานอยู่ก่อน กรุณาสร้างโพสต์และรออนุมัติ');
      return;
    }

    if (!selectedProfileId) {
      setError('กรุณาเลือกโปรไฟล์ที่ต้องการซื้อวันใช้งาน');
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
      fetchData();
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!hasApprovedProfile) {
      setError('ต้องมีโปรไฟล์ที่มีวันใช้งานอยู่ก่อน กรุณาสร้างโพสต์และรออนุมัติ');
      return;
    }

    if (!selectedProfileId) {
      setError('กรุณาเลือกโปรไฟล์ที่ต้องการซื้อวันใช้งาน');
      return;
    }

    if (!topupAmount || parseInt(topupAmount) < 1) {
      setError('กรุณากรอกจำนวนวัน');
      return;
    }

    if (!topupProof) {
      setError('กรุณาอัพโหลดสลิป');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(topupAmount),
          type: 'TOPUP',
          proof: topupProof,
          profileId: selectedProfileId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด');
        return;
      }

      setSuccess('ส่งคำขอเติมเงินสำเร็จ รอการตรวจสอบ');
      setTopupAmount('');
      setTopupProof('');
      setShowModal(false);
      fetchData();
    } catch (error) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
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
            <Link href="/dashboard" className="text-gray-600 hover:text-primary-500">
              กลับสู่แดชบอร์ด
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">วันใช้งานทั่วไป</p>
                <p className="text-3xl font-bold text-gray-900">{summary.totalFreeDays}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">วัน Super</p>
                <p className="text-3xl font-bold text-yellow-600">{summary.totalSuperDays}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">วัน Model</p>
                <p className="text-3xl font-bold text-gray-600">{summary.totalModelDays}</p>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Selector */}
        {!hasApprovedProfile && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold">ต้องสร้างโพสต์ก่อน</p>
                  <p className="mt-1">กรุณาสร้างโพสต์และรอการอนุมัติจากแอดมินก่อน จึงจะสามารถซื้อวันใช้งานได้</p>
                  <Link
                    href="/dashboard/posts/new"
                    className="inline-block mt-3 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 text-sm font-medium"
                  >
                    ไปสร้างโพสต์
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Selector (when has approved profile) */}
        {hasApprovedProfile && profiles.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกโปรไฟล์ที่ต้องการซื้อวันใช้งาน
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">วันใช้งานจะถูกเพิ่มให้โปรไฟล์ที่เลือก</p>
          </div>
        )}

        {/* Topup Button */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">เติมเงิน / ซื้อ Addon</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => {
                if (!hasApprovedProfile) {
                  setError('ต้องมีโปรไฟล์ที่มีวันใช้งานอยู่ก่อน กรุณาสร้างโพสต์และรออนุมัติ');
                  return;
                }
                if (!selectedProfileId) {
                  setError('กรุณาเลือกโปรไฟล์ที่ต้องการซื้อวันใช้งาน');
                  return;
                }
                setShowModal(true);
                setError('');
                setSuccess('');
              }}
              disabled={!hasApprovedProfile || !selectedProfileId}
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <CreditCard className="w-8 h-8 text-blue-500" />
              </div>
              <p className="font-semibold text-gray-900">เติมวันใช้งาน</p>
              <p className="text-sm text-gray-500">ฝากสลิปเพื่อตรวจสอบ</p>
            </button>
            <button
              type="button"
              onClick={() => openAddonModal('SUPER')}
              className="flex flex-col items-center p-4 border-2 border-yellow-200 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
            >
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-3xl">⭐</span>
              </div>
              <p className="font-semibold text-gray-900">Super</p>
              <p className="text-sm text-gray-500 text-center">
                {packages.find((p) => p.name === 'SUPER') ? (
                  <>
                    {packages.find((p) => p.name === 'SUPER')!.price7Days} บาท / 7 วัน
                    <br />
                    {packages.find((p) => p.name === 'SUPER')!.price14Days} บาท / 14 วัน
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
                <span className="text-3xl">💎</span>
              </div>
              <p className="font-semibold text-gray-900">Model</p>
              <p className="text-sm text-gray-500 text-center">
                {packages.find((p) => p.name === 'MODEL') ? (
                  <>
                    {packages.find((p) => p.name === 'MODEL')!.price7Days} บาท / 7 วัน
                    <br />
                    {packages.find((p) => p.name === 'MODEL')!.price14Days} บาท / 14 วัน
                  </>
                ) : (
                  'รอโหลดราคา...'
                )}
              </p>
              <p className="text-xs text-primary-600 mt-2 font-medium">คลิกเลือกแพ็คเกจ</p>
            </button>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
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
        </div>

        {/* History */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ประวัติการเติมเงิน</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">ยังไม่มีประวัติการเติมเงิน</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.status === 'APPROVED' ? (
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    ) : item.status === 'REJECTED' ? (
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-500" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{item.amount} วัน</p>
                      <p className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('th-TH')} • {item.type}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status === 'APPROVED' ? 'อนุมัติ' :
                     item.status === 'REJECTED' ? 'ปฏิเสธ' :
                     'รอตรวจสอบ'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Topup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-4">เติมวันใช้งาน</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
                {success}
              </div>
            )}
            <form onSubmit={handleTopup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนวัน
                </label>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  min="1"
                  placeholder="7 หรือ 14 วัน"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">กรอกจำนวนวันที่ต้องการ แล้วแนบสลิปโอนเงิน</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สลิปโอนเงิน <span className="text-red-500">*</span>
                </label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center min-h-[140px] flex flex-col items-center justify-center hover:border-primary-400 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleProofChange}
                    aria-label="อัพโหลดสลิปโอนเงิน"
                  />
                  {topupProof ? (
                    <div className="relative z-0 w-full pointer-events-none">
                      <img
                        src={topupProof}
                        alt="สลิปที่เลือก"
                        className="max-h-36 mx-auto rounded-lg object-contain"
                      />
                      <p className="text-xs text-green-600 mt-2">พร้อมส่ง — คลิกพื้นที่เพื่อเปลี่ยนรูป</p>
                    </div>
                  ) : (
                    <div className="pointer-events-none py-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 font-medium">คลิกเพื่อเลือกสลิป</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP — ไม่เกิน 5 MB</p>
                    </div>
                  )}
                </div>
                {topupProof && (
                  <button
                    type="button"
                    onClick={clearProof}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    ลบรูปและเลือกใหม่
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    'ส่งคำขอ'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super / Model — เลือก 7 หรือ 14 วัน + สลิป */}
      {addonModalKind && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
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
                    const pkg = packages.find((p) =>
                      addonModalKind === 'SUPER' ? p.name === 'SUPER' : p.name === 'MODEL'
                    );
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
                      <p className="text-xs text-green-600 mt-2">คลิกพื้นที่เพื่อเปลี่ยนรูป</p>
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
                    className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    ลบรูป
                  </button>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeAddonModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting || !addonDays}
                  className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center"
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
