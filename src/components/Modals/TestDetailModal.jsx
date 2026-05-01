import { useState, useContext } from 'react';
import { FiDownload, FiX, FiCheckCircle } from 'react-icons/fi';
import { ThemeContext } from '../../context/ThemeContext';

export default function TestDetailModal({ test, onClose }) {
  const theme = useContext(ThemeContext);

  const getHeaders = () => {
    const headers = ['Test ID', 'Student Name', 'Roll No', 'Language'];
    test.questions.forEach((q, i) => {
      headers.push(`Solution Q${i + 1}: ${q.title}`);
      headers.push(`Time Q${i + 1}`);
    });
    return headers;
  };

  const getRowsData = () => {
    return test.submissions.map(submission => {
      const rowData = [test.id, submission.name, submission.rollNo, submission.language || '—'];
      test.questions.forEach(question => {
        // Backend stores answers as: { questionId, code, language, timeSpent }
        const answer = (submission.answers || []).find(a => a.questionId === question.id);
        rowData.push(answer?.code || 'N/A');
        rowData.push(answer ? `${answer.timeSpent}s` : 'N/A');
      });
      return rowData;
    });
  };

  const downloadCSV = () => {
    const headers = getHeaders();
    const rows = getRowsData();

    // Create CSV content
    const csvContent = [
      headers,
      ...rows
    ]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${test.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tableHeaders = getHeaders();
  const tableRows = getRowsData();

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200`}>
        {/* Header */}
        <div className="sticky top-0 bg-accent text-white p-5 flex justify-between items-center z-10 border-b border-accent/20 shadow-sm">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{test.title}</h2>
            <p className="text-white/70 text-sm mt-0.5 font-medium">
              {test.totalQuestions} Questions • {test.totalStudents} Students
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-white/10 rounded-lg w-10 h-10 flex items-center justify-center transition-all text-white/80 hover:text-white"
          >
            <FiX />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Test Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`${theme.card} border p-4 text-center hover:shadow-md transition-all`}>
              <p className={`${theme.text.secondary} text-xs font-semibold uppercase tracking-wider mb-1`}>Total Questions</p>
              <p className="text-3xl font-bold text-primary">{test.totalQuestions}</p>
            </div>
            <div className={`${theme.card} border p-4 text-center hover:shadow-md transition-all`}>
              <p className={`${theme.text.secondary} text-xs font-semibold uppercase tracking-wider mb-1`}>Total Students</p>
              <p className="text-3xl font-bold text-secondary">{test.totalStudents}</p>
            </div>
            <div className={`${theme.card} border p-4 text-center hover:shadow-md transition-all`}>
              <p className={`${theme.text.secondary} text-xs font-semibold uppercase tracking-wider mb-1`}>Total Time</p>
              <p className="text-3xl font-bold text-emerald-600">{test.duration ? `${test.duration} mins` : 'N/A'}</p>
            </div>
          </div>

          {/* Questions */}
          {test.questions.length > 0 && (
            <div>
              <h3 className={`text-lg font-bold ${theme.text.primary} mb-3 tracking-tight`}>Questions Included</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {test.questions.map((question) => (
                  <div key={question.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50 hover:border-slate-300 transition-all">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      Q{question.id}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${theme.text.primary} text-sm`}>{question.title}</p>
                    </div>
                    <div>
                       <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                           question.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                           question.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                           'bg-red-50 text-red-700 border-red-200'
                       }`}>
                           {question.difficulty}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submissions Table */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${theme.text.primary} tracking-tight`}>Test Data</h3>
              <button
                onClick={downloadCSV}
                className="bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg text-sm shadow-sm hover:shadow transition-all flex items-center gap-2 font-medium"
              >
                <FiDownload className="text-lg" /> Download CSV
              </button>
            </div>

            {test.submissions.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      {tableHeaders.map((header, idx) => (
                        <th key={idx} className="px-5 py-3.5 border-b border-slate-200 font-semibold text-xs uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {tableRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-5 py-3.5 text-slate-600 align-top">
                            {/* Code cells: monospace with scroll */}
                            {cellIdx > 3 && cellIdx % 2 === 0 ? (
                              <pre className="font-mono text-xs bg-slate-900 text-green-300 px-3 py-2 rounded-md max-w-xs overflow-x-auto whitespace-pre-wrap border border-slate-700">
                                {String(cell)}
                              </pre>
                            ) : (
                              <span className={cellIdx < 4 ? 'font-medium text-slate-800' : 'text-slate-600'}>{cell}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={`${theme.card} border p-10 text-center`}>
                <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <FiCheckCircle className="text-3xl text-slate-300" />
                </div>
                <p className={`${theme.text.primary} font-bold text-lg mb-1`}>No submissions yet</p>
                <p className={`${theme.text.secondary} text-sm`}>Students have not submitted their tests yet.</p>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="pt-5 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
