import { useContext, useState } from 'react';
import { FiPlus, FiFileText } from 'react-icons/fi';
import { AdminContext } from '../../context/AdminContext';
import { ThemeContext } from '../../context/ThemeContext';
import TestDetailModal from '../Modals/TestDetailModal';
import CreateTestModal from '../Modals/CreateTestModal';
import CameraModal from '../Modals/CameraModal';
import { FiVideo } from 'react-icons/fi';

export default function TestsPage() {
  const { allTests, loadingTests, createTest } = useContext(AdminContext);
  const theme = useContext(ThemeContext);
  const [selectedTest, setSelectedTest] = useState(null);
  const [cameraTestId, setCameraTestId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateTest = async (testData) => {
    setCreating(true);
    setCreateError('');
    try {
      const result = await createTest(testData);
      if (result.success) {
        setShowCreateModal(false);
      } else {
        setCreateError(result.error || 'Failed to create test');
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create test');
    } finally {
      setCreating(false);
    }
  };

  if (loadingTests) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-secondary"></div>
          <p className={`${theme.text.secondary} mt-3 text-sm font-medium`}>Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative mb-6">
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${theme.text.primary} tracking-tight`}>Tests Management</h2>
          <p className={`${theme.text.secondary} mt-1`}>View and manage all created tests</p>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <button
            onClick={() => { setShowCreateModal(true); setCreateError(''); }}
            className="bg-secondary hover:bg-secondary/90 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow transition-all text-sm flex items-center gap-2"
          >
            <FiPlus className="text-lg" /> Create Test
          </button>
        </div>
      </div>

      {/* Tests Grid */}
      {allTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {allTests.map((test) => (
            <div
              key={test.id}
              className={`${theme.card} p-5 hover:shadow-md hover:border-secondary/30 transition-all cursor-pointer border flex flex-col`}
              onClick={() => setSelectedTest(test)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`${theme.text.primary} font-bold text-lg flex-1 tracking-tight`}>{test.title}</h3>
                  <p className={`text-xs font-mono font-semibold mt-0.5 ${theme.text.secondary}`}>{test.id}</p>
                </div>
                <div className="p-2 bg-secondary-light text-secondary rounded-lg">
                  <FiFileText className="text-xl" />
                </div>
              </div>

              <div className="space-y-3 mb-5 flex-1">
                <div className="flex justify-between items-center text-sm">
                  <span className={theme.text.secondary}>Questions</span>
                  <span className="font-semibold text-slate-700">{test.totalQuestions}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className={theme.text.secondary}>Duration</span>
                  <span className="font-semibold text-slate-700">{test.duration || 60} min</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className={theme.text.secondary}>Students</span>
                  <span className="font-semibold text-slate-700">{test.totalStudents}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className={theme.text.secondary}>Completed</span>
                  <span className="font-semibold text-primary">{test.submitted}</span>
                </div>
              </div>

              <div className={`border-t ${theme.border} pt-4 mb-4`}>
                <div className="flex gap-2 text-xs">
                  <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-md font-semibold">
                    {test.submitted} Submitted
                  </span>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-md font-semibold">
                    {test.inProgress} Ongoing
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <p className={`text-xs ${theme.text.secondary} font-medium`}>
                  Created {test.createdDate?.toLocaleDateString?.() || 'Recently'}
                </p>
                <div className="flex gap-2">
                  <button
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCameraTestId(test.id);
                    }}
                  >
                    <FiVideo className="text-slate-500" />
                  </button>
                  <button
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTest(test);
                    }}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${theme.card} border p-12 text-center`}>
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <FiFileText className="text-3xl text-slate-400" />
          </div>
          <h3 className={`text-lg font-bold ${theme.text.primary} mb-2 tracking-tight`}>No tests created yet</h3>
          <p className={`${theme.text.secondary} text-sm mb-6 max-w-sm mx-auto`}>Start by creating your first test to begin assessing students and tracking their performance.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm hover:shadow transition-all text-sm inline-flex items-center gap-2"
          >
            <FiPlus className="text-lg" /> Create First Test
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateTestModal
          onClose={() => { setShowCreateModal(false); setCreateError(''); }}
          onCreate={handleCreateTest}
          creating={creating}
          createError={createError}
        />
      )}

      {selectedTest && (
        <TestDetailModal
          test={selectedTest}
          onClose={() => setSelectedTest(null)}
        />
      )}

      {cameraTestId && (
        <CameraModal 
          testId={cameraTestId} 
          onClose={() => setCameraTestId(null)} 
        />
      )}
    </div>
  );
}
