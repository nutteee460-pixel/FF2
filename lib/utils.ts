import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const THAI_PROVINCES = [
  'กรุงเทพมหานคร', 'สมุทรปราการ', 'นนทบุรี', 'ปทุมธานี', 'พระนครศรีอยุธยา',
  'อ่างทอง', 'ลพบุรี', 'สิงห์บุรี', 'ชัยนาท', 'สระบุรี', 'ชลบุรี', 'ระยอง',
  'จันทบุรี', 'ตราด', 'นครปฐม', 'สมุทรสาคร', 'สมุทรสงคราม', 'เพชรบุรี',
  'ประจวบคีรีขันธ์', 'หนองคาย', 'มหาสารคาม', 'ร้อยเอ็ด', 'อุดรธานี', 'ขอนแก่น',
  'นครราชสีมา', 'บุรีรัมย์', 'สุรินทร์', 'ศรีสะเกษ', 'ยโสธร', 'อำนาจเจริญ',
  'หนองบัวลำภู', 'ลำพูน', 'เชียงใหม่', 'ลำปาง', 'อุตรดิตถ์', 'แพร่', 'น่าน',
  'พะเยา', 'เชียงราย', 'แม่ฮ่องสอน', 'ตาก', 'สุโขทัย', 'พิษณุโลก', 'พิจิตร',
  'อุทัยธานี', 'เพชรบูรณ์', 'ราชบุรี', 'กาฬสินธุ์', 'สกลนคร', 'นครพนม', 'มุกดาหาร',
  'บึงกาฬ', 'นครสวรรค์', 'อุบลราชธานี', 'ศรีษะเกศ', 'มหาพรต', 'แม่ฮ่องสอน',
];

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getDaysRemaining(expiryDate: Date | string | null | undefined): number {
  if (!expiryDate) return 0;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getProfileDisplayTier(profile: {
  tier: string;
  superExpiry: Date | string | null;
  modelExpiry: Date | string | null;
  freeExpiry: Date | string | null;
  status: string;
}): { tier: string; label: string; daysRemaining: number } {
  if (profile.status !== 'APPROVED') {
    return { tier: 'PENDING', label: 'รอตรวจสอบ', daysRemaining: 0 };
  }

  const superDays = getDaysRemaining(profile.superExpiry);
  const modelDays = getDaysRemaining(profile.modelExpiry);
  const freeDays = getDaysRemaining(profile.freeExpiry);

  if (superDays > 0) {
    return { tier: 'SUPER', label: 'Super', daysRemaining: superDays };
  }
  if (modelDays > 0) {
    return { tier: 'MODEL', label: 'Model', daysRemaining: modelDays };
  }
  return { tier: 'FREE', label: 'ผู้ใช้ทั่วไป', daysRemaining: freeDays };
}
