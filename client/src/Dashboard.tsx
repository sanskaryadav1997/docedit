import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { api } from './api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [docs, setDocs] = useState<{ owned: any[]; shared: any[] }>({ owned: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  const load = () => { api.getDocs().then(setDocs).finally(() => setLoading(false)); };
  useEffect(load, []);

  const createDoc = async () => {
    const doc = await api.createDoc();
    nav(`/doc/${doc.id}`);
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const doc = await api.uploadFile(file);
      nav(`/doc/${doc.id}`);
    } catch (err: any) { alert(err.message); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const deleteDoc = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await api.deleteDoc(id);
    load();
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-700">📝 DocEdit</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.name} ({user?.email})</span>
            <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-3 mb-8">
          <button onClick={createDoc} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium">
            + New Document
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="bg-white border-2 border-dashed border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg hover:border-indigo-400 hover:text-indigo-600 font-medium">
            📄 Upload .txt / .md
          </button>
          <input ref={fileRef} type="file" accept=".txt,.md" onChange={uploadFile} className="hidden" />
        </div>

        {loading ? <p className="text-gray-400">Loading...</p> : (<>
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">My Documents ({docs.owned.length})</h2>
            {docs.owned.length === 0 ? <p className="text-gray-400 italic">No documents yet. Create one to get started!</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.owned.map((d: any) => (
                  <div key={d.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition cursor-pointer group"
                    onClick={() => nav(`/doc/${d.id}`)}>
                    <h3 className="font-medium text-gray-800 truncate">{d.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">Updated {fmt(d.updatedAt)}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">Owner</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteDoc(d.id); }}
                        className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Shared with Me ({docs.shared.length})</h2>
            {docs.shared.length === 0 ? <p className="text-gray-400 italic">No shared documents.</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.shared.map((d: any) => (
                  <div key={d.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => nav(`/doc/${d.id}`)}>
                    <h3 className="font-medium text-gray-800 truncate">{d.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">By {d.owner.name} · {fmt(d.updatedAt)}</p>
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded mt-2 inline-block">
                      {d.shares?.[0]?.permission === 'edit' ? 'Can Edit' : 'View Only'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>)}
      </main>
    </div>
  );
}
