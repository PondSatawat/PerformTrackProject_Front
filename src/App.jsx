import { useState, useEffect } from 'react';
import { auth, logout, loginWithGoogle, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from './firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(''); // State ใหม่สำหรับเก็บชื่อที่จะแสดง
  const [view, setView] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [firstName, setFirstName] = useState(''); 
  const [lastName, setLastName] = useState('');   
  const [isLoading, setIsLoading] = useState(true);

  // State สำหรับเปิด-ปิดการมองเห็นรหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentRole, setCurrentRole] = useState('STUDENT'); 
  const [assignments, setAssignments] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('อาจารย์บูม'); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        let fetchedRole = 'STUDENT';
        let displayNameToUse = currentUser.displayName || currentUser.email; // ค่าเริ่มต้น

        try {
          const res = await fetch(`http://localhost:8080/api/users/uid/${currentUser.uid}`);
          if (res.ok) {
            const userData = await res.json();
            if (userData) {
              if (userData.role) fetchedRole = userData.role;
              // ดึงชื่อ-นามสกุลจาก MySQL มาต่อกัน
              if (userData.firstName && userData.lastName) {
                displayNameToUse = `${userData.firstName} ${userData.lastName}`;
              }
            }
          }
        } catch (error) {
          console.error("Error fetching data from MySQL:", error);
        }
        
        setCurrentRole(fetchedRole);
        setUserName(displayNameToUse); // เก็บชื่อไว้โชว์
        setUser(currentUser);
        fetchAssignments(currentUser, fetchedRole, displayNameToUse);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAssignments = (currentUser, role, currentName) => {
    fetch('http://localhost:8080/api/assignments')
      .then(res => res.json())
      .then(data => {
        if (role === 'STUDENT') {
          setAssignments(data.filter(a => a.studentId === currentUser.email));
        } else {
          setAssignments(data.filter(a => a.teacherName === (currentName || userName)));
        }
      });
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    const newAssignment = {
      studentId: user.email,
      studentName: userName, // ส่งชื่อ-นามสกุลที่ดึงมา ไปเก็บในงานที่ส่ง
      academicYear: 'ปี 3',
      taskTitle: taskTitle,
      taskDescription: taskDesc,
      teacherName: selectedTeacher,
      submissionStatus: 'SUBMITTED',
      dueDate: new Date().toISOString().split('T')[0]
    };

    const res = await fetch('http://localhost:8080/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAssignment)
    });

    if (res.ok) {
      alert(`ส่งงานให้ ${selectedTeacher} สำเร็จ!`);
      setTaskTitle(''); setTaskDesc('');
      fetchAssignments(user, currentRole, userName);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (err) { alert("Login ล้มเหลว: " + err.message); }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: `${firstName} ${lastName}` });
      
      await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: userCredential.user.uid,
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: "STUDENT" 
        })
      });

      alert("สมัครสมาชิกสำเร็จ!");
    } catch (err) { alert("สมัครสมาชิกล้มเหลว: " + err.message); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      alert("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว!");
      setView('login');
    } catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const EyeSlashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

  if (isLoading) return <div className="h-screen flex items-center justify-center text-white bg-[#0f172a]">กำลังโหลด...</div>;

  // ---------------- 1. หน้า Login ----------------
  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0bd1d1] via-[#1e3a8a] to-[#2e1065]">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md text-white">
          
          {view === 'login' && (
            <form onSubmit={handleEmailLogin}>
              <h2 className="text-3xl font-bold text-center mb-8">Login</h2>
              <input type="email" placeholder="Username / Email" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-4 outline-none focus:bg-white/30 placeholder-white/60 transition" value={email} onChange={(e)=>setEmail(e.target.value)} required />
              
              <div className="relative mb-2 w-full">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-4 pr-12 py-3 outline-none focus:bg-white/30 placeholder-white/60 transition" 
                  value={password} onChange={(e)=>setPassword(e.target.value)} required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 h-full px-4 flex items-center text-white/60 hover:text-white transition z-10">
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              
              <div className="flex justify-between items-center text-sm mb-6 mt-2 text-white/80">
                <label className="cursor-pointer flex items-center"><input type="checkbox" className="mr-2 accent-[#3b82f6]" /> Remember me</label>
                <button type="button" onClick={() => setView('forgot')} className="hover:text-white transition">Forgot your password?</button>
              </div>

              <button type="submit" className="w-full bg-[#3b82f6] hover:bg-[#2563eb] py-3 rounded-xl font-bold transition shadow-lg mb-4">LOGIN</button>
              
              <div className="text-center text-sm mb-4 border-b border-white/20 pb-4">
                <button type="button" onClick={loginWithGoogle} className="w-full bg-white/10 border border-white/20 text-white py-2 rounded-xl font-bold hover:bg-white/20 transition flex justify-center items-center gap-2">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="google" />
                  Login with Google
                </button>
              </div>

              <div className="text-center text-sm text-white/80">
                New here? <button type="button" onClick={() => setView('signup')} className="font-bold text-white hover:underline ml-1">Sign Up</button>
              </div>
            </form>
          )}

          {view === 'signup' && (
            <form onSubmit={handleSignUp}>
              <h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>
              <div className="flex gap-3 mb-4">
                <input type="text" placeholder="First Name" className="w-1/2 bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:bg-white/30 placeholder-white/60 transition" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required />
                <input type="text" placeholder="Last Name" className="w-1/2 bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:bg-white/30 placeholder-white/60 transition" value={lastName} onChange={(e)=>setLastName(e.target.value)} required />
              </div>
              <input type="email" placeholder="Email Address" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-4 outline-none focus:bg-white/30 placeholder-white/60 transition" value={email} onChange={(e)=>setEmail(e.target.value)} required />
              
              <div className="relative mb-4 w-full">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create Password" 
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-4 pr-12 py-3 outline-none focus:bg-white/30 placeholder-white/60 transition" 
                  value={password} onChange={(e)=>setPassword(e.target.value)} required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 h-full px-4 flex items-center text-white/60 hover:text-white transition z-10">
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>

              <div className="relative mb-6 w-full">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm Password" 
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-4 pr-12 py-3 outline-none focus:bg-white/30 placeholder-white/60 transition" 
                  value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required 
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-0 top-0 h-full px-4 flex items-center text-white/60 hover:text-white transition z-10">
                  {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>

              <button type="submit" className="w-full bg-[#10b981] hover:bg-[#059669] py-3 rounded-xl font-bold transition shadow-lg mb-4 uppercase">Create Account</button>
              <button type="button" onClick={() => setView('login')} className="w-full text-sm text-white/80 hover:text-white transition text-center block">Already have an account? Login</button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleResetPassword}>
              <h2 className="text-2xl font-bold text-center mb-4">Reset Password</h2>
              <p className="text-sm text-center text-white/70 mb-6">ระบุอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>
              <input type="email" placeholder="Email Address" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-6 outline-none focus:bg-white/30 placeholder-white/60 transition" value={email} onChange={(e)=>setEmail(e.target.value)} required />
              <button type="submit" className="w-full bg-[#f97316] hover:bg-[#ea580c] py-3 rounded-xl font-bold transition shadow-lg mb-4 uppercase">Send Reset Link</button>
              <button type="button" onClick={() => setView('login')} className="w-full text-sm text-white/80 hover:text-white transition text-center block">Back to Login</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ---------------- 2. หน้า Dashboard (เมื่อ Login สำเร็จ) ----------------
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      <nav className="bg-white shadow-sm px-6 py-4 mb-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-slate-800">
          <h1 className="text-xl font-bold text-blue-900">Performance Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">สถานะ: {currentRole}</span>
            {/* โชว์ชื่อ-นามสกุลตรงนี้ */}
            <span className="text-sm font-bold">{userName}</span> 
            <button onClick={logout} className="text-sm font-semibold text-red-500 hover:text-red-700">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {currentRole === 'STUDENT' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-md border border-slate-200 h-fit">
              <h2 className="text-xl font-bold mb-4 border-b pb-2 text-slate-800">ส่งงานใหม่</h2>
              <form onSubmit={handleSubmitAssignment} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1 font-semibold text-slate-700">เลือกอาจารย์ผู้ตรวจ:</label>
                  <select className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800 bg-slate-50" value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                    <option value="อาจารย์บูม">อาจารย์บูม</option>
                    <option value="อาจารย์จอย">อาจารย์จอย</option>
                  </select>
                </div>
                <input type="text" placeholder="หัวข้อโปรเจกต์" className="w-full border border-slate-300 rounded-lg p-2 outline-none text-slate-800 bg-slate-50" value={taskTitle} onChange={(e)=>setTaskTitle(e.target.value)} required />
                <textarea placeholder="รายละเอียดงานหรือลิงก์ส่งงาน" className="w-full border border-slate-300 rounded-lg p-2 outline-none h-32 text-slate-800 bg-slate-50" value={taskDesc} onChange={(e)=>setTaskDesc(e.target.value)} required />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-sm">กดส่งงาน</button>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">งานที่ฉันส่งแล้ว</h2>
              {assignments.map(task => (
                <div key={task.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{task.taskTitle}</h3>
                      <p className="text-xs text-slate-500">ส่งถึง: {task.teacherName}</p>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">{task.score ? `คะแนน: ${task.score}` : 'รอตรวจ'}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100">Note จากอาจารย์: {task.instructorNote || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 border-l-4 border-blue-600 pl-3">งานที่รอกลั่นกรอง (สำหรับอาจารย์ {userName})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.map(task => (
                <TeacherGradeCard key={task.id} task={task} refresh={() => fetchAssignments(user, currentRole, userName)} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TeacherGradeCard({ task, refresh }) {
  const [score, setScore] = useState(task.score || '');
  const [note, setNote] = useState(task.instructorNote || '');

  const handleGrade = async () => {
    await fetch(`http://localhost:8080/api/assignments/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: parseFloat(score), instructorNote: note, submissionStatus: 'GRADED' })
    });
    alert('บันทึกคะแนนเรียบร้อย');
    refresh();
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-md">
      <h3 className="text-lg font-bold mb-1 text-slate-800">{task.taskTitle}</h3>
      <p className="text-sm text-blue-600 mb-3 font-semibold">โดยนักศึกษา: {task.studentName}</p>
      <p className="text-sm bg-slate-50 border border-slate-100 text-slate-700 p-3 rounded-lg mb-4 h-24 overflow-y-auto">{task.taskDescription}</p>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">ให้คะแนน (0-100)</label>
          <input type="number" className="w-full border border-slate-300 rounded-xl p-2 outline-none focus:border-blue-500" value={score} onChange={(e)=>setScore(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">ข้อเสนอแนะ</label>
          <textarea className="w-full border border-slate-300 rounded-xl p-2 outline-none focus:border-blue-500 h-20" value={note} onChange={(e)=>setNote(e.target.value)} />
        </div>
        <button onClick={handleGrade} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition shadow-sm mt-2">บันทึกเกรด</button>
      </div>
    </div>
  );
}

export default App;