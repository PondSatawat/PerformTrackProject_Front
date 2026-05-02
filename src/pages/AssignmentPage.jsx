import { StudentSubmitCard, TeacherGradeCard } from '../component/assignmentcard.jsx';

export default function AssignmentPage({
  currentRole, user, userName, profileData,
  allUsers,
  todoTasks, submittedTasks,
  teacherAssigned, teacherPendingGrade, teacherGraded,
  selectedTask, setSelectedTask,
  selectedAssignment, setSelectedAssignment,
  selectedSubject, setSelectedSubject,
  searchStudent, setSearchStudent, filterStudent, setFilterStudent,
  uniqueStudents,
  setShowCreateModal,
  openEditModal, handleDeleteAssignment,
  fetchAssignments
}) {

  // Processing the filtered pending grade as it was in App.jsx
  const filteredPendingGrade = filterStudent === 'ALL' ? teacherPendingGrade : teacherPendingGrade.filter(a => a.studentName === filterStudent);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">จัดการการมอบหมายงาน/การสอบ</h3>
          <p className="text-slate-500 mt-1">เลือกงานเพื่อดูรายละเอียดเพิ่มเติม</p>
        </div>
        {currentRole === 'TEACHER' && (
          <button onClick={() => setShowCreateModal(true)} className="bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold shadow-sm hover:bg-indigo-800 active:bg-indigo-900 transition duration-200">+ มอบหมายงานใหม่</button>
        )}
      </div>

      <div className={`grid grid-cols-1 gap-6 ${(currentRole === 'TEACHER' ? selectedAssignment : selectedTask) ? 'xl:grid-cols-[380px_1fr]' : 'xl:grid-cols-1 max-w-4xl'}`}>
        {/* คอลัมน์ซ้าย: รายการวิชา และ รายการงาน */}
        <div className="bg-white/90 border border-sky-100 rounded-3xl shadow-sm p-5 h-fit">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-lg font-semibold text-slate-800">รายการงาน</h4>
            <span className="text-xs text-slate-500">คลิกดูรายละเอียด</span>
          </div>

          {currentRole === 'TEACHER' ? (
            !selectedSubject ? (
              <div className="space-y-3">
                {(() => {
                  const subs = [...new Set(teacherAssigned.map(a => a.subject).filter(Boolean))];
                  if(subs.length === 0) return <p className="text-slate-500">ยังไม่มีรายวิชาที่รับผิดชอบ</p>;
                  return subs.map(sub => (
                    <button key={sub} onClick={() => setSelectedSubject(sub)} className="w-full text-left p-5 rounded-2xl transition-all duration-200 border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 group shadow-sm">
                      <p className="text-slate-900 font-bold text-lg group-hover:text-indigo-700">{sub}</p>
                      <p className="text-xs text-slate-500 mt-1">คลิกเพื่อดูงานทั้งหมดในวิชานี้</p>
                    </button>
                  ));
                })()}
              </div>
            ) : (
              <div>
                <button onClick={() => {setSelectedSubject(null); setSelectedAssignment(null);}} className="text-sm text-indigo-600 hover:text-indigo-800 font-bold mb-4 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg> ย้อนกลับไปหน้ารายวิชา</button>
                <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">วิชา: {selectedSubject}</h4>
                <div className="space-y-3">
                  {teacherAssigned.filter(a => a.subject === selectedSubject).map((task) => (
                    <button key={task.id} onClick={() => { setSelectedAssignment(selectedAssignment?.id === task.id ? null : task); setSelectedTask(null); }} className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${selectedAssignment?.id === task.id ? 'border border-indigo-300 bg-indigo-50 shadow-md ring-2 ring-indigo-100' : 'border border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-slate-900 font-semibold">{task.taskTitle}</p>
                          <p className="text-xs text-slate-500 mt-1">{task.academicYear} • {task.taskType || 'งานทั่วไป'}</p>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-semibold text-slate-600">เปิด: {task.openDate ? task.openDate.replace('T', ' ') : '-'}</span>
                          <span className="block text-xs font-semibold text-red-500 mt-1">ปิด: {task.dueDate ? task.dueDate.replace('T', ' ') : '-'}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : (
            !selectedSubject ? (
              <div className="space-y-3">
                {(() => {
                  const todoSubs = [...new Set(todoTasks.map(a => a.subject).filter(Boolean))];
                  const submitSubs = [...new Set(submittedTasks.map(a => a.subject).filter(Boolean))];
                  const allSubs = [...new Set([...todoSubs, ...submitSubs])];
                  if(allSubs.length === 0) return <p className="text-slate-500">ไม่มีรายวิชาที่ต้องส่งงาน</p>;
                  return allSubs.map(sub => {
                    const sampleTask = [...todoTasks, ...submittedTasks].find(a => a.subject === sub);
                    return (
                      <button key={sub} onClick={() => setSelectedSubject(sub)} className="w-full text-left p-5 rounded-2xl transition-all duration-200 border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 group shadow-sm">
                        <p className="text-slate-900 font-bold text-lg group-hover:text-indigo-700">{sub}</p>
                        <p className="text-sm text-slate-600 mt-1">อาจารย์ผู้สอน: {sampleTask?.teacherName || '-'}</p>
                      </button>
                    );
                  });
                })()}
              </div>
            ) : (
              <div>
                <button onClick={() => {setSelectedSubject(null); setSelectedTask(null);}} className="text-sm text-indigo-600 hover:text-indigo-800 font-bold mb-4 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg> ย้อนกลับไปหน้ารายวิชา</button>
                <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">วิชา: {selectedSubject}</h4>
                <div className="space-y-3">
                  {todoTasks.filter(a => a.subject === selectedSubject).map((task) => (
                    <button key={task.id} onClick={() => { setSelectedTask(selectedTask?.id === task.id ? null : task); setSelectedAssignment(null); }} className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${selectedTask?.id === task.id ? 'border border-indigo-300 bg-indigo-50 shadow-md ring-2 ring-indigo-100' : 'border border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-slate-900 font-semibold">{task.taskTitle}</p>
                          <p className="text-xs text-slate-500 mt-1">{task.taskType || 'งานทั่วไป'}</p>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-semibold text-slate-600">เปิด: {task.openDate ? task.openDate.replace('T', ' ') : '-'}</span>
                          <span className="block text-xs font-semibold text-red-500 mt-1">ปิด: {task.dueDate ? task.dueDate.replace('T', ' ') : '-'}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                  {submittedTasks.filter(a => a.subject === selectedSubject).length > 0 && (
                     <div className="mt-6 pt-4 border-t border-slate-200">
                       <h5 className="text-sm font-semibold text-slate-700 mb-3">งานที่ส่งแล้ว</h5>
                       <div className="space-y-3">
                         {submittedTasks.filter(a => a.subject === selectedSubject).map((task) => (
                            <button key={task.id} onClick={() => { setSelectedTask(selectedTask?.id === task.id ? null : task); setSelectedAssignment(null); }} className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${selectedTask?.id === task.id ? 'border border-indigo-300 bg-indigo-50 shadow-md ring-2 ring-indigo-100' : 'border border-slate-200 bg-white hover:bg-slate-50'}`}>
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-slate-900 font-semibold">{task.taskTitle}</p>
                                  <p className="text-xs text-slate-500 mt-1">{task.submissionStatus === 'LATE_SUBMITTED' ? 'ส่งล่าช้า รอตรวจ' : task.submissionStatus === 'SUBMITTED' ? 'ส่งแล้ว รอตรวจ' : 'ส่งแล้ว'}</p>
                                </div>
                                <span className="text-xs font-semibold text-slate-600">ปิด: {task.dueDate ? task.dueDate.replace('T', ' ') : '-'}</span>
                              </div>
                            </button>
                         ))}
                       </div>
                     </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* คอลัมน์ขวา: รายละเอียดของงาน (คลิกแล้วถึงขึ้น) */}
        {(selectedTask || selectedAssignment) && (
          <div className="bg-white/90 border border-sky-100 rounded-3xl shadow-sm p-6 overflow-hidden flex flex-col h-fit">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md mb-2 inline-block">งานที่เลือก</span>
                <h3 className="text-2xl font-bold text-slate-800">{(selectedTask || selectedAssignment).taskTitle}</h3>
                <p className="text-sm text-slate-500 mt-1">{(selectedTask || selectedAssignment).subject} • {(selectedTask || selectedAssignment).academicYear} • {(selectedTask || selectedAssignment).taskType || 'งานทั่วไป'}</p>
                <div className="flex flex-col gap-1 mt-3">
                  <span className="text-sm font-semibold text-indigo-600">เปิดรับงาน: {(selectedTask || selectedAssignment).openDate ? (selectedTask || selectedAssignment).openDate.replace('T', ' ') : '-'}</span>
                  <span className="text-sm font-semibold text-red-600">ปิดรับงาน: {(selectedTask || selectedAssignment).dueDate ? (selectedTask || selectedAssignment).dueDate.replace('T', ' ') : '-'}</span>
                </div>
              </div>
              {currentRole === 'TEACHER' && (
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(selectedAssignment)} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-200 transition">แก้ไข</button>
                  <button onClick={() => handleDeleteAssignment(selectedAssignment)} className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-200 transition">ลบ</button>
                </div>
              )}
            </div>
            
            <div className="mb-6 bg-slate-50 p-4 rounded-xl">
              <p className="text-sm text-slate-700 whitespace-pre-line">{(selectedTask || selectedAssignment).taskDescription}</p>
            </div>

            {currentRole === 'STUDENT' && selectedTask && (
              <div className="border-t border-slate-200 pt-6 mt-2">
                <h4 className="text-base font-bold text-slate-800 mb-4">ส่งงาน</h4>
                <StudentSubmitCard 
                  task={selectedTask} 
                  userName={userName} 
                  userEmail={user.email} 
                  refresh={() => {
                    fetchAssignments(user, currentRole, profileData.academicYear, userName); 
                    setSelectedTask(null); 
                  }} 
                />
              </div>  
            )}

            {currentRole === 'TEACHER' && selectedAssignment && (
              <div className="border-t border-slate-200 pt-6 mt-2 flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <h4 className="text-base font-bold text-slate-800">สถานะการส่งงานของนักศึกษา</h4>
                  <div className="w-full md:w-auto">
                    <input type="text" placeholder="ค้นหาชื่อนักศึกษา..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                  {(() => {
                    // Logic คัดกรองนักศึกษาที่เกี่ยวข้องกับงานนี้
                    const targetStudents = allUsers.filter(u => {
                      if (u.role !== 'STUDENT') return false;
                      const isYearMatch = selectedAssignment.academicYear === 'ทั้งหมด' || u.academicYear === selectedAssignment.academicYear;
                      const isMajorMatch = selectedAssignment.targetMajor === 'ALL' || (u.major || 'เทคโนโลยีสารสนเทศ (IT)') === selectedAssignment.targetMajor;
                      return isYearMatch && isMajorMatch;
                    });
                    
                    const filteredTargetStudents = targetStudents.filter(s => {
                      const name = `${s.firstName} ${s.lastName}`;
                      return name.toLowerCase().includes(searchStudent.toLowerCase());
                    });

                    if (filteredTargetStudents.length === 0) {
                      return <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300"><p className="text-slate-500 text-sm">ไม่พบนักศึกษา</p></div>;
                    }

                    return filteredTargetStudents.map(student => {
                      const fullName = `${student.firstName} ${student.lastName}`;
                      // หารายการที่ส่งแล้วจากตาราง assignment (ดูจาก teacherPendingGrade และ teacherGraded)
                      const allSubmissions = [...teacherPendingGrade, ...teacherGraded];
                      const submission = allSubmissions.find(s => s.taskTitle === selectedAssignment.taskTitle && s.studentId === student.email);

                      if (submission) {
                        return <TeacherGradeCard key={submission.id} task={submission} refresh={() => fetchAssignments(user, currentRole, profileData.academicYear, userName)} />;
                      } else {
                        // ยังไม่ส่ง
                        const isLate = selectedAssignment.dueDate && new Date() > new Date(selectedAssignment.dueDate);
                        return (
                          <div key={student.email} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center opacity-70">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800">{selectedAssignment.taskTitle}</h3>
                              <p className="text-xs text-slate-600">นักศึกษา: <span className="font-semibold text-slate-700">{fullName}</span></p>
                            </div>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${isLate ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-slate-200 text-slate-500 border border-slate-300'}`}>
                              {isLate ? 'เลยกำหนด (ยังไม่ส่ง)' : 'ยังไม่ส่งงาน'}
                            </span>
                          </div>
                        );
                      }
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
