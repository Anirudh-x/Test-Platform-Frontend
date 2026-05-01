import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';
import { AdminContext } from '../context/AdminContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useContext(AdminContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen from-emerald-50 to-cyan-50 flex items-center justify-center p-4 bg-gradient-to-br">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 border-2 border-primary-border">
        {/* Header */}
        <div className="text-center">
          <div className="inline-block bg-primary-light p-4 rounded-full mb-4">
            <FiLock className="text-4xl text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
            Admin Login
          </h1>
          <p className="text-text-secondary text-sm">Access the admin dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-2.5 rounded-lg border-2 bg-white border-primary-border text-text-primary focus:border-primary focus:bg-primary-light outline-none transition-all disabled:opacity-50 text-sm"
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 rounded-lg border-2 bg-white border-primary-border text-text-primary focus:border-primary focus:bg-primary-light outline-none transition-all disabled:opacity-50 text-sm"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-400 rounded-lg">
              <p className="text-red-700 text-sm font-semibold">❌ {error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 mt-4 text-sm flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Logging in...
              </>
            ) : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
