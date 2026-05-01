import { useContext } from 'react';
import { TestContext } from '../context/TestContext';
import { formatTime } from '../utils/testData';

export default function EndTestPage() {
  const { studentInfo, questionTimes, testQuestions, testMeta } = useContext(TestContext);

  const totalTime = Object.values(questionTimes).reduce((acc, time) => acc + time, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 p-8 py-7">
      <div className="max-w-5xl mx-auto">
        {/* Success Message */}
        <div className="bg-white rounded-3xl shadow-soft p-16 text-center mb-12">
          <div className="inline-block bg-green-100 p-2 rounded-full mb-2 animate-bounce">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">
            Test Submitted Successfully!
          </h1>
          <p className="text-text-secondary text-sm font-normal leading-relaxed">
            Thank you for completing the coding test. Your results will be evaluated and shared shortly.
          </p>
          {testMeta?.title && (
            <p className="mt-3 text-text-secondary text-base font-medium">
              Test: <span className="text-primary font-bold">{testMeta.title}</span>
            </p>
          )}
        </div>

        {/* Student Information */}
        <div className="bg-white rounded-3xl shadow-soft p-10 mb-10">
          <h2 className="text-3xl font-bold text-text-primary mb-8 uppercase tracking-wide">Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-secondary-light rounded-2xl p-8 border-l-4 border-secondary">
              <p className="text-text-secondary text-xs font-semibold mb-3 uppercase tracking-wide">Test ID</p>
              <p className="text-3xl font-bold text-text-primary font-mono">{studentInfo?.testId}</p>
            </div>
            <div className="bg-primary-light rounded-2xl p-8 border-l-4 border-primary">
              <p className="text-text-secondary text-xs font-semibold mb-3 uppercase tracking-wide">Name</p>
              <p className="text-3xl font-bold text-text-primary">{studentInfo?.name}</p>
            </div>
            <div className="bg-accent-light rounded-2xl p-8 border-l-4 border-accent">
              <p className="text-text-secondary text-xs font-semibold mb-3 uppercase tracking-wide">Roll No</p>
              <p className="text-3xl font-bold text-text-primary font-mono">{studentInfo?.rollNo}</p>
            </div>
          </div>
        </div>

        {/* Time Summary */}
        <div className="bg-white rounded-3xl shadow-soft p-10 mb-10">
          <h2 className="text-3xl font-bold text-text-primary mb-8 uppercase tracking-wide">Time Summary</h2>
          <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-12 text-center mb-10">
            <p className="text-sm font-semibold opacity-90 mb-3 uppercase tracking-wider">Total Time Taken</p>
            <p className="text-6xl font-bold">{formatTime(totalTime)}</p>
          </div>

          {/* Per-question times */}
          {testQuestions.length > 0 && (
            <div className="space-y-4">
              {testQuestions.map((question, idx) => (
                <div
                  key={question.id}
                  className="flex items-center justify-between p-6 bg-bg-light rounded-xl hover:shadow-md transition-all duration-200 border border-gray-100"
                >
                  <div className="flex items-center gap-5 flex-1">
                    <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary text-base">{question.title}</p>
                      <p className="text-sm text-text-secondary font-medium">{question.difficulty}</p>
                    </div>
                  </div>
                  <div className="text-right min-w-max ml-4">
                    <p className="text-2xl font-bold text-primary font-mono">
                      {formatTime(questionTimes[question.id] || 0)}
                    </p>
                    <p className="text-xs text-text-secondary font-medium mt-1">Time taken</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics */}
        {testQuestions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div className="bg-white rounded-3xl shadow-soft p-10">
              <h3 className="font-semibold text-text-primary mb-6 text-base uppercase tracking-wide">Questions Attempted</h3>
              <p className="text-6xl font-bold text-primary mb-3">{testQuestions.length}</p>
              <p className="text-text-secondary text-base font-normal">out of {testQuestions.length} total questions</p>
            </div>
            <div className="bg-white rounded-3xl shadow-soft p-10">
              <h3 className="font-semibold text-text-primary mb-6 text-base uppercase tracking-wide">Average Time Per Question</h3>
              <p className="text-6xl font-bold text-primary mb-3">
                {formatTime(Math.round(totalTime / Math.max(testQuestions.length, 1)))}
              </p>
              <p className="text-text-secondary text-base font-normal">across all questions</p>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        <div className="bg-secondary-light border-l-4 border-secondary rounded-2xl p-8">
          <p className="text-text-primary font-semibold mb-3 text-base">📝 Test Completed</p>
          <p className="text-text-secondary text-base font-normal leading-relaxed">
            Your test has been successfully submitted and saved. The results will be evaluated and you will receive feedback shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
