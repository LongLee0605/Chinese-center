import { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent, type Content } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { postsApi, getUploadsBase } from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Link as LinkIcon,
  ImagePlus,
} from 'lucide-react';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung bài viết...',
  className = '',
  minHeight = '280px',
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInternalChange = useRef(false);
  const { show } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
      Placeholder.configure({ placeholder }),
    ],
    content: (value || '') as Content,
    editorProps: {
      attributes: { style: `min-height: ${minHeight}` },
    },
    onUpdate: ({ editor }) => {
      if (isInternalChange.current) return;
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && !isInternalChange.current) {
      isInternalChange.current = true;
      editor.commands.setContent(value || '', false);
      isInternalChange.current = false;
    }
  }, [value, editor]);

  const handleImageUpload = useCallback(async () => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !editor) return;
      if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
        return;
      }
      try {
        const { path } = await postsApi.uploadImage(file);
        const src = `${getUploadsBase()}/uploads/${path}`;
        editor.chain().focus().setImage({ src }).run();
      } catch (err) {
        show('error', err instanceof Error ? err.message : 'Tải ảnh lên thất bại.');
      }
    },
    [editor, show],
  );

  if (!editor) return null;

  return (
    <div className={`rich-text-editor rounded border border-gray-200 bg-white ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={onFileChange}
      />
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 p-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="In đậm"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="In nghiêng"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 w-px self-stretch bg-gray-200" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Tiêu đề 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Tiêu đề 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 w-px self-stretch bg-gray-200" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Gạch đầu dòng"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Danh sách số"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 w-px self-stretch bg-gray-200" />
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Nhập URL link:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          active={editor.isActive('link')}
          title="Chèn link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={handleImageUpload} title="Chèn ảnh (upload)">
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className="prose-editor" />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-2 transition-colors hover:bg-gray-100 ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
    >
      {children}
    </button>
  );
}
