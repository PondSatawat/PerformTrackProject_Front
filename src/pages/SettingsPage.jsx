export default function SettingsPage({ profileData, setProfileData, onSubmit }) {
  return (
    <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate-200">
      <h3 className="text-3xl font-bold mb-8 text-slate-800 border-b border-slate-200 pb-6">ตั้งค่าข้อมูลส่วนตัว</h3>
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div><label className="block text-sm font-semibold text-slate-700 mb-3">ชื่อ</label><input type="text" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-slate-50 transition-all duration-200" value={profileData.firstName} onChange={(e) => setProfileData({...profileData, firstName: e.target.value})} required /></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-3">นามสกุล</label><input type="text" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-slate-50 transition-all duration-200" value={profileData.lastName} onChange={(e) => setProfileData({...profileData, lastName: e.target.value})} required /></div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-3">สาขาวิชา</label>
            <select className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-slate-50 transition-all duration-200" value={profileData.major || 'เทคโนโลยีสารสนเทศ (IT)'} onChange={(e) => setProfileData({...profileData, major: e.target.value})}>
              <option value="เทคโนโลยีสารสนเทศ (IT)">เทคโนโลยีสารสนเทศ (IT)</option><option value="ปัญญาประดิษฐ์ (AI)">ปัญญาประดิษฐ์ (AI)</option><option value="วิศวกรรมซอฟต์แวร์ (SE)">วิศวกรรมซอฟต์แวร์ (SE)</option><option value="อาจารย์ประจำคณะ">อาจารย์ประจำคณะ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">ชั้นปี</label>
            <select className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-slate-50 transition-all duration-200" value={profileData.academicYear} onChange={(e) => setProfileData({...profileData, academicYear: e.target.value})}>
              <option value="ปี 1">ชั้นปีที่ 1</option><option value="ปี 2">ชั้นปีที่ 2</option><option value="ปี 3">ชั้นปีที่ 3</option><option value="ปี 4">ชั้นปีที่ 4</option><option value="อาจารย์">อาจารย์</option>
            </select>
          </div>
        </div>
        <div className="pt-6"><button type="submit" className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">บันทึกข้อมูล</button></div>
      </form>
    </div>
  );
}
