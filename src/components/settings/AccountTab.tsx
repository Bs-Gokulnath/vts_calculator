import { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccountTab() {
  const { user, logout }        = useAuth();
  const [confirming, setConfirming] = useState(false);

  const emailDomain = user?.email ? user.email.split('@')[1] : null;

  return (
    <div className="p-4 space-y-4">
      {/* Profile card */}
      <div className="card-elevated p-5">
        <div className="relative flex items-center gap-4">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover shrink-0 ring-2 ring-brand-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center shrink-0 ring-2 ring-brand-100">
              <User size={26} className="text-brand-600" />
            </div>
          )}

          {/* Google badge top-right */}
          <span className="badge badge-brand absolute top-0 right-0 flex items-center gap-1">
            <GoogleDot /> Google
          </span>

          <div className="min-w-0">
            <p className="font-bold text-ink truncate">{user?.name ?? '—'}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Account info */}
      {emailDomain && (
        <div className="card p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Domain</span>
            <span className="badge badge-brand text-xs">{emailDomain}</span>
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="card p-4">
        <button
          onClick={() => setConfirming(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-500 border border-red-300 rounded-xl hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* Confirm dialog */}
      {confirming && (
        <div className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center">
          <div className="dialog-panel bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-ink mb-2">Sign Out</h3>
            <p className="text-gray-500 text-sm mb-5">Are you sure you want to sign out?</p>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setConfirming(false)}>Cancel</button>
              <button className="btn-danger flex-1" onClick={logout}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleDot() {
  return (
    <svg width="10" height="10" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
