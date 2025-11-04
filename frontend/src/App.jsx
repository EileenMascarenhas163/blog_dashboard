import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Folder } from 'lucide-react';

function App() {
  const [contents, setContents] = useState([]);
  const [tab, setTab] = useState('uploaded');
  const [loading, setLoading] = useState(true);

  // ---------- FETCH ----------
  const fetchBlogs = async () => {
    try {
      const { data } = await axios.get('/api/content');
      setContents(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchBlogs(); }, []);

  // ---------- PUBLISH ----------
  const publishBlog = async (id) => {
    try {
      const { data } = await axios.patch(`/api/content/${id}/publish`);
      setContents(prev => prev.map(i => i._id === id ? data : i));
      alert('Published!');
    } catch { alert('Publish failed'); }
  };

  // ---------- FILTER & SORT ----------
  const uploaded = contents
    .filter(c => !c.Published)
    .sort((a, b) => new Date(b['Date Approved']) - new Date(a['Date Approved']));

  const published = contents
    .filter(c => c.Published)
    .sort((a, b) => new Date(b['Date Published']) - new Date(a['Date Published']));

  const list = tab === 'published' ? published : uploaded;

  // ---------- DATE HELPERS ----------
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ==== SIDEBAR ==== */}
      <aside className="w-64 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white p-6">
        <h1 className="text-2xl font-bold mb-10">BLOG Portal</h1>
        <nav className="space-y-3">
          {[
            { key: 'uploaded', label: 'Uploaded', data: uploaded },
            { key: 'published', label: 'Published', data: published }
          ].map(({ key, label, data }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`w-full flex justify-between items-center px-5 py-3 rounded-xl font-medium transition-all ${
                tab === key ? 'bg-white text-indigo-700 shadow-lg' : 'hover:bg-indigo-700'
              }`}
            >
              {label}
              <span className="bg-white/20 px-2 py-1 rounded-full text-sm">{data.length}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ==== MAIN ==== */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {tab === 'uploaded' ? 'Ready to Publish' : 'Live '}
        </h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : list.length === 0 ? (
          <p className="text-center text-gray-500 py-20">No items here.</p>
        ) : (
          <ul className="space-y-2">
            {list.map(item => (
              <li
                key={item._id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 transition"
              >
                {/* ICON */}
                <FileText className="w-5 h-5 text-indigo-600" />

                {/* TITLE */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.topic}</p>
                </div>

                {/* DATE */}
                <div className="text-sm text-gray-600 w-32 text-right">
                  {tab === 'uploaded'
                    ? `Approved ${fmtDate(item['Date Approved'])} ${fmtTime(item['Date Approved'])}`
                    : `Published ${fmtDate(item['Date Published'])} ${fmtTime(item['Date Published'])}`}
                </div>

                {/* FOLDER (static) */}
                <div className="flex items-center gap-1 text-gray-500 w-28">
                  <Folder className="w-4 h-4" />
                  <span className="text-sm">blog creation</span>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  {/* OPEN DOC */}
                  <a
                    href={`https://docs.google.com/document/d/${item.doc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                  >
                    Open
                  </a>

                  {/* PUBLISH (only in Uploaded) */}
                  {tab === 'uploaded' && !item.Published && (
                    <button
                      onClick={() => publishBlog(item._id)}
                      className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 transition"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;