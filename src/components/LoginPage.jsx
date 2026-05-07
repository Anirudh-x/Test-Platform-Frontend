import { useContext, useState, useEffect } from 'react';
import { TestContext } from '../context/TestContext';

export default function LoginPage() {
  const { login, startTest, loginError, loginLoading } = useContext(TestContext);
  const [testId, setTestId] = useState('');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [errors, setErrors] = useState({});
  const [mediaPermissionStatus, setMediaPermissionStatus] = useState('requesting');

  // Request media permissions on component mount
  useEffect(() => {
    const requestMediaPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
        setMediaPermissionStatus('granted');
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('Media permission denied:', err);
        setMediaPermissionStatus('denied');
      }
    };
    requestMediaPermissions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!testId.trim()) newErrors.testId = 'Test ID is required';
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!rollNo.trim()) newErrors.rollNo = 'Roll No is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // login() validates with backend and fetches questions
    const success = await login(testId, name, rollNo);
    if (success) {
      startTest();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 flex items-stretch justify-center px-6 py-10">
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT SECTION - Notes, Rules & Regulations */}
        <div className="flex flex-col gap-6 overflow-y-auto w-[90%]">
          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-4xl h-[3rem] font-bold text-text-primary mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#54D75A] to-[#009BA3]">
              Mountreach Coding Test
            </h2>
            <p className="text-text-secondary text-base font-normal leading-relaxed">Read the guidelines carefully before starting</p>
          </div>

          {/* Test Guidelines */}
          <div className="bg-primary-light rounded-2xl border-2 border-primary p-6">
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              Test Guidelines
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                <span className="text-text-primary text-sm font-normal text-left">Select your programming language to view the questions.</span>
              </li>
              <li className="flex text-left items-start gap-3">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                <span className="text-text-primary text-sm font-normal">After Selecting language fullscreen mode will get enable and your timer will start.</span>
              </li>
              <li className="flex text-left items-start gap-3">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                <span className="text-text-primary text-sm font-normal">Any attempt to leave fullscreen or access external resources will auto-submit your test.</span>
              </li>
              <li className="flex text-left items-start gap-3">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                <span className="text-text-primary text-sm font-normal">If you failed to submit the test within the time limit it will get auto submitted.</span>
              </li>
              <li className="flex text-left items-start gap-3">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">5</span>
                <span className="text-text-primary text-sm font-normal">Do not attempt to refresh or reload the page during the test, to avoid getting eliminated.</span>
              </li>
              <li className="flex text-left items-start gap-3">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">6</span>
                <span className="text-text-primary text-sm font-normal">Do not attempt to take screenshot, it will auto submit the test.</span>
              </li>
              <li className="flex text-left items-start gap-3">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">7</span>
                <span className="text-text-primary text-sm font-normal">Make sure all fields are filled correctly before starting the test</span>
              </li>
              <li className="flex text-left items-start gap-3">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">8</span>
                <span className="text-text-primary text-sm font-normal">You cannot go back or pause once the test is submitted</span>
              </li>
              <li className="flex text-left items-start gap-3">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">9</span>
                <span className="text-text-primary text-sm font-normal">Camera and microphone access is mandatory for the test</span>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT SECTION - Login Form */}
        <div className="flex flex-col justify-center w-[90%]">
          <div className="bg-white rounded-3xl shadow-soft px-10 py-5 space-y-4">
            {/* Logo */}
            <div className="text-center">
              <div className="inline-block bg-primary-light p-4 rounded-full">
                <span>
                  <img src='./favicon.ico' alt="Mountreach Logo" />
                </span>
              </div>
              <h1 className="text-3xl text-text-primary">Mountreach Solutions Pvt. Ltd.</h1>
              <p className="text-text-secondary text-sm font-normal">Enter your details to begin</p>
            </div>

            {/* Permission Status */}
            <div className={`px-4 py-2 rounded-lg border-2 flex items-center gap-3 ${mediaPermissionStatus === 'granted'
              ? 'bg-green-50 border-green-300'
              : mediaPermissionStatus === 'denied'
                ? 'bg-red-50 border-red-300'
                : 'bg-yellow-50 border-yellow-300'
              }`}>
              <span className="text-2xl">
                {mediaPermissionStatus === 'granted' ? '✅' : mediaPermissionStatus === 'denied' ? '❌' : '⏳'}
              </span>
              <div>
                <p className={`text-sm font-semibold ${mediaPermissionStatus === 'granted'
                  ? 'text-green-700'
                  : mediaPermissionStatus === 'denied'
                    ? 'text-red-700'
                    : 'text-yellow-700'
                  }`}>
                  {mediaPermissionStatus === 'granted'
                    ? 'Camera & Microphone Enabled'
                    : mediaPermissionStatus === 'denied'
                      ? 'Camera & Microphone Required'
                      : 'Requesting Camera & Microphone...'}
                </p>
                <p className={`text-xs mt-1 ${mediaPermissionStatus === 'granted'
                  ? 'text-green-600'
                  : mediaPermissionStatus === 'denied'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                  }`}>
                  {mediaPermissionStatus === 'granted'
                    ? 'Your permissions have been configured successfully'
                    : mediaPermissionStatus === 'denied'
                      ? 'Please allow access to camera and microphone to start the test'
                      : 'Please allow access when prompted by your browser'}
                </p>
              </div>
            </div>

            {/* API / Login Error from backend */}
            {loginError && (
              <div className="px-4 py-3 bg-red-50 border-2 border-red-300 rounded-xl flex items-start gap-3">
                <span className="text-xl">❌</span>
                <p className="text-red-700 text-sm font-semibold">{loginError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Test ID Field */}
              <div className='space-y-1'>
                <input
                  id="testId"
                  type="text"
                  value={testId}
                  onChange={(e) => {
                    setTestId(e.target.value);
                    if (errors.testId) setErrors(prev => ({ ...prev, testId: '' }));
                  }}
                  placeholder="Enter your test ID"
                  disabled={loginLoading}
                  className={`w-full px-5 py-3 rounded-xl border-2 transition-all focus:outline-none text-base font-normal disabled:opacity-60 ${errors.testId
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 focus:border-primary focus:bg-primary-light'
                    }`}
                />
                {errors.testId && (
                  <p className="text-red-500 text-xs font-medium">{errors.testId}</p>
                )}
              </div>

              {/* Name Field */}
              <div className='space-y-1'>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="Enter your full name"
                  disabled={loginLoading}
                  className={`w-full px-5 py-3 rounded-xl border-2 transition-all focus:outline-none text-base font-normal disabled:opacity-60 ${errors.name
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 focus:border-primary focus:bg-primary-light'
                    }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs font-medium">{errors.name}</p>
                )}
              </div>

              {/* Roll No Field */}
              <div className='space-y-1'>
                <input
                  id="rollNo"
                  type="text"
                  value={rollNo}
                  onChange={(e) => {
                    setRollNo(e.target.value);
                    if (errors.rollNo) setErrors(prev => ({ ...prev, rollNo: '' }));
                  }}
                  placeholder="Enter your roll number"
                  disabled={loginLoading}
                  className={`w-full px-5 py-3 rounded-xl border-2 transition-all focus:outline-none text-base font-normal disabled:opacity-60 ${errors.rollNo
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 focus:border-primary focus:bg-primary-light'
                    }`}
                />
                {errors.rollNo && (
                  <p className="text-red-500 text-xs font-medium">{errors.rollNo}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="mt-8 w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 text-base disabled:opacity-60 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : 'Start Test'}
              </button>
            </form>

            {/* Agreement Text */}
            <p className="text-xs text-text-secondary text-center font-normal leading-relaxed">
              By clicking "Start Test", you agree to follow all the rules and regulations mentioned above. Violation may result in test cancellation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
