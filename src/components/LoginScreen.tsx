'use client';

import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Refresh the page so Server Component (page.tsx) reads the cookie
        window.location.reload();
      } else {
        setError(data.error || '登入失敗，請確認 Email 是否正確。');
      }
    } catch (err) {
      setError('伺服器連線錯誤，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#EEF2FF', color: '#4F46E5', marginBottom: '1rem' }}>
            <LogIn size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>週報系統登入</h1>
          <p style={{ color: '#6B7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>請輸入您的授權 Email 繼續</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              電子信箱 (Email)
            </label>
            <input
              type="email"
              required
              placeholder="例如: user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #D1D5DB',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', borderLeft: '4px solid #EF4444', color: '#B91C1C', fontSize: '0.875rem', borderRadius: '0.25rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: isLoading || !email.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !email.trim() ? 0.7 : 1,
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? '驗證中...' : '登入系統'}
          </button>
        </form>
      </div>
    </div>
  );
}
