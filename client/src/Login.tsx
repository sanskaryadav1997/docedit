import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Login() {
  const [email, setEmail] = useState('alice@test.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const nav = useNavigate();

  if (user) { nav('/'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try { await login(email, password); nav('/'); }
    catch (err: any) { setError(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-indigo-700">📝 DocEdit</h1>
        <p className="text-gray-500 text-center mb-6">Collaborative Document Editor</p>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none" required />
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium">
            Sign In
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Test accounts: alice@test.com, bob@test.com, carol@test.com (password: password123)
        </p>
      </div>
    </div>
  );
}
