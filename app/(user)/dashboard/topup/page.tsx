'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, Clock, CheckCircle, XCircle, Loader, AlertCircle, X, Building2 } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  tier: string;
  superExpiry: string | null;
  modelExpiry: string | null;
  freeExpiry: string | null;
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

interface BankSettings {
  bankName: string;
  bankAccount: string;
  bankNumber: string;
}

export default function TopupPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<CreditHistory[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [hasApprovedProfile, setHasApprovedProfile] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [topupAmount, setTopupAmount] = useState('');
  const [topupProof, setTopupProof] = useState('');
  const [bank, setBank] = useState<BankSettings | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [creditsRes, profilesRes, settingsRes] = await Promise.all([
          fetch('/api/credits'),
          fetch('/api/profiles/transfer-profiles', { method: 'POST' }),
          fetch('/api/settings'),
        ]);

        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          setHistory(creditsData.history || []);
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

        if (settingsRes.ok) {
          const s = await settingsRes.json();
          setBank({
            bankName: s.bankName || '',
            bankAccount: s.bankAccount || '',
            bankNumber: s.bankNumber || '',
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!hasApprovedProfile) {
      setError('ต้องมีโปรไฟล์ที่มีวันใช้งานอยู่ก่อน กรุณาสร้างโพสต์และรออนุมัติ');
      return;
    }
    if (!selectedProfileId) {
      setError('กรุณาเลือกโปรไฟล์');
      return;
    }
    if (!topupAmount || parseInt(topupAmount, 10) < 1) {
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
          type: 'TOPUP',
          amount: parseInt(topupAmount, 10),
          proof: topupProof,
          profileId: selectedProfileId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด');
        return;
      }
      setSuccess('ส่งสลิปสำเร็จ รอแอดมินอนุมัติ');
      setTopupAmount('');
      setTopupProof('');
      const creditsRes = await fetch('/api/credits');
      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        setHistory(creditsData.history || []);
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

  const hasBank =
    bank && (bank.bankName || bank.bankAccount || bank.bankNumber);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">เติมเงิน</h1>
        <p className="text-gray-500 text-sm mt-1">
          โอนเงินตามเลขบัญชีด้านล่าง แล้วแนบสลิป — คำขอจะถูกส่งไปหลังบ้านเพื่อรออนุมัติ
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-bold text-gray-900">เลขบัญชีโอนเงิน</h2>
        </div>
        {hasBank ? (
          <dl className="space-y-2 text-sm">
            {bank!.bankName ? (
              <div>
                <dt className="text-gray-500">ธนาคาร</dt>
                <dd className="font-medium text-gray-900">{bank!.bankName}</dd>
              </div>
            ) : null}
            {bank!.bankAccount ? (
              <div>
                <dt className="text-gray-500">ชื่อบัญชี</dt>
                <dd className="font-medium text-gray-900">{bank!.bankAccount}</dd>
              </div>
            ) : null}
            {bank!.bankNumber ? (
              <div>
                <dt className="text-gray-500">เลขที่บัญชี</dt>
                <dd className="font-mono font-semibold text-lg text-primary-600">{bank!.bankNumber}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            ยังไม่ได้ตั้งค่าเลขบัญชี — แอดมินสามารถกรอกได้ที่หลังบ้าน &gt; ตั้งค่า
          </p>
        )}
        <p className="text-xs text-gray-500 mt-4">
          ซื้อแพ็คเกจ Super / Model (7–14 วัน) ไปที่{' '}
          <Link href="/dashboard/shop" className="text-primary-600 font-medium hover:underline">
            ร้านค้า
          </Link>
        </p>
      </div>

      {!hasApprovedProfile && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">ต้องสร้างโพสต์และรออนุมัติก่อน</p>
              <p className="mt-1">จึงจะเติมวันใช้งานทั่วไปได้</p>
              <Link
                href="/dashboard/posts/new"
                className="inline-block mt-3 bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600"
              >
                ไปสร้างโพสต์
              </Link>
            </div>
          </div>
        </div>
      )}

      {hasApprovedProfile && profiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ส่งสลิปเติมวันใช้งานทั่วไป</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}
          <form onSubmit={handleTopup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">โปรไฟล์</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนวันที่เติม</label>
              <input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                min={1}
                placeholder="เช่น 7, 14, 30"
                required
              />
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
                  aria-label="อัพโหลดสลิป"
                />
                {topupProof ? (
                  <div className="relative z-0 w-full pointer-events-none">
                    <img
                      src={topupProof}
                      alt="สลิป"
                      className="max-h-36 mx-auto rounded-lg object-contain"
                    />
                    <p className="text-xs text-green-600 mt-2">คลิกพื้นที่เพื่อเปลี่ยนรูป</p>
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
                  onClick={() => setTopupProof('')}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  ลบรูป
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader className="w-5 h-5 animate-spin" /> : null}
              ส่งสลิปไปหลังบ้าน
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">ประวัติคำขอเติมเงิน / ซื้อแพ็คเกจ</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">ยังไม่มีประวัติ</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.status === 'APPROVED' ? (
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ) : item.status === 'REJECTED' ? (
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {item.amount} วัน · {item.type}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : item.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {item.status === 'APPROVED'
                    ? 'อนุมัติ'
                    : item.status === 'REJECTED'
                      ? 'ปฏิเสธ'
                      : 'รอตรวจสอบ'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
