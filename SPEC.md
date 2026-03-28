# FF2 - เว็บขายรูปนางแบบ (Model Photo Marketplace)

## 1. แนวคิดและวิสัยทัศน์

FF2 เป็นแพลตฟอร์มออนไลน์สำหรับนางแบบและผู้ขายรูปภาพ โดยมีระบบสมาชิกแบบลำดับชั้น (Tier-based) ที่บังคับให้ผู้ใช้ต้องซื้อสิทธิ์เพื่อแสดงในตำแหน่งที่ดีขึ้น ระบบมีความปลอดภัยสูงด้วยการยืนยันตัวตนหลังบ้าน และรองรับการจัดการเครดิตแบบครบวงจร

**Personalities:**
- สำหรับนางแบบ: มืออาชีพ, ปลอดภัย, ง่ายต่อการใช้งาน
- สำหรับผู้ซื้อ: น่าเชื่อถือ, มีระบบการแสดงผลที่ชัดเจน

---

## 2. ภาษาการออกแบบ (Design Language)

### Color Palette
- **Primary**: #E91E63 (Pink/Magenta - แทนความเป็นผู้หญิง/แฟชั่น)
- **Secondary**: #9C27B0 (Purple - ความหรูหรา)
- **Accent**: #FF5722 (Deep Orange - ดึงดูดความสนใจ)
- **Background**: #FAFAFA (Light Gray)
- **Surface**: #FFFFFF (White)
- **Text Primary**: #212121
- **Text Secondary**: #757575
- **Success**: #4CAF50
- **Warning**: #FFC107
- **Error**: #F44336

### Typography
- **Font Family**: 'Kanit', 'Prompt', sans-serif (รองรับภาษาไทย)
- **Headings**: Kanit Bold, sizes 32/24/20/18px
- **Body**: Kanit Regular, size 16px
- **Caption**: Kanit Light, size 14px

### Spacing System
- Base unit: 8px
- Padding: 16px, 24px, 32px
- Gap: 8px, 16px, 24px
- Border radius: 8px (cards), 12px (buttons), 50% (avatars)

### Motion Philosophy
- **Hover**: scale(1.02), 200ms ease
- **Page transitions**: fade 300ms
- **Loading**: skeleton shimmer animation
- **Modals**: slide up + fade, 250ms

---

## 3. โครงสร้างและ Layout

### หน้าหลัก (Public)
- **Header**: Logo, Navigation, Login/Register buttons
- **Hero Section**: Featured models carousel
- **Filter Section**: Province, Category filters
- **Grid Section**: Model cards (จัดเรียงตาม tier: Super > Model > ทั่วไป)
- **Telegram Widget**: Fixed bottom-right corner
- **Footer**: Links, Contact info

### หน้าสมาชิก (User Dashboard)
- **Sidebar**: Navigation menu
- **Content Area**: Profile cards, posts, credits management
- **Quick Actions**: New post, Buy credits

### หน้า Admin
- **Sidebar**: Admin navigation
- **Dashboard**: Stats overview
- **Sections**: Members, Payments, Posts, Settings

---

## 4. ระบบและฟีเจอร์

### 4.1 ระบบสมัครสมาชิก
- **ข้อจำกัด**: 1 Email สร้างได้สูงสุด 50 Profile
- **ข้อมูลบังคับ**: Email, Password เท่านั้น
- **LINE ID / ชื่อ / จังหวัด**: กรอกตอน **สร้างโพสต์** (ไม่เก็บตอนสมัคร)
- **การยืนยัน**: Email verification (optional)

### 4.2 ระดับสมาชิก (Tiers)
| Tier | ชื่อ | ตำแหน่ง | ราคา | ระยะเวลา |
|------|------|---------|------|---------|
| 1 | Super | แสดงช่องแรก | ดูจาก DB | 7/14 วัน |
| 2 | Model | แสดงช่องที่สอง | ดูจาก DB | 7/14 วัน |
| 3 | ทั่วไป | แสดงช่องสุดท้าย | ฟรี | - |

**หมายเหตุ:** ราคา Super/Model ตั้งได้จากหลังบ้าน ดูที่ `/admin/packages`

**กฎ:**
- ต้องมีวันใช้งานทั่วไปก่อนซื้อ Super/Model
- Super/Model ไม่เเกิดวันใช้งานทั่วไป
- อนุมัติโพสต์แล้วแสดงช่อง 3 ทันที

### 4.3 ระบบโพสต์
- **รูปภาพ**: 3-5 รูปต่อโพสต์
- **ไฟล์**: .jpg, .png เท่านั้น
- **ข้อมูลบังคับ**: LINE ID, ชื่อโพสต์ (หัวข้อ), อายุ, รายละเอียด, รูป
- **ข้อมูลเพิ่มเติม (ไม่บังคับ)**: ชื่อติดต่อ, จังหวัด, เขต/แขวง
- **สถานะ**: รอตรวจสอบ → อนุมัติ/ปฏิเสธ
- **การแสดงผล**: ตาม tier ของผู้โพสต์

### 4.4 ระบบเติมเงิน (Credits)
- **วิธีการ**: โอนเงินผ่านบัญชีธนาคาร
- **ข้อมูลที่ต้องการ**: สลิปโอนเงิน
- **การอนุมัติ**: Admin ตรวจสอบแล้วอนุมัติ
- **แสดงผล**: ประวัติแบบ real-time

### 4.5 ระบบโอนย้ายวันใช้งาน
- **ขอบเขต**: Profile → Profile (ภายใน email เดียวกันเท่านั้น)
- **การแสดงผล**: รายชื่อ profile ที่มีเวลาเหลือ
- **Log**: บันทึกประวัติการโอนในระบบจัดการสมาชิก

### 4.6 หน้าหลังบ้าน (Admin)
1. **จัดการสมาชิก**
   - ดู: เครดิต, วันใช้งานทั้งหมด, Email
   - แก้ไขรหัสผ่าน
   - แบน/ยกเลิกแบน
   - เพิ่มยศ Admin

2. **ประวัติการเติมเงิน** (Real-time)

3. **ตั้งค่าธนาคาร**
   - ชื่อบัญชี
   - เลขบัญชี

4. **ตั้งค่า Telegram**
   - ช่องทาง/ลิงก์ Telegram

5. **สรุปยอดรายรับ**

6. **จัดการราคาแพ็คเกจ**
   - ตั้งราคา Super (7 วัน / 14 วัน)
   - ตั้งราคา Model (7 วัน / 14 วัน)
   - เปิด/ปิดใช้งานแพ็คเกจ
   - คำอธิบายแพ็คเกจ
   - ราคาอ่านจาก DB (Package model) ไม่ใช่ hardcode

---

## 5. Component Inventory

### ModelCard
- Avatar/รูปหลัก
- ชื่อ, อายุ
- จังหวัด
- Badge tier (Super/Model/ทั่วไป)
- ปุ่มติดต่อ Line
- States: default, hover (scale up), loading (skeleton)

### TierBadge
- Super: พื้นหลังสีทอง (#FFD700)
- Model: พื้นหลังสีเงิน (#C0C0C0)
- ทั่วไป: พื้นหลังสีเทา (#9E9E9E)

### CreditCard
- แสดงวันใช้งานคงเหลือ
- Progress bar
- ปุ่มเติมเงิน

### PostForm
- Image upload (drag & drop)
- Preview gallery
- Form fields
- Validation states

### AdminSidebar
- Logo
- Navigation items
- User info
- Logout

### TelegramWidget
- Fixed position bottom-right
- Telegram icon
- Pulse animation on hover
- Link to channel/group

---

## 6. Technical Approach

### Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM (for simplicity)
- **Styling**: Tailwind CSS
- **Auth**: Custom HMAC-signed sessions with NextAuth.js patterns
- **State**: React Context / Zustand
- **Forms**: React Hook Form + Zod validation
- **Security**: OWASP Top 10 compliance

### Security Features (OWASP Top 10)
- **A01 - Broken Access Control**: Input validation, whitelist-based updates, authorization checks
- **A02 - Cryptographic Failures**: HMAC-signed sessions, secure password hashing (bcrypt 12 rounds)
- **A03 - Injection**: Zod schema validation, safe JSON parsing, parameterized queries
- **A05 - Security Misconfiguration**: Security headers (HSTS, X-Frame-Options, CSP), restricted image domains
- **A07 - Authentication Failures**: Rate limiting, strong password policy (8+ chars, complexity requirements)

### Rate Limits
| Action | Limit |
|--------|-------|
| Login attempts | 5/minute/IP |
| Registration | 3/minute/IP |
| Transfer days | 10/hour/user |
| Credit requests | 5/hour/user |
| Admin login | 3/minute/IP |

### Project Structure
```
FF2/
├── app/
│   ├── (public)/           # Public pages
│   │   ├── page.tsx        # Home
│   │   ├── login/
│   │   └── register/
│   ├── (user)/             # User dashboard
│   │   ├── dashboard/
│   │   ├── profiles/
│   │   ├── posts/
│   │   └── credits/
│   ├── (admin)/            # Admin pages
│   │   ├── admin/
│   │   └── settings/
│   ├── api/               # API routes
│   └── layout.tsx
├── components/
├── lib/
├── prisma/
└── public/
```

### Database Schema

**User**
- id, email, password, lineId, province, district
- role: USER | ADMIN
- isBanned, createdAt, updatedAt

**Profile**
- id, userId, name, age, province, district
- description, images
- tier: SUPER | MODEL | FREE
- superExpiry, modelExpiry, freeExpiry
- status: PENDING | APPROVED | REJECTED
- createdAt

**Post**
- id, profileId, images, title, description
- status: PENDING | APPROVED | REJECTED
- createdAt

**CreditHistory**
- id, userId, amount, type
- proof, status
- createdAt

**TransferLog**
- id, fromProfileId, toProfileId
- days, createdAt

**Settings**
- bankName, bankAccount, bankNumber
- telegramChannel

---

## 7. API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout

### Profiles
- GET /api/profiles
- POST /api/profiles
- GET /api/profiles/:id
- PUT /api/profiles/:id
- DELETE /api/profiles/:id
- POST /api/profiles/:id/transfer

### Posts
- GET /api/posts
- POST /api/posts
- PUT /api/posts/:id (admin)
- DELETE /api/posts/:id

### Credits
- GET /api/credits
- POST /api/credits (topup request)
- PUT /api/credits/:id (approve/reject)

### Admin
- GET /api/admin/users
- PUT /api/admin/users/:id
- GET /api/admin/stats
- PUT /api/admin/settings
