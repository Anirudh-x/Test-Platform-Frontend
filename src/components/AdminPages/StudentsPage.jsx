import { useContext, useState, useMemo } from 'react';
import { FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { AdminContext } from '../../context/AdminContext';
import { ThemeContext } from '../../context/ThemeContext';

// Group flat submissions array by rollNo so each student appears only once
function groupByStudent(submissions) {
  const map = {};
  for (const s of submissions) {
    const key = s.rollNo.toUpperCase();
    if (!map[key]) {
      map[key] = {
        rollNo: key,
        name: s.name,
        tests: [],
      };
    }
    map[key].tests.push(s);
  }
  return Object.values(map);
}

export default function StudentsPage() {
  const { allStudents, loadingStudents } = useContext(AdminContext);
  const theme = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedRoll, setExpandedRoll] = useState(null);

  // Group all submissions by student (rollNo)
  const groupedStudents = useMemo(() => groupByStudent(allStudents), [allStudents]);

  // Filter students — match name, rollNo, or any of their test IDs / statuses
  const filteredStudents = useMemo(() => {
    return groupedStudents.filter(student => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        student.name.toLowerCase().includes(searchLower) ||
        student.rollNo.toLowerCase().includes(searchLower) ||
        student.tests.some(t => t.testId.toLowerCase().includes(searchLower));

      const matchesStatus =
        filterStatus === 'all' ||
        student.tests.some(t => t.status.toLowerCase() === filterStatus.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [groupedStudents, searchTerm, filterStatus]);

  // Summary stats (operate on flat allStudents for accuracy)
  const submittedCount = allStudents.filter(s => s.status === 'Submitted').length;
  const ongoingCount   = allStudents.filter(s => s.status === 'In Progress').length;
  const cancelledCount = allStudents.filter(s => s.status === 'Cancelled').length;
  const uniqueStudents = groupedStudents.length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted':   return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'In Progress': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Cancelled':   return 'text-red-700 bg-red-50 border-red-200';
      default:            return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  if (loadingStudents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-secondary"></div>
          <p className={`${theme.text.secondary} mt-3 text-sm font-medium`}>Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className={`text-2xl font-bold ${theme.text.primary} tracking-tight`}>Students</h2>
        <p className={`${theme.text.secondary} mt-1`}>Monitor student progress and test submissions</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            placeholder="Search by name, roll no, or test ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 shadow-sm text-sm transition-all"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 shadow-sm text-sm transition-all text-slate-700"
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="in progress">In Progress</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Results Summary */}
      <p className={`${theme.text.secondary} text-sm`}>
        Showing <span className="font-semibold text-slate-700">{filteredStudents.length}</span> of{' '}
        <span className="font-semibold text-slate-700">{uniqueStudents}</span> unique students
        {' '}(<span className="font-semibold text-slate-700">{allStudents.length}</span> total submissions)
      </p>

      {/* Students List */}
      {filteredStudents.length > 0 ? (
        <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
          {filteredStudents.map((student) => {
            const isExpanded = expandedRoll === student.rollNo;
            const latestTest = student.tests[student.tests.length - 1];
            const submittedTests = student.tests.filter(t => t.status === 'Submitted').length;

            return (
              <div key={student.rollNo} className={`${theme.card} border overflow-hidden transition-all`}>
                {/* Student row — always visible */}
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedRoll(isExpanded ? null : student.rollNo)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    {/* Name + Roll */}
                    <div className="md:col-span-1">
                      <p className={`${theme.text.primary} font-bold text-sm tracking-tight`}>{student.name}</p>
                      <p className={`text-xs font-mono ${theme.text.secondary} mt-0.5`}>{student.rollNo}</p>
                    </div>

                    {/* Tests taken */}
                    <div className="md:col-span-1">
                      <p className={`${theme.text.secondary} text-xs mb-0.5 uppercase tracking-wider font-semibold`}>Tests Taken</p>
                      <p className={`${theme.text.primary} font-semibold text-sm`}>{student.tests.length}</p>
                    </div>

                    {/* Completed */}
                    <div className="md:col-span-1">
                      <p className={`${theme.text.secondary} text-xs mb-0.5 uppercase tracking-wider font-semibold`}>Completed</p>
                      <p className="text-emerald-600 font-bold text-sm">{submittedTests} / {student.tests.length}</p>
                    </div>

                    {/* Latest test status */}
                    <div className="md:col-span-1">
                      <p className={`${theme.text.secondary} text-xs mb-1 uppercase tracking-wider font-semibold`}>Latest</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(latestTest?.status)}`}>
                        {latestTest?.status}
                      </span>
                    </div>

                    {/* Expand toggle */}
                    <div className="md:col-span-1 flex justify-end">
                      <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isExpanded ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                        {isExpanded ? 'Hide' : 'View'} Tests
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded: per-test breakdown */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 divide-y divide-slate-100">
                    {student.tests.map((test, idx) => (
                      <div key={idx} className="px-6 py-3 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                        {/* Test ID */}
                        <div className="md:col-span-1">
                          <p className={`${theme.text.secondary} text-xs uppercase tracking-wider font-semibold mb-0.5`}>Test ID</p>
                          <p className={`${theme.text.primary} font-semibold text-sm font-mono`}>{test.testId}</p>
                        </div>

                        {/* Status */}
                        <div className="md:col-span-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(test.status)}`}>
                            {test.status}
                          </span>
                        </div>

                        {/* Language */}
                        <div className="md:col-span-1">
                          <p className={`${theme.text.secondary} text-xs mb-0.5 uppercase tracking-wider font-semibold`}>Language</p>
                          <p className={`${theme.text.primary} text-sm font-medium capitalize`}>{test.language || '—'}</p>
                        </div>

                        {/* Time */}
                        <div className="md:col-span-1">
                          <p className={`${theme.text.secondary} text-xs mb-0.5 uppercase tracking-wider font-semibold`}>Time Taken</p>
                          <p className={`${theme.text.primary} text-sm font-medium`}>{formatTime(test.totalTime)}</p>
                        </div>

                        {/* Submitted at */}
                        <div className="md:col-span-1">
                          <p className={`${theme.text.secondary} text-xs mb-0.5 uppercase tracking-wider font-semibold`}>Submitted</p>
                          <p className={`${theme.text.primary} text-xs font-medium`}>
                            {test.endTime ? new Date(test.endTime).toLocaleString() : '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`${theme.card} border p-12 text-center`}>
          <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <FiSearch className="text-3xl text-slate-300" />
          </div>
          <h3 className={`text-lg font-bold ${theme.text.primary} mb-2 tracking-tight`}>No students found</h3>
          <p className={`${theme.text.secondary} text-sm max-w-sm mx-auto`}>
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No students have taken tests yet'}
          </p>
        </div>
      )}

      {/* Summary Footer */}
      {allStudents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className={`${theme.card} border p-4 text-center`}>
            <p className={`${theme.text.secondary} text-xs font-medium uppercase tracking-wider mb-2`}>Unique Students</p>
            <p className="text-3xl font-bold text-secondary">{uniqueStudents}</p>
          </div>

          <div className={`${theme.card} border p-4 text-center`}>
            <p className={`${theme.text.secondary} text-xs font-medium uppercase tracking-wider mb-2`}>Submitted</p>
            <p className="text-3xl font-bold text-emerald-600">{submittedCount}</p>
            <p className="text-xs text-emerald-600/70 font-medium mt-1">
              {allStudents.length > 0 ? ((submittedCount / allStudents.length) * 100).toFixed(0) : 0}%
            </p>
          </div>

          <div className={`${theme.card} border p-4 text-center`}>
            <p className={`${theme.text.secondary} text-xs font-medium uppercase tracking-wider mb-2`}>In Progress</p>
            <p className="text-3xl font-bold text-amber-600">{ongoingCount}</p>
            <p className="text-xs text-amber-600/70 font-medium mt-1">
              {allStudents.length > 0 ? ((ongoingCount / allStudents.length) * 100).toFixed(0) : 0}%
            </p>
          </div>

          <div className={`${theme.card} border p-4 text-center`}>
            <p className={`${theme.text.secondary} text-xs font-medium uppercase tracking-wider mb-2`}>Cancelled</p>
            <p className="text-3xl font-bold text-red-500">{cancelledCount}</p>
            <p className="text-xs text-red-500/70 font-medium mt-1">
              {allStudents.length > 0 ? ((cancelledCount / allStudents.length) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
