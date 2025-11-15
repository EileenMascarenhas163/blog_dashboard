// App.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Folder } from 'lucide-react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import EditorPage from './EditorPage'; // Full page editor

function DashboardList() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  // two-level state: section (LinkedIn / Blog) and tab (uploaded / published)
  const [section, setSection] = useState('blog'); // 'blog' or 'linkedin'
  const [tab, setTab] = useState('uploaded'); // 'uploaded' or 'published'
  const navigate = useNavigate();

  // fetch all content
  const fetchContents = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/content');
      setContents(data || []);
    } catch (err) {
      console.error('Failed to fetch contents', err);
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  // publish a blog
  const publishBlog = async (id) => {
    try {
      await axios.patch(`/api/content/${id}/publish`);
      alert('Published!');
      fetchContents();
    } catch (err) {
      console.error('Publish failed', err);
      alert('Publish failed');
    }
  };

  // For now we use same contents for both sections.
  // If you have separate collections (linkedin vs blog) adjust filtering here.
  const uploadedAll = contents.filter((c) => !c.Published);
  const publishedAll = contents.filter((c) => c.Published);

  // If you want different logic per section, replace the following switch
  const uploaded = section === 'blog' ? uploadedAll : uploadedAll.filter(c => (c.section === 'linkedin' || false));
  const published = section === 'blog' ? publishedAll : publishedAll.filter(c => (c.section === 'linkedin' || false));

  const list = tab === 'published' ? published : uploaded;

  // date helpers
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');
  const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white p-6 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Content Dashboard</h1>
        </div>

        {/* Sections (top-level) */}
        <div className="mb-6">
          <h3 className="text-sm uppercase opacity-80 mb-2">Sections</h3>
          <div className="space-y-2">
            <button
              onClick={() => { setSection('blog'); setTab('uploaded'); }}
              className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center justify-between ${
                section === 'blog' ? 'bg-white text-indigo-700 font-semibold' : 'hover:bg-indigo-700/60'
              }`}
            >
              <span>Blog</span>
              <span className="ml-2 inline-block bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {contents.length}
              </span>
            </button>

            <button
              onClick={() => { setSection('linkedin'); setTab('uploaded'); }}
              className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center justify-between ${
                section === 'linkedin' ? 'bg-white text-indigo-700 font-semibold' : 'hover:bg-indigo-700/60'
              }`}
            >
              <span>LinkedIn</span>
              <span className="ml-2 inline-block bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {contents.filter(c => c.platform === 'linkedin').length}
              </span>
            </button>
          </div>
        </div>

        {/* Tabs (Uploaded / Published) */}
        <div className="mt-auto">
          <h3 className="text-sm uppercase opacity-80 mb-2">Status</h3>
          <nav className="space-y-2">
            <button
              onClick={() => setTab('uploaded')}
              className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center justify-between ${
                tab === 'uploaded' ? 'bg-white text-indigo-700 font-semibold' : 'hover:bg-indigo-700/60'
              }`}
            >
              <span>Uploaded</span>
              <span className="ml-2 inline-block bg-white/20 px-2 py-0.5 rounded-full text-sm">{uploaded.length}</span>
            </button>

            <button
              onClick={() => setTab('published')}
              className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center justify-between ${
                tab === 'published' ? 'bg-white text-indigo-700 font-semibold' : 'hover:bg-indigo-700/60'
              }`}
            >
              <span>Published</span>
              <span className="ml-2 inline-block bg-white/20 px-2 py-0.5 rounded-full text-sm">{published.length}</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{section === 'blog' ? 'Blog' : 'LinkedIn'} — {tab === 'uploaded' ? 'Ready to Publish' : 'Published'}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {list.length} item{list.length !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Optional create */}
          {/* <div>
            <Link to="/create" className="px-3 py-1 bg-indigo-600 text-white rounded">Create New</Link>
          </div> */}
        </header>

        {loading ? (
          <div className="text-center py-20">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No items in this list.</div>
        ) : (
          <ul className="space-y-2">
            {list.map((item) => (
              <li
                key={item._id}
                className="flex items-center gap-4 p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition"
              >
                <FileText className="w-5 h-5 text-indigo-600" />

                <div className="flex-1">
                  {/* Navigate to full-page editor on click */}
                  <button
                    className="text-left w-full"
                    onClick={() => navigate(`/edit/${item._id}`)}
                  >
                    <p className="font-medium text-gray-900 truncate">{item.topic}</p>
                    <p className="text-sm text-gray-500 truncate" style={{ maxWidth: '60ch' }}>
                      {item.Content ? (item.Content.replace(/<[^>]*>/g, '').slice(0, 180) + (item.Content.length > 180 ? '...' : '')) : 'No content'}
                    </p>
                  </button>
                </div>

                <div className="text-sm text-gray-600 w-36 text-right">
                  {tab === 'uploaded'
                    ? `Date ${fmtDate(item['Date Approved'])} ${fmtTime(item['Date Approved'])}`
                    : `Published ${fmtDate(item['Date Published'])} ${fmtTime(item['Date Published'])}`}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-gray-500 w-28">
                    <Folder className="w-4 h-4" />
                    <span className="text-sm">{section === 'blog' ? 'blog creation' : 'linkedin'}</span>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={item.doc ? `https://docs.google.com/document/d/${item.doc}` : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    >
                      Open
                    </a>

                    {tab === 'uploaded' && !item.Published && (
                      <button
                        onClick={() => publishBlog(item._id)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-sm"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

// Create / New page: creates a draft and redirects to editor
function CreateRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const createDraft = async () => {
      try {
        const res = await axios.post('/api/content', { topic: 'Untitled', Content: '<p></p>' });
        const id = res.data._id;
        navigate(`/edit/${id}`);
      } catch (err) {
        console.error('Create failed', err);
        alert('Create failed');
      }
    };
    createDraft();
  }, [navigate]);

  return <div className="p-10">Creating draft...</div>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardList />} />
        <Route path="/create" element={<CreateRedirect />} />
        <Route path="/edit/:id" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
