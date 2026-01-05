'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  return (
    <div className={cn('border rounded-md bg-background', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 overflow-x-auto">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7', isCommandActive('bold') && 'bg-accent')}
          onClick={() => execCommand('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7', isCommandActive('italic') && 'bg-accent')}
          onClick={() => execCommand('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7', isCommandActive('underline') && 'bg-accent')}
          onClick={() => execCommand('underline')}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7', isCommandActive('insertUnorderedList') && 'bg-accent')}
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7', isCommandActive('insertOrderedList') && 'bg-accent')}
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7', isCommandActive('justifyLeft') && 'bg-accent')}
          onClick={() => execCommand('justifyLeft')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7', isCommandActive('justifyCenter') && 'bg-accent')}
          onClick={() => execCommand('justifyCenter')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7', isCommandActive('justifyRight') && 'bg-accent')}
          onClick={() => execCommand('justifyRight')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'min-h-[200px] p-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
          !value && !isFocused && 'text-muted-foreground',
          'prose prose-sm dark:prose-invert max-w-none'
        )}
        style={{
          wordBreak: 'break-word',
        }}
        data-placeholder={placeholder || 'Compose your message...'}
        suppressContentEditableWarning
      />
      
    </div>
  );
}

