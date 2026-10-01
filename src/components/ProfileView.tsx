import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Key,
  Smartphone,
  CheckCircle2,
  Lock,
  Building,
  Mail,
  Phone,
  LogOut,
} from 'lucide-react';
import { User as UserType } from '../types/banking';

interface ProfileViewProps {
  currentUser: UserType;
  onUpdateUser: (updated: Partial<UserType>) => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onUpdateUser, onLogout }) => {
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [twoFactor, setTwoFactor] = useState(true);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      phone,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    const activeUserPw =
      currentUser.password ||
      (currentUser.role === 'ADMIN'
        ? 'admin123'
        : currentUser.role === 'STAFF'
        ? 'Staff@2026'
        : 'customer123');

    if (currentPw.trim() !== activeUserPw) {
      setPwError('Current password does not match your existing password. Please check and try again.');
      return;
    }

    if (newPw.length < 4) {
      setPwError('New password must be at least 4 characters long.');
      return;
    }

    if (newPw !== confirmPw) {
      setPwError('New password and confirm password do not match.');
      return;
    }

    // Persist new password to user in storage
    onUpdateUser({
      password: newPw,
    });

    setPwSuccess('Password successfully updated! Next time you sign in, use this new password.');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setTimeout(() => setPwSuccess(''), 6000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account & Security Profile</h2>
        <p className="text-xs text-slate-500">
          Personal identification, biometric two-factor credentials, and role privileges
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile records updated successfully.</span>
        </div>
      )}

      {/* Main Profile Details */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shadow-md">
            {currentUser.firstName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                {currentUser.firstName} {currentUser.lastName}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {currentUser.role}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Username: @{currentUser.username}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Identity Verification Passed</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telephone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition"
            >
              Update Profile Information
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>Security & Authentication</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Password rotation and two-factor authorization</p>
        </div>

        {/* 2FA Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-slate-500" />
            <div>
              <div className="font-semibold text-slate-900 text-xs">Two-Factor Authentication (2FA)</div>
              <div className="text-[11px] text-slate-500">Require one-time passcode on new device logins</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTwoFactor(!twoFactor)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
              twoFactor ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
          </button>
        </div>

        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-800">Change Account Password</h4>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
            >
              {showPassword ? 'Hide Passwords' : 'Show Passwords'}
            </button>
          </div>

          {pwSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pwSuccess}</span>
            </div>
          )}

          {pwError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {pwError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter current password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Secure Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={4}
                placeholder="Min 4 characters"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={4}
                placeholder="Re-enter new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Sign Out Card */}
      {onLogout && (
        <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Terminate Active Banking Session</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely log out of this workstation and clear active authentication tokens
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
