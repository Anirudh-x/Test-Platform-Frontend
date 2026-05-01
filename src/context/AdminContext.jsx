import { createContext, useState, useCallback, useEffect, useRef } from 'react';
import * as api from '../utils/api';

export const AdminContext = createContext();

const POLL_INTERVAL_MS = 5000; // refresh every 5 seconds

export function AdminProvider({ children }) {
  const [adminUser, setAdminUser]       = useState(null);
  const [adminToken, setAdminToken]     = useState(localStorage.getItem('adminToken') || null);
  const [allStudents, setAllStudents]   = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [allTests, setAllTests]         = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(null);

  const pollRef       = useRef(null);
  const unsubRef      = useRef(null);
  const isMountedRef  = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ─── Core fetch helpers (used by both polling and manual refresh) ──────────

  const _fetchStudents = useCallback(async () => {
    try {
      const data = await api.getAdminStudents();
      if (data.success && isMountedRef.current) {
        setAllStudents(data.students);
      }
    } catch (err) {
      console.warn('Poll: students fetch failed', err.message);
    }
  }, []);

  const _fetchTests = useCallback(async () => {
    try {
      const data = await api.getAdminTests();
      if (data.success && isMountedRef.current) {
        const tests = data.tests.map(t => ({
          ...t,
          createdDate: t.createdDate ? new Date(t.createdDate) : new Date(),
        }));
        setAllTests(tests);
      }
    } catch (err) {
      console.warn('Poll: tests fetch failed', err.message);
    }
  }, []);

  // ─── Polling — runs every POLL_INTERVAL_MS while admin is logged in ────────

  const startPolling = useCallback(() => {
    if (pollRef.current) return; // already polling

    const tick = async () => {
      await Promise.all([_fetchStudents(), _fetchTests()]);
      if (isMountedRef.current) setLastUpdated(new Date());
    };

    tick(); // immediate first tick
    pollRef.current = setInterval(tick, POLL_INTERVAL_MS);
  }, [_fetchStudents, _fetchTests]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ─── SSE — true real-time push layer on top of polling ────────────────────
  // If the SSE connection works, we get sub-second updates.
  // If it fails (old server, network issue), polling covers us every 5 s.

  const connectStream = useCallback(() => {
    if (unsubRef.current) return;

    try {
      const unsub = api.subscribeToStream(
        (payload) => {
          if (!isMountedRef.current) return;

          switch (payload.type) {
            case 'student_started':
              setAllStudents(prev => {
                const exists = prev.some(
                  s => s.rollNo === payload.student.rollNo && s.testId === payload.student.testId
                );
                if (exists) return prev;
                return [payload.student, ...prev];
              });
              setAllTests(prev => prev.map(t =>
                t.id === payload.student.testId
                  ? { ...t, totalStudents: t.totalStudents + 1, inProgress: t.inProgress + 1 }
                  : t
              ));
              setLastUpdated(new Date());
              break;

            case 'student_submitted':
              setAllStudents(prev => prev.map(s =>
                s.rollNo === payload.student.rollNo && s.testId === payload.student.testId
                  ? { ...s, ...payload.student }
                  : s
              ));
              setAllTests(prev => prev.map(t =>
                t.id === payload.student.testId
                  ? { ...t, submitted: t.submitted + 1, inProgress: Math.max(0, t.inProgress - 1) }
                  : t
              ));
              setLastUpdated(new Date());
              break;

            case 'test_created':
              setAllTests(prev => {
                const exists = prev.some(t => t.id === payload.test.id);
                if (exists) return prev;
                return [
                  { ...payload.test, createdDate: new Date(payload.test.createdDate) },
                  ...prev,
                ];
              });
              setLastUpdated(new Date());
              break;

            default:
              break;
          }
        },
        () => {
          if (isMountedRef.current) setStreamConnected(true);
        }
      );
      unsubRef.current = unsub;
    } catch (err) {
      // SSE unavailable — polling alone will keep the data fresh
      console.warn('SSE not available, relying on polling:', err.message);
    }
  }, []);

  const disconnectStream = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    setStreamConnected(false);
  }, []);

  // ─── Start / stop everything when auth state changes ──────────────────────

  useEffect(() => {
    if (adminToken) {
      startPolling();
      connectStream();
    } else {
      stopPolling();
      disconnectStream();
      setAllStudents([]);
      setAllTests([]);
      setLastUpdated(null);
    }

    return () => {
      stopPolling();
      disconnectStream();
    };
  }, [adminToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auth ──────────────────────────────────────────────────────────────────

  const login = useCallback(async (username, password) => {
    try {
      const data = await api.adminLogin(username, password);
      if (data.success) {
        setAdminUser(data.user);
        setAdminToken(data.token);
        localStorage.setItem('adminToken', data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid credentials' };
    }
  }, []);

  const logout = useCallback(() => {
    setAdminUser(null);
    setAdminToken(null);
    localStorage.removeItem('adminToken');
    stopPolling();
    disconnectStream();
  }, [stopPolling, disconnectStream]);

  // ─── Manual fetch (used for initial load in AdminDashboard) ───────────────

  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    await _fetchStudents();
    setLoadingStudents(false);
  }, [_fetchStudents]);

  const fetchTests = useCallback(async () => {
    setLoadingTests(true);
    await _fetchTests();
    setLoadingTests(false);
  }, [_fetchTests]);

  // ─── Create test ───────────────────────────────────────────────────────────

  const createTest = useCallback(async (testData) => {
    try {
      const data = await api.createAdminTest(testData);
      if (data.success) {
        const newTest = {
          ...data.test,
          createdDate: data.test.createdDate ? new Date(data.test.createdDate) : new Date(),
        };
        // Optimistically add — SSE / poll will deduplicate
        setAllTests(prev => {
          const exists = prev.some(t => t.id === newTest.id);
          return exists ? prev : [newTest, ...prev];
        });
        return { success: true, test: newTest };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to create test' };
    }
  }, []);

  // ─── Context value ─────────────────────────────────────────────────────────

  const value = {
    adminUser,
    adminToken,
    allStudents,
    loadingStudents,
    allTests,
    loadingTests,
    streamConnected,
    lastUpdated,
    login,
    logout,
    fetchStudents,
    fetchTests,
    createTest,
    isAuthenticated: !!adminToken,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
