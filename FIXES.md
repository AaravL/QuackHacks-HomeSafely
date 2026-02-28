Fix the import issue in frontend/src/App.jsx:

Change:
```javascript
import Auth from './components/Auth';
import Feed from './components/Feed';
import CreatePost from './components/CreatePost';
import Messages from './components/Messages';
```

To:
```javascript
import Auth from './components/Auth.jsx';
import Feed from './components/Feed.jsx';
import CreatePost from './components/CreatePost.jsx';
import Messages from './components/Messages.jsx';
```

This ensures proper JSX module resolution in Vite.
