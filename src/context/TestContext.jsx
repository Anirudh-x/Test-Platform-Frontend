import { createContext, useState, useCallback } from 'react';
import * as api from '../utils/api';

export const TestContext = createContext();

export function TestProvider({ children }) {
  const [studentInfo, setStudentInfo] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [objectiveAnswers, setObjectiveAnswers] = useState({}); // { [questionId]: optionIndex }
  const [questionTimes, setQuestionTimes] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState('none');
  const [languageLocked, setLanguageLocked] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [timerStarted, setTimerStarted] = useState(false);

  // Dynamic test data fetched from backend
  const [testQuestions, setTestQuestions] = useState([]);
  const [testMeta, setTestMeta] = useState(null); // { testId, title, duration, type }
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // ─── Login: validate test ID + check for duplicate submission ─────────────
  const login = useCallback(async (testId, name, rollNo) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      // 1. Validate with backend (also creates "In Progress" record)
      const loginData = await api.studentLogin(testId, name, rollNo);
      if (!loginData.success) {
        setLoginError(loginData.error || 'Login failed');
        return false;
      }

      // 2. Fetch the test questions
      const testData = await api.getTestQuestions(testId);
      if (!testData.success || !testData.test) {
        setLoginError('Failed to load test questions. Please try again.');
        return false;
      }

      setTestMeta(testData.test);
      setTestQuestions(testData.test.questions || []);
      setTimeRemaining((testData.test.duration || 60) * 60); // convert minutes → seconds
      setStudentInfo({ testId: testId.toUpperCase(), name, rollNo: rollNo.toUpperCase() });
      setTestStarted(false);
      return true;
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoginLoading(false);
    }
  }, []);

  // ─── Start test ────────────────────────────────────────────────────────────
  const startTest = useCallback(() => {
    setTestStarted(true);
    setQuestionStartTime(Date.now());
  }, []);

  // ─── Answer management ─────────────────────────────────────────────────────
  const setAnswer = useCallback((questionId, code, language = 'python') => {
    const key = `${questionId}_${language}`;
    setAnswers(prev => ({ ...prev, [key]: code }));
  }, []);

  const setObjectiveAnswer = useCallback((questionId, optionIndex) => {
    setObjectiveAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  }, []);

  const clearObjectiveAnswer = useCallback((questionId) => {
    setObjectiveAnswers(prev => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  }, []);

  // ─── Navigation ────────────────────────────────────────────────────────────
  const moveToNextQuestion = useCallback((questions) => {
    if (questionStartTime && currentQuestionIndex < questions.length) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionTimes(prev => ({
        ...prev,
        [questions[currentQuestionIndex].id]: (prev[questions[currentQuestionIndex].id] || 0) + timeSpent,
      }));
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, questionStartTime]);

  const moveToPreviousQuestion = useCallback((questions) => {
    if (questionStartTime && currentQuestionIndex < questions.length) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionTimes(prev => ({
        ...prev,
        [questions[currentQuestionIndex].id]: (prev[questions[currentQuestionIndex].id] || 0) + timeSpent,
      }));
    }
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, questionStartTime]);

  const goToQuestion = useCallback((index, questions) => {
    if (questionStartTime && currentQuestionIndex < questions.length) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionTimes(prev => ({
        ...prev,
        [questions[currentQuestionIndex].id]: (prev[questions[currentQuestionIndex].id] || 0) + timeSpent,
      }));
    }
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex, questionStartTime]);

  // ─── Submit: save to backend then mark submitted ───────────────────────────
  const submitTest = useCallback(async (questions) => {
    // Record time for current question
    let finalTimes = { ...questionTimes };
    if (questionStartTime && questions.length > 0 && questions[currentQuestionIndex]) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      const qId = questions[currentQuestionIndex].id;
      finalTimes = {
        ...finalTimes,
        [qId]: (finalTimes[qId] || 0) + timeSpent,
      };
      setQuestionTimes(finalTimes);
    }

    const totalTime = Object.values(finalTimes).reduce((acc, t) => acc + t, 0);
    const isObjective = testMeta?.type === 'objective';

    let answersArray;
    if (isObjective) {
      answersArray = questions.map(q => ({
        questionId: q.id,
        questionTitle: q.title,
        selectedOption: objectiveAnswers[q.id] !== undefined ? objectiveAnswers[q.id] : null,
        timeSpent: finalTimes[q.id] || 0,
      }));
    } else {
      answersArray = questions.map(q => ({
        questionId: q.id,
        questionTitle: q.title,
        code: answers[`${q.id}_${selectedLanguage}`] || '',
        language: selectedLanguage,
        timeSpent: finalTimes[q.id] || 0,
      }));
    }

    try {
      await api.submitTest({
        testId: studentInfo?.testId,
        name: studentInfo?.name,
        rollNo: studentInfo?.rollNo,
        answers: answersArray,
        language: isObjective ? 'objective' : selectedLanguage,
        totalTime,
      });
    } catch (err) {
      console.error('Submit API error:', err);
    }

    setTestSubmitted(true);
  }, [currentQuestionIndex, questionStartTime, questionTimes, answers, objectiveAnswers, selectedLanguage, studentInfo, testMeta]);

  // ─── Reset ─────────────────────────────────────────────────────────────────
  const resetTest = useCallback(() => {
    setStudentInfo(null);
    setTestStarted(false);
    setTestSubmitted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setObjectiveAnswers({});
    setQuestionTimes({});
    setSelectedLanguage('none');
    setLanguageLocked(false);
    setQuestionStartTime(null);
    setTimeRemaining(3600);
    setTimerStarted(false);
    setTestQuestions([]);
    setTestMeta(null);
    setLoginError('');
  }, []);

  const startTimer = useCallback(() => {
    setTimerStarted(true);
  }, []);

  const value = {
    studentInfo,
    testStarted,
    testSubmitted,
    currentQuestionIndex,
    answers,
    objectiveAnswers,
    questionTimes,
    selectedLanguage,
    languageLocked,
    timeRemaining,
    timerStarted,
    testQuestions,
    testMeta,
    loginError,
    loginLoading,
    login,
    startTest,
    setAnswer,
    setObjectiveAnswer,
    clearObjectiveAnswer,
    moveToNextQuestion,
    moveToPreviousQuestion,
    goToQuestion,
    submitTest,
    resetTest,
    setSelectedLanguage,
    setLanguageLocked,
    setTimeRemaining,
    startTimer,
  };

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
}
