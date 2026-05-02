import React, { useState } from 'react';

export default function ReportingPage({ 
  currentRole, user, 
  assignments, allUsers, 
  submittedTasks, teacherAssigned, 
  teacherPendingGrade, teacherGraded, 
  calculateGrade 
}) {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);

  // หาลิสต์รายวิชาทั้งหมด
  let subjects = [];
  if (currentRole === 'STUDENT') {
    subjects = [...new Set(submittedTasks.map(a => a.subject).filter(Boolean))];
  } else {
    subjects = [...new Set(teacherAssigned.map(a => a.subject).filter(Boolean))];
  }

  // ฟังก์ชันคำนวณคะแนนของนักศึกษา 1 คนใน 1 วิชานั้นๆ
  const getStudentSubjectStats = (studentUser, subjectName) => {
    // หางานทั้งหมดในวิชานี้ที่ "สั่งให้" นักศึกษาคนนี้
    const targetTasks = teacherAssigned.filter(task => {
      if (task.subject !== subjectName) return false;
      const isYearMatch = task.academicYear === 'ทั้งหมด' || task.academicYear === studentUser.academicYear;
      const isMajorMatch = task.targetMajor === 'ALL' || (studentUser.major || 'เทคโนโลยีสารสนเทศ (IT)') === task.targetMajor;
      return isYearMatch && isMajorMatch;
    });

    let totalMaxScore = 0;
    let totalEarnedScore = 0;
    const taskDetails = [];

    // วนลูปหางานแต่ละชิ้น
    targetTasks.forEach(task => {
      const maxS = task.maxScore !== undefined && task.maxScore !== null ? parseFloat(task.maxScore) : 100;
      totalMaxScore += maxS;

      // หาการส่งงานของ นศ. คนนี้ในงานชิ้นนี้
      const submission = assignments.find(a => 
        a.taskTitle === task.taskTitle && 
        a.studentId === studentUser.email && 
        a.submissionStatus !== 'ASSIGNED'
      );

      let earned = 0;
      let statusLabel = 'ยังไม่ส่ง';
      if (submission) {
        if (submission.score !== null && submission.score !== undefined && submission.score !== '') {
          earned = parseFloat(submission.score);
          statusLabel = `ตรวจแล้ว`;
        } else {
          statusLabel = submission.submissionStatus === 'LATE_SUBMITTED' ? 'ส่งล่าช้า (รอตรวจ)' : 'ส่งแล้ว (รอตรวจ)';
        }
      }

      totalEarnedScore += earned;

      taskDetails.push({
        taskTitle: task.taskTitle,
        maxScore: maxS,
        earnedScore: submission && submission.score !== null ? earned : '-',
        statusLabel: statusLabel
      });
    });

    // สมมติว่ามีงาน 0 ชิ้น ให้ max เป็น 0
    let percentage = 0;
    let grade = '-';
    if (totalMaxScore > 0) {
      percentage = (totalEarnedScore / totalMaxScore) * 100;
      grade = calculateGrade(percentage);
    }

    return {
      totalMaxScore,
      totalEarnedScore,
      percentage: percentage.toFixed(2),
      grade,
      taskDetails
    };
  };

  // --- Render หน้าหลัก (เลือกวิชา) ---
  if (!selectedSubject) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">สรุปผลการเรียน</h3>
            <p className="text-slate-500 mt-1">เลือกวิชาเพื่อดูรายละเอียดคะแนนและเกรดสะสม</p>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-200">
            <p className="text-slate-500">ยังไม่มีข้อมูลรายวิชา</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map(sub => (
              <button 
                key={sub} 
                onClick={() => setSelectedSubject(sub)}
                className="bg-white border border-slate-200 rounded-3xl p-6 text-left hover:shadow-md hover:border-indigo-300 transition-all duration-200 group flex flex-col justify-between min-h-[160px]"
              >
                <div>
                  <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full mb-3">วิชาเรียน</span>
                  <h4 className="text-xl font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{sub}</h4>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500 font-semibold">
                  ดูรายละเอียด นศ. <svg className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Render หน้ารายละเอียดวิชา ---

  // หานักศึกษาเป้าหมายในวิชานี้
  let targetStudents = [];
  if (currentRole === 'TEACHER') {
    const tasksInSub = teacherAssigned.filter(a => a.subject === selectedSubject);
    targetStudents = allUsers.filter(u => {
      if (u.role !== 'STUDENT') return false;
      // ถ้านักศึกษาคนนี้ตรงกับเงื่อนไขของงาน "ชิ้นใดชิ้นหนึ่ง" ในวิชานี้ ถือว่าเป็น นศ. ในวิชานี้
      return tasksInSub.some(task => {
        const isYearMatch = task.academicYear === 'ทั้งหมด' || task.academicYear === u.academicYear;
        const isMajorMatch = task.targetMajor === 'ALL' || (u.major || 'เทคโนโลยีสารสนเทศ (IT)') === task.targetMajor;
        return isYearMatch && isMajorMatch;
      });
    });
  } else {
    // Student ดูเฉพาะตัวเอง
    const me = allUsers.find(u => u.email === user.email);
    if (me) targetStudents = [me];
  }

  // เรียงลำดับนักศึกษา (ถ้ามีหลายคน)
  targetStudents.sort((a, b) => a.firstName.localeCompare(b.firstName));

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="p-8 border-b border-slate-200 relative flex items-center justify-center">
        <button onClick={() => { setSelectedSubject(null); setExpandedStudent(null); }} className="absolute left-8 text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg> ย้อนกลับไปหน้ารวมวิชา
        </button>
        <h3 className="text-2xl font-bold text-slate-800 text-center">{selectedSubject}</h3>
      </div>
      
      <div className="p-0">
        {targetStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-500">ไม่พบนักศึกษาในรายวิชานี้</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-slate-700 text-sm border-b border-slate-200">
                  <th className="p-5 font-bold w-1/4">นักศึกษา</th>
                  <th className="p-5 font-bold text-center w-1/4">คะแนนสะสม (ได้ / เต็ม)</th>
                  <th className="p-5 font-bold text-center w-1/4">คิดเป็นเปอร์เซ็นต์ (%)</th>
                  <th className="p-5 font-bold text-center w-1/4">เกรดสะสม</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {targetStudents.map((studentUser) => {
                  const stats = getStudentSubjectStats(studentUser, selectedSubject);
                  const isExpanded = expandedStudent === studentUser.email;

                  return (
                    <React.Fragment key={studentUser.email}>
                      <tr 
                        className={`border-b border-slate-100 hover:bg-indigo-50/50 transition-colors duration-150 cursor-pointer ${isExpanded ? 'bg-indigo-50/50' : ''}`}
                        onClick={() => setExpandedStudent(isExpanded ? null : studentUser.email)}
                      >
                        <td className="p-5 font-medium text-slate-800 flex items-center gap-3">
                          <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90 text-indigo-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                          <div>
                            <p className="font-bold text-base text-slate-900">{studentUser.firstName} {studentUser.lastName}</p>
                            <p className="text-xs text-slate-500">{studentUser.academicYear} • {studentUser.major || 'IT'}</p>
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex items-center justify-center gap-1 font-bold text-lg">
                            <span className={stats.totalEarnedScore >= stats.totalMaxScore * 0.8 ? 'text-emerald-600' : 'text-slate-700'}>{stats.totalEarnedScore}</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-600">{stats.totalMaxScore}</span>
                          </div>
                        </td>
                        <td className="p-5 text-center font-bold text-slate-700">
                          {stats.percentage}%
                        </td>
                        <td className="p-5 text-center">
                          <span className={`font-bold text-lg ${
                            stats.grade === 'A' ? 'text-emerald-600' : 
                            stats.grade === 'F' ? 'text-red-600' : 
                            'text-indigo-600'
                          }`}>
                            {stats.grade}
                          </span>
                        </td>
                      </tr>
                      {/* ส่วนขยาย (Expandable) แสดงรายละเอียดแต่ละงาน */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan="4" className="p-0">
                            <div className="px-14 py-6">
                              <h5 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                รายละเอียดคะแนนรายชิ้นงาน
                              </h5>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {stats.taskDetails.map((task, idx) => (
                                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                                    <div>
                                      <p className="font-semibold text-slate-800 text-sm">{task.taskTitle}</p>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 inline-block ${
                                        task.statusLabel === 'ยังไม่ส่ง' ? 'bg-red-100 text-red-600' :
                                        task.statusLabel === 'ตรวจแล้ว' ? 'bg-emerald-100 text-emerald-600' :
                                        'bg-amber-100 text-amber-600'
                                      }`}>{task.statusLabel}</span>
                                    </div>
                                    <div className="text-right flex items-baseline gap-1">
                                      <span className="text-lg font-black text-indigo-600">{task.earnedScore}</span>
                                      <span className="text-sm font-semibold text-slate-400">/ {task.maxScore}</span>
                                    </div>
                                  </div>
                                ))}
                                {stats.taskDetails.length === 0 && (
                                  <div className="col-span-2 text-center text-sm text-slate-500 p-4 border border-dashed border-slate-300 rounded-xl">
                                    ยังไม่มีการมอบหมายงานในวิชานี้สำหรับนักศึกษาคนนี้
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
