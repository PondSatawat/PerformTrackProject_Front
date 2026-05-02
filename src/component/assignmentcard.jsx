import { useState } from 'react';
import { useToast } from './Toast.jsx';

const isPastDue = (dueDate) => {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  return now > due;
};

export function StudentSubmitCard({ task, userName, userEmail, refresh }) {
  const { showToast } = useToast();
  const [studentNote, setStudentNote] = useState('');
  const isBeforeOpen = task.openDate && new Date() < new Date(task.openDate);
  const isLate = isPastDue(task.dueDate);
  const buttonLabel = isBeforeOpen ? 'ยังไม่เปิดรับงาน' : (isLate ? 'ส่งล่าช้า' : 'บันทึกและส่ง');
  const buttonClass = isBeforeOpen 
    ? 'w-full bg-slate-400 text-white py-2 rounded-lg font-bold shadow-sm cursor-not-allowed' 
    : (isLate ? 'w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-2 rounded-lg font-bold transition shadow-sm' : 'w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-2 rounded-lg font-bold transition shadow-sm');
  
  const handleSubmit = async () => {
    if (isBeforeOpen) {
      showToast('ยังไม่ถึงเวลาเปิดรับงาน', 'warning');
      return;
    }
    const submissionData = {
      ...task,
      id: null,
      studentId: userEmail,
      studentName: userName,
      studentNote: studentNote,
      submissionStatus: isLate ? 'LATE_SUBMITTED' : 'SUBMITTED',
      lateSubmission: isLate
    };
    await fetch(`http://localhost:8080/api/assignments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submissionData) });
    showToast('ส่งรายการประเมินเรียบร้อย!', 'success'); refresh();
  };

  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between hover:border-indigo-300 transition">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md mb-1 inline-block mr-2">{task.taskType || 'งานทั่วไป'}</span>
            <h3 className="text-base font-bold text-slate-800">{task.taskTitle}</h3>
          </div>
          <div className="text-right">
            {task.openDate && <span className="block text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 mb-0.5">เปิด: {task.openDate.replace('T', ' ')}</span>}
            <span className={`block text-[10px] font-bold px-1.5 py-0.5 rounded ${isLate ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-700'}`}>
              ปิด: {task.dueDate?.replace('T', ' ') || '-'}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-600 mb-2 line-clamp-2">{task.taskDescription}</p>
        {isLate && <p className="text-[10px] font-semibold text-red-600 mb-2">กำหนดส่งผ่านไปแล้ว งานนี้จะถูกบันทึกเป็นส่งล่าช้า</p>}
      </div>
      <div className="mt-2 pt-2 border-t border-slate-100">
        <label className="text-[10px] font-bold text-slate-500 mb-1 block">แนบลิงก์ผลงาน / โน้ต:</label>
        <textarea className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-400 h-12 text-xs mb-2 bg-slate-50 resize-none" value={studentNote} onChange={(e)=>setStudentNote(e.target.value)} disabled={isBeforeOpen} placeholder="วางลิงก์หรือพิมพ์ข้อความ..." />
        <button onClick={handleSubmit} className={`${buttonClass} text-sm py-1.5`} disabled={isBeforeOpen}>{buttonLabel}</button>
      </div>
    </div>
  );
}

export function TeacherGradeCard({ task, refresh }) {
  const { showToast } = useToast();
  const [score, setScore] = useState(task.score || '');
  const [note, setNote] = useState(task.instructorNote || '');
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(task.submissionStatus !== 'GRADED');
  const isLate = task.submissionStatus === 'LATE_SUBMITTED' || task.lateSubmission === true;
  const isGraded = task.submissionStatus === 'GRADED';
  
  const handleGrade = async () => {
    await fetch(`http://localhost:8080/api/assignments/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: parseFloat(score), instructorNote: note, submissionStatus: 'GRADED' }) });
    showToast('ประเมินผลเรียบร้อย', 'success');
    setIsEditing(false);
    refresh();
  };

  // Compact view (collapsed) - just show name + status
  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="w-full text-left bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-800">{task.taskTitle}</h3>
            <p className="text-xs text-indigo-600 font-semibold">นักศึกษา: {task.studentName}</p>
          </div>
          <div className="flex items-center gap-2">
            {isGraded && <span className="text-xs font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">ตรวจแล้ว ({task.score})</span>}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLate ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isLate ? 'ส่งล่าช้า' : 'ตรงเวลา'}
            </span>
            <span className="text-slate-400 text-lg">›</span>
          </div>
        </div>
      </button>
    );
  }

  // Expanded view
  return (
    <div className="bg-white border border-indigo-200 p-4 rounded-xl shadow-md ring-2 ring-indigo-50 transition-all duration-200">
      <div className="flex justify-between items-center mb-1">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{task.taskTitle}</h3>
          <p className="text-xs text-indigo-600 font-semibold">{task.studentName}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{task.taskType || 'งานทั่วไป'}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLate ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isLate ? 'ส่งล่าช้า' : 'ตรงเวลา'}
            </span>
          </div>
          <button onClick={() => setExpanded(false)} className="ml-2 text-slate-400 hover:text-slate-600 text-lg font-bold transition-colors">✕</button>
        </div>
      </div>
      
      {task.studentNote && (
        <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg mb-3 mt-2">
          <p className="text-[10px] font-bold text-slate-400 mb-0.5">แนบมา:</p>
          <p className="text-xs text-slate-700 truncate">{task.studentNote}</p>
        </div>
      )}

      <div className="flex gap-3 items-end mt-3">
        <div className="w-1/3">
          <label className="text-[10px] font-bold text-slate-500 mb-1 block">คะแนน</label>
          <input type="number" placeholder="เต็ม 100" className={`w-full border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400 font-bold text-indigo-700 text-sm ${!isEditing ? 'bg-slate-100 cursor-not-allowed' : ''}`} value={score} onChange={(e)=>setScore(e.target.value)} disabled={!isEditing} />
        </div>
        <div className="w-2/3">
          <label className="text-[10px] font-bold text-slate-500 mb-1 block">คอมเมนต์</label>
          <input type="text" placeholder="ข้อเสนอแนะ..." className={`w-full border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400 text-sm ${!isEditing ? 'bg-slate-100 cursor-not-allowed' : ''}`} value={note} onChange={(e)=>setNote(e.target.value)} disabled={!isEditing} />
        </div>
      </div>
      {isEditing ? (
        <button onClick={handleGrade} className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg text-sm font-bold transition shadow-sm mt-3">บันทึก</button>
      ) : (
        <button onClick={() => setIsEditing(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded-lg text-sm font-bold transition shadow-sm mt-3">แก้ไข</button>
      )}
    </div>
  );
}