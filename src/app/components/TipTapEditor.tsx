'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface TipTapEditorProps {
  content?: any;
  onUpdate?: (content: any) => void;
}

export default function TipTapEditor({ content, onUpdate }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Comece a escrever sua tese aqui...',
      }),
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[600px] px-8 py-6',
      },
    },
  });

  return (
    <div className="bg-zinc-900 rounded-2xl min-h-[700px]">
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
}
