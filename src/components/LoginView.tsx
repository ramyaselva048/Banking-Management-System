import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Lock,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User } from '../types/banking';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegisterCustomer: (
    name: string,
    email: string,
    phone: string,
    branchName: string,
    customPassword?: string
  ) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onLogin,
  onRegisterCustomer,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('customer123');
  const [regSuccess, setRegSuccess] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const inputClean = usernameOrEmail.trim().toLowerCase();
    const targetUser = users.find(
      (u) =>
        u.email.trim().toLowerCase() === inputClean ||
        u.username.trim().toLowerCase() === inputClean
    );

    if (!targetUser) {
      setErrorMessage(
        `User account not found for "${usernameOrEmail}". If you recently changed your email, please use your updated email address.`
      );
      return;
    }

    if (password.length < 4) {
      setErrorMessage('Please enter your password (minimum 4 characters).');
      return;
    }

    const expectedPassword =
      targetUser.password ||
      (targetUser.role === 'ADMIN'
        ? 'admin123'
        : targetUser.role === 'STAFF'
        ? 'Staff@2026'
        : 'customer123');

    if (password !== expectedPassword) {
      setErrorMessage(
        `Incorrect password for ${targetUser.email}. If you recently updated your password in Profile, please enter your new password.`
      );
      return;
    }

    onLogin(targetUser);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail) {
      setErrorMessage('Please enter legal name and valid email address.');
      return;
    }

    onRegisterCustomer(
      regName,
      regEmail.trim().toLowerCase(),
      regPhone || '+1 (555) 019-8800',
      'Apex Downtown Headquarters',
      regPassword || 'customer123'
    );
    setRegSuccess(`Account for ${regName} created successfully! You can now log in with your email and password.`);
    setIsRegisterMode(false);
    setUsernameOrEmail(regEmail.trim().toLowerCase());
    setPassword(regPassword || 'customer123');
  };

  const quickLogin = (role: 'ADMIN' | 'STAFF' | 'CUSTOMER', username: string) => {
    const user = users.find((u) => u.username === username) || users.find((u) => u.role === role);
    if (user) {
      setUsernameOrEmail(user.email);
      setPassword(
        user.password ||
          (user.role === 'ADMIN' ? 'admin123' : user.role === 'STAFF' ? 'Staff@2026' : 'customer123')
      );
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-xl shadow-blue-900/40">
            <Building2 className="w-6 h-6 text-blue-300" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight text-white">APEX BANK</h1>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
              Core Banking Portal
            </span>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-1">
          Secure enterprise authentication with role-based access control
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-700">
          {regSuccess && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{regSuccess}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isRegisterMode ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username or Email
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="e.g. admin or john_doe"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  <span className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer">
                    Demo: Any password &ge; 4 chars
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Banking Portal</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className="text-xs text-slate-400 hover:text-blue-400 transition"
                >
                  Need a customer account? <strong className="text-blue-400">Register Online</strong>
                </button>
              </div>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="border-b border-slate-700 pb-3 mb-2">
                <h3 className="font-bold text-white text-sm">Customer Online Registration</h3>
                <p className="text-xs text-slate-400">Create new retail banking credentials</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Hasselhoff"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="david@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 019-2834"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Set Account Password *</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="Choose your password (min 4 characters)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700/50"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Sign In Persona Shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              1-Click Demo Login
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickLogin('ADMIN', 'admin')}
                className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-left transition group"
              >
                <div className="font-bold text-red-300 group-hover:text-red-200">Admin Portal</div>
                <div className="text-[10px] text-slate-400">admin@apexbank.com</div>
                <div className="text-[9px] text-red-400/80 font-mono mt-0.5">
                  PW: {users.find((u) => u.role === 'ADMIN')?.password || 'admin123'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('STAFF', 'staff_officer')}
                className="p-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/40 text-left transition group"
              >
                <div className="font-bold text-blue-300 group-hover:text-blue-200">Staff Officer</div>
                <div className="text-[10px] text-slate-400">staff@apexbank.com</div>
                <div className="text-[9px] text-blue-400/80 font-mono mt-0.5">
                  PW: {users.find((u) => u.role === 'STAFF')?.password || 'Staff@2026'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('CUSTOMER', 'john_doe')}
                className="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-left transition group"
              >
                <div className="font-bold text-emerald-300 group-hover:text-emerald-200">Customer John</div>
                <div className="text-[10px] text-slate-400">john@example.com</div>
                <div className="text-[9px] text-emerald-400/80 font-mono mt-0.5">
                  PW: {users.find((u) => u.username === 'john_doe')?.password || 'customer123'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('CUSTOMER', 'emily_chen')}
                className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-left transition group"
              >
                <div className="font-bold text-purple-300 group-hover:text-purple-200">Customer Emily</div>
                <div className="text-[10px] text-slate-400">emily@example.com</div>
                <div className="text-[9px] text-purple-400/80 font-mono mt-0.5">
                  PW: {users.find((u) => u.username === 'emily_chen')?.password || 'customer123'}
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 text-[11px] text-slate-500">
          Protected by Apex National Bank Enterprise Banking Core &bull; 256-bit TLS Encrypted
        </div>
      </div>
    </div>
  );
};
