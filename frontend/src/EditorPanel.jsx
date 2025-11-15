// EditorPanel.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";

/**
 * Props:
 *  - id: content _id from Mongo
 *  - onClose: callback when closing editor
 *  - onSaved: callback when saved (optional)
 */
export default function EditorPanel({ id, onClose, onSaved }) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start typing your content..." }),
    ],
    content: "<p>Loading...</p>",
    autofocus: true,
  });

  // Load content from backend
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios
      .get(`/api/content/${id}`)
      .then((res) => {
        const doc = res.data;
        setTitle(doc.topic || "");
        if (editor) editor.commands.setContent(doc.Content || "");
      })
      .catch((err) => {
        console.error("Failed to load doc:", err);
        alert("Failed to load document.");
      })
      .finally(() => setLoading(false));
  }, [id, editor]);

  // Save handler: get HTML and PUT to backend
  const save = async () => {
    if (!editor) return;
    const html = editor.getHTML();
    try {
      const payload = { topic: title, Content: html };
      const { data } = await axios.put(`/api/content/${id}`, payload);
      alert("Saved successfully");
      if (onSaved) onSaved(data);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  // Formatting helpers
  const MenuButton = ({ onClick, active, title, children }) => (
    <button
      onClick={onClick}
      title={title}
      className={`px-2 py-1 border rounded text-sm hover:bg-gray-100 transition ${active ? "bg-gray-200" : ""
        }`}
    >
      {children}
    </button>
  );

  // Link insertion
  const applyLink = () => {
    if (!editor) return;
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setShowLinkInput(false);
      setLinkUrl("");
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl, target: "_blank", rel: "noopener noreferrer" })
      .run();
    setShowLinkInput(false);
    setLinkUrl("");
  };

  // Image insertion (url)
  const insertImage = () => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl, alt: "" }).run();
    setImageUrl("");
  };

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose && onClose()} />

      <div className="relative m-auto w-[95%] lg:w-4/5 bg-white rounded-xl shadow-2xl p-5 max-h-[90vh] overflow-auto z-60">
        <div className="flex items-center justify-between gap-4 mb-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Topic Title"
            className="flex-1 border px-3 py-2 rounded text-lg"
          />

          <div className="flex gap-2">
            <button
              onClick={save}
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              onClick={() => onClose && onClose()}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Close
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-3">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor && editor.isActive("bold")}
            title="Bold"
          >
            <b>B</b>
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor && editor.isActive("italic")}
            title="Italic"
          >
            <i>I</i>
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor && editor.isActive("underline")}
            title="Underline"
          >
            <span style={{ textDecoration: "underline" }}>U</span>
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor && editor.isActive("strike")}
            title="Strike"
          >
            S
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor && editor.isActive("code")}
            title="Code"
          >
            {"</>"}
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor && editor.isActive("bulletList")}
            title="Bullet list"
          >
            • List
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor && editor.isActive("orderedList")}
            title="Numbered list"
          >
            1. List
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor && editor.isActive("blockquote")}
            title="Blockquote"
          >
            ❝
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            active={editor && editor.isActive("paragraph")}
            title="Paragraph"
          >
            P
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor && editor.isActive("heading", { level: 1 })}
            title="H1"
          >
            H1
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor && editor.isActive("heading", { level: 2 })}
            title="H2"
          >
            H2
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor && editor.isActive("heading", { level: 3 })}
            title="H3"
          >
            H3
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor && editor.isActive({ textAlign: "left" })}
            title="Align left"
          >
            L
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor && editor.isActive({ textAlign: "center" })}
            title="Align center"
          >
            C
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor && editor.isActive({ textAlign: "right" })}
            title="Align right"
          >
            R
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            ⎌
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            ↻
          </MenuButton>

          {/* Link button & input */}
          <div className="flex items-center gap-2">
            <MenuButton
              onClick={() => {
                setShowLinkInput((s) => !s);
                setTimeout(() => {
                  // focus input if showing
                  const el = document.getElementById("link-input");
                  if (el) el.focus();
                }, 50);
              }}
              title="Insert/Edit Link"
            >
              🔗
            </MenuButton>

            {showLinkInput && (
              <div className="flex items-center gap-1 border rounded px-2 py-1">
                <input
                  id="link-input"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="text-sm outline-none"
                  style={{ width: 260 }}
                />
                <button
                  onClick={applyLink}
                  className="px-2 py-1 bg-indigo-600 text-white rounded text-sm"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Image input */}
          <div className="flex items-center gap-2">
            <MenuButton
              onClick={() => {
                const el = document.getElementById("image-url");
                if (el) el.focus();
              }}
              title="Insert Image by URL"
            >
              🖼
            </MenuButton>

            <div className="flex items-center gap-1 border rounded px-2 py-1">
              <input
                id="image-url"
                placeholder="Image URL (https://...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="text-sm outline-none"
                style={{ width: 260 }}
              />
              <button
                onClick={insertImage}
                className="px-2 py-1 bg-indigo-600 text-white rounded text-sm"
              >
                Insert
              </button>
            </div>
          </div>
        </div>

        {/* Editor area */}
        <div className="border rounded p-3 min-h-[300px]">
          {loading ? (
            <div className="text-center py-20">Loading...</div>
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>

        <div className="mt-3 text-sm text-gray-600">
          The editor stores HTML. When you click Save the content is converted to HTML and saved to the server.
        </div>
      </div>
    </div>
  );
}
