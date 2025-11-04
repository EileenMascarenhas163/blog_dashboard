// backend/server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Schema - flexible for your data
const contentSchema = new mongoose.Schema({}, { strict: false });
const Content = mongoose.model('Content', contentSchema, 'blogdata'); // ← Your collection
// === PUBLISH BLOG ===
app.patch('/api/content/:id/publish', async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await Content.findByIdAndUpdate(
        id,
        { 
          Published: true, 
          $set: { 'Date Published': new Date() } 
        },
        { new: true }
      );
  
      if (!updated) return res.status(404).json({ error: 'Blog not found' });
  
      console.log(`Published blog: ${updated.topic}`);
      res.json(updated);
    } catch (err) {
      console.error('Publish error:', err);
      res.status(500).json({ error: err.message });
    }
  });
// Route: Get all content + LOG TO CONSOLE
app.get('/api/content', async (req, res) => {
  try {
    const contents = await Content.find({});
    
    // PRINT DATA IN CONSOLE
    console.log('=== FETCHED BLOG DATA FROM MONGODB ===');
    contents.forEach((item, index) => {
      console.log(`\n[${index + 1}] Topic: ${item.topic}`);
      console.log(`    Approved: ${item['Date Approved']}`);
      console.log(`    Published: ${item.Published}`);
      console.log(`    Doc ID: ${item.doc}`);
      console.log(`    _id: ${item._id}`);
    });
    console.log('======================================\n');

    res.json(contents);
  } catch (err) {
    console.error('Error fetching data:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Test Route: Just to trigger console print
app.get('/api/test', async (req, res) => {
  res.json({ message: 'Server is running! Check console for blog data.' });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://a208eileenmas_db_user:2NBKhDAcaPUYnvwK@blogcreate.yykocrv.mongodb.net/blog?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas (blogdata collection)');

    // AUTO-FETCH & PRINT DATA ON STARTUP
    Content.find({}).then(data => {
      if (data.length === 0) {
        console.log('⚠️  No data found in blogdata collection.');
      } else {
        console.log(`\n🚀 SERVER STARTUP: Found ${data.length} blog(s)\n`);
        data.forEach((item, i) => {
          console.log(`📄 Blog ${i+1}:`);
          console.log(`   Title: ${item.topic}`);
          console.log(`   Status: ${item.Published ? '🟢 PUBLISHED' : '🔴 DRAFT'}`);
          console.log(`   Google Doc: https://docs.google.com/document/d/${item.doc}`);
          console.log('   ---');
        });
        console.log('\n🌐 Visit: http://localhost:5173 to view portal\n');
      }
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Failed:', err.message);
  });

  if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  }
module.exports = app;