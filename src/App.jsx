import { useState, useEffect } from 'react';
import { auth, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 🌟 Import Components ที่เราแยกไว้ 🌟
import AuthPage from './pages/login.jsx';
import { StudentSubmitCard, TeacherGradeCard } from './component/assignmentcard.jsx';
import { ToastProvider, useToast } from './component/Toast.jsx';

function AppContent() {
  const { showToast, showConfirm } = useToast();
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(''); 
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', academicYear: '', major: '', role: '' });
  const [currentRole, setCurrentRole] = useState('STUDENT'); 
  const [assignments, setAssignments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  // States สำหรับอาจารย์
  const [showCreateModal, setShowCreateModal] = useState(false); 
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskOpenDate, setNewTaskOpenDate] = useState('');
  const [targetClass, setTargetClass] = useState(''); 
  const [newTaskType, setNewTaskType] = useState(''); 
  const [filterStudent, setFilterStudent] = useState('ALL'); 
  const [searchStudent, setSearchStudent] = useState('');
  const [targetMajor, setTargetMajor] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await refreshUserData(currentUser);
        setUser(currentUser);
        fetchAllUsers();
      } else { setUser(null); }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/users');
      if (res.ok) setAllUsers(await res.json());
    } catch (error) { console.error("Error fetching all users:", error); }
  };

  const refreshUserData = async (currentUser) => {
    try {
      const res = await fetch(`http://localhost:8080/api/users/uid/${currentUser.uid}`);
      if (res.ok) {
        const userData = await res.json();
        if (userData) {
          // 🌟 สร้างตัวแปรเก็บชื่อตรงนี้เลย เพื่อให้ส่งไป fetch ได้ทันที 🌟
          const fullName = `${userData.firstName} ${userData.lastName}`;
          
          setCurrentRole(userData.role);
          setUserName(fullName);
          setProfileData(prev => ({...prev, ...userData}));
          
          // ส่ง fullName เข้าไปตรงๆ แทนการใช้ userName ที่ยังอัปเดตไม่เสร็จ
          fetchAssignments(currentUser, userData.role, userData.academicYear, fullName);
        }
      }
    } catch (error) { console.error("Error fetching user:", error); }
  };

  // 🌟 รับค่า currentUserName เพิ่มเข้ามา 🌟
  const fetchAssignments = (currentUser, role, userYear, currentUserName) => {
    fetch('http://localhost:8080/api/assignments')
      .then(res => res.json())
      .then(data => {
        if (role === 'STUDENT') {
          setAssignments(data.filter(a => a.studentId === currentUser.email || a.academicYear === userYear || a.academicYear === 'ทั้งหมด'));
        } else {
          // กรองงานด้วย currentUserName ไม่ใช่ state userName
          setAssignments(data.filter(a => a.teacherName === currentUserName));
        }
      });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const res = await fetch(`http://localhost:8080/api/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        firebaseUid: user.uid, email: user.email, firstName: profileData.firstName, lastName: profileData.lastName,
        academicYear: profileData.academicYear, major: profileData.major, role: profileData.role
      })
    });
    if (res.ok) { showToast('อัปเดตข้อมูลสำเร็จ!', 'success'); refreshUserData(user); }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    const newAssignment = {
      studentId: 'ALL_CLASS', studentName: `นักศึกษา ${targetClass} (${targetMajor})`, academicYear: targetClass, targetMajor: targetMajor,
      taskTitle: newTaskTitle, taskDescription: newTaskDesc, teacherName: userName,
      submissionStatus: 'ASSIGNED', openDate: newTaskOpenDate, dueDate: newTaskDueDate, taskType: newTaskType,
      subject: newTaskSubject || 'งานทั่วไป'
    };
    const res = await fetch('http://localhost:8080/api/assignments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAssignment)
    });
    if (res.ok) {
      showToast(`มอบหมายรายการให้ ${targetClass} (${targetMajor}) สำเร็จ!`, 'success');
      setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskDueDate(''); setNewTaskOpenDate(''); setNewTaskSubject('');
      setShowCreateModal(false); refreshUserData(user);
    }
  };

  const handleDeleteAssignment = async (task) => {
    showConfirm(`คุณต้องการลบงาน "${task.taskTitle}" หรือไม่?`, async () => {
      const res = await fetch(`http://localhost:8080/api/assignments/${task.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('ลบงานสำเร็จ!', 'success');
        setSelectedAssignment(null);
        refreshUserData(user);
      }
    });
  };

  const openEditModal = (task) => {
    setEditTask({ ...task });
    setShowEditModal(true);
  };

  const handleEditAssignment = async (e) => {
    e.preventDefault();
    const res = await fetch(`http://localhost:8080/api/assignments/${editTask.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editTask)
    });
    if (res.ok) {
      showToast('แก้ไขงานสำเร็จ!', 'success');
      setShowEditModal(false);
      setEditTask(null);
      setSelectedAssignment(null);
      refreshUserData(user);
    }
  };

  const calculateGrade = (score) => {
    if (score === null || score === undefined || score === '') return '-';
    const s = parseFloat(score);
    if (s >= 80) return 'A'; if (s >= 75) return 'B+'; if (s >= 70) return 'B';
    if (s >= 65) return 'C+'; if (s >= 60) return 'C'; if (s >= 55) return 'D+';
    if (s >= 50) return 'D'; return 'F';
  };

  // SVG Icons
  const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>);
  const ClipboardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>);
  const ChartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>);
  const SettingIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.754 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
  const AcademicIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">กำลังโหลด...</div>;

  if (!user) {
    return <AuthPage />;
  }

  // ---------------- Data Processing ----------------
  let todoTasks = [];
  let submittedTasks = [];
  let teacherAssigned = [];
  let teacherPendingGrade = [];
  let teacherGraded = [];
  let uniqueStudents = []; 

  if (currentRole === 'STUDENT') {
    const mySubmissions = assignments.filter(a => a.studentId === user.email);
    const submittedTitles = mySubmissions.map(a => a.taskTitle);
    todoTasks = assignments.filter(a => a.studentId === 'ALL_CLASS' && !submittedTitles.includes(a.taskTitle));
    submittedTasks = mySubmissions;
  } else {
    teacherAssigned = assignments.filter(a => a.studentId === 'ALL_CLASS');
    const allStudentSubmissions = assignments.filter(a => a.studentId !== 'ALL_CLASS' && a.submissionStatus !== 'ASSIGNED');
    teacherPendingGrade = allStudentSubmissions.filter(a => a.submissionStatus === 'SUBMITTED');
    teacherGraded = allStudentSubmissions.filter(a => a.submissionStatus === 'GRADED');
    
    const studentSet = new Set(allStudentSubmissions.map(a => a.studentName));
    uniqueStudents = Array.from(studentSet).filter(Boolean);
  }

  const filteredPendingGrade = filterStudent === 'ALL' ? teacherPendingGrade : teacherPendingGrade.filter(a => a.studentName === filterStudent);

  const scoreChartData = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'].map((year) => {
    const scores = assignments
      .filter(a => a.academicYear === year && a.score !== null && a.score !== undefined && a.score !== '')
      .map(a => parseFloat(a.score));
    const average = scores.length ? Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1)) : 0;
    return { year, average, submissions: scores.length };
  });

  const menuItems = [
    { name: 'Home', icon: <HomeIcon /> },
    { name: 'Assignment', icon: <ClipboardIcon /> },
    { name: 'Reporting', icon: <ChartIcon /> }
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* Modal อาจารย์สร้างงาน */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-white border-b border-slate-200 p-8 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-slate-800">มอบหมายงาน / การสอบ</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors duration-200"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="p-10">
              <form onSubmit={handleCreateAssignment} className="space-y-4">
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
                  
                  <div className="w-full">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">หัวข้อโปรเจกต์/งาน/ชื่อการสอบ:</label>
                    <input type="text" placeholder="พิมพ์ชื่อหัวข้อ..." className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-sm" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
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
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all duration-200 text-sm">ยกเลิก</button>
                  <button type="submit" className="px-6 py-2 bg-indigo-700 text-white font-bold rounded-xl hover:bg-indigo-800 active:bg-indigo-900 transition-all duration-200 shadow hover:shadow-md text-sm">มอบหมายงาน</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal แก้ไขงาน */}
      {showEditModal && editTask && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-white border-b border-slate-200 p-8 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-slate-800">แก้ไขงาน</h3>
              <button onClick={() => { setShowEditModal(false); setEditTask(null); }} className="text-slate-400 hover:text-slate-600 transition-colors duration-200"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="p-10">
              <form onSubmit={handleEditAssignment} className="space-y-4">
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
                  
                  <div className="w-full">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">หัวข้อโปรเจกต์/งาน/ชื่อการสอบ:</label>
                    <input type="text" placeholder="พิมพ์ชื่อหัวข้อ..." className="w-full px-3 h-10 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 text-sm" value={editTask.taskTitle || ''} onChange={(e) => setEditTask({...editTask, taskTitle: e.target.value})} required />
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
                  <button type="button" onClick={() => { setShowEditModal(false); setEditTask(null); }} className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all duration-200 text-sm">ยกเลิก</button>
                  <button type="submit" className="px-6 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 active:bg-amber-800 transition-all duration-200 shadow hover:shadow-md text-sm">บันทึกการแก้ไข</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar เมนูด้านซ้าย */}
      <aside className="w-64 bg-gradient-to-b from-white to-slate-50 shadow-xl flex flex-col z-20 border-r border-slate-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 font-bold text-xl text-slate-800 bg-gradient-to-r from-indigo-50 to-blue-50">
          <AcademicIcon /> <span className="ml-2">PerformTrack</span>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <button key={item.name} onClick={() => setActiveTab(item.name)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${activeTab === item.name ? 'bg-white/70 border border-sky-200 text-slate-900 font-semibold shadow-sm' : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'}`}>
              {item.icon} {item.name}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4 border-t border-slate-200 bg-slate-50/50">
          <button onClick={() => setActiveTab('Settings')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${activeTab === 'Settings' ? 'bg-white/70 border border-sky-200 text-slate-900 font-semibold shadow-sm' : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'}`}>
            <SettingIcon /> Settings
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full">
        <header className="h-16 bg-white shadow-md flex items-center justify-between px-8 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">{activeTab}</h2>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{userName}</p>
              <p className="text-xs text-indigo-600 font-medium">{currentRole} {currentRole === 'STUDENT' ? ` - ${profileData.academicYear}` : ''}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center font-bold shadow-lg">{userName.charAt(0).toUpperCase()}</div>
            <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors duration-200">Logout</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            
            {activeTab === 'Home' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white/80 border border-sky-100 text-slate-900 p-8 rounded-3xl shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
                    <p className="text-slate-500 text-sm font-medium mb-2">รวมยอดงานทั้งหมด</p>
                    <h3 className="text-5xl font-extrabold">{currentRole === 'STUDENT' ? (todoTasks.length + submittedTasks.length) : teacherAssigned.length} <span className="text-lg font-medium text-slate-500">รายการ</span></h3>
                  </div>
                  <div className="bg-white/80 border border-sky-100 text-slate-900 p-8 rounded-3xl shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
                    <p className="text-slate-500 text-sm font-medium mb-2">{currentRole === 'STUDENT' ? 'งานที่ส่งแล้ว' : 'งานที่ตรวจแล้ว'}</p>
                    <h3 className="text-5xl font-extrabold">{currentRole === 'STUDENT' ? submittedTasks.length : teacherGraded.length} <span className="text-lg font-medium text-slate-500">รายการ</span></h3>
                  </div>
                  <div className="bg-white/80 border border-sky-100 text-slate-900 p-8 rounded-3xl shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
                    <p className="text-slate-500 text-sm font-medium mb-2">{currentRole === 'STUDENT' ? 'งานที่ต้องทำ (To Do)' : 'งานที่รอตรวจ'}</p>
                    <h3 className="text-5xl font-extrabold">{currentRole === 'STUDENT' ? todoTasks.length : teacherPendingGrade.length} <span className="text-lg font-medium text-slate-500">รายการ</span></h3>
                  </div>
                </div>

                <div className="bg-white/90 border border-sky-100 rounded-3xl shadow-sm p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">ผลคะแนนเฉลี่ยตามชั้นปี</h3>
                      <p className="text-slate-500 text-sm mt-1">แสดงคะแนนเฉลี่ยของงานที่มีการส่งแล้ว</p>
                    </div>
                    <p className="text-sm text-slate-500">มีข้อมูล {scoreChartData.filter(item => item.submissions > 0).length} ชั้นปี</p>
                  </div>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scoreChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                        <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#475569', fontSize: 12 }} domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}`, 'คะแนนเฉลี่ย']} contentStyle={{ borderRadius: '1rem', border: '1px solid #cbd5e1' }} />
                        <Line type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: '#2563eb' }} activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Settings' && (
              <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate-200">
                <h3 className="text-3xl font-bold mb-8 text-slate-800 border-b border-slate-200 pb-6">ตั้งค่าข้อมูลส่วนตัว</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-8">
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
            )}

            {activeTab === 'Assignment' && (
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
                  <div className="bg-white/90 border border-sky-100 rounded-3xl shadow-sm p-5">
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

                  {(currentRole === 'TEACHER' ? selectedAssignment : selectedTask) && (
                  <div className="bg-white/90 border border-sky-100 rounded-3xl shadow-sm p-6 min-h-[320px]">
                    {currentRole === 'TEACHER' ? (
                        <div className="space-y-6">
                          <div className="rounded-3xl bg-slate-50 p-5 border border-slate-200">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm text-slate-500">งานที่เลือก</p>
                                <h4 className="text-xl font-bold text-slate-900 mt-2">{selectedAssignment.taskTitle}</h4>
                                <p className="text-sm text-slate-500 mt-1">{selectedAssignment.subject} • {selectedAssignment.academicYear} • {selectedAssignment.taskType || 'งานทั่วไป'}</p>
                                <p className="text-sm text-indigo-600 font-medium mt-2">เปิดรับงาน: {selectedAssignment.openDate ? selectedAssignment.openDate.replace('T', ' ') : '-'}</p>
                                <p className="text-sm text-red-600 font-medium mt-1">ปิดรับงาน: {selectedAssignment.dueDate ? selectedAssignment.dueDate.replace('T', ' ') : '-'}</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => openEditModal(selectedAssignment)} className="px-4 py-2 text-sm font-bold rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">แก้ไข</button>
                                <button onClick={() => handleDeleteAssignment(selectedAssignment)} className="px-4 py-2 text-sm font-bold rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors">ลบ</button>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 mt-3">{selectedAssignment.taskDescription}</p>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-3 mt-8">
                              <h5 className="text-lg font-semibold text-slate-800">สถานะการส่งงานของนักศึกษา</h5>
                              <input type="text" placeholder="ค้นหาชื่อนักศึกษา..." className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400 w-64 bg-slate-50 focus:bg-white transition" value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} />
                            </div>
                            {(() => {
                               const targetClass = selectedAssignment.academicYear;
                               const targetMaj = selectedAssignment.targetMajor || 'ALL';
                               
                               let targetStudents = allUsers.filter(u => u.role === 'STUDENT');
                               if (targetClass !== 'ทั้งหมด') targetStudents = targetStudents.filter(u => u.academicYear === targetClass);
                               if (targetMaj !== 'ALL') targetStudents = targetStudents.filter(u => (u.major || 'เทคโนโลยีสารสนเทศ (IT)') === targetMaj);
                               
                               if (searchStudent) {
                                 const q = searchStudent.toLowerCase();
                                 targetStudents = targetStudents.filter(u => 
                                   (u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q))
                                 );
                               }
                               
                               const taskSubmissions = assignments.filter(a => a.studentId !== 'ALL_CLASS' && a.taskTitle === selectedAssignment.taskTitle);
                               
                               const studentStatusList = targetStudents.map(student => {
                                  const submission = taskSubmissions.find(sub => sub.studentId === student.email);
                                  return { student, submission };
                               });

                               if (studentStatusList.length === 0) return <p className="text-slate-500">ไม่พบนักศึกษาในชั้นปีที่กำหนด</p>;

                               return (
                                  <div className="space-y-4">
                                     {studentStatusList.map((item, idx) => (
                                        item.submission ? (
                                           <TeacherGradeCard key={item.submission.id} task={item.submission} refresh={() => fetchAssignments(user, currentRole, profileData.academicYear, userName)} />
                                        ) : (
                                           <div key={idx} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm opacity-60 hover:opacity-100 transition-opacity">
                                              <div className="flex justify-between items-center mb-1">
                                                 <h3 className="text-lg font-bold text-slate-800">{selectedAssignment.taskTitle}</h3>
                                                 <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-600">ยังไม่ส่งงาน</span>
                                              </div>
                                              <p className="text-sm text-indigo-600 mb-2 font-semibold">นักศึกษา: {item.student.firstName} {item.student.lastName}</p>
                                              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm text-center text-slate-500 mt-4">
                                                รอการส่งงานจากนักศึกษา
                                              </div>
                                           </div>
                                        )
                                     ))}
                                  </div>
                               );
                            })()}
                          </div>
                        </div>
                    ) : (
                        <div className="w-full">
                            {selectedTask.studentId === 'ALL_CLASS' ? (
                              <StudentSubmitCard task={selectedTask} userEmail={user.email} userName={userName} refresh={() => { fetchAssignments(user, currentRole, profileData.academicYear, userName); setSelectedTask(null); }} />
                            ) : (
                              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <span className="text-xs font-bold px-2 py-1 bg-slate-200 text-slate-700 rounded-md mb-2 inline-block">{selectedTask.taskType || 'งานทั่วไป'}</span>
                                    <h3 className="text-xl font-bold text-slate-800">{selectedTask.taskTitle}</h3>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-6">{selectedTask.taskDescription}</p>
                                <div className="rounded-xl bg-slate-50 p-5 border border-slate-200">
                                  <p className="text-sm font-semibold text-slate-700">สถานะการส่ง</p>
                                  <p className="text-indigo-600 font-bold mt-1 text-lg">{selectedTask.submissionStatus === 'LATE_SUBMITTED' ? 'ส่งล่าช้า รอตรวจ' : selectedTask.submissionStatus === 'SUBMITTED' ? 'ส่งแล้ว รอตรวจ' : selectedTask.submissionStatus || 'ส่งแล้ว'}</p>
                                  <div className="mt-4 pt-4 border-t border-slate-200">
                                    <p className="text-sm font-semibold text-slate-700">ผลงาน / โน้ตที่ส่ง</p>
                                    <p className="text-slate-600 mt-2 bg-white p-3 rounded-lg border border-slate-100">{selectedTask.studentNote || '-'}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                    )}
                  </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Reporting' && (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-slate-800">ตารางประเมินผล (คะแนนและเกรด)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-900 text-sm">
                        <th className="p-6 font-bold">หัวข้อ/การสอบ</th>
                        <th className="p-6 font-bold">ประเภท</th>
                        <th className="p-6 font-bold">นักศึกษา</th>
                        <th className="p-6 font-bold text-center">คะแนนที่ได้</th>
                        <th className="p-6 font-bold text-center">เกรด</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {(currentRole === 'STUDENT' ? submittedTasks : [...teacherPendingGrade, ...teacherGraded]).map((task) => (
                        <tr key={task.id} className="border-b border-slate-100 hover:bg-white/70 transition-colors duration-150">
                          <td className="p-6 font-medium text-slate-800">
                            {task.taskTitle}
                            {(task.submissionStatus === 'LATE_SUBMITTED' || task.lateSubmission) && (
                              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] rounded-full font-bold">ส่งล่าช้า</span>
                            )}
                          </td>
                          <td className="p-6"><span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold">{task.taskType || 'งานทั่วไป'}</span></td>
                          <td className="p-6 text-slate-600">{task.studentName || task.studentId}</td>
                          <td className="p-6 font-bold text-center text-indigo-600 text-lg">{task.score !== null ? task.score : '-'}</td>
                          <td className="p-6 text-center">
                            <span className={`inline-block px-4 py-2 rounded-full font-black text-sm ${calculateGrade(task.score) === 'A' ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : calculateGrade(task.score) === 'F' ? 'bg-gradient-to-r from-red-400 to-red-500 text-white' : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'}`}>
                              {calculateGrade(task.score)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(currentRole === 'STUDENT' ? submittedTasks : [...teacherPendingGrade, ...teacherGraded]).length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">ไม่มีข้อมูล</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Wrap with ToastProvider
function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;