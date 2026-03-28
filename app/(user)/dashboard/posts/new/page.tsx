'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader, MessageCircle, User } from 'lucide-react';
import { THAI_PROVINCES } from '@/lib/utils';

interface Profile {
  id: string;
  name: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [buyerBlocked, setBuyerBlocked] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [formData, setFormData] = useState({
    lineId: '',
    contactName: '',
    age: 20,
    province: '',
    district: '',
    title: '',
    description: '',
  });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const s = await fetch('/api/auth/session');
        const d = await s.json();
        if (!d.user) {
          setLoading(false);
          return;
        }
        if (d.user.accountType === 'BUYER' && d.user.role !== 'ADMIN') {
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
        const approvedProfiles = data.profiles.filter((p: any) => p.status === 'APPROVED');
        setProfiles(approvedProfiles);
        if (approvedProfiles.length > 0) {
          setSelectedProfile(approvedProfiles[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    
    Array.from(files).forEach((file) => {
      if (images.length + newImages.length >= 5) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          if (newImages.length === files.length || images.length + newImages.length === 5) {
            setImages([...images, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!selectedProfile) {
      setError('กรุณาเลือกโปรไฟล์');
      setSubmitting(false);
      return;
    }

    if (!formData.lineId.trim()) {
      setError('กรุณากรอก LINE ID');
      setSubmitting(false);
      return;
    }

    if (!formData.province.trim()) {
      setError('กรุณาเลือกจังหวัด');
      setSubmitting(false);
      return;
    }

    if (formData.age < 20 || formData.age > 99) {
      setError('อายุต้องอยู่ระหว่าง 20–99 ปี (ตามข้อกำหนดเว็บไซต์)');
      setSubmitting(false);
      return;
    }

    if (!formData.title) {
      setError('กรุณากรอกหัวข้อ');
      setSubmitting(false);
      return;
    }

    if (images.length < 3 || images.length > 5) {
      setError('กรุณาใส่รูป 3-5 รูป');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfile,
          lineId: formData.lineId.trim(),
          contactName: formData.contactName.trim() || undefined,
          age: formData.age,
          province: formData.province.trim(),
          district: formData.district.trim() || undefined,
          title: formData.title,
          description: formData.description,
          images,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด');
        return;
      }

      router.push('/dashboard/posts');
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
                กลับ
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-xl shadow-md p-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">บัญชีผู้ใช้งาน</h2>
            <p className="text-gray-500 mb-6">
              ประเภทนี้ไม่สามารถสร้างโพสต์ได้ หากต้องการลงขายโปรดสมัครด้วยประเภท &quot;Post งาน&quot;
            </p>
            <Link href="/dashboard" className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600">
              กลับแดชบอร์ด
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
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
                กลับ
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-xl shadow-md p-12">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">ต้องมีโปรไฟล์ที่อนุมัติแล้ว</h2>
            <p className="text-gray-500 mb-6">กรุณาสร้างโปรไฟล์และรอการอนุมัติก่อนสร้างโพสต์</p>
            <Link
              href="/dashboard/profiles/new"
              className="inline-flex items-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <span>สร้างโปรไฟล์ใหม่</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <Link href="/dashboard/posts" className="text-gray-600 hover:text-primary-500">
              กลับ
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">สร้างโพสต์ใหม่</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                โปรไฟล์ <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </div>

            {/* LINE ID — บังคับ (ย้ายมาจากหน้าสมัคร) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LINE ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.lineId}
                  onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="line-id ของคุณ"
                  required
                />
              </div>
            </div>

            {/* ชื่อ (ไม่บังคับ) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ (ไม่บังคับ)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="ชื่อของคุณ"
                />
              </div>
            </div>

            {/* อายุ — บังคับ (ย้ายมาจากหน้าสมัคร) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อายุ <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                min={20}
                max={99}
                required
              />
              <p className="text-xs text-gray-500 mt-1">ต้องไม่ต่ำกว่า 20 ปี ตามข้อกำหนดเว็บไซต์</p>
            </div>

            {/* จังหวัด — บังคับ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จังหวัด <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">เลือกจังหวัด</option>
                {THAI_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* เขต/แขวง (ไม่บังคับ) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เขต/แขวง (ไม่บังคับ)</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="เขต / แขวง"
              />
            </div>

            {/* Images - 3-5 required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปภาพ (3-5 รูป) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={img} alt={`รูปที่ ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-sm text-gray-500">เพิ่มรูป</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">รองรับไฟล์ .jpg, .png เท่านั้น • ต้องใส่ 3-5 รูป</p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หัวข้อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="หัวข้อโพสต์"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียด
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={4}
                placeholder="รายละเอียดเพิ่มเติม..."
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                โพสต์จะถูกส่งไปยังระบบยืนยันตัวตนหลังบ้าน หลังจากอนุมัติแล้วจะแสดงในช่องที่ 3 (ผู้ใช้ทั่วไป) ทันที
              </p>
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <Link
                href="/dashboard/posts"
                className="flex-1 text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>กำลังสร้าง...</span>
                  </>
                ) : (
                  <span>สร้างโพสต์</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
