import { useState, useEffect } from 'react';
import { auth, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// 🌟 Import Components ที่เราแยกไว้ 🌟
import AuthPage from './pages/login.jsx';
import { StudentSubmitCard, TeacherGradeCard } from './component/assignmentcard.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(''); 
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', academicYear: '', major: '', role: '' });
  const [currentRole, setCurrentRole] = useState('STUDENT'); 
  const [assignments, setAssignments] = useState([]);
  
  // States สำหรับอาจารย์
  const [showCreateModal, setShowCreateModal] = useState(false); 
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [targetClass, setTargetClass] = useState('ปี 3'); 
  const [newTaskType, setNewTaskType] = useState('งานทั่วไป'); 
  const [filterStudent, setFilterStudent] = useState('ALL'); 

  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await refreshUserData(currentUser);
        setUser(currentUser);
      } else { setUser(null); }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
    if (res.ok) { alert("อัปเดตข้อมูลสำเร็จ!"); refreshUserData(user); }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    const newAssignment = {
      studentId: 'ALL_CLASS', studentName: `นักศึกษา ${targetClass}`, academicYear: targetClass,
      taskTitle: newTaskTitle, taskDescription: newTaskDesc, teacherName: userName,
      submissionStatus: 'ASSIGNED', dueDate: newTaskDueDate, taskType: newTaskType 
    };
    const res = await fetch('http://localhost:8080/api/assignments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAssignment)
    });
    if (res.ok) {
      alert(`มอบหมายรายการให้ ${targetClass} สำเร็จ!`);
      setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskDueDate('');
      setShowCreateModal(false); refreshUserData(user);
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

  const menuItems = [
    { name: 'Home', icon: <HomeIcon /> },
    { name: 'Assignment', icon: <ClipboardIcon /> },
    { name: 'Reporting', icon: <ChartIcon /> }
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* Modal อาจารย์สร้างงาน */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">มอบหมายงาน / การสอบ</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-indigo-200 hover:text-white transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">ประเภท:</label>
                    <select className="w-full p-2 border rounded-lg bg-slate-50 outline-none focus:border-indigo-400" value={newTaskType} onChange={(e) => setNewTaskType(e.target.value)}>
                      <option value="งานทั่วไป">งานทั่วไป (Assignment)</option><option value="สอบย่อย">สอบย่อย (Quiz)</option><option value="สอบกลางภาค">สอบกลางภาค (Midterm)</option><option value="สอบปลายภาค">สอบปลายภาค (Final)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">สั่งให้ชั้นปี:</label>
                    <select className="w-full p-2 border rounded-lg bg-slate-50 outline-none focus:border-indigo-400" value={targetClass} onChange={(e) => setTargetClass(e.target.value)}>
                      <option value="ปี 1">ชั้นปีที่ 1</option><option value="ปี 2">ชั้นปีที่ 2</option><option value="ปี 3">ชั้นปีที่ 3</option><option value="ปี 4">ชั้นปีที่ 4</option><option value="ทั้งหมด">นักศึกษาทุกชั้นปี</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase">กำหนดส่ง:</label>
                    <input type="date" className="w-full p-2 border rounded-lg bg-slate-50 outline-none focus:border-indigo-400" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} required />
                  </div>
                </div>
                <input type="text" placeholder="หัวข้อโปรเจกต์/งาน/ชื่อการสอบ" className="w-full p-2 border rounded-lg bg-slate-50 outline-none focus:border-indigo-400" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
                <textarea placeholder="คำอธิบาย/คำสั่ง..." className="w-full p-2 border rounded-lg h-24 bg-slate-50 outline-none focus:border-indigo-400" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} required />
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">ยกเลิก</button>
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">มอบหมายงาน</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar เมนูด้านซ้าย */}
      <aside className="w-64 bg-white shadow-lg flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b font-bold text-xl text-blue-900 bg-indigo-50">
          <AcademicIcon /> <span className="ml-2">PerformTrack</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {menuItems.map((item) => (
            <button key={item.name} onClick={() => setActiveTab(item.name)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === item.name ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
              {item.icon} {item.name}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={() => setActiveTab('Settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'Settings' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
            <SettingIcon /> Settings
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8">
          <h2 className="text-lg font-bold text-slate-800">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{userName}</p>
              <p className="text-xs text-indigo-600 font-semibold">{currentRole} {currentRole === 'STUDENT' ? ` - ${profileData.academicYear}` : ''}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-inner">{userName.charAt(0).toUpperCase()}</div>
            <button onClick={logout} className="ml-4 text-sm font-semibold text-slate-400 hover:text-red-500 transition">Logout</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            
            {activeTab === 'Home' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#5A67D8] text-white p-6 rounded-2xl shadow-md">
                    <p className="text-indigo-100 text-sm font-medium mb-1">รวมยอดงานทั้งหมด</p>
                    <h3 className="text-4xl font-bold">{currentRole === 'STUDENT' ? (todoTasks.length + submittedTasks.length) : teacherAssigned.length} <span className="text-lg font-medium opacity-80">รายการ</span></h3>
                  </div>
                  <div className="bg-[#667EEA] text-white p-6 rounded-2xl shadow-md">
                    <p className="text-indigo-100 text-sm font-medium mb-1">{currentRole === 'STUDENT' ? 'งานที่ส่งแล้ว' : 'งานที่ตรวจแล้ว'}</p>
                    <h3 className="text-4xl font-bold">{currentRole === 'STUDENT' ? submittedTasks.length : teacherGraded.length} <span className="text-lg font-medium opacity-80">รายการ</span></h3>
                  </div>
                  <div className="bg-[#7F9CF5] text-white p-6 rounded-2xl shadow-md">
                    <p className="text-indigo-100 text-sm font-medium mb-1">{currentRole === 'STUDENT' ? 'งานที่ต้องทำ (To Do)' : 'งานที่รอตรวจ'}</p>
                    <h3 className="text-4xl font-bold">{currentRole === 'STUDENT' ? todoTasks.length : teacherPendingGrade.length} <span className="text-lg font-medium opacity-80">รายการ</span></h3>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Settings' && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-4">ตั้งค่าข้อมูลส่วนตัว</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-semibold text-slate-600 mb-2">ชื่อ</label><input type="text" className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500 bg-slate-50" value={profileData.firstName} onChange={(e) => setProfileData({...profileData, firstName: e.target.value})} required /></div>
                    <div><label className="block text-sm font-semibold text-slate-600 mb-2">นามสกุล</label><input type="text" className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500 bg-slate-50" value={profileData.lastName} onChange={(e) => setProfileData({...profileData, lastName: e.target.value})} required /></div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-600 mb-2">สาขาวิชา</label>
                      <select className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500 bg-slate-50" value={profileData.major || 'เทคโนโลยีสารสนเทศ (IT)'} onChange={(e) => setProfileData({...profileData, major: e.target.value})}>
                        <option value="เทคโนโลยีสารสนเทศ (IT)">เทคโนโลยีสารสนเทศ (IT)</option><option value="ปัญญาประดิษฐ์ (AI)">ปัญญาประดิษฐ์ (AI)</option><option value="วิศวกรรมซอฟต์แวร์ (SE)">วิศวกรรมซอฟต์แวร์ (SE)</option><option value="อาจารย์ประจำคณะ">อาจารย์ประจำคณะ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">ชั้นปี</label>
                      <select className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500 bg-slate-50" value={profileData.academicYear} onChange={(e) => setProfileData({...profileData, academicYear: e.target.value})}>
                        <option value="ปี 1">ชั้นปีที่ 1</option><option value="ปี 2">ชั้นปีที่ 2</option><option value="ปี 3">ชั้นปีที่ 3</option><option value="ปี 4">ชั้นปีที่ 4</option><option value="อาจารย์">อาจารย์</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-4"><button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md">บันทึกข้อมูล</button></div>
                </form>
              </div>
            )}

            {activeTab === 'Assignment' && (
              <div className="space-y-6">
                {currentRole === 'TEACHER' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">จัดการการมอบหมายงาน/การสอบ</h3>
                      <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-sm">+ มอบหมายงานใหม่</button>
                    </div>
                    <div className="flex justify-between items-center mt-8 mb-2 border-b pb-4">
                      <h3 className="text-lg font-bold text-slate-700">รอตรวจประเมินผล</h3>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-slate-600">ตรวจสอบรายคน:</label>
                        <select className="border border-slate-300 rounded-lg p-1.5 text-sm bg-white outline-none focus:border-indigo-500 min-w-[200px]" value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}>
                          <option value="ALL">แสดงนักศึกษาทั้งหมด</option>
                          {uniqueStudents.map(studentName => (<option key={studentName} value={studentName}>{studentName}</option>))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredPendingGrade.length === 0 ? <p className="text-slate-500 col-span-2">ไม่มีข้อมูลงานที่รอตรวจ</p> : null}
                      {filteredPendingGrade.map(task => (<TeacherGradeCard key={task.id} task={task} refresh={() => fetchAssignments(user, currentRole, profileData.academicYear, userName)} />))}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold">สิ่งที่ต้องทำสำหรับ {profileData.academicYear}</h3>
                    <div className="grid gap-4">
                      {todoTasks.length === 0 ? <p className="text-slate-500">ไม่มีข้อมูล</p> : null}
                      {todoTasks.map(task => (<StudentSubmitCard key={task.id} task={task} userEmail={user.email} userName={userName} refresh={() => fetchAssignments(user, currentRole, profileData.academicYear, userName)} />))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'Reporting' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800">ตารางประเมินผล (คะแนนและเกรด)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-indigo-50 text-indigo-900 text-sm">
                        <th className="p-4 font-bold">หัวข้อ/การสอบ</th>
                        <th className="p-4 font-bold">ประเภท</th>
                        <th className="p-4 font-bold">นักศึกษา</th>
                        <th className="p-4 font-bold text-center">คะแนนที่ได้</th>
                        <th className="p-4 font-bold text-center">เกรด</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {(currentRole === 'STUDENT' ? submittedTasks : [...teacherPendingGrade, ...teacherGraded]).map((task) => (
                        <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="p-4 font-medium text-slate-800">{task.taskTitle}</td>
                          <td className="p-4"><span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold">{task.taskType || 'งานทั่วไป'}</span></td>
                          <td className="p-4 text-slate-600">{task.studentName || task.studentId}</td>
                          <td className="p-4 font-bold text-center text-indigo-600 text-base">{task.score !== null ? task.score : '-'}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full font-black text-sm ${calculateGrade(task.score) === 'A' ? 'bg-green-100 text-green-700' : calculateGrade(task.score) === 'F' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {calculateGrade(task.score)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(currentRole === 'STUDENT' ? submittedTasks : [...teacherPendingGrade, ...teacherGraded]).length === 0 && <tr><td colSpan="5" className="p-4 text-center text-slate-500">ไม่มีข้อมูล</td></tr>}
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

export default App;