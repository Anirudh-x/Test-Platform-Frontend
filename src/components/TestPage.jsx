import { useContext, useEffect, useState, useRef } from 'react';
import { TestContext } from '../context/TestContext';
import { languages, generateStarterCode } from '../utils/testData';

export default function TestPage() {
  const {
    currentQuestionIndex,
    answers,
    setAnswer,
    moveToNextQuestion,
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
    testMeta,                // { testId, title, duration }
  } = useContext(TestContext);

  const question = testQuestions[currentQuestionIndex];
  const [code, setCode] = useState('');
  const [mediaStream, setMediaStream] = useState(null);
  const videoRef = useRef(null);
  const permissionRequestedRef = useRef(false);

  // Initialize code when question or language changes
  useEffect(() => {
    if (!question) return;
    const answerKey = `${question.id}_${selectedLanguage}`;
    const savedAnswer = answers[answerKey];
    if (savedAnswer) {
      setCode(savedAnswer);
    } else {
      // Generate language-specific starter code so switching language
      // always shows the correct syntax (not the Python admin template).
      setCode(generateStarterCode(question, selectedLanguage));
    }
  }, [currentQuestionIndex, selectedLanguage, question?.id, answers]);

  // Timer logic - starts when language is locked
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
  }, [timerStarted, submitTest, testQuestions]);

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

  const handleNext = () => moveToNextQuestion(testQuestions);


  const handleSubmit = () => {
    if (window.confirm('Are you sure you want to submit the test? You cannot change answers after submission.')) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.warn('Exit fullscreen failed:', err));
      }
      submitTest(testQuestions);
    }
  };

  const isLastQuestion = currentQuestionIndex === testQuestions.length - 1;

  // Fullscreen on language lock
  useEffect(() => {
    if (languageLocked && !document.fullscreenElement) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.warn('Fullscreen request failed:', err));
      }
    }
  }, [languageLocked]);

  // Auto-submit if fullscreen exited during test
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (languageLocked && !document.fullscreenElement) {
        alert('Fullscreen mode was exited. Your test has been submitted.');
        submitTest(testQuestions);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [languageLocked, testQuestions, submitTest]);

  // Camera / mic access when test starts
  useEffect(() => {
    if (languageLocked && !permissionRequestedRef.current) {
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
        } catch (err) {
          console.error('Camera/Microphone access error:', err);
          permissionRequestedRef.current = false;
          alert('Camera and microphone access is required. Please allow access and refresh the page.');
        }
      };

      requestMediaAccess();
    }

    return () => {
      if (mediaStream && !languageLocked) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        permissionRequestedRef.current = false;
      }
    };
  }, [languageLocked]);

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

  // Parse examples and constraints from string (stored as string in backend)
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

  return (
    <div className={`min-h-screen bg-gray-50 px-6 py-3 ${languageLocked ? 'fullscreen-active' : ''}`}>
      <style>{`
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
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problem Section */}
        <div className="bg-white rounded-xl shadow-soft p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {!languageLocked ? (
            <div className="flex flex-col items-center justify-center min-h-96 text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">Select a Language to Begin</h3>
              <p className="text-text-secondary text-sm">Please select your preferred programming language from the selector above to start the test and view the questions.</p>
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

        {/* Code Editor Section */}
        <div className="flex flex-col gap-6 h-[calc(100vh-180px)]">
          {!languageLocked ? (
            <div className="bg-white rounded-xl shadow-soft p-6 flex-1 flex flex-col items-center justify-center">
              <div className="text-5xl mb-4">✏️</div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">Code Editor Ready</h3>
              <p className="text-text-secondary text-sm text-center">Select a programming language above to unlock the code editor and start solving problems.</p>
            </div>
          ) : (
            <>
              {/* Code Editor */}
              <div className="bg-white rounded-xl shadow-soft p-6 flex-1 flex flex-col">
                <h3 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wide">Write Your Code</h3>
                <textarea
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="Write your code here..."
                  className="flex-1 w-full p-4 bg-text-primary text-white font-mono text-sm rounded-lg border-2 border-gray-300 focus:border-primary focus:outline-none resize-none leading-relaxed"
                  spellCheck="false"
                />
              </div>

              {/* Navigation Buttons */}
              <div className="bg-white rounded-xl shadow-soft px-6 py-4">
                <div className="flex gap-4 justify-end">
                  {!isLastQuestion ? (
                    <button
                      onClick={handleNext}
                      className="px-6 py-2 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 text-sm"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 text-sm"
                    >
                      Submit Test
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
