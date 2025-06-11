```javascript
const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://socialsphere_user:<your-password>@cluster0.abc123.mongodb.net/socialsphere?retryWrites=true&w=majority';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Post schema
const postSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  content: String,
  author: String,
  timestamp: String,
  likes: { type: Number, default: 0 },
  image: String,
  comments: [{
    id: Number,
    content: String,
    author: String,
    timestamp: String
  }]
});
const Post = mongoose.model('Post', postSchema);

// Liked posts schema
const likedPostSchema = new mongoose.Schema({
  userId: String,
  postIds: [Number]
});
const LikedPost = mongoose.model('LikedPost', likedPostSchema);

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ id: -1 });
    res.json(posts);
  } catch (error) {
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
    const post = new Post({
      id: Date.now(),
      content,
      author,
      timestamp: new Date().toLocaleString(),
      likes: 0,
      comments: [],
      image
    });
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error creating post' });
  }
});

// Like a post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const likedPost = await LikedPost.findOne({ userId });
    const postIds = likedPost ? likedPost.postIds : [];
    if (postIds.includes(parseInt(id))) {
      return res.status(400).json({ error: 'Already liked' });
    }
    await Post.findOneAndUpdate({ id: parseInt(id) }, { $inc: { likes: 1 } });
    if (likedPost) {
      likedPost.postIds.push(parseInt(id));
      await likedPost.save();
    } else {
      await new LikedPost({ userId, postIds: [parseInt(id)] }).save();
    }
    res.json({ success: true });
  } catch (error) {
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
    await Post.findOneAndUpdate(
      { id: parseInt(id) },
      { $push: { comments: comment } }
    );
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Error adding comment' });
  }
});

module.exports = app;
```
