import { useContext } from 'react';
import { FiClipboard, FiUsers, FiStar, FiClock, FiCheck, FiBarChart2 } from 'react-icons/fi';
import { AdminContext } from '../../context/AdminContext';
import { ThemeContext } from '../../context/ThemeContext';

const StatCard = ({ title, value, color, icon: Icon, theme }) => {
  // Mapping color prop to text color for the icon
  const colorMap = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
  };

  const bgMap = {
    primary: 'bg-primary/10',
    secondary: 'bg-secondary/10',
    accent: 'bg-accent/10',
  };

  return (
    <div className={`${theme.card} p-5 hover:shadow-md transition-all border flex items-center justify-between`}>
      <div>
        <p className={`${theme.text.secondary} text-sm font-medium mb-1 tracking-tight`}>{title}</p>
        <p className={`text-3xl font-bold ${theme.text.primary}`}>
          {value}
        </p>
      </div>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bgMap[color] || 'bg-slate-100'}`}>
        <Icon className={`text-2xl ${colorMap[color] || 'text-slate-600'}`} />
      </div>
    </div>
  );
};

export default function StatisticsPage() {
  const { allStudents, allTests } = useContext(AdminContext);
  const theme = useContext(ThemeContext);

  // Calculate statistics
  const totalTests = allTests.length;
  const totalStudents = allStudents.length;
  const submittedTests = allStudents.filter(s => s.status === 'Submitted').length;
  const ongoingTests = allStudents.filter(s => s.status === 'In Progress').length;
  const notStarted = allStudents.filter(s => s.status === 'Not Started').length;
  const cancelled = allStudents.filter(s => s.status === 'Cancelled').length;

  const submittedStudents = allStudents.filter(s => s.score !== null);
  const avgScore = submittedStudents.length > 0
    ? (submittedStudents.reduce((sum, s) => sum + s.score, 0) / submittedStudents.length).toFixed(1)
    : 0;

  // Calculate average time taken
  const totalTimeMinutes = allStudents
    .filter(s => s.startTime)
    .reduce((sum, s) => sum + (new Date() - s.startTime) / 60000, 0);
  const avgTimeMinutes = allStudents.filter(s => s.startTime).length > 0
    ? (totalTimeMinutes / allStudents.filter(s => s.startTime).length).toFixed(0)
    : 0;

  const passRate = totalStudents > 0
    ? ((submittedTests / totalStudents) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className={`text-2xl font-bold ${theme.text.primary} tracking-tight mb-1`}>Statistics Overview</h2>
        <p className={theme.text.secondary}>Real-time insights into test performance</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Tests Created" value={totalTests} color="secondary" icon={FiClipboard} theme={theme} />
        <StatCard title="Total Students" value={totalStudents} color="accent" icon={FiUsers} theme={theme} />
        <StatCard title="Submission Rate" value={submittedTests} color="primary" icon={FiBarChart2} theme={theme} />
        <StatCard title="Average Score" value={`${avgScore}%`} color="secondary" icon={FiStar} theme={theme} />
        <StatCard title="Avg Time Taken" value={`${avgTimeMinutes} min`} color="accent" icon={FiClock} theme={theme} />
        <StatCard title="Completion Rate" value={`${passRate}%`} color="primary" icon={FiCheck} theme={theme} />
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Status Distribution */}
        <div className={`${theme.card} border p-6`}>
          <h3 className={`text-lg font-bold ${theme.text.primary} mb-5 tracking-tight`}>Student Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`${theme.text.primary} font-medium text-sm`}>Submitted</span>
                <span className="text-sm font-bold text-primary">{submittedTests}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: totalStudents > 0 ? `${(submittedTests / totalStudents) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`${theme.text.primary} font-medium text-sm`}>In Progress</span>
                <span className="text-sm font-bold text-secondary">{ongoingTests}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-secondary h-2 rounded-full transition-all duration-500"
                  style={{ width: totalStudents > 0 ? `${(ongoingTests / totalStudents) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`${theme.text.primary} font-medium text-sm`}>Not Started</span>
                <span className="text-sm font-bold text-slate-400">{notStarted}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-slate-300 h-2 rounded-full transition-all duration-500"
                  style={{ width: totalStudents > 0 ? `${(notStarted / totalStudents) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`${theme.text.primary} font-medium text-sm`}>Cancelled</span>
                <span className="text-sm font-bold text-red-500">{cancelled}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: totalStudents > 0 ? `${(cancelled / totalStudents) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Test Performance */}
        <div className={`${theme.card} border p-6`}>
          <h3 className={`text-lg font-bold ${theme.text.primary} mb-5 tracking-tight`}>Performance Metrics</h3>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-lg">
              <span className={`${theme.text.primary} font-medium text-sm`}>Highest Score</span>
              <span className="text-lg font-bold text-primary">
                {submittedStudents.length > 0
                  ? Math.max(...submittedStudents.map(s => s.score))
                  : 'N/A'}%
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-lg">
              <span className={`${theme.text.primary} font-medium text-sm`}>Lowest Score</span>
              <span className="text-lg font-bold text-secondary">
                {submittedStudents.length > 0
                  ? Math.min(...submittedStudents.map(s => s.score))
                  : 'N/A'}%
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-lg">
              <span className={`${theme.text.primary} font-medium text-sm`}>Median Score</span>
              <span className="text-lg font-bold text-accent">
                {submittedStudents.length > 0
                  ? submittedStudents
                    .map(s => s.score)
                    .sort((a, b) => a - b)[Math.floor(submittedStudents.length / 2)]
                  : 'N/A'}%
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <span className="text-primary font-semibold text-sm">Success Rate</span>
              <span className="text-lg font-bold text-primary">{passRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Creation Summary */}
      <div className={`${theme.card} border p-6`}>
        <h3 className={`text-lg font-bold ${theme.text.primary} mb-4 tracking-tight`}>Recent Tests Overview</h3>
        {allTests.length > 0 ? (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {allTests.map((test, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-white border border-slate-100 hover:border-slate-200 rounded-xl shadow-sm transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <FiClipboard className="text-lg" />
                  </div>
                  <div>
                    <p className={`font-semibold ${theme.text.primary} text-sm`}>{test.title}</p>
                    <p className={`text-xs ${theme.text.secondary} mt-0.5`}>
                      {test.totalQuestions} questions • {test.totalStudents} students
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{test.submitted} / {test.totalStudents}</p>
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${theme.text.secondary} mt-0.5`}>Submitted</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <FiClipboard className="mx-auto text-4xl text-slate-300 mb-3" />
            <p className={`${theme.text.secondary} font-medium`}>No tests created yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
