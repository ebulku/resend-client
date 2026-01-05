"use client";

import { useRef, useEffect, useState } from "react";
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
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const normalizeHTML = (html: string): string => {
    // Create a temporary div to parse and normalize the HTML
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Collect all text nodes that need processing
    const walker = document.createTreeWalker(temp, NodeFilter.SHOW_TEXT, null);

    const textNodesToProcess: { node: Text; parts: string[] }[] = [];
    let node;
    while ((node = walker.nextNode())) {
      const textNode = node as Text;
      if (textNode.textContent && textNode.textContent.includes("\n")) {
        textNodesToProcess.push({
          node: textNode,
          parts: textNode.textContent.split("\n"),
        });
      }
    }

    // Process text nodes to replace newlines with <br> tags
    textNodesToProcess.forEach(({ node: textNode, parts }) => {
      const parent = textNode.parentNode;
      if (parent) {
        // Insert text parts and <br> tags
        parts.forEach((part, index) => {
          if (part) {
            parent.insertBefore(document.createTextNode(part), textNode);
          }
          if (index < parts.length - 1) {
            const br = document.createElement("br");
            parent.insertBefore(br, textNode);
          }
        });
        parent.removeChild(textNode);
      }
    });

    // Convert empty block elements (div/p) that represent line breaks to <br> tags
    // This helps with email compatibility while preserving formatting
    const blockElements = Array.from(temp.querySelectorAll("div, p"));
    blockElements.forEach((block) => {
      const isEmpty = !block.textContent || block.textContent.trim() === "";
      // Only convert empty blocks that likely represent line breaks
      if (isEmpty && block.parentNode) {
        const br = document.createElement("br");
        block.parentNode.replaceChild(br, block);
      }
    });

    return temp.innerHTML;
  };

  const handleInput = () => {
    if (editorRef.current) {
      let html = editorRef.current.innerHTML;
      // Normalize the HTML to ensure line breaks are preserved
      html = normalizeHTML(html);
      onChange(html);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Prevent default behavior
      e.preventDefault();

      // Insert a <br> tag and move cursor after it
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const br = document.createElement("br");
          range.deleteContents();
          range.insertNode(br);

          // Move cursor after the <br>
          range.setStartAfter(br);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          // Fallback: use execCommand
          document.execCommand("insertLineBreak", false);
        }

        // Trigger input event to update the value
        handleInput();
      }
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
    <div className={cn("border rounded-md bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 overflow-x-auto">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", isCommandActive("bold") && "bg-accent")}
          onClick={() => execCommand("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", isCommandActive("italic") && "bg-accent")}
          onClick={() => execCommand("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", isCommandActive("underline") && "bg-accent")}
          onClick={() => execCommand("underline")}
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
            isCommandActive("insertUnorderedList") && "bg-accent"
          )}
          onClick={() => execCommand("insertUnorderedList")}
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
            isCommandActive("insertOrderedList") && "bg-accent"
          )}
          onClick={() => execCommand("insertOrderedList")}
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
            isCommandActive("justifyLeft") && "bg-accent"
          )}
          onClick={() => execCommand("justifyLeft")}
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
            isCommandActive("justifyCenter") && "bg-accent"
          )}
          onClick={() => execCommand("justifyCenter")}
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
            isCommandActive("justifyRight") && "bg-accent"
          )}
          onClick={() => execCommand("justifyRight")}
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
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "min-h-[200px] p-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
          !value && !isFocused && "text-muted-foreground",
          "prose prose-sm dark:prose-invert max-w-none"
        )}
        style={{
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
        data-placeholder={placeholder || "Compose your message..."}
        suppressContentEditableWarning
      />
    </div>
  );
}
