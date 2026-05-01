import { useState } from 'react';
import { auth, loginWithGoogle, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from '../firebase';
import { updateProfile } from 'firebase/auth';

export default function AuthPage() {
  const [view, setView] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [firstName, setFirstName] = useState(''); 
  const [lastName, setLastName] = useState('');   
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [signupYear, setSignupYear] = useState('ปี 3');
  const [signupMajor, setSignupMajor] = useState('เทคโนโลยีสารสนเทศ (IT)');

  const handleEmailLogin = async (e) => { 
    e.preventDefault(); 
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (err) { alert(err.message); } 
  };
  
  const handleSignUp = async (e) => {
    e.preventDefault(); 
    if (password !== confirmPassword) { alert("รหัสผ่านไม่ตรงกัน"); return; }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: `${firstName} ${lastName}` });
      await fetch('http://localhost:8080/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firebaseUid: userCredential.user.uid, email: email, firstName: firstName, lastName: lastName, 
          role: "STUDENT", academicYear: signupYear, major: signupMajor 
        })
      });
      alert("สมัครสมาชิกสำเร็จ!");
    } catch (err) { alert(err.message); }
  };

  const handleResetPassword = async (e) => { 
    e.preventDefault(); 
    try { await sendPasswordResetEmail(auth, email); alert("ส่งลิงก์แล้ว!"); setView('login'); } 
    catch (err) { alert(err.message); } 
  };

  const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
  const EyeSlashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0bd1d1] via-[#1e3a8a] to-[#2e1065]">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md text-white">
        {view === 'login' && (
          <form onSubmit={handleEmailLogin}>
            <h2 className="text-3xl font-bold text-center mb-8">Login</h2>
            <input type="email" placeholder="Username / Email" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-4 outline-none focus:bg-white/30 placeholder-white/60 transition" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            <div className="relative mb-2 w-full">
              <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full bg-white/10 border border-white/20 rounded-xl pl-4 pr-12 py-3 outline-none focus:bg-white/30 placeholder-white/60 transition" value={password} onChange={(e)=>setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 h-full px-4 flex items-center text-white/60 hover:text-white transition z-10">{showPassword ? <EyeSlashIcon /> : <EyeIcon />}</button>
            </div>
            <div className="flex justify-between items-center text-sm mb-6 mt-2 text-white/80">
              <label className="cursor-pointer flex items-center"><input type="checkbox" className="mr-2 accent-[#3b82f6]" /> Remember me</label>
              <button type="button" onClick={() => setView('forgot')} className="hover:text-white transition">Forgot your password?</button>
            </div>
            <button type="submit" className="w-full bg-[#3b82f6] hover:bg-[#2563eb] py-3 rounded-xl font-bold transition shadow-lg mb-4">LOGIN</button>
            <div className="text-center text-sm mb-4 border-b border-white/20 pb-4">
              <button type="button" onClick={loginWithGoogle} className="w-full bg-white/10 border border-white/20 text-white py-2 rounded-xl font-bold hover:bg-white/20 transition flex justify-center items-center gap-2"><img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="google" />Login with Google</button>
            </div>
            <div className="text-center text-sm text-white/80">New here? <button type="button" onClick={() => setView('signup')} className="font-bold text-white hover:underline ml-1">Sign Up</button></div>
          </form>
        )}
        {view === 'signup' && (
          <form onSubmit={handleSignUp}>
            <h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input type="text" placeholder="First Name" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:bg-white/30 placeholder-white/60 transition" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required />
              <input type="text" placeholder="Last Name" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:bg-white/30 placeholder-white/60 transition" value={lastName} onChange={(e)=>setLastName(e.target.value)} required />
            </div>
            <input type="email" placeholder="Email Address" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-4 outline-none focus:bg-white/30 placeholder-white/60 transition" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <select className="w-full bg-[#1e3a8a] border border-white/20 rounded-xl px-4 py-3 outline-none text-white focus:bg-[#172554] transition" value={signupYear} onChange={(e) => setSignupYear(e.target.value)}>
                <option value="ปี 1">ชั้นปีที่ 1</option><option value="ปี 2">ชั้นปีที่ 2</option><option value="ปี 3">ชั้นปีที่ 3</option><option value="ปี 4">ชั้นปีที่ 4</option><option value="อาจารย์">อาจารย์</option>
              </select>
              <select className="w-full bg-[#1e3a8a] border border-white/20 rounded-xl px-4 py-3 outline-none text-white focus:bg-[#172554] transition" value={signupMajor} onChange={(e) => setSignupMajor(e.target.value)}>
                <option value="เทคโนโลยีสารสนเทศ (IT)">IT</option><option value="ปัญญาประดิษฐ์ (AI)">AI</option><option value="วิศวกรรมซอฟต์แวร์ (SE)">SE</option>
              </select>
            </div>

            <div className="relative mb-4 w-full">
              <input type={showPassword ? "text" : "password"} placeholder="Create Password" className="w-full bg-white/10 border border-white/20 rounded-xl pl-4 pr-12 py-3 outline-none focus:bg-white/30 placeholder-white/60 transition" value={password} onChange={(e)=>setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 h-full px-4 flex items-center text-white/60 hover:text-white transition z-10">{showPassword ? <EyeSlashIcon /> : <EyeIcon />}</button>
            </div>
            <div className="relative mb-6 w-full">
              <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" className="w-full bg-white/10 border border-white/20 rounded-xl pl-4 pr-12 py-3 outline-none focus:bg-white/30 placeholder-white/60 transition" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-0 top-0 h-full px-4 flex items-center text-white/60 hover:text-white transition z-10">{showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}</button>
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