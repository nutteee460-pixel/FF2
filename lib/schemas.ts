import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'กรุณากรอกอีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .max(255, 'อีเมลต้องไม่เกิน 255 ตัวอักษร')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .max(128, 'รหัสผ่านต้องไม่เกิน 128 ตัวอักษร')
    .refine(
      (password) => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        return [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length >= 3;
      },
      { message: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษอย่างน้อย 3 ประเภท' }
    ),
  confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
  accountType: z.enum(['POSTER', 'BUYER']).optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'กรุณายอมรับข้อกำหนดของเว็บไซต์',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'กรุณากรอกอีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน').max(128),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ').max(100).optional(),
  age: z.number().int().min(20, 'อายุต้องไม่ต่ำกว่า 20 ปี').max(99).optional(),
  province: z.string().min(1).max(100).optional(),
  district: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  serviceTypes: z.array(z.string()).max(10).optional(),
  appearance: z.array(z.string()).max(10).optional(),
  ageRange: z.array(z.string()).max(5).optional(),
});

export const profileCreateSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ').max(100),
  age: z.number().int().min(20, 'อายุต้องไม่ต่ำกว่า 20 ปี').max(99),
  province: z.string().min(1, 'กรุณาเลือกจังหวัด').max(100),
  district: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  images: z.array(z.string().url()).min(1).max(10).optional(),
  serviceTypes: z.array(z.string()).max(10).optional(),
  appearance: z.array(z.string()).max(10).optional(),
  ageRange: z.array(z.string()).max(5).optional(),
  region: z.string().max(50).optional(),
});

export const postSchema = z.object({
  profileId: z.string().min(1, 'กรุณาเลือกโปรไฟล์'),
  title: z.string().min(1, 'กรุณากรอกหัวข้อ').max(200),
  description: z.string().max(2000).optional(),
  lineId: z.string().min(1, 'กรุณากรอก LINE ID').max(100),
  contactName: z.string().max(100).optional(),
  age: z.number().int().min(20, 'อายุในโพสต์ต้องไม่ต่ำกว่า 20 ปี').max(99),
  province: z.string().min(1, 'กรุณาเลือกจังหวัด').max(100),
  district: z.string().max(100).optional(),
  images: z.array(z.string().url()).min(3, 'ต้องมีรูปอย่างน้อย 3 รูป').max(5, 'มีรูปได้ไม่เกิน 5 รูป'),
  serviceTypes: z.array(z.string()).max(10).optional(),
  appearance: z.array(z.string()).max(10).optional(),
  ageRange: z.array(z.string()).max(5).optional(),
});

export const postUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  lineId: z.string().min(1).max(100).optional(),
  contactName: z.string().max(100).optional().nullable(),
  age: z.number().int().min(20).max(99).optional(),
  province: z.string().max(100).optional(),
  district: z.string().max(100).optional().nullable(),
  images: z.array(z.string().url()).min(3).max(5).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  adminNotes: z.string().max(1000).optional().nullable(),
});

export const transferSchema = z.object({
  fromProfileId: z.string().min(1, 'กรุณาเลือกโปรไฟล์ต้นทาง'),
  toProfileId: z.string().min(1, 'กรุณาเลือกโปรไฟล์ปลายทาง'),
  days: z.number().int().min(1, 'ต้องโอนอย่างน้อย 1 วัน').max(3650),
});

export const creditTopupSchema = z.object({
  amount: z.number().int().min(1, 'กรุณากรอกจำนวนวัน').max(3650),
  profileId: z.string().min(1, 'กรุณาเลือกโปรไฟล์'),
  proof: z.string().min(1, 'กรุณาอัพโหลดสลิป'),
});

export const settingsSchema = z.object({
  bankName: z.string().max(100).optional(),
  bankAccount: z.string().max(200).optional(),
  bankNumber: z.string().max(50).optional(),
  telegramChannel: z.string().max(200).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfileCreateInput = z.infer<typeof profileCreateSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type PostUpdateInput = z.infer<typeof postUpdateSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type CreditTopupInput = z.infer<typeof creditTopupSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
