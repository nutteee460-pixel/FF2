import PublicHeader from '@/components/PublicHeader';
import Link from 'next/link';
import TelegramWidget from '@/components/TelegramWidget';

export const metadata = {
  title: 'วิธีการใช้งาน - FF2',
  description: 'เรียนรู้วิธีการใช้งานเว็บไซต์ FF2 สำหรับนางแบบและผู้ขายรูปภาพ',
};

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">วิธีการใช้งาน</h1>
          <p className="text-xl opacity-90">
            เรียนรู้ขั้นตอนการใช้งาน FF2 สำหรับนางแบบและผู้ขายรูปภาพ
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Steps */}
        <div className="space-y-8">
          {/* Step 1 */}
          <div className="bg-white rounded-xl p-6 shadow-md flex items-start gap-6">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary-500">1</span>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">สมัครสมาชิก</h2>
              <p className="text-gray-600 mb-3">
                ลงทะเบียนบัญชีฟรีด้วยอีเมล สามารถสร้างได้สูงสุด 50 โปรไฟล์ต่อ 1 อีเมล
              </p>
              <Link
                href="/register"
                className="inline-block bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                สมัครสมาชิกฟรี
              </Link>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl p-6 shadow-md flex items-start gap-6">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary-500">2</span>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">สร้างโปรไฟล์</h2>
              <p className="text-gray-600 mb-3">
                เพิ่มรูปนางแบบและรายละเอียดต่างๆ เช่น อายุ และข้อมูลการติดต่อ
              </p>
              <p className="text-sm text-gray-500">
                โปรไฟล์ที่สร้างจะต้องผ่านการอนุมัติจากผู้ดูแลระบบก่อนจึงจะแสดงผล
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl p-6 shadow-md flex items-start gap-6">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary-500">3</span>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">สร้างโพสต์รูป</h2>
              <p className="text-gray-600 mb-3">
                อัปโหลดรูปภาพ 3-5 รูป (รองรับ .jpg และ .png) พร้อมรายละเอียดและ LINE ID สำหรับติดต่อ
              </p>
              <p className="text-sm text-gray-500">
                โพสต์จะเข้าสู่สถานะ "รอตรวจสอบ" ก่อนอนุมัติโดยผู้ดูแลระบบ
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-xl p-6 shadow-md flex items-start gap-6">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary-500">4</span>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">เลือกระดับสมาชิก</h2>
              <p className="text-gray-600 mb-3">
                เลือกซื้อแพ็คเกจเพื่อเพิ่มตำแหน่งการแสดงผลของโปรไฟล์
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p><strong>Super (5 บาท)</strong> - แสดงช่องที่ 1 (บนสุด) ระยะเวลา 7/14 วัน</p>
                <p><strong>Model (5 บาท)</strong> - แสดงช่องที่ 2 ระยะเวลา 7/14 วัน</p>
                <p><strong>ผู้ใช้ทั่วไป</strong> - แสดงช่องที่ 3 (ล่างสุด) ฟรี</p>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white rounded-xl p-6 shadow-md flex items-start gap-6">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary-500">5</span>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">เติมเงิน / ซื้อแพ็คเกจ</h2>
              <p className="text-gray-600 mb-3">
                หลังจากโอนเงินแล้ว อัปโหลดสลิปเพื่อเติมเครดิต จากนั้นใช้เครดิตซื้อแพ็คเกจ Super หรือ Model
              </p>
              <p className="text-sm text-gray-500">
                สามารถโอนวันใช้งานระหว่างโปรไฟล์ที่อยู่ภายในอีเมลเดียวกันได้
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">คำถามที่พบบ่อย</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold mb-2">สมัครสมาชิกฟรีได้ไหม?</h3>
              <p className="text-gray-600">ได้ การสมัครสมาชิกและสร้างโปรไฟล์ไม่มีค่าใช้จ่าย จ่ายเฉพาะเมื่อต้องการซื้อแพ็คเกจ Super หรือ Model</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold mb-2">1 อีเมล สร้างได้กี่โปรไฟล์?</h3>
              <p className="text-gray-600">สร้างได้สูงสุด 50 โปรไฟล์ต่อ 1 อีเมล</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold mb-2">โพสต์รูปต้องมีกี่รูป?</h3>
              <p className="text-gray-600">ต้องมีรูปภาพ 3-5 รูปต่อโพสต์ รองรับไฟล์ .jpg และ .png เท่านั้น</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold mb-2">โอนวันใช้งานระหว่างโปรไฟล์ได้ไหม?</h3>
              <p className="text-gray-600">ได้ สามารถโอนวันใช้งานระหว่างโปรไฟล์ที่อยู่ภายในอีเมลเดียวกันเท่านั้น</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">พร้อมเริ่มต้นใช้งานแล้วหรือยัง?</p>
          <Link
            href="/register"
            className="inline-block bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
          >
            สมัครสมาชิกฟรี
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2024 FF2. สงวนลิขสิทธิ์ทุกประการ</p>
        </div>
      </footer>

      <TelegramWidget />
    </div>
  );
}
