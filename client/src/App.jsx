import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { getUsers } from './services/api';
import Feed from './components/Feed';
import PostDetail from './components/PostDetail';
import Leaderboard from './components/Leaderboard';
import './index.css';

// User context — shared across all components
export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

function App() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    getUsers().then(data => {
      setUsers(data);
      if (data.length > 0) setCurrentUserId(data[0].id);
    });
  }, []);

  return (
    <UserContext.Provider value={{ currentUserId, users }}>
      <BrowserRouter>
        <nav className="app-navbar">
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a className="navbar-brand" href="/" style={{ textDecoration: 'none' }}>
              <span className="brand-icon">💬</span>
              Community Feed
            </a>
            <div className="user-selector">
              <label>Acting as:</label>
              <select
                value={currentUserId || ''}
                onChange={e => setCurrentUserId(Number(e.target.value))}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>
          </div>
        </nav>

        <div className="main-layout">
          <main>
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/post/:id" element={<PostDetail />} />
            </Routes>
          </main>
          <aside>
            <Leaderboard />
          </aside>
        </div>
      </BrowserRouter>
    </UserContext.Provider>
  );
}

export default App;
