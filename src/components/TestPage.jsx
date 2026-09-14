import { useContext, useEffect, useState, useRef } from 'react';
import { TestContext } from '../context/TestContext';
import { languages, generateStarterCode } from '../utils/testData';
import { initSocket, executeCode } from '../utils/api';
import { TbCancel } from "react-icons/tb";
import { FaPlay, FaTerminal, FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { FiCheck, FiChevronLeft, FiChevronRight, FiVideo } from "react-icons/fi";

export default function TestPage() {
  const {
    studentInfo,
    currentQuestionIndex,
    answers,
    objectiveAnswers,
    setAnswer,
    setObjectiveAnswer,
    clearObjectiveAnswer,
    moveToNextQuestion,
    moveToPreviousQuestion,
    goToQuestion,
    submitTest,
    selectedLanguage,
    setSelectedLanguage,
    languageLocked,
    setLanguageLocked,
    timeRemaining,
    setTimeRemaining,
    timerStarted,
    startTimer,
    testQuestions,           // dynamic from backend
    testMeta,                // { testId, title, duration, type }
  } = useContext(TestContext);

  const isObjective = testMeta?.type === 'objective';
  const isTestActive = isObjective ? timerStarted : languageLocked;

  const question = testQuestions[currentQuestionIndex];
  const [code, setCode] = useState('');
  const [mediaStream, setMediaStream] = useState(null);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const videoRef = useRef(null);
  const permissionRequestedRef = useRef(false);
  const isWindowFocusedRef = useRef(true);

  // Code runner states
  const [isRunning, setIsRunning] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // Comment out it in production
  // ===================================================================================================
  const isFullscreenExempt = studentInfo?.name?.trim().toLowerCase() === 'aniruddha'
    && studentInfo?.rollNo?.trim().toUpperCase() === 'A123';
  // ===================================================================================================

  // Reset console result when switching questions
  useEffect(() => {
    setRunResult(null);
  }, [currentQuestionIndex]);

  // Use ref for state variables needed in stable useEffect listeners
  const testStateRef = useRef({ isTestActive, testQuestions, submitTest });

  useEffect(() => {
    testStateRef.current = { isTestActive, testQuestions, submitTest };
  }, [isTestActive, testQuestions, submitTest]);

  // WebRTC & Socket refs
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({}); // AdminSocketId -> RTCPeerConnection

  // Initialize code when question or language changes (coding test)
  useEffect(() => {
    if (isObjective || !question) return;
    const answerKey = `${question.id}_${selectedLanguage}`;
    const savedAnswer = answers[answerKey];
    if (savedAnswer) {
      setCode(savedAnswer);
    } else {
      setCode(generateStarterCode(question, selectedLanguage));
    }
  }, [currentQuestionIndex, selectedLanguage, question?.id, answers, isObjective]);

  // Timer logic - runs when test is active
  useEffect(() => {
    if (!timerStarted) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.warn('Exit fullscreen failed:', err));
          }
          submitTest(testQuestions);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStarted, submitTest, testQuestions, setTimeRemaining]);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (question) setAnswer(question.id, newCode, selectedLanguage);
  };

  const handleLanguageChange = (langId) => {
    if (!languageLocked) {
      if (question) setAnswer(question.id, code, selectedLanguage);
      setSelectedLanguage(langId);
      setLanguageLocked(true);
      startTimer();
    }
  };

  const handleStartObjectiveTest = () => {
    if (!isFullscreenExempt && !document.fullscreenElement) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.warn('Fullscreen request failed:', err));
      }
    }
    startTimer();
  };

  const handleRunCode = async () => {
    if (!code || !code.trim()) {
      setRunResult({
        isError: true,
        stderr: 'Error: Please write some code before clicking Run Code.',
        status: 'Empty Code',
      });
      setIsConsoleOpen(true);
      return;
    }

    setIsRunning(true);
    setIsConsoleOpen(true);
    setRunResult(null);

    try {
      const res = await executeCode({
        sourceCode: code,
        language: selectedLanguage,
        stdin: customInput,
      });

      setRunResult({
        stdout: res.stdout || '',
        stderr: res.stderr || '',
        compile_output: res.compile_output || '',
        status: res.status || 'Executed',
        time: res.time,
        memory: res.memory,
        isError: Boolean(res.stderr || res.compile_output || (res.status && !['Accepted', 'Executed'].includes(res.status))),
      });
    } catch (err) {
      setRunResult({
        isError: true,
        stderr: err.message || 'An error occurred while executing the code.',
        status: 'Execution Failed',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleNext = () => moveToNextQuestion(testQuestions);
  const handlePrevious = () => moveToPreviousQuestion(testQuestions);

  const handleSubmit = () => {
    const unansweredCount = isObjective
      ? testQuestions.filter(q => objectiveAnswers[q.id] === undefined).length
      : 0;

    let confirmMsg = 'Are you sure you want to submit the test? You cannot change answers after submission.';
    if (isObjective && unansweredCount > 0) {
      confirmMsg = `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Are you sure you want to submit?`;
    }

    if (window.confirm(confirmMsg)) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.warn('Exit fullscreen failed:', err));
      }
      submitTest(testQuestions);
    }
  };

  const isLastQuestion = currentQuestionIndex === testQuestions.length - 1;

  // Fullscreen enforcement on test active
  useEffect(() => {
    if (isTestActive && !isFullscreenExempt && !document.fullscreenElement) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.warn('Fullscreen request failed:', err));
      }
    }
  }, [isFullscreenExempt, isTestActive]);

  // Anti-cheating measures (Copy/Paste, Screenshot)
  useEffect(() => {
    const preventCopyPaste = (e) => {
      e.preventDefault();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
        alert('Screenshots are not allowed!');
        e.preventDefault();
      }
      if (e.ctrlKey || e.metaKey) {
        const forbiddenKeys = ['c', 'v', 'x', 'p', 's'];
        if (forbiddenKeys.includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const checkFocus = () => {
      const currentlyFocused = !(document.hidden || !document.hasFocus());

      if (!currentlyFocused && isWindowFocusedRef.current) {
        // Focus was just lost
        const { isTestActive: active, testQuestions: questions, submitTest: submit } = testStateRef.current;
        if (active) {
          alert("Violation Detected: You have left the test window or opened an external tool (e.g., screenshot tool). Your test is being submitted automatically.");
          submit(questions);
        }
      }

      isWindowFocusedRef.current = currentlyFocused;
      setIsWindowFocused(currentlyFocused);
    };

    // Use an interval as a robust fallback for focus events
    const focusInterval = setInterval(checkFocus, 300);

    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', checkFocus);
    window.addEventListener('focus', checkFocus);
    document.addEventListener('visibilitychange', checkFocus);

    return () => {
      clearInterval(focusInterval);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', checkFocus);
      window.removeEventListener('focus', checkFocus);
      document.removeEventListener('visibilitychange', checkFocus);
    };
  }, []);

  // Auto-submit if fullscreen exited during active test
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (isTestActive && !isFullscreenExempt && !document.fullscreenElement) {
        alert('Fullscreen mode was exited. Your test has been submitted.');
        submitTest(testQuestions);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreenExempt, isTestActive, testQuestions, submitTest]);

  // Camera / mic access when test starts
  useEffect(() => {
    if (isTestActive && !permissionRequestedRef.current) {
      permissionRequestedRef.current = true;

      const requestMediaAccess = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
          });
          setMediaStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play().catch(err => console.warn('Video play failed:', err));
            };
          }

          // Connect to socket for WebRTC signaling
          const socket = initSocket();
          socketRef.current = socket;

          socket.on('connect', () => {
            socket.emit('register-student', {
              testId: studentInfo?.testId,
              rollNo: studentInfo?.rollNo,
              name: studentInfo?.name
            });
          });

          // Handle incoming WebRTC connection request from admin
          socket.on('request-offer', async (data) => {
            const { adminSocketId } = data;

            const pc = new RTCPeerConnection({
              iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerConnectionsRef.current[adminSocketId] = pc;

            // Add local camera tracks to the peer connection
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
              if (event.candidate) {
                socket.emit('ice-candidate', {
                  targetSocketId: adminSocketId,
                  candidate: event.candidate
                });
              }
            };

            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('webrtc-offer', {
                adminSocketId,
                offer
              });
            } catch (err) {
              console.error('Error creating WebRTC offer:', err);
            }
          });

          // Handle answer from admin
          socket.on('webrtc-answer', async (data) => {
            const { adminSocketId, answer } = data;
            const pc = peerConnectionsRef.current[adminSocketId];
            if (pc) {
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
              } catch (e) {
                console.error('Error setting remote description from answer:', e);
              }
            }
          });

          // Handle incoming ICE candidates from admin
          socket.on('ice-candidate', async (data) => {
            const { sourceSocketId, candidate } = data;
            const pc = peerConnectionsRef.current[sourceSocketId];
            if (pc) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error('Error adding ICE candidate', e);
              }
            }
          });
        } catch (err) {
          console.error('Camera/Microphone access error:', err);
          permissionRequestedRef.current = false;
          alert('Camera and microphone access is required. Please allow access and refresh the page.');
        }
      };

      requestMediaAccess();
    }

    return () => {
      if (mediaStream && !isTestActive) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        permissionRequestedRef.current = false;
      }

      // Cleanup WebRTC connections
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      peerConnectionsRef.current = {};
    };
  }, [isTestActive, studentInfo]);

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 300) return 'text-red-600';
    if (timeRemaining <= 900) return 'text-orange-500';
    return 'text-primary';
  };

  // Safety: if questions haven't loaded yet
  if (!testQuestions || testQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-secondary font-medium">Loading test questions...</p>
        </div>
      </div>
    );
  }

  // Parse examples and constraints from string (stored as string in backend for coding tests)
  const renderExamples = () => {
    if (!question?.examples) return null;
    const lines = question.examples.split('\n').filter(Boolean);
    return (
      <div className="bg-bg-light rounded-lg p-4 border border-gray-200">
        {lines.map((line, idx) => (
          <p key={idx} className="text-xs text-text-secondary font-mono leading-relaxed">{line}</p>
        ))}
      </div>
    );
  };

  const renderConstraints = () => {
    if (!question?.constraints) return null;
    const lines = question.constraints.split('\n').filter(Boolean);
    return (
      <ul className="space-y-2">
        {lines.map((line, idx) => (
          <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">▸</span>
            <span className="font-normal">{line}</span>
          </li>
        ))}
      </ul>
    );
  };

  // ─── OBJECTIVE TEST PRE-START SCREEN ─────────────────────────────────────────
  if (isObjective && !timerStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-8 md:p-10 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            📝
          </div>
          <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
            Objective (MCQ) Assessment
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {testMeta?.title || 'Objective Test'}
          </h1>
          <p className="text-sm text-slate-500 mb-6 font-mono font-semibold">
            Test ID: {testMeta?.testId || studentInfo?.testId}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6 text-left">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Questions</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{testQuestions.length}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Duration</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{testMeta?.duration || 60} mins</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Candidate</p>
              <p className="text-base font-bold text-slate-800 mt-1 truncate">{studentInfo?.name}</p>
              <p className="text-xs font-mono text-slate-500 truncate">{studentInfo?.rollNo}</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left mb-6 text-xs text-amber-900 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
              ⚠️ Important Instructions & Guidelines:
            </p>
            <p>• Clicking <strong>"Start Assessment"</strong> will activate <strong>Fullscreen Mode</strong> and start the timer immediately.</p>
            <p>• Leaving fullscreen, switching browser tabs, or opening external tools will <strong>auto-submit</strong> your test immediately.</p>
            <p>• Camera and microphone proctoring is mandatory throughout the test.</p>
            <p>• You can navigate between questions and change answers anytime before final submission.</p>
          </div>

          <button
            onClick={handleStartObjectiveTest}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-base shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Start Objective Assessment Now →
          </button>
        </div>
      </div>
    );
  }

  // ─── OBJECTIVE TEST TAKING INTERFACE ─────────────────────────────────────────
  if (isObjective) {
    const answeredCount = Object.keys(objectiveAnswers).length;
    const selectedOptionIndex = objectiveAnswers[question?.id];

    return (
      <div className={`min-h-screen bg-gray-50 px-6 py-4 ${isTestActive ? 'fullscreen-active' : ''}`}>
        {/* Anti-screenshot overlay */}
        {!isWindowFocused && isTestActive && (
          <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center text-white">
            <div className="text-6xl mb-4">
              <TbCancel />
            </div>
            <h2 className="text-3xl font-bold mb-2">Window Lost Focus</h2>
            <p className="text-lg mb-2">Please return to the test window immediately.</p>
            <p className="text-sm text-gray-400">Taking screenshots or leaving the window is prohibited.</p>
          </div>
        )}

        <style>{`
          * { user-select: none; -webkit-user-select: none; }
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: #f4f3ec; border-radius: 10px; }
          ::-webkit-scrollbar-thumb { background: #54D75A; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: #009BA3; }
          * { scrollbar-width: thin; scrollbar-color: #54D75A #f4f3ec; }
          .fullscreen-active { background: #f8fafc; }
          .fullscreen-active::before {
            content: '⛔ Fullscreen Mode Active - Exiting or switching tabs will end the test';
            position: fixed; top: 0; left: 0; right: 0;
            background: linear-gradient(90deg, #ff6b6b, #ff8c42);
            color: white; padding: 6px; text-align: center;
            font-weight: bold; font-size: 13px; z-index: 9999; pointer-events: none;
          }
        `}</style>

        {/* Video element for proctoring */}
        <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />

        <div className="max-w-7xl mx-auto space-y-5">
          {/* Top Header */}
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">{testMeta?.title}</h1>
                <span className="text-[11px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                  Objective MCQ
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Candidate: <span className="font-semibold text-slate-700">{studentInfo?.name}</span> ({studentInfo?.rollNo})
              </p>
            </div>

            {/* Timer */}
            <div className={`flex flex-col items-center px-4 py-2 rounded-xl border-2 ${
              timeRemaining <= 300 ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
            }`}>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Time Remaining</p>
              <p className={`text-2xl font-bold font-mono ${getTimerColor()}`}>
                {formatTime(timeRemaining)}
              </p>
            </div>

            {/* Status & Submit */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Proctored
              </div>
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all text-sm cursor-pointer"
              >
                Submit Test
              </button>
            </div>
          </div>

          {/* Main Grid: Question (8 cols) + Sidebar (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Question Panel */}
            <div className="lg:col-span-8 bg-white rounded-2xl shadow-soft p-6 md:p-8 border border-slate-200 flex flex-col justify-between min-h-[500px]">
              <div>
                {/* Question Info Bar */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-lg text-sm">
                      Question {currentQuestionIndex + 1} of {testQuestions.length}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      question?.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      question?.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {question?.difficulty || 'Medium'}
                    </span>
                  </div>

                  {selectedOptionIndex !== undefined && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <FiCheck /> Answered
                    </span>
                  )}
                </div>

                {/* Question Prompt */}
                <h2 className="text-xl font-bold text-slate-800 leading-relaxed mb-4">
                  {question?.title}
                </h2>

                {/* Optional Description / Code Snippet */}
                {question?.description && (
                  <div className="mb-6 p-4 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl border border-slate-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {question.description}
                  </div>
                )}

                {/* Options List */}
                <div className="space-y-3 mt-6">
                  {(question?.options || []).map((opt, oIdx) => {
                    const isSelected = selectedOptionIndex === oIdx;
                    const optionLetter = String.fromCharCode(65 + oIdx);

                    return (
                      <div
                        key={oIdx}
                        onClick={() => setObjectiveAnswer(question.id, oIdx)}
                        className={`flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {optionLetter}
                        </div>

                        <span className={`flex-1 text-sm ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {opt}
                        </span>

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-primary bg-primary' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Action Bar */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FiChevronLeft /> Previous
                </button>

                {selectedOptionIndex !== undefined && (
                  <button
                    onClick={() => clearObjectiveAnswer(question.id)}
                    className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors cursor-pointer"
                  >
                    Clear Selection
                  </button>
                )}

                {!isLastQuestion ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    Next <FiChevronRight />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm cursor-pointer"
                  >
                    Finish & Submit
                  </button>
                )}
              </div>
            </div>

            {/* Right Sidebar: Question Palette & Proctoring Preview */}
            <div className="lg:col-span-4 space-y-4">
              {/* Question Palette */}
              <div className="bg-white rounded-2xl shadow-soft p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight">Question Overview</h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {answeredCount} / {testQuestions.length} Answered
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 mb-5">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(answeredCount / testQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Palette Grid */}
                <div className="grid grid-cols-5 gap-2.5 max-h-60 overflow-y-auto p-1">
                  {testQuestions.map((q, idx) => {
                    const isAnswered = objectiveAnswers[q.id] !== undefined;
                    const isCurrent = idx === currentQuestionIndex;

                    return (
                      <button
                        key={q.id || idx}
                        onClick={() => goToQuestion(idx, testQuestions)}
                        className={`h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                          isCurrent
                            ? 'ring-2 ring-primary ring-offset-2 bg-primary text-white shadow-sm'
                            : isAnswered
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-slate-100" />
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-primary" />
                    <span>Current</span>
                  </div>
                </div>
              </div>

              {/* Proctoring Card */}
              <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FiVideo className="text-primary" /> Proctoring Monitor
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your webcam and assessment session are securely monitored by the examination system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CODING TEST TAKING INTERFACE ───────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-gray-50 px-6 py-3 ${languageLocked ? 'fullscreen-active' : ''}`}>
      {/* Anti-screenshot overlay */}
      {!isWindowFocused && languageLocked && (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center text-white">
          <div className="text-6xl mb-4">
            <TbCancel /></div>
          <h2 className="text-3xl font-bold mb-2">Window Lost Focus</h2>
          <p className="text-lg mb-2">Please return to the test window.</p>
          <p className="text-sm text-gray-400">Taking screenshots or leaving the window is prohibited.</p>
        </div>
      )}

      <style>{`
        * { user-select: none; -webkit-user-select: none; }
        textarea { user-select: text; -webkit-user-select: text; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f4f3ec; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: #54D75A; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #009BA3; }
        textarea::-webkit-scrollbar { width: 8px; }
        textarea::-webkit-scrollbar-track { background: #08060d; border-radius: 8px; }
        textarea::-webkit-scrollbar-thumb { background: #54D75A; border-radius: 8px; }
        textarea::-webkit-scrollbar-thumb:hover { background: #009BA3; }
        * { scrollbar-width: thin; scrollbar-color: #54D75A #f4f3ec; }
        textarea { scrollbar-color: #54D75A #08060d; }
        .fullscreen-active { background: #000; }
        .fullscreen-active::before {
          content: '⛔ Fullscreen Mode Active - Exiting will end the test';
          position: fixed; top: 0; left: 0; right: 0;
          background: linear-gradient(90deg, #ff6b6b, #ff8c42);
          color: white; padding: 8px; text-align: center;
          font-weight: bold; font-size: 14px; z-index: 9999; pointer-events: none;
        }
      `}</style>

      {/* Hidden video element for camera feed */}
      <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-soft p-5">
          <div className="flex justify-between items-center gap-6">
            <div className="flex-2">
              <p className="text-text-secondary text-xs font-medium mb-2">
                Question {currentQuestionIndex + 1} of {testQuestions.length}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-xs">
                <div
                  className="bg-gradient-to-r from-primary to-secondary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / testQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Timer Display */}
            <div className={`flex flex-col items-center min-w-max px-4 py-2 rounded-lg bg-gray-50 border-2 ${timeRemaining <= 300 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">Time Remaining</p>
              <p className={`text-2xl font-bold font-mono ${getTimerColor()} transition-colors`}>
                {formatTime(timeRemaining)}
              </p>
            </div>

            <div className='flex gap-6'>
              {/* Language Selector */}
              <div className="min-w-max">
                <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2 text-xs uppercase tracking-wide">
                  Language
                  {languageLocked && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">🔒 Locked</span>}
                </h3>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={languageLocked}
                  className={`px-3 py-2 rounded-lg font-semibold border-2 transition-all text-sm ${languageLocked
                    ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-text-primary border-gray-300 focus:border-primary focus:outline-none'
                    }`}
                >
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 min-w-max">
                <div>
                  <div className="text-xs text-text-secondary font-medium uppercase tracking-wide">Progress</div>
                  <div className="text-xl font-bold text-primary">
                    {Math.round(((currentQuestionIndex + 1) / testQuestions.length) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Code Editor & Execution Panel */}
        <div className="flex flex-col gap-4">
          {!languageLocked ? (
            <div className="bg-white rounded-xl shadow-soft p-6 min-h-[500px] flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-4">✏️</div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">Code Editor Ready</h3>
              <p className="text-text-secondary text-sm max-w-sm">Select a programming language above to unlock the code editor and start solving problems.</p>
            </div>
          ) : (
            <>
              {/* Code Editor */}
              <div className="bg-white rounded-xl shadow-soft p-5 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-text-primary text-xs uppercase tracking-wide flex items-center gap-2">
                    <span>💻</span> Write Your Code
                  </h3>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-gray-100 text-gray-700 font-semibold uppercase">
                    {languages.find(l => l.id === selectedLanguage)?.name || selectedLanguage}
                  </span>
                </div>
                <textarea
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="Write your code here..."
                  className="w-full h-80 p-4 bg-[#0f172a] text-[#f8fafc] font-mono text-sm rounded-lg border-2 border-gray-300 focus:border-primary focus:outline-none resize-y leading-relaxed shadow-inner"
                  spellCheck="false"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                />
              </div>

              {/* Action Bar Below Code Editor: Run Code Button & Navigation */}
              <div className="bg-white rounded-xl shadow-soft p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-emerald-600 hover:from-emerald-600 hover:to-primary text-white font-bold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm active:scale-95 cursor-pointer"
                    title="Run code against sandbox"
                  >
                    {isRunning ? (
                      <>
                        <FaSpinner className="animate-spin text-sm" />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <FaPlay className="text-xs" />
                        <span>Run Code</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCustomInput(prev => !prev)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      showCustomInput
                        ? 'bg-gray-100 text-primary border-primary'
                        : 'bg-white text-text-secondary border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {showCustomInput ? 'Hide Stdin' : 'Custom Input'}
                  </button>

                  {runResult && (
                    <button
                      type="button"
                      onClick={() => setRunResult(null)}
                      className="text-xs text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      Clear Output
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  {!isLastQuestion ? (
                    <button
                      onClick={handleNext}
                      className="px-6 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 text-sm cursor-pointer"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 text-sm cursor-pointer"
                    >
                      Submit Test
                    </button>
                  )}
                </div>
              </div>

              {/* Optional Custom Input Box */}
              {showCustomInput && (
                <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                      Standard Input (Stdin)
                    </label>
                    <span className="text-[11px] text-text-secondary">Input passed to your program</span>
                  </div>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter standard input for your program here..."
                    className="w-full h-20 p-2.5 bg-gray-50 text-text-primary font-mono text-xs rounded-lg border border-gray-300 focus:border-primary focus:outline-none resize-none"
                    spellCheck="false"
                  />
                </div>
              )}

              {/* Terminal / Output Console */}
              {(runResult || isRunning) && (
                <div className="bg-[#0b0f19] rounded-xl shadow-soft overflow-hidden border border-gray-800 transition-all">
                  {/* Console Header */}
                  <div className="bg-[#131b2e] px-4 py-2.5 flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-2">
                      <FaTerminal className="text-primary text-xs" />
                      <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Console Output</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isRunning ? (
                        <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-medium">
                          <FaSpinner className="animate-spin text-xs" />
                          <span>Executing...</span>
                        </div>
                      ) : runResult ? (
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            runResult.isError
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {runResult.isError ? (
                              <FaTimesCircle className="text-[10px]" />
                            ) : (
                              <FaCheckCircle className="text-[10px]" />
                            )}
                            {runResult.status}
                          </span>

                          {runResult.time && (
                            <span className="text-[11px] font-mono text-gray-400">
                              {runResult.time}s
                            </span>
                          )}

                          {runResult.memory && (
                            <span className="text-[11px] font-mono text-gray-400">
                              {(runResult.memory / 1024).toFixed(1)}MB
                            </span>
                          )}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setIsConsoleOpen(prev => !prev)}
                        className="text-gray-400 hover:text-gray-200 text-xs font-bold px-1.5 py-0.5 cursor-pointer"
                        title={isConsoleOpen ? 'Collapse console' : 'Expand console'}
                      >
                        {isConsoleOpen ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>

                  {/* Console Body */}
                  {isConsoleOpen && (
                    <div className="p-4 font-mono text-xs leading-relaxed max-h-60 overflow-y-auto">
                      {isRunning ? (
                        <div className="text-gray-400 py-3 flex items-center gap-2">
                          <FaSpinner className="animate-spin text-primary" />
                          Compiling and executing in sandbox...
                        </div>
                      ) : runResult ? (
                        <div className="space-y-3">
                          {/* Compilation Errors */}
                          {runResult.compile_output && (
                            <div className="text-red-400 whitespace-pre-wrap bg-red-950/30 p-2.5 rounded border border-red-900/50">
                              <div className="font-bold text-red-300 mb-1">Compilation Error:</div>
                              {runResult.compile_output}
                            </div>
                          )}

                          {/* Runtime Errors */}
                          {runResult.stderr && (
                            <div className="text-red-400 whitespace-pre-wrap bg-red-950/30 p-2.5 rounded border border-red-900/50">
                              <div className="font-bold text-red-300 mb-1">Runtime Error / Stderr:</div>
                              {runResult.stderr}
                            </div>
                          )}

                          {/* Standard Output */}
                          {runResult.stdout && (
                            <div className="text-emerald-300 whitespace-pre-wrap">
                              <div className="font-bold text-gray-400 text-[11px] mb-1">Stdout:</div>
                              {runResult.stdout}
                            </div>
                          )}

                          {/* No output message */}
                          {!runResult.compile_output && !runResult.stderr && !runResult.stdout && (
                            <div className="text-gray-400 italic">
                              Program executed successfully with no output. (Tip: Use print() or console.log() to display results).
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Problem Box */}
        <div className="bg-white rounded-xl shadow-soft p-6 overflow-y-auto max-h-[calc(100vh-160px)] sticky top-6">
          {!languageLocked ? (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">Select a Language to Begin</h3>
              <p className="text-text-secondary text-sm max-w-sm">Please select your preferred programming language from the selector above to start the test and view the questions.</p>
            </div>
          ) : (
            <>
              {/* Title and Difficulty */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-text-primary">{question?.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${question?.difficulty === 'Easy'
                    ? 'bg-green-100 text-green-700'
                    : question?.difficulty === 'Medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                    {question?.difficulty}
                  </span>
                </div>
                <p className="text-text-secondary text-xs font-medium">Problem {currentQuestionIndex + 1} of {testQuestions.length}</p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-text-primary mb-3 text-sm uppercase tracking-wide">Description</h3>
                <p className="text-text-secondary leading-relaxed text-sm font-normal">{question?.description}</p>
              </div>

              {/* Examples */}
              {question?.examples && (
                <div className="mb-6">
                  <h3 className="font-semibold text-text-primary mb-3 text-sm uppercase tracking-wide">Examples</h3>
                  {renderExamples()}
                </div>
              )}

              {/* Constraints */}
              {question?.constraints && (
                <div>
                  <h3 className="font-semibold text-text-primary mb-3 text-sm uppercase tracking-wide">Constraints</h3>
                  {renderConstraints()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
