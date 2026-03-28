// หมวดหมู่ต่างๆ สำหรับ FF2

export const SERVICE_TYPES = [
  { value: 'ถ่ายรูป', label: 'รับถ่ายรูป', icon: '📷' },
  { value: 'พรีเซนเตอร์', label: 'พรีเซนเตอร์', icon: '🎤' },
  { value: 'งาน Event', label: 'งาน Event', icon: '🎪' },
  { value: 'เดท', label: 'เดท/พี่เลี้ยง', icon: '💕' },
  { value: 'ไลฟ์สด', label: 'ไลฟ์สด', icon: '📱' },
  { value: 'ร้องเพลง', label: 'ร้องเพลง/KTV', icon: '🎵' },
  { value: 'อาหาร', label: 'รับเลี้ยงอาหาร', icon: '🍽️' },
  { value: 'เดินทาง', label: 'เดินทางท่องเที่ยว', icon: '✈️' },
  { value: 'งานปาร์ตี้', label: 'งานปาร์ตี้', icon: '🥳' },
  { value: 'ทำงานบ้าน', label: 'ช่วยงานบ้าน', icon: '🏠' },
];

export const APPEARANCES = [
  { value: 'สูง', label: 'สูง', icon: '📏' },
  { value: 'เตี้ย', label: 'เตี้ย', icon: '📊' },
  { value: 'ผอม', label: 'ผอม', icon: '⚡' },
  { value: 'อวบ', label: 'อวบ', icon: '✨' },
  { value: 'ท้วม', label: 'ท้วม', icon: '🌟' },
  { value: 'บาง', label: 'บาง', icon: '🌸' },
  { value: 'ล่ำ', label: 'ล่ำ/กล้าม', icon: '💪' },
  { value: 'ผิวขาว', label: 'ผิวขาว', icon: '🤍' },
  { value: 'ผิวเข้ม', label: 'ผิวเข้ม', icon: '🖤' },
  { value: 'ผิวละมุน', label: 'ผิวละมุน', icon: '🌺' },
];

export const AGE_RANGES = [
  { value: '18-22', label: '18-22 ปี', icon: '🌱' },
  { value: '23-26', label: '23-26 ปี', icon: '🌿' },
  { value: '27-30', label: '27-30 ปี', icon: '🌳' },
  { value: '31-35', label: '31-35 ปี', icon: '🌲' },
  { value: '36-40', label: '36-40 ปี', icon: '🌸' },
  { value: '40+', label: '40+ ปี', icon: '👑' },
];

export const REGIONS = [
  { value: 'central', label: 'ภาคกลาง', icon: '🏙️' },
  { value: 'east', label: 'ภาคตะวันออก', icon: '🏖️' },
  { value: 'north', label: 'ภาคเหนือ', icon: '🏔️' },
  { value: 'northeast', label: 'ภาคอีสาน', icon: '🌾' },
  { value: 'south', label: 'ภาคใต้', icon: '🏝️' },
];

export const REGION_LABELS: Record<string, string> = {
  central: 'ภาคกลาง',
  east: 'ภาคตะวันออก',
  north: 'ภาคเหนือ',
  northeast: 'ภาคอีสาน',
  south: 'ภาคใต้',
};
