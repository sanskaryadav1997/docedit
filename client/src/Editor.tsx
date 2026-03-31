import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { api } from './api';
import ShareModal from './ShareModal';

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [doc, setDoc] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [permission, setPermission] = useState('owner');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const canEdit = permission === 'owner' || permission === 'edit';

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    editable: canEdit,
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        save(title, JSON.stringify(editor.getJSON()));
      }, 1000);
    },
  });

  useEffect(() => {
    if (!id) return;
    api.getDoc(id).then(d => {
      setDoc(d);
      setTitle(d.title);
      setPermission(d.permission || 'view');
      try {
        const content = JSON.parse(d.content);
        editor?.commands.setContent(content);
      } catch { editor?.commands.setContent(d.content); }
    }).catch(() => nav('/'));
  }, [id, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(canEdit);
  }, [canEdit, editor]);

  const save = useCallback(async (t?: string, c?: string) => {
    if (!id || !canEdit) return;
    setSaving(true);
    try { await api.updateDoc(id, { title: t || title, content: c }); }
    catch (e) { console.error(e); }
    setSaving(false);
  }, [id, title, canEdit]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(e.target.value), 800);
  };

  if (!doc || !editor) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>;

  const Btn = ({ active, onClick, children, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}
      className={`px-2.5 py-1.5 rounded text-sm font-medium transition ${active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={() => nav('/')} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">← Back</button>
          <input value={title} onChange={handleTitleChange} disabled={!canEdit} placeholder="Document title"
            className="flex-1 text-lg font-semibold bg-transparent outline-none border-b border-transparent focus:border-indigo-300 disabled:text-gray-500" />
          <span className="text-xs text-gray-400">{saving ? 'Saving...' : 'Saved'}</span>
          {permission === 'owner' && (
            <button onClick={() => setShowShare(true)}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700">Share</button>
          )}
          {permission !== 'owner' && (
            <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">{permission === 'edit' ? 'Can Edit' : 'View Only'}</span>
          )}
        </div>

        {canEdit && (
          <div className="max-w-4xl mx-auto px-6 py-2 flex flex-wrap gap-1 border-t bg-gray-50/50">
            <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></Btn>
            <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></Btn>
            <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></Btn>
            <div className="w-px bg-gray-200 mx-1" />
            <Btn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</Btn>
            <Btn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Btn>
            <Btn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Btn>
            <div className="w-px bg-gray-200 mx-1" />
            <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</Btn>
            <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</Btn>
            <div className="w-px bg-gray-200 mx-1" />
            <Btn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>" Quote</Btn>
            <Btn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code</Btn>
            <div className="w-px bg-gray-200 mx-1" />
            <Btn onClick={() => editor.chain().focus().undo().run()}>↩ Undo</Btn>
            <Btn onClick={() => editor.chain().focus().redo().run()}>↪ Redo</Btn>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border min-h-[60vh] p-8">
          <EditorContent editor={editor} className="prose max-w-none min-h-[50vh] focus:outline-none" />
        </div>
      </main>

      {showShare && <ShareModal docId={id!} shares={doc.shares || []} onClose={() => {
        setShowShare(false);
        api.getDoc(id!).then(setDoc);
      }} />}
    </div>
  );
}
