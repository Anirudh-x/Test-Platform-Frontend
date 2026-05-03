
import { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TestProvider, TestContext } from './context/TestContext';
import { AdminProvider } from './context/AdminContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './components/LoginPage';
import TestPage from './components/TestPage';
import EndTestPage from './components/EndTestPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function TestAppContent() {
  const { studentInfo, testStarted, testSubmitted } = useContext(TestContext);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const widthCheck = window.innerWidth <= 768;
      setIsMobile(userAgentCheck || widthCheck);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-soft p-8 max-w-md text-center border-t-4 border-primary">
          <div className="text-5xl mb-6">📱🚫</div>
          <h2 className="text-2xl font-bold text-text-primary mb-4">Mobile Access Restricted</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            The coding platform assessment can only be accessed through a desktop or laptop computer. Please open this link on a supported device to continue your test.
          </p>
        </div>
      </div>
    );
  }

  // If test not started, show login page
  if (!studentInfo || !testStarted) {
    return <LoginPage />;
  }

  // If test submitted, show end test page
  if (testSubmitted) {
    return <EndTestPage />;
  }

  // Otherwise show test page
  return <TestPage />;
}

function TestApp() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable developer tools keyboard shortcuts
    const handleKeyDown = (e) => {
      // F12 - Developer Tools
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I - Inspect Element
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J - Console
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C - Inspect Element (alternative)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+K - Developer Console
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, false);
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <TestProvider>
      <TestAppContent />
    </TestProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AdminProvider>
          <Routes>
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Test app routes */}
            <Route path="/" element={<TestApp />} />
            <Route path="*" element={<TestApp />} />
          </Routes>
        </AdminProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
