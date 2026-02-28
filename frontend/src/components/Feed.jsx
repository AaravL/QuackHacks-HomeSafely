import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { postsService, recommendationsService } from '../services/api';
import '../styles/Feed.css';

const Feed = () => {
  const { user, currentLocation, posts, setPosts } = useContext(AppContext);
  const [sortBy, setSortBy] = useState('recommendation');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [sortBy, currentLocation]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      if (sortBy === 'recommendation' && currentLocation) {
        // Get personalized recommendations from Gemini
        const response = await recommendationsService.getPersonalized(
          user.id,
          currentLocation,
          currentLocation // Using same for source and destination - adjust as needed
        );
        setPosts(response.data);
      } else {
        const response = await postsService.getPosts(
          sortBy,
          currentLocation?.lat,
          currentLocation?.lng
        );
        setPosts(response.data);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h1>🏠 Available Trips</h1>
        <div className="sort-options">
          <button
            className={sortBy === 'recommendation' ? 'active' : ''}
            onClick={() => setSortBy('recommendation')}
          >
            Recommended
          </button>
          <button
            className={sortBy === 'closest' ? 'active' : ''}
            onClick={() => setSortBy('closest')}
          >
            Closest
          </button>
          <button
            className={sortBy === 'earliest' ? 'active' : ''}
            onClick={() => setSortBy('earliest')}
          >
            Earliest
          </button>
          <button
            className={sortBy === 'age' ? 'active' : ''}
            onClick={() => setSortBy('age')}
          >
            Age
          </button>
          <button
            className={sortBy === 'gender' ? 'active' : ''}
            onClick={() => setSortBy('gender')}
          >
            Gender
          </button>
        </div>
      </div>

      {loading && <div className="loading">Loading posts...</div>}

      <div className="posts-list">
        {posts && posts.map((post) => (
          <div key={post.ID} className="post-card">
            <div className="post-header">
              <div className="user-info">
                <h3>{post.NAME}</h3>
                <p>{post.AGE} • {post.GENDER}</p>
              </div>
              <div className="post-meta">
                <span className="mode-badge">{post.MODE}</span>
              </div>
            </div>

            <div className="post-content">
              <p className="destination">📍 {post.DESTINATION}</p>
              <p className="time">{new Date(post.CREATED_AT).toLocaleTimeString()}</p>
            </div>

            <div className="post-footer">
              <button className="btn-primary">Message</button>
              <button className="btn-secondary">View Details</button>
            </div>
          </div>
        ))}
      </div>

      {!loading && posts.length === 0 && (
        <div className="empty-state">
          <p>No trips available in your area</p>
        </div>
      )}
    </div>
  );
};

export default Feed;
