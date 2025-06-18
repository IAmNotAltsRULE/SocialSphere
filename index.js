const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Create a post
app.post('/api/posts', async (req, res) => {
  try {
    console.log('Creating post:', req.body);
    const { content, author, image } = req.body;
    if (!content && !image) {
      return res.status(400).json({ error: 'Post content or image required' });
    }
    const post = {
      content,
      author,
      timestamp: new Date().toLocaleString(),
      likes: 0,
      comments: [],
      image
    };
    const { data, error } = await supabase
      .from('posts')
      .insert([post])
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Error creating post:', error.message, error.stack);
    res.status(500).json({ error: 'Error creating post' });
  }
});

// Other routes (like, comment) if needed
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
