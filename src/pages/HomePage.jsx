import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function HomePage({
  currentRole, assignments, allUsers,
  todoTasks, submittedTasks,
  teacherAssigned, teacherPendingGrade, teacherGraded,
  scoreChartData, setActiveTab, calculateGrade
}) {
  const now = new Date();

  // ==========================================
  // Logic สำหรับฝั่ง STUDENT
  // ==========================================

  // 1. งานที่ใกล้กำหนดส่ง (เรียงจากใกล้สุด -> ไกลสุด)
  const upcomingDeadlines = todoTasks
    .filter(t => t.dueDate)
    .map(t => {
      const due = new Date(t.dueDate);
      const diffTime = due - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...t, daysLeft: diffDays };
    })
    .filter(t => t.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  // 2. กราฟคะแนน Student: คะแนนที่ได้ vs คะแนนเฉลี่ยเพื่อน ในแต่ละชิ้นงาน
  const studentScoreChartData = (() => {
    if (currentRole !== 'STUDENT') return [];
    // หาวิชาที่ นศ. เรียน
    const allStudentTasks = [...todoTasks, ...submittedTasks];
    const subjects = [...new Set(allStudentTasks.map(a => a.subject).filter(Boolean))];

    const chartData = [];
    subjects.forEach(sub => {
      const tasksInSub = allStudentTasks.filter(a => a.subject === sub);
      // แต่ละงาน
      const uniqueTaskTitles = [...new Set(tasksInSub.map(t => t.taskTitle))];
      uniqueTaskTitles.forEach(taskTitle => {
        const myTask = submittedTasks.find(t => t.taskTitle === taskTitle && t.score !== null && t.score !== undefined && t.score !== '');
        const myScore = myTask ? parseFloat(myTask.score) : null;
        const maxScore = myTask?.maxScore || tasksInSub.find(t => t.taskTitle === taskTitle)?.maxScore || 100;

        // หาคะแนนเฉลี่ยเพื่อนในงานชิ้นนี้
        const allSubmissionsForTask = assignments.filter(a =>
          a.taskTitle === taskTitle &&
          a.studentId !== 'ALL_CLASS' &&
          a.score !== null && a.score !== undefined && a.score !== ''
        );
        const avgOfAll = allSubmissionsForTask.length > 0
          ? allSubmissionsForTask.reduce((sum, a) => sum + parseFloat(a.score), 0) / allSubmissionsForTask.length
          : 0;

        // ชื่อย่อสำหรับแกน X
        const shortTitle = taskTitle.length > 12 ? taskTitle.substring(0, 12) + '...' : taskTitle;

        chartData.push({
          name: shortTitle,
          fullName: taskTitle,
          subject: sub,
          'คะแนนของฉัน': myScore !== null ? parseFloat(myScore.toFixed(1)) : 0,
          'คะแนนเฉลี่ย': parseFloat(avgOfAll.toFixed(1)),
          'คะแนนเต็ม': parseFloat(maxScore)
        });
      });
    });
    return chartData;
  })();

  // ==========================================
  // Logic สำหรับฝั่ง TEACHER
  // ==========================================

  // หาวิชาทั้งหมดของอาจารย์
  const teacherSubjects = [...new Set(teacherAssigned.map(a => a.subject).filter(Boolean))];
  const [selectedChartSubject, setSelectedChartSubject] = useState('');

  // เลือกวิชาแรกถ้ายังไม่ได้เลือก
  const activeSubject = selectedChartSubject || teacherSubjects[0] || '';

  // กราฟ Teacher: คะแนนเฉลี่ยกับคะแนนเต็มของงานแต่ละชิ้นในวิชาที่เลือก
  const teacherScoreChartData = (() => {
    if (currentRole !== 'TEACHER' || !activeSubject) return [];
    const tasksInSub = teacherAssigned.filter(a => a.subject === activeSubject);

    return tasksInSub.map(task => {
      const maxS = task.maxScore !== undefined && task.maxScore !== null ? parseFloat(task.maxScore) : 100;

      // หาคะแนนเฉลี่ยของ นศ. ทุกคนในงานชิ้นนี้
      const allSubmissionsForTask = assignments.filter(a =>
        a.taskTitle === task.taskTitle &&
        a.studentId !== 'ALL_CLASS' &&
        a.score !== null && a.score !== undefined && a.score !== ''
      );
      const avg = allSubmissionsForTask.length > 0
        ? allSubmissionsForTask.reduce((sum, a) => sum + parseFloat(a.score), 0) / allSubmissionsForTask.length
        : 0;

      const shortTitle = task.taskTitle.length > 15 ? task.taskTitle.substring(0, 15) + '...' : task.taskTitle;

      return {
        name: shortTitle,
        fullName: task.taskTitle,
        'คะแนนเฉลี่ย': parseFloat(avg.toFixed(1)),
        'คะแนนเต็ม': maxS
      };
    });
  })();

  // 1. งานที่รอตรวจ (จัดกลุ่มตามชื่องาน)
  const pendingByTask = teacherPendingGrade.reduce((acc, curr) => {
    if (!acc[curr.taskTitle]) acc[curr.taskTitle] = { count: 0, subject: curr.subject };
    acc[curr.taskTitle].count += 1;
    return acc;
  }, {});
  const pendingList = Object.keys(pendingByTask)
    .map(title => ({ title, count: pendingByTask[title].count, subject: pendingByTask[title].subject }))
    .sort((a, b) => b.count - a.count);

  // 2. อัตราการส่งงาน (แต่ละงาน)
  const submissionRates = teacherAssigned.map(task => {
    // คำนวณเป้าหมาย (จำนวนนักศึกษาที่ตรงเงื่อนไข)
    const targetStudents = allUsers.filter(u => {
      if (u.role !== 'STUDENT') return false;
      const matchYear = task.academicYear === 'ทั้งหมด' || u.academicYear === task.academicYear;
      const matchMajor = task.targetMajor === 'ALL' || (u.major || 'เทคโนโลยีสารสนเทศ (IT)') === task.targetMajor;
      return matchYear && matchMajor;
    });

    // จำนวนคนที่ส่งแล้ว
    const submittedCount = assignments.filter(a => a.taskTitle === task.taskTitle && a.studentId !== 'ALL_CLASS' && a.submissionStatus !== 'ASSIGNED').length;
    const targetCount = targetStudents.length;
    const rate = targetCount > 0 ? Math.round((submittedCount / targetCount) * 100) : 0;

    return { title: task.taskTitle, submitted: submittedCount, target: targetCount, rate };
  });

  // 3. นักศึกษาที่ส่งช้า / ไม่ส่ง
  const allStudentSubmissions = [...teacherPendingGrade, ...teacherGraded];
  const lateOrMissingStudents = [];

  teacherAssigned.forEach(task => {
    const isPastDue = task.dueDate && new Date(task.dueDate) < now;

    // คนที่ส่งช้า
    const lateSubmitters = allStudentSubmissions.filter(s => s.taskTitle === task.taskTitle && (s.submissionStatus === 'LATE_SUBMITTED' || s.lateSubmission));
    lateSubmitters.forEach(s => {
      lateOrMissingStudents.push({ name: s.studentName, task: task.taskTitle, status: 'ส่งล่าช้า', type: 'late' });
    });

    // คนที่ไม่ส่ง (ถ้าเลยกำหนดแล้ว)
    if (isPastDue) {
      const targetStudents = allUsers.filter(u => {
        if (u.role !== 'STUDENT') return false;
        const matchYear = task.academicYear === 'ทั้งหมด' || u.academicYear === task.academicYear;
        const matchMajor = task.targetMajor === 'ALL' || (u.major || 'เทคโนโลยีสารสนเทศ (IT)') === task.targetMajor;
        return matchYear && matchMajor;
      });

      targetStudents.forEach(u => {
        const hasSubmitted = allStudentSubmissions.some(s => s.taskTitle === task.taskTitle && s.studentId === u.email);
        if (!hasSubmitted) {
          lateOrMissingStudents.push({ name: `${u.firstName} ${u.lastName}`, task: task.taskTitle, status: 'ยังไม่ส่ง', type: 'missing' });
        }
      });
    }
  });

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-sm">
          <p className="font-bold text-slate-800 mb-2">{data?.fullName || label}</p>
          {payload.map((item, idx) => (
            <p key={idx} style={{ color: item.color }} className="font-semibold text-xs">
              {item.name}: {item.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };


  return (
    <div className="space-y-8">
      {/* การ์ดสรุปยอดด้านบน */}
      <div className={`grid ${currentRole === 'STUDENT' ? 'grid-cols-2' : 'grid-cols-2'} gap-4 md:gap-8`}>
        <div className="bg-white/80 border border-sky-100 text-slate-900 p-8 rounded-3xl shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
          <p className="text-slate-500 text-sm font-medium mb-2">รวมยอดงานทั้งหมด</p>
          <h3 className="text-5xl font-extrabold">{currentRole === 'STUDENT' ? (todoTasks.length + submittedTasks.length) : teacherAssigned.length} <span className="text-lg font-medium text-slate-500">รายการ</span></h3>
        </div>
        <div className="bg-white/80 border border-sky-100 text-slate-900 p-8 rounded-3xl shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
          <p className="text-slate-500 text-sm font-medium mb-2">{currentRole === 'STUDENT' ? 'งานที่ส่งแล้ว' : 'งานที่ตรวจแล้ว'}</p>
          <h3 className="text-5xl font-extrabold">{currentRole === 'STUDENT' ? submittedTasks.length : teacherGraded.length} <span className="text-lg font-medium text-slate-500">รายการ</span></h3>
        </div>
      </div>

      {/* ========== STUDENT SECTION ========== */}
      {currentRole === 'STUDENT' && (
        <div className="space-y-8">
          {/* กราฟใหม่: คะแนนของฉัน vs คะแนนเฉลี่ย vs คะแนนเต็ม */}
          <div className="bg-white/90 border border-sky-100 rounded-3xl shadow-sm p-6">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-800">คะแนนของฉันเทียบกับค่าเฉลี่ย</h3>
              <p className="text-slate-500 text-sm mt-1">แสดงคะแนนที่คุณได้ เทียบกับคะแนนเฉลี่ยของเพื่อนร่วมชั้น และคะแนนเต็มของแต่ละชิ้นงาน</p>
            </div>
            {studentScoreChartData.length > 0 ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentScoreChartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#475569', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Bar dataKey="คะแนนเต็ม" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="คะแนนเฉลี่ย" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="คะแนนของฉัน" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center p-10 text-slate-400 text-sm">ยังไม่มีข้อมูลคะแนน</div>
            )}
          </div>

          {/* งานที่ใกล้กำหนดส่ง */}
          <div className="bg-white/90 border border-sky-100 rounded-3xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">งานที่ใกล้กำหนดส่ง</h3>
            <div className="space-y-3">
              {upcomingDeadlines.length > 0 ? upcomingDeadlines.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <p className="font-semibold text-slate-800">{t.taskTitle}</p>
                    <p className="text-xs text-slate-500">{t.subject}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold ${t.daysLeft <= 3 ? 'bg-red-100 text-red-600' : t.daysLeft <= 7 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    เหลือ {t.daysLeft} วัน
                  </div>
                </div>
              )) : (
                <p className="text-slate-500 text-sm p-4 text-center bg-slate-50 rounded-2xl">ไม่มีงานที่ใกล้กำหนดส่ง</p>
              )}
            </div>
            {upcomingDeadlines.length > 0 && (
              <button onClick={() => setActiveTab('Assignment')} className="mt-4 w-full text-center text-sm text-indigo-600 font-semibold hover:text-indigo-800">ดูงานทั้งหมด &rarr;</button>
            )}
          </div>
        </div>
      )}

      {/* ========== TEACHER SECTION ========== */}
      {currentRole === 'TEACHER' && (
        <div className="space-y-8">
          {/* กราฟใหม่: คะแนนเฉลี่ยกับคะแนนเต็ม แต่ละชิ้นงาน (เลือกวิชาได้) */}
          <div className="bg-white/90 border border-sky-100 rounded-3xl shadow-sm p-6">
            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800">คะแนนเฉลี่ยรายชิ้นงาน</h3>
                <p className="text-slate-500 text-sm mt-1">เปรียบเทียบคะแนนเฉลี่ยของ นศ. กับคะแนนเต็ม</p>
              </div>
              <select
                className="border border-slate-300 rounded-xl px-6 py-2 text-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none min-w-[200px]"
                value={activeSubject}
                onChange={(e) => setSelectedChartSubject(e.target.value)}
              >
                {teacherSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            {teacherScoreChartData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacherScoreChartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#475569', fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Bar dataKey="คะแนนเต็ม" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="คะแนนเฉลี่ย" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center p-10 text-slate-400 text-sm">ยังไม่มีข้อมูลงานในวิชานี้</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Widget 1: งานที่รอตรวจ (ด่วน) */}
            <div className="bg-white/90 border border-sky-100 rounded-3xl shadow-sm p-6 flex flex-col max-h-[400px]">
              <h3 className="text-xl font-bold text-slate-800 mb-4 shrink-0 flex items-center gap-2">งานที่รอตรวจ</h3>
              <div className="space-y-3 overflow-y-auto pr-2 min-h-0">
                {pendingList.length > 0 ? pendingList.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div>
                      <p className="font-semibold text-slate-800 truncate max-w-[200px]" title={p.title}>{p.title}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{p.subject}</p>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-amber-600">{p.count} คน</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm p-4 text-center bg-slate-50 rounded-2xl">ไม่มีงานค้างตรวจ เยี่ยมมาก!</p>
                )}
              </div>
              {pendingList.length > 0 && (
                <button onClick={() => setActiveTab('Assignment')} className="mt-4 shrink-0 w-full text-center text-sm text-indigo-600 font-semibold hover:text-indigo-800">ไปหน้าตรวจงาน &rarr;</button>
              )}
            </div>

            {/* Widget 2: อัตราการส่งงาน */}
            <div className="bg-white/90 border border-sky-100 rounded-3xl shadow-sm p-6 flex flex-col max-h-[400px]">
              <h3 className="text-xl font-bold text-slate-800 mb-4 shrink-0 flex items-center gap-2">อัตราการส่งงานของนักศึกษา</h3>
              <div className="space-y-5 overflow-y-auto pr-2 min-h-0">
                {submissionRates.length > 0 ? submissionRates.map((r, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 truncate w-2/3" title={r.title}>{r.title}</span>
                      <span className="text-indigo-600">{r.submitted}/{r.target} ({r.rate}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full ${r.rate === 100 ? 'bg-emerald-500' : r.rate >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${r.rate}%` }}></div>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm text-center">ยังไม่ได้มอบหมายงาน</p>
                )}
              </div>
            </div>
          </div>

          {/* Widget 3: นศ.ค้างงาน */}
          <div className="bg-white/90 border border-sky-100 rounded-3xl shadow-sm p-6 flex flex-col max-h-[400px]">
            <h3 className="text-xl font-bold text-slate-800 mb-4 shrink-0 flex items-center gap-2">นักศึกษาที่ค้างงาน</h3>
            <div className="space-y-2 overflow-y-auto pr-2 min-h-0">
              {lateOrMissingStudents.length > 0 ? lateOrMissingStudents.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-colors">
                  <div>
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <span className="text-slate-400 mx-2">—</span>
                    <span className="text-xs text-slate-500">{s.task}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${s.type === 'missing' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{s.status}</span>
                </div>
              )) : (
                <p className="text-slate-500 text-sm text-center p-4">ไม่มีนักศึกษาที่ส่งช้า หรือยังไม่ส่ง</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
