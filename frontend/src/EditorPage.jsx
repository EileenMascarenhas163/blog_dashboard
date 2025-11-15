// EditorPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
    Bold,
    Italic,
    Underline as UIcon,
    Code,
    List,
    ListOrdered,
    Quote,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Undo,
    Redo,
    Link as LinkIcon,
    Image as ImageIcon
  } from "lucide-react";
  
export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
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

  // load doc
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

  // save
  const save = async () => {
    if (!editor) return;
    const html = editor.getHTML();
    try {
      await axios.put(`/api/content/${id}`, { topic: title, Content: html });
      // simple feedback
      const el = document.getElementById("save-toast");
      if (el) {
        el.classList.remove("opacity-0");
        setTimeout(() => el.classList.add("opacity-0"), 1200);
      }
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  // publish
  // in EditorPage.jsx (replace current publish function)
const publish = async () => {
    try {
      const resp = await axios.post(`/api/content/${id}/publish-and-notify`);
      if (resp.data && resp.data.ok) {
        alert('Published! n8n notified: ' + (resp.data.forwarded ? 'yes' : 'no'));
        navigate('/');
      } else {
        alert('Published but error notifying n8n.');
        navigate('/');
      }
    } catch (err) {
      console.error('Publish-and-notify failed', err);
      alert('Publish failed. See console.');
    }
  };
  

  // link apply/unset
  const applyLink = () => {
    if (!editor) return;
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl, target: "_blank", rel: "noopener noreferrer" }).run();
    }
    setLinkUrl("");
    setShowLinkInput(false);
  };

  const insertImage = () => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl, alt: "" }).run();
    setImageUrl("");
  };

  // keyboard shortcuts: Ctrl/Cmd + B/I/U etc.
  const handleKeyDown = useCallback(
    (e) => {
      if (!editor) return;
      const cmd = e.ctrlKey || e.metaKey;
      if (!cmd) return;
      // prevent default for handled combos
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        editor.chain().focus().toggleBold().run();
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        editor.chain().focus().toggleItalic().run();
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        editor.chain().focus().toggleUnderline().run();
      } else if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        editor.chain().focus().undo().run();
      } else if ((e.key === "y" || e.key === "Y") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        editor.chain().focus().redo().run();
      }
    },
    [editor]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // small MenuButton for toolbar
  const MenuButton = ({ onClick, active, title, children }) => (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center w-9 h-9 rounded hover:bg-gray-100 transition ${active ? "bg-gray-200" : ""}`}
    >
      {children}
    </button>
  );

  // render
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="px-3 py-1 bg-gray-100 rounded">Back</button>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Topic Title"
              className="text-lg px-3 py-2 rounded border w-[min(60vw,800px)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={save} className="px-3 py-1 bg-indigo-600 text-white rounded">Save</button>
            <button onClick={publish} className="px-3 py-1 bg-emerald-600 text-white rounded">Publish</button>
          </div>
        </div>

        {/* STICKY toolbar: stays under header */}
        <div className="sticky top-[56px] z-40 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 py-2 overflow-x-auto">
              {/* Group 1 - text styles */}
              <div className="flex items-center gap-1 px-2">
                <MenuButton
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  active={editor && editor.isActive("bold")}
                  title="Bold (Ctrl/Cmd+B)"
                >
                  <Bold size={16} />
                </MenuButton>
                <MenuButton
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  active={editor && editor.isActive("italic")}
                  title="Italic (Ctrl/Cmd+I)"
                >
                  <Italic size={16} />
                </MenuButton>
                <MenuButton
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  active={editor && editor.isActive("underline")}
                  title="Underline (Ctrl/Cmd+U)"
                >
                  <UIcon size={16} />
                </MenuButton>
                <MenuButton
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  active={editor && editor.isActive("code")}
                  title="Code"
                >
                  <Code size={16} />
                </MenuButton>
              </div>

              {/* Group 2 - lists & quote */}
              <div className="flex items-center gap-1 px-2">
                <MenuButton
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  active={editor && editor.isActive("bulletList")}
                  title="Bulleted list"
                >
                  <List size={16} />
                </MenuButton>
                <MenuButton
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  active={editor && editor.isActive("orderedList")}
                  title="Numbered list"
                >
                  <ListOrdered size={16} />
                </MenuButton>
                <MenuButton
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  active={editor && editor.isActive("blockquote")}
                  title="Quote"
                >
                  <Quote size={16} />
                </MenuButton>
              </div>

              {/* Group 3 - headings */}
              <div className="flex items-center gap-1 px-2">
                <MenuButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor && editor.isActive("paragraph")} title="Paragraph">P</MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor && editor.isActive("heading", { level: 1 })} title="Heading 1">H1</MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor && editor.isActive("heading", { level: 2 })} title="Heading 2">H2</MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor && editor.isActive("heading", { level: 3 })} title="Heading 3">H3</MenuButton>
              </div>

              {/* Group 4 - alignment */}
              <div className="flex items-center gap-1 px-2">
                <MenuButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor && editor.isActive({ textAlign: "left" })} title="Align left"><AlignLeft size={16} /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor && editor.isActive({ textAlign: "center" })} title="Align center"><AlignCenter size={16} /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor && editor.isActive({ textAlign: "right" })} title="Align right"><AlignRight size={16} /></MenuButton>
              </div>

              {/* Group 5 - undo/redo */}
              <div className="flex items-center gap-1 px-2">
                <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl/Cmd+Z)"><Undo size={16} /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl/Cmd+Y)"><Redo size={16} /></MenuButton>
              </div>

              {/* Group 6 - link & image inline inputs (like Google Docs) */}
              <div className="flex items-center gap-2 px-2 ml-3">
                <MenuButton
                  onClick={() => setShowLinkInput((s) => !s)}
                  title="Insert link (select text and click)"
                >
                  <LinkIcon size={16} />
                </MenuButton>

                {showLinkInput && (
                  <div className="flex items-center gap-1 border rounded px-2 py-1 bg-white">
                    <input
                      id="link-input"
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="text-sm outline-none w-72"
                    />
                    <button onClick={applyLink} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Apply</button>
                  </div>
                )}

                <div className="flex items-center gap-1 border rounded px-2 py-1 bg-white">
                  <ImageIcon size={16} />
                  <input
                    placeholder="Image URL (https://...)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="text-sm outline-none w-64"
                  />
                  <button onClick={insertImage} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Insert</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* editor body */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="prose max-w-none" style={{ fontFamily: "'Arial', sans-serif" }}>
          {loading ? (
            <div className="text-center py-20">Loading...</div>
          ) : (
            <div className="min-h-[60vh] border rounded p-6">
              <EditorContent editor={editor} />
            </div>
          )}
        </div>
      </main>

      {/* small save toast */}
      <div
        id="save-toast"
        className="fixed right-6 bottom-6 bg-black text-white px-4 py-2 rounded opacity-0 transition-opacity"
        style={{ pointerEvents: "none" }}
      >
        Saved
      </div>
    </div>
  );
}
