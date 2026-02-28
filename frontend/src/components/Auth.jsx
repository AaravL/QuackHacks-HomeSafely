import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { authService } from '../services/api';
import '../styles/Auth.css';

const Auth = ({ onSwitch }) => {
  const { login } = useContext(AppContext);
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    gender: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const response = await authService.login(formData.email, formData.password);
        login(response.data.user, response.data.token);
        onSwitch('feed');
      } else {
        await authService.register(
          formData.email,
          formData.password,
          formData.age,
          formData.gender,
          formData.name
        );
        setMode('login');
        setFormData({ ...formData, password: '' });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🏠 HomeSafely</h1>
        <p className="subtitle">Travel home safely with others</p>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <select
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
              >
                <option value="">Select Age</option>
                {Array.from({ length: 60 }, (_, i) => 18 + i).map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <button
          className="toggle-mode"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login'
            ? "Don't have an account? Register"
            : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
