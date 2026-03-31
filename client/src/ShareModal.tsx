import React, { useState } from 'react';
import { api } from './api';

interface Props {
  docId: string;
  shares: any[];
  onClose: () => void;
}

export default function ShareModal({ docId, shares, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [perm, setPerm] = useState('view');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localShares, setLocalShares] = useState(shares);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const share = await api.shareDoc(docId, email, perm);
      setSuccess(`Shared with ${share.user?.email || email}`);
      setLocalShares(prev => [...prev.filter(s => s.user?.email !== email), share]);
      setEmail('');
    } catch (err: any) { setError(err.message); }
  };

  const removeShare = async (shareId: string) => {
    await api.removeShare(docId, shareId);
    setLocalShares(prev => prev.filter(s => s.id !== shareId));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">Share Document</h2>
        {error && <div className="bg-red-50 text-red-600 p-2 rounded mb-3 text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-2 rounded mb-3 text-sm">{success}</div>}
        <form onSubmit={handleShare} className="flex gap-2 mb-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="User email"
            className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400" required />
          <select value={perm} onChange={e => setPerm(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white">
            <option value="view">View</option>
            <option value="edit">Edit</option>
          </select>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Share</button>
        </form>
        {localShares.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Shared with</h3>
            <div className="space-y-2">
              {localShares.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <div>
                    <span className="text-sm font-medium">{s.user?.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{s.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{s.permission}</span>
                    <button onClick={() => removeShare(s.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={onClose} className="w-full mt-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Close</button>
      </div>
    </div>
  );
}
