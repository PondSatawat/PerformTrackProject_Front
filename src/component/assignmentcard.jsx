import { useState } from 'react';

export function StudentSubmitCard({ task, userName, userEmail, refresh }) {
  const [studentNote, setStudentNote] = useState('');
  
  const handleSubmit = async () => {
    const submissionData = { ...task, id: null, studentId: userEmail, studentName: userName, studentNote: studentNote, submissionStatus: 'SUBMITTED' };
    await fetch(`http://localhost:8080/api/assignments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submissionData) });
    alert('ส่งรายการประเมินเรียบร้อย!'); refresh();
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:border-indigo-300 transition">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs font-bold px-2 py-1 bg-slate-200 text-slate-700 rounded-md mb-2 inline-block mr-2">{task.taskType || 'งานทั่วไป'}</span>
            <h3 className="text-lg font-bold text-slate-800">{task.taskTitle}</h3>
          </div>
          <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded">กำหนด: {task.dueDate}</span>
        </div>
        <p className="text-sm text-slate-600 mb-4">{task.taskDescription}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700 mb-1 block">แนบลิงก์ผลงาน หรือ โน้ตถึงอาจารย์:</label>
        <textarea className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-400 h-16 text-sm mb-3 bg-slate-50" value={studentNote} onChange={(e)=>setStudentNote(e.target.value)} />
        <button onClick={handleSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold transition shadow-sm">บันทึกและส่ง</button>
      </div>
    </div>
  );
}

export function TeacherGradeCard({ task, refresh }) {
  const [score, setScore] = useState(task.score || '');
  const [note, setNote] = useState(task.instructorNote || '');
  
  const handleGrade = async () => {
    await fetch(`http://localhost:8080/api/assignments/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: parseFloat(score), instructorNote: note, submissionStatus: 'GRADED' }) });
    alert('ประเมินผลเรียบร้อย'); refresh();
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-lg font-bold text-slate-800">{task.taskTitle}</h3>
        <span className="text-xs font-bold px-2 py-1 bg-slate-200 text-slate-700 rounded-md">{task.taskType || 'งานทั่วไป'}</span>
      </div>
      <p className="text-sm text-indigo-600 mb-2 font-semibold">นักศึกษา: {task.studentName}</p>
      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg mb-4 text-sm">
        <p className="text-slate-500 text-xs font-bold mb-1">โน้ตที่นักศึกษาส่งมา:</p>
        <p className="text-slate-800 font-medium">{task.studentNote || '-'}</p>
      </div>
      <div className="space-y-3">
        <div><label className="text-xs font-bold text-slate-500 mb-1 block">คะแนนที่ได้ (เต็ม 100)</label><input type="number" className="w-full border border-slate-300 rounded-xl p-2 outline-none focus:border-indigo-400 font-bold text-indigo-700 text-lg" value={score} onChange={(e)=>setScore(e.target.value)} /></div>
        <div><label className="text-xs font-bold text-slate-500 mb-1 block">ข้อเสนอแนะ/โน้ตจากอาจารย์</label><textarea className="w-full border border-slate-300 rounded-xl p-2 outline-none focus:border-indigo-400 h-16" value={note} onChange={(e)=>setNote(e.target.value)} /></div>
        <button onClick={handleGrade} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition shadow-sm mt-2">บันทึกคะแนนและเกรด</button>
      </div>
    </div>
  );
}