"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import UnderlineExtension from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Disable the default hard break behavior, we'll handle it
        hardBreak: false,
        // Ensure lists are enabled
        bulletList: {
          HTMLAttributes: {
            class: "list-disc",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "list-item",
          },
        },
      }),
      UnderlineExtension,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: "left",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Get HTML content and ensure line breaks are preserved
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none min-h-[200px] p-4 focus:outline-none",
          "prose-p:my-1 prose-headings:my-2"
        ),
      },
    },
  });

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-md bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 overflow-x-auto">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", editor.isActive("bold") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", editor.isActive("italic") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", editor.isActive("underline") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            editor.isActive("bulletList") && "bg-accent"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (editor.isActive("bulletList")) {
              editor.chain().focus().toggleBulletList().run();
            } else {
              // If ordered list is active, toggle it off first
              if (editor.isActive("orderedList")) {
                editor.chain().focus().toggleOrderedList().run();
              }
              editor.chain().focus().toggleBulletList().run();
            }
          }}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            editor.isActive("orderedList") && "bg-accent"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (editor.isActive("orderedList")) {
              editor.chain().focus().toggleOrderedList().run();
            } else {
              // If bullet list is active, toggle it off first
              if (editor.isActive("bulletList")) {
                editor.chain().focus().toggleBulletList().run();
              }
              editor.chain().focus().toggleOrderedList().run();
            }
          }}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            editor.isActive({ textAlign: "left" }) && "bg-accent"
          )}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            editor.isActive({ textAlign: "center" }) && "bg-accent"
          )}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            editor.isActive({ textAlign: "right" }) && "bg-accent"
          )}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="min-h-[200px]">
        <EditorContent
          editor={editor}
          className={cn(
            !editor.getText() &&
              "before:content-[attr(data-placeholder)] before:absolute before:text-muted-foreground before:pointer-events-none"
          )}
        />
      </div>
    </div>
  );
}
