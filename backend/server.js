// server.js (ESM-ready, fixed)
// Requires: npm i express mongoose cors body-parser sanitize-html dotenv axios
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import sanitizeHtml from 'sanitize-html';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// ---------- CONFIG (safe defaults) ----------
const MONGO_URI = process.env.MONGODB_URI ;
const PORT = process.env.PORT || 4000;

console.log('Using MONGO_URI:', MONGO_URI);
console.log('Using PORT:', PORT);

// ---------- MONGO SETUP ----------
mongoose.set('strictQuery', false);
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Mongo connection error:', err);
    // do not exit immediately - log and keep server up for debugging
  });

// ---------- SCHEMA ----------
const { Schema } = mongoose;
const ContentSchema = new Schema({
  topic: { type: String, default: '' },
  Content: { type: String, default: '' }, // HTML string
  Published: { type: Boolean, default: false },
  'Date Approved': { type: Date },
  'Date Published': { type: Date },
  doc: { type: String },
  versions: [
    {
      content: String,
      date: Date,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
ContentSchema.index({ 'Date Approved': -1 });
ContentSchema.index({ 'Date Published': -1 });

// FIXED: use ContentSchema (not contentSchema) and specify collection name if needed
const Content = mongoose.model('Content', ContentSchema, 'blogdata');

// ---------- SANITIZER OPTIONS ----------
const sanitizerOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'h1',
    'h2',
    'h3',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
  ]),
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    '*': ['class', 'id', 'style'],
  },
  allowedSchemes: ['http', 'https', 'data'],
};

// ---------- ROUTES ----------

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));
// POST /api/content/:id/publish-and-notify
// publish-and-notify: publish in DB and forward the full document to n8n
app.post('/api/content/:id/publish-and-notify', async (req, res) => {
  const { id } = req.params;
  console.log(`[publish-and-notify] called for id=${id} at ${new Date().toISOString()}`);

  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('[publish-and-notify] invalid id:', id);
      return res.status(400).json({ ok: false, error: 'invalid id' });
    }

    // 1) Publish in DB
    const publishDate = new Date();
    const updated = await Content.findByIdAndUpdate(
      id,
      {
        $set: {
          Published: true,
          'Date Published': publishDate,
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      console.log(`[publish-and-notify] NOT FOUND id=${id}`);
      return res.status(404).json({ ok: false, error: 'not found' });
    }

    console.log('[publish-and-notify] published in db, _id=', updated._id);

    // 2) Prepare payload: choose which fields to forward
    // Forwarding the entire `updated` object is fine, but you may want to remove internal props.
    // We'll build a safe payload with the main fields:
    const payload = {
      _id: String(updated._id),
      topic: updated.topic,
      Content: updated.Content,
      Published: updated.Published,
      dateApproved: updated['Date Approved'] || null,
      datePublished: updated['Date Published'] || null,
      doc: updated.doc || null,
      versions: updated.versions || [],
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      // include any other fields you need (tags, author, etc.)
    };

    // 3) Forward to n8n if configured
    const n8nWebhook = (process.env.N8N_WEBHOOK_URL || '').trim();
    if (!n8nWebhook) {
      console.log('[publish-and-notify] N8N webhook not configured; returning success after publish');
      return res.json({ ok: true, published: true, forwarded: false, reason: 'n8n webhook not configured' });
    }

    console.log('[publish-and-notify] forwarding full document to n8n webhook:', n8nWebhook);

    try {
      // allow non-2xx so we can inspect resp without axios throwing
      const resp = await axios.post(n8nWebhook, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
        validateStatus: () => true
      });

      if (resp.status >= 200 && resp.status < 300) {
        console.log('[publish-and-notify] n8n responded status=', resp.status);
        return res.json({ ok: true, published: true, forwarded: true, forwardStatus: resp.status });
      } else {
        console.warn('[publish-and-notify] n8n responded non-2xx', resp.status, resp.data);
        return res.json({
          ok: true,
          published: true,
          forwarded: false,
          forwardStatus: resp.status,
          forwardResponse: typeof resp.data === 'object' ? resp.data : String(resp.data)
        });
      }
    } catch (forwardErr) {
      // Network or axios error
      console.error('[publish-and-notify] Error forwarding to n8n:', forwardErr && forwardErr.message);
      return res.json({
        ok: true,
        published: true,
        forwarded: false,
        forwardError: forwardErr && forwardErr.message
      });
    }
  } catch (err) {
    console.error('[publish-and-notify] INTERNAL ERROR:', err);
    return res.status(500).json({ ok: false, error: err.message, stack: err.stack });
  }
});


// GET all content
app.get('/api/content', async (req, res) => {
  try {
    const published = req.query.published;
    const q = {};
    if (published === 'true') q.Published = true;
    if (published === 'false') q.Published = false;

    const list = await Content.find(q).lean().sort({ 'Date Approved': -1 });
    res.json(list);
  } catch (err) {
    console.error('GET /api/content error', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single by id
app.get('/api/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Content.findById(id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });

    res.json({
      _id: doc._id,
      topic: doc.topic,
      Content: doc.Content || '',
      Published: doc.Published || false,
      'Date Approved': doc['Date Approved'] || null,
      'Date Published': doc['Date Published'] || null,
      doc: doc.doc || null,
      versions: doc.versions || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error('GET /api/content/:id error', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update title + HTML content
app.put('/api/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, Content: rawHtml } = req.body;

    const sanitized = sanitizeHtml(rawHtml || '', sanitizerOptions);
    const version = { content: sanitized, date: new Date() };

    const updated = await Content.findByIdAndUpdate(
      id,
      {
        $set: {
          topic: topic,
          Content: sanitized,
          updatedAt: new Date(),
        },
        $push: { versions: version },
      },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/content/:id error', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH publish
app.patch('/api/content/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const publishDate = new Date();

    const updated = await Content.findByIdAndUpdate(
      id,
      {
        $set: {
          Published: true,
          'Date Published': publishDate,
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('PATCH /api/content/:id/publish error', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create (helper to insert test content)
app.post('/api/content', async (req, res) => {
  try {
    const { topic = 'Untitled', Content: rawHtml = '' } = req.body;
    const sanitized = sanitizeHtml(rawHtml || '', sanitizerOptions);
    const doc = new Content({
      topic,
      Content: sanitized,
      'Date Approved': new Date(),
      versions: [{ content: sanitized, date: new Date() }],
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    console.error('POST /api/content error', err);
    res.status(500).json({ error: err.message });
  }
});

// Forward to n8n (server side)
app.post('/api/content/:id/forward', async (req, res) => {
  try {
    const { id } = req.params;
    const { webhookUrl, additionalPayload } = req.body;
    if (!webhookUrl) return res.status(400).json({ error: 'webhookUrl required' });

    const doc = await Content.findById(id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const payload = {
      'Topic Title': doc.topic,
      Content: doc.Content,
      ...additionalPayload,
    };

    await axios.post(webhookUrl, payload, { headers: { 'Content-Type': 'application/json' } });
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/content/:id/forward error', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- SERVER START ----------
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
