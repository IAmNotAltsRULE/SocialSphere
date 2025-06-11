require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Supabase connection
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  app.get('*', (req, res) => res.status(500).json({ error: 'Server configuration error' }));
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Health check
  app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

  // Get all posts
  app.get('/api/posts', async (req, res) => {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error.message, error.stack);
      res.status(500).json({ error: 'Error fetching posts' });
    }
  });

  // Create a post
  app.post('/api/posts', async (req, res) => {
    try {
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

  // Like a post
  app.post('/api/posts/:id/like', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const { data: likedPost, error: fetchError } = await supabase
        .from('liked_posts')
        .select('post_ids')
        .eq('user_id', userId)
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      const postIds = likedPost ? likedPost.post_ids : [];
      if (postIds.includes(parseInt(id))) {
        return res.status(400).json({ error: 'Already liked' });
      }
      const { error: updateError } = await supabase
        .from('posts')
        .update({ likes: supabase.raw('likes + 1') })
        .eq('id', parseInt(id));
      if (updateError) throw updateError;
      if (likedPost) {
        const { error: upsertError } = await supabase
          .from('liked_posts')
          .update({ post_ids: [...postIds, parseInt(id)] })
          .eq('user_id', userId);
        if (upsertError) throw upsertError;
      } else {
        const { error: insertError } = await supabase
          .from('liked_posts')
          .insert([{ user_id: userId, post_ids: [parseInt(id)] }]);
        if (insertError) throw insertError;
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error liking post:', error.message, error.stack);
      res.status(500).json({ error: 'Error liking post' });
    }
  });

  // Add a comment
  app.post('/api/posts/:id/comment', async (req, res) => {
    try {
      const { id } = req.params;
      const { content, author } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Comment content required' });
      }
      const comment = {
        id: Date.now(),
        content,
        author,
        timestamp: new Date().toLocaleString()
      };
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('comments')
        .eq('id', parseInt(id))
        .single();
      if (fetchError) throw fetchError;
      const updatedComments = [...(post.comments || []), comment];
      const { error: updateError } = await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', parseInt(id));
      if (updateError) throw updateError;
      res.json(comment);
    } catch (error) {
      console.error('Error adding comment:', error.message, error.stack);
      res.status(500).json({ error: 'Error adding comment' });
    }
  });

  // Serve index.html for all non-API routes
  app.get('*', (req, res) => {
    console.log(`Serving index.html for route: ${req.url}`);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

module.exports = app;
