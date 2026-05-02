import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// 🌟 Import Components ที่เราแยกไว้ 🌟
import AuthPage from './pages/login.jsx';
import MainLayout from './component/MainLayout.jsx';
import { CreateAssignmentModal, EditAssignmentModal } from './component/CreateAssignmentModal.jsx';
import HomePage from './pages/HomePage.jsx';
import AssignmentPage from './pages/AssignmentPage.jsx';
import ReportingPage from './pages/ReportingPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
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
  const [newTaskMaxScore, setNewTaskMaxScore] = useState('100'); // ค่าเริ่มต้น 100
  const [targetClass, setTargetClass] = useState('ปี 1');
  const [newTaskType, setNewTaskType] = useState('งานทั่วไป');
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

  useEffect(() => {
    // เมื่อมีการเปลี่ยนเมนู (activeTab เปลี่ยน) ให้ดึงข้อมูลใหม่จากฐานข้อมูล
    if (user) {
      refreshUserData(user);
      fetchAllUsers();
    }
  }, [activeTab]);

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('https://performtrackproject-back.onrender.com/api/users');
      if (res.ok) setAllUsers(await res.json());
    } catch (error) { console.error("Error fetching all users:", error); }
  };

  const refreshUserData = async (currentUser) => {
    try {
      const res = await fetch(`https://performtrackproject-back.onrender.com/api/users/uid/${currentUser.uid}`);
      if (res.ok) {
        const userData = await res.json();
        if (userData) {
          const fullName = `${userData.firstName} ${userData.lastName}`;
          setCurrentRole(userData.role);
          setUserName(fullName);
          setProfileData(prev => ({ ...prev, ...userData }));
          fetchAssignments(currentUser, userData.role, userData.academicYear, fullName);
        }
      }
    } catch (error) { console.error("Error fetching user:", error); }
  };

  const fetchAssignments = (currentUser, role, userYear, currentUserName) => {
    fetch('https://performtrackproject-back.onrender.com/api/assignments')
      .then(res => res.json())
      .then(data => {
        if (role === 'STUDENT') {
          setAssignments(data.filter(a => a.studentId === currentUser.email || a.academicYear === userYear || a.academicYear === 'ทั้งหมด'));
        } else {
          setAssignments(data.filter(a => a.teacherName === currentUserName));
        }
      });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const res = await fetch(`https://performtrackproject-back.onrender.com/api/users`, {
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
      subject: newTaskSubject || 'งานทั่วไป', maxScore: parseFloat(newTaskMaxScore) || 100
    };
    const res = await fetch('https://performtrackproject-back.onrender.com/api/assignments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAssignment)
    });
    if (res.ok) {
      showToast(`มอบหมายรายการให้ ${targetClass} (${targetMajor}) สำเร็จ!`, 'success');
      setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskDueDate(''); setNewTaskOpenDate(''); setNewTaskSubject(''); setNewTaskMaxScore('100');
      setShowCreateModal(false); refreshUserData(user);
    }
  };

  const handleDeleteAssignment = async (task) => {
    showConfirm(`คุณต้องการลบงาน "${task.taskTitle}" หรือไม่?`, async () => {
      const res = await fetch(`https://performtrackproject-back.onrender.com/api/assignments/${task.id}`, { method: 'DELETE' });
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
    const res = await fetch(`https://performtrackproject-back.onrender.com/api/assignments/${editTask.id}`, {
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

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">กำลังโหลด...</div>;
  if (!user) return <AuthPage />;

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
    teacherPendingGrade = allStudentSubmissions.filter(a => a.submissionStatus === 'SUBMITTED' || a.submissionStatus === 'LATE_SUBMITTED');
    teacherGraded = allStudentSubmissions.filter(a => a.submissionStatus === 'GRADED');

    const studentSet = new Set(allStudentSubmissions.map(a => a.studentName));
    uniqueStudents = Array.from(studentSet).filter(Boolean);
  }

  const scoreChartData = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'].map((year) => {
    const scores = assignments
      .filter(a => a.academicYear === year && a.score !== null && a.score !== undefined && a.score !== '')
      .map(a => parseFloat(a.score));
    const average = scores.length ? Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1)) : 0;
    return { year, average, submissions: scores.length };
  });

  return (
    <>
      <CreateAssignmentModal
        show={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={handleCreateAssignment}
        newTaskTitle={newTaskTitle} setNewTaskTitle={setNewTaskTitle}
        newTaskDesc={newTaskDesc} setNewTaskDesc={setNewTaskDesc}
        newTaskDueDate={newTaskDueDate} setNewTaskDueDate={setNewTaskDueDate}
        newTaskOpenDate={newTaskOpenDate} setNewTaskOpenDate={setNewTaskOpenDate}
        newTaskMaxScore={newTaskMaxScore} setNewTaskMaxScore={setNewTaskMaxScore}
        newTaskType={newTaskType} setNewTaskType={setNewTaskType}
        newTaskSubject={newTaskSubject} setNewTaskSubject={setNewTaskSubject}
        targetClass={targetClass} setTargetClass={setTargetClass}
        targetMajor={targetMajor} setTargetMajor={setTargetMajor}
      />

      <EditAssignmentModal
        show={showEditModal} onClose={() => { setShowEditModal(false); setEditTask(null); }}
        onSubmit={handleEditAssignment} editTask={editTask} setEditTask={setEditTask}
      />

      <MainLayout
        activeTab={activeTab} setActiveTab={setActiveTab}
        userName={userName} currentRole={currentRole} profileData={profileData}
      >
        {activeTab === 'Home' && (
          <HomePage
            currentRole={currentRole} assignments={assignments} allUsers={allUsers}
            todoTasks={todoTasks} submittedTasks={submittedTasks}
            teacherAssigned={teacherAssigned} teacherPendingGrade={teacherPendingGrade} teacherGraded={teacherGraded}
            scoreChartData={scoreChartData} setActiveTab={setActiveTab} calculateGrade={calculateGrade}
          />
        )}

        {activeTab === 'Assignment' && (
          <AssignmentPage
            currentRole={currentRole} user={user} userName={userName} profileData={profileData}
            allUsers={allUsers}
            todoTasks={todoTasks} submittedTasks={submittedTasks}
            teacherAssigned={teacherAssigned} teacherPendingGrade={teacherPendingGrade} teacherGraded={teacherGraded}
            selectedTask={selectedTask} setSelectedTask={setSelectedTask}
            selectedAssignment={selectedAssignment} setSelectedAssignment={setSelectedAssignment}
            selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject}
            searchStudent={searchStudent} setSearchStudent={setSearchStudent}
            filterStudent={filterStudent} setFilterStudent={setFilterStudent}
            uniqueStudents={uniqueStudents}
            setShowCreateModal={setShowCreateModal}
            openEditModal={openEditModal} handleDeleteAssignment={handleDeleteAssignment}
            fetchAssignments={fetchAssignments}
          />
        )}

        {activeTab === 'Reporting' && (
          <ReportingPage
            currentRole={currentRole} user={user}
            assignments={assignments} allUsers={allUsers}
            submittedTasks={submittedTasks}
            teacherAssigned={teacherAssigned}
            teacherPendingGrade={teacherPendingGrade} teacherGraded={teacherGraded}
            calculateGrade={calculateGrade}
          />
        )}

        {activeTab === 'Settings' && (
          <SettingsPage
            profileData={profileData} setProfileData={setProfileData} onSubmit={handleUpdateProfile}
          />
        )}
      </MainLayout>
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;