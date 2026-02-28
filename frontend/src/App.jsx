import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Auth from './components/Auth.jsx';
import Feed from './components/Feed.jsx';
import CreatePost from './components/CreatePost.jsx';
import Messages from './components/Messages.jsx';
import { usersService } from './services/api';
import './App.css';

function App() {
  const { user, logout, updateLocation, setUserOnline } = useContext(AppContext);
  const [currentPage, setCurrentPage] = useState('feed');

  useEffect(() => {
    // Get initial location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        updateLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });
    }
  }, [updateLocation]);

  useEffect(() => {
    if (user) {
      // User came online
      setUserOnline(user.id, true);
      usersService.updateStatus(user.id, true);

      // Cleanup on unmount
      return () => {
        setUserOnline(user.id, false);
        usersService.updateStatus(user.id, false);
      };
    }
  }, [user, setUserOnline]);

  if (!user) {
    return <Auth onSwitch={setCurrentPage} />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">🏠 HomeSafely</div>
        <div className="nav-buttons">
          <button
            className={currentPage === 'feed' ? 'active' : ''}
            onClick={() => setCurrentPage('feed')}
          >
            Feed
          </button>
          <button
            className={currentPage === 'create' ? 'active' : ''}
            onClick={() => setCurrentPage('create')}
          >
            Create Trip
          </button>
          <button
            className={currentPage === 'messages' ? 'active' : ''}
            onClick={() => setCurrentPage('messages')}
          >
            Messages
          </button>
          <button onClick={logout} className="logout">
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'feed' && <Feed />}
        {currentPage === 'create' && (
          <CreatePost onPost={() => setCurrentPage('feed')} />
        )}
        {currentPage === 'messages' && <Messages />}
      </main>
    </div>
  );
}

export default App;
