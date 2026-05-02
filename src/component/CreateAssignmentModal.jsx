import { useToast } from './Toast.jsx';

export function CreateAssignmentModal({
  show, onClose, onSubmit,
  newTaskTitle, setNewTaskTitle, newTaskDesc, setNewTaskDesc,
  newTaskDueDate, setNewTaskDueDate, newTaskOpenDate, setNewTaskOpenDate,
  newTaskMaxScore, setNewTaskMaxScore,
  newTaskType, setNewTaskType, newTaskSubject, setNewTaskSubject,
  targetClass, setTargetClass, targetMajor, setTargetMajor
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-white border-b border-slate-200 p-8 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-slate-800">มอบหมายงาน / การสอบ</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors duration-200"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="p-10">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">ประเภท:</label>
                  <select className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm" value={newTaskType} onChange={(e) => setNewTaskType(e.target.value)}>
                    <option value="งานทั่วไป">งานทั่วไป (Assignment)</option><option value="สอบย่อย">สอบย่อย (Quiz)</option><option value="สอบกลางภาค">สอบกลางภาค (Midterm)</option><option value="สอบปลายภาค">สอบปลายภาค (Final)</option>
                  </select>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">รายวิชา:</label>
                  <input type="text" placeholder="เช่น Programming" className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm" value={newTaskSubject} onChange={(e) => setNewTaskSubject(e.target.value)} required />
                </div>
              </div>
              
              
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-[3] w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">หัวข้อโปรเจกต์/งาน/ชื่อการสอบ:</label>
                  <input type="text" placeholder="พิมพ์ชื่อหัวข้อ..." className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
                </div>
                <div className="flex-[1] w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">คะแนนเต็ม:</label>
                  <input type="number" min="0" step="1" className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm" value={newTaskMaxScore} onChange={(e) => setNewTaskMaxScore(e.target.value)} required />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">สั่งให้ชั้นปี:</label>
                  <select className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm" value={targetClass} onChange={(e) => setTargetClass(e.target.value)}>
                    <option value="ปี 1">ชั้นปีที่ 1</option><option value="ปี 2">ชั้นปีที่ 2</option><option value="ปี 3">ชั้นปีที่ 3</option><option value="ปี 4">ชั้นปีที่ 4</option><option value="ทั้งหมด">ทุกชั้นปี</option>
                  </select>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">สาขาวิชา:</label>
                  <select className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm" value={targetMajor} onChange={(e) => setTargetMajor(e.target.value)}>
                    <option value="ALL">ทุกสาขาวิชา</option><option value="เทคโนโลยีสารสนเทศ (IT)">เทคโนโลยีสารสนเทศ (IT)</option><option value="ปัญญาประดิษฐ์ (AI)">ปัญญาประดิษฐ์ (AI)</option><option value="วิศวกรรมซอฟต์แวร์ (SE)">วิศวกรรมซอฟต์แวร์ (SE)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">เวลาเริ่มเปิดรับงาน:</label>
                  <input type="datetime-local" className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm" value={newTaskOpenDate} onChange={(e) => setNewTaskOpenDate(e.target.value)} required />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">เวลาปิดรับงาน / กำหนดส่ง:</label>
                  <input type="datetime-local" className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} required />
                </div>
              </div>

              <div className="w-full">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">คำอธิบาย/คำสั่ง:</label>
                <textarea placeholder="รายละเอียด..." className="w-full px-3 py-2 border border-slate-300 rounded-xl h-24 bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm resize-none" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} required />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all duration-200 text-sm">ยกเลิก</button>
              <button type="submit" className="px-6 py-2 bg-indigo-700 text-white font-bold rounded-xl hover:bg-indigo-800 active:bg-indigo-900 transition-all duration-200 shadow hover:shadow-md text-sm">มอบหมายงาน</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function EditAssignmentModal({ show, onClose, onSubmit, editTask, setEditTask }) {
  if (!show || !editTask) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-white border-b border-slate-200 p-8 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-slate-800">แก้ไขงาน</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors duration-200"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="p-10">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">ประเภท:</label>
                  <select className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 text-sm" value={editTask.taskType || ''} onChange={(e) => setEditTask({...editTask, taskType: e.target.value})}>
                    <option value="งานทั่วไป">งานทั่วไป (Assignment)</option><option value="สอบย่อย">สอบย่อย (Quiz)</option><option value="สอบกลางภาค">สอบกลางภาค (Midterm)</option><option value="สอบปลายภาค">สอบปลายภาค (Final)</option>
                  </select>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">รายวิชา:</label>
                  <input type="text" placeholder="เช่น Programming" className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 text-sm" value={editTask.subject || ''} onChange={(e) => setEditTask({...editTask, subject: e.target.value})} required />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-[3] w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">หัวข้อโปรเจกต์/งาน/ชื่อการสอบ:</label>
                  <input type="text" placeholder="พิมพ์ชื่อหัวข้อ..." className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 text-sm" value={editTask.taskTitle || ''} onChange={(e) => setEditTask({...editTask, taskTitle: e.target.value})} required />
                </div>
                <div className="flex-[1] w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">คะแนนเต็ม:</label>
                  <input type="number" min="0" step="1" className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 text-sm" value={editTask.maxScore || ''} onChange={(e) => setEditTask({...editTask, maxScore: parseFloat(e.target.value)})} required />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">สั่งให้ชั้นปี:</label>
                  <select className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 text-sm" value={editTask.academicYear || ''} onChange={(e) => setEditTask({...editTask, academicYear: e.target.value})}>
                    <option value="ปี 1">ชั้นปีที่ 1</option><option value="ปี 2">ชั้นปีที่ 2</option><option value="ปี 3">ชั้นปีที่ 3</option><option value="ปี 4">ชั้นปีที่ 4</option><option value="ทั้งหมด">ทุกชั้นปี</option>
                  </select>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">สาขาวิชา:</label>
                  <select className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 text-sm" value={editTask.targetMajor || 'ALL'} onChange={(e) => setEditTask({...editTask, targetMajor: e.target.value})}>
                    <option value="ALL">ทุกสาขาวิชา</option><option value="เทคโนโลยีสารสนเทศ (IT)">เทคโนโลยีสารสนเทศ (IT)</option><option value="ปัญญาประดิษฐ์ (AI)">ปัญญาประดิษฐ์ (AI)</option><option value="วิศวกรรมซอฟต์แวร์ (SE)">วิศวกรรมซอฟต์แวร์ (SE)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">เวลาเริ่มเปิดรับงาน:</label>
                  <input type="datetime-local" className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 text-sm" value={editTask.openDate || ''} onChange={(e) => setEditTask({...editTask, openDate: e.target.value})} required />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">เวลาปิดรับงาน / กำหนดส่ง:</label>
                  <input type="datetime-local" className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 text-sm" value={editTask.dueDate || ''} onChange={(e) => setEditTask({...editTask, dueDate: e.target.value})} required />
                </div>
              </div>

              <div className="w-full">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">คำอธิบาย/คำสั่ง:</label>
                <textarea placeholder="รายละเอียด..." className="w-full px-3 py-2 border border-slate-300 rounded-xl h-24 bg-slate-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 text-sm resize-none" value={editTask.taskDescription || ''} onChange={(e) => setEditTask({...editTask, taskDescription: e.target.value})} required />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all duration-200 text-sm">ยกเลิก</button>
              <button type="submit" className="px-6 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 active:bg-amber-800 transition-all duration-200 shadow hover:shadow-md text-sm">บันทึกการแก้ไข</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
