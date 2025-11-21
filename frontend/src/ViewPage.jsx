// ViewPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  // Load content from backend
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios
      .get(`/api/content/${id}`)
      .then((res) => {
        const doc = res.data;
        setTitle(doc.topic || "");
        setContent(doc.Content || "");
      })
      .catch((err) => {
        console.error("Failed to load content:", err);
        alert("Failed to load content.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <article className="bg-white rounded-lg shadow-md p-8">
            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-6 pb-4 border-b">
              {title || "Untitled"}
            </h1>

            {/* HTML Content */}
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-img:rounded-lg prose-img:shadow-md prose-blockquote:border-l-indigo-600 prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-code:text-indigo-600 prose-pre:bg-gray-900 prose-pre:text-gray-100"
              dangerouslySetInnerHTML={{ __html: content }}
              style={{
                lineHeight: "1.8",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            />
          </article>
        )}
      </main>
    </div>
  );
}

