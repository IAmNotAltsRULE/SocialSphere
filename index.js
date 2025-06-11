```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SocialSphere</title>
    <script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js"></script>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div id="root"></div>
    <div id="error" class="hidden error"></div>

    <script type="text/babel">
        try {
            function App() {
                const [posts, setPosts] = React.useState([]);
                const [newPost, setNewPost] = React.useState('');
                const [username, setUsername] = React.useState('User' + Math.floor(Math.random() * 1000));
                const [image, setImage] = React.useState(null);
                const [imagePreview, setImagePreview] = React.useState(null);
                const [newComments, setNewComments] = React.useState({});
                const userId = React.useRef('user_' + Math.random().toString(36).substr(2, 9));

                // Fetch posts on mount
                React.useEffect(() => {
                    fetch('/api/posts')
                        .then(res => res.json())
                        .then(data => setPosts(data))
                        .catch(err => console.error('Error fetching posts:', err));
                }, []);

                const handleImageChange = (e) => {
                    const file = e.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        setImage(file);
                        const reader = new FileReader();
                        reader.onload = () => setImagePreview(reader.result);
                        reader.readAsDataURL(file);
                    } else {
                        setImage(null);
                        setImagePreview(null);
                    }
                };

                const handlePostSubmit = async (e) => {
                    e.preventDefault();
                    if (!newPost.trim() && !image) return;
                    try {
                        const post = { content: newPost, author: username };
                        if (image) post.image = imagePreview;
                        const res = await fetch('/api/posts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(post)
                        });
                        if (!res.ok) throw new Error('Failed to create post');
                        const newPostData = await res.json();
                        setPosts([newPostData, ...posts]);
                        setNewPost('');
                        setImage(null);
                        setImagePreview(null);
                    } catch (error) {
                        console.error('Error posting:', error);
                        document.getElementById('error').classList.remove('hidden');
                        document.getElementById('error').textContent = 'Failed to post. Please try again.';
                    }
                };

                const handleLike = async (postId) => {
                    try {
                        const res = await fetch(`/api/posts/${postId}/like`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: userId.current })
                        });
                        if (res.ok) {
                            setPosts(posts.map(post =>
                                post.id === postId ? { ...post, likes: post.likes + 1 } : post
                            ));
                        }
                    } catch (error) {
                        console.error('Error liking post:', error);
                    }
                };

                const handleCommentChange = (postId, value) => {
                    setNewComments({ ...newComments, [postId]: value });
                };

                const handleCommentSubmit = async (postId) => {
                    const commentText = newComments[postId]?.trim();
                    if (!commentText) return;
                    try {
                        const res = await fetch(`/api/posts/${postId}/comment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content: commentText, author: username })
                        });
                        if (!res.ok) throw new Error('Failed to add comment');
                        const newComment = await res.json();
                        setPosts(posts.map(post =>
                            post.id === postId
                                ? { ...post, comments: [...(post.comments || []), newComment] }
                                : post
                        ));
                        setNewComments({ ...newComments, [postId]: '' });
                    } catch (error) {
                        console.error('Error adding comment:', error);
                    }
                };

                return (
                    <div className="container">
                        <h1 className="title">SocialSphere</h1>
                        
                        <div className="post-form">
                            <div>
                                <textarea
                                    className="post-input"
                                    placeholder="What's on your mind?"
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                    rows="3"
                                ></textarea>
                                <div className="form-footer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="file-input"
                                        onChange={handleImageChange}
                                    />
                                    {imagePreview && (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="preview"
                                        />
                                    )}
                                    <div className="form-actions">
                                        <input
                                            type="text"
                                            className="username-input"
                                            placeholder="Your username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            onClick={handlePostSubmit}
                                            className="post-button"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="post-feed">
                            {posts.map(post => (
                                <div key={post.id} className="post">
                                    <div className="post-header">
                                        <h3 className="author">{post.author}</h3>
                                        <span className="timestamp">{post.timestamp}</span>
                                    </div>
                                    <p className="post-content">{post.content}</p>
                                    {post.image && (
                                        <img
                                            src={post.image}
                                            alt="Post"
                                            className="post-image"
                                        />
                                    )}
                                    <div className="post-actions">
                                        <button
                                            onClick={() => handleLike(post.id)}
                                            className="post-button"
                                        >
                                            Like ({post.likes})
                                        </button>
                                    </div>
                                    <div className="comment-section">
                                        <div className="comment-form">
                                            <input
                                                type="text"
                                                className="comment-input"
                                                placeholder="Post comment..."
                                                value={newComments[post.id] || ''}
                                                onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                            />
                                            <button
                                                onClick={() => handleCommentSubmit(post.id)}
                                                className="comment-button"
                                            >
                                                Comment
                                            </button>
                                        </div>
                                        {post.comments && post.comments.length > 0 && (
                                            <div className="comments-container">
                                                {post.comments.map(comment => (
                                                    <div key={comment.id} className="comment">
                                                        <div className="comment-header">
                                                            <span className="author">{comment.author}</span>
                                                            <span className="timestamp">{comment.timestamp}</span>
                                                        </
