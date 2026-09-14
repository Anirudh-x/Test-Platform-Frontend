import { useState, useContext } from 'react';
import { FiPlus, FiTrash2, FiCheck, FiCode, FiCheckCircle, FiList } from 'react-icons/fi';
import { ThemeContext } from '../../context/ThemeContext';

const difficultyOptions = ['Easy', 'Medium', 'Hard'];

// Function to generate starter code based on question title
const generateStarterCode = (questionTitle) => {
  const title = questionTitle.toLowerCase().replace(/\s+/g, '_');

  const templates = {
    'two_sum': `def twoSum(nums, target):
    """
    Find two numbers that add up to target
    """
    # Your code here
    pass`,

    'reverse': `def reverse(s):
    """
    Reverse the input string
    """
    # Your code here
    pass`,

    'fibonacci': `def fibonacci(n):
    """
    Return the nth Fibonacci number
    """
    # Your code here
    pass`,

    'palindrome': `def isPalindrome(s):
    """
    Check if string is a palindrome
    """
    # Your code here
    return False`,
  };

  // Check if we have a template match
  for (const [key, template] of Object.entries(templates)) {
    if (title.includes(key)) {
      return template;
    }
  }

  // Default template
  return `def solution():
    """
    ${questionTitle}
    """
    # Your code here
    pass`;
};

export default function CreateTestModal({ onClose, onCreate, creating = false, createError = '' }) {
  const theme = useContext(ThemeContext);
  const [step, setStep] = useState('testId'); // 'testId', 'addQuestion'
  const [testType, setTestType] = useState('coding'); // 'coding' or 'objective'
  const [testId, setTestId] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState({});

  // Coding Question form state
  const [questionForm, setQuestionForm] = useState({
    title: '',
    description: '',
    difficulty: 'Medium',
    examples: '',
    constraints: '',
    starterCode: '',
  });

  // Objective Question form state
  const [objectiveForm, setObjectiveForm] = useState({
    title: '',
    description: '',
    difficulty: 'Medium',
    options: ['', '', '', ''],
    correctOption: 0,
  });

  const handleTestIdSubmit = () => {
    const newErrors = {};
    if (!testId.trim()) newErrors.testId = 'Test ID is required';
    if (!testTitle.trim()) newErrors.testTitle = 'Test title is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep('addQuestion');
  };

  // Coding Question Add
  const handleAddCodingQuestion = () => {
    const newErrors = {};
    if (!questionForm.title.trim()) newErrors.title = 'Question title is required';
    if (!questionForm.description.trim()) newErrors.description = 'Description is required';
    if (!questionForm.examples.trim()) newErrors.examples = 'Examples are required';
    if (!questionForm.constraints.trim()) newErrors.constraints = 'Constraints are required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newQuestion = {
      id: Date.now(),
      ...questionForm,
    };

    setQuestions([...questions, newQuestion]);
    setQuestionForm({
      title: '',
      description: '',
      difficulty: 'Medium',
      examples: '',
      constraints: '',
      starterCode: '',
    });
    setErrors({});
  };

  // Objective Question Add
  const handleAddObjectiveQuestion = () => {
    const newErrors = {};
    if (!objectiveForm.title.trim()) newErrors.objTitle = 'Question title / statement is required';
    
    // Validate options
    const emptyOptionIndex = objectiveForm.options.findIndex(opt => !opt.trim());
    if (emptyOptionIndex !== -1) {
      newErrors.objOptions = `Option ${String.fromCharCode(65 + emptyOptionIndex)} cannot be empty`;
    }
    if (objectiveForm.options.length < 2) {
      newErrors.objOptions = 'At least 2 options are required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newQuestion = {
      id: Date.now(),
      title: objectiveForm.title.trim(),
      description: objectiveForm.description.trim(),
      difficulty: objectiveForm.difficulty,
      options: objectiveForm.options.map(o => o.trim()),
      correctOption: objectiveForm.correctOption,
    };

    setQuestions([...questions, newQuestion]);
    setObjectiveForm({
      title: '',
      description: '',
      difficulty: 'Medium',
      options: ['', '', '', ''],
      correctOption: 0,
    });
    setErrors({});
  };

  const handleQuestionTitleChange = (title) => {
    const generatedCode = generateStarterCode(title);
    setQuestionForm({
      ...questionForm,
      title,
      starterCode: generatedCode,
    });
  };

  const handleOptionChange = (index, value) => {
    const updated = [...objectiveForm.options];
    updated[index] = value;
    setObjectiveForm({ ...objectiveForm, options: updated });
    if (errors.objOptions) setErrors(prev => ({ ...prev, objOptions: '' }));
  };

  const addOptionField = () => {
    if (objectiveForm.options.length < 6) {
      setObjectiveForm({
        ...objectiveForm,
        options: [...objectiveForm.options, ''],
      });
    }
  };

  const removeOptionField = (index) => {
    if (objectiveForm.options.length > 2) {
      const updated = objectiveForm.options.filter((_, i) => i !== index);
      let newCorrect = objectiveForm.correctOption;
      if (newCorrect === index) {
        newCorrect = 0;
      } else if (newCorrect > index) {
        newCorrect--;
      }
      setObjectiveForm({
        ...objectiveForm,
        options: updated,
        correctOption: newCorrect,
      });
    }
  };

  const handleDeleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleCreateTest = () => {
    if (questions.length === 0) {
      setErrors({ questions: 'Add at least one question' });
      return;
    }
    if (creating) return;

    onCreate({
      testId,
      title: testTitle,
      type: testType,
      duration,
      questions,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${theme.bg.primary} rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-lg border-2 ${theme.border}`}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-secondary text-white p-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-lg font-bold">
              {step === 'testId' && 'Create New Test'}
              {step === 'addQuestion' && `Add Questions to "${testTitle}"`}
            </h2>
            <p className="text-xs text-white/80">
              {testType === 'objective' ? 'Objective (MCQ) Test' : 'Coding Test'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xl hover:bg-white/20 rounded-lg w-8 h-8 flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Step 1: Test ID & Configuration Input */}
          {step === 'testId' && (
            <div className="space-y-4">
              {/* Test Type Selector */}
              <div>
                <label className={`block ${theme.text.primary} font-semibold mb-2 text-sm`}>Select Test Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => { setTestType('coding'); setQuestions([]); }}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 ${testType === 'coding'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg text-lg ${testType === 'coding' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <FiCode />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-sm ${testType === 'coding' ? 'text-primary' : 'text-slate-800'}`}>
                          Coding Test
                        </p>
                        {testType === 'coding' && (
                          <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Algorithmic challenges, live in-browser compiler & starter code.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => { setTestType('objective'); setQuestions([]); }}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 ${testType === 'objective'
                      ? 'border-secondary bg-secondary/10 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg text-lg ${testType === 'objective' ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <FiCheckCircle />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-sm ${testType === 'objective' ? 'text-secondary' : 'text-slate-800'}`}>
                          Objective (MCQ) Test
                        </p>
                        {testType === 'objective' && (
                          <span className="bg-secondary text-white text-[10px] px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Multiple choice questions with options and automated instant grading.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className={`block ${theme.text.primary} font-semibold mb-2 text-sm`}>Test ID</label>
                <input
                  type="text"
                  value={testId}
                  onChange={(e) => {
                    setTestId(e.target.value);
                    if (errors.testId) setErrors(prev => ({ ...prev, testId: '' }));
                  }}
                  placeholder={testType === 'objective' ? 'e.g., OBJ_TEST_001, JAVA_MCQ_01' : 'e.g., TEST_001, JS_FUNDAMENTALS'}
                  className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none transition-all text-sm ${errors.testId
                    ? 'border-red-500 bg-red-50 text-text-primary'
                    : 'border-primary-border bg-white text-text-primary focus:border-primary focus:bg-primary-light'
                    }`}
                />
                {errors.testId && <p className="text-red-500 text-xs mt-1">{errors.testId}</p>}
              </div>

              <div>
                <label className={`block ${theme.text.primary} font-semibold mb-2 text-sm`}>Test Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => {
                    setTestTitle(e.target.value);
                    if (errors.testTitle) setErrors(prev => ({ ...prev, testTitle: '' }));
                  }}
                  placeholder={testType === 'objective' ? 'e.g., Core Java & OOPs Concepts MCQ' : 'e.g., JavaScript Fundamentals'}
                  className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none transition-all text-sm ${errors.testTitle
                    ? 'border-red-500 bg-red-50 text-text-primary'
                    : 'border-primary-border bg-white text-text-primary focus:border-primary focus:bg-primary-light'
                    }`}
                />
                {errors.testTitle && <p className="text-red-500 text-xs mt-1">{errors.testTitle}</p>}
              </div>

              <div>
                <label className={`block ${theme.text.primary} font-semibold mb-2 text-sm`}>Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="240"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-primary-border bg-white text-text-primary focus:border-primary focus:bg-primary-light focus:outline-none transition-all text-sm"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-primary-border text-text-primary font-semibold transition-all text-sm hover:bg-primary-light"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTestIdSubmit}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg transition-all text-sm"
                >
                  Next: Add Questions
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Add Questions */}
          {step === 'addQuestion' && (
            <div className="space-y-4">
              {/* Objective Question Form */}
              {testType === 'objective' ? (
                <div className="border-2 border-primary-border rounded-lg p-4 bg-primary-light">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${theme.text.primary} font-bold text-sm flex items-center gap-2`}>
                      <FiCheckCircle className="text-secondary" /> Add Multiple Choice Question
                    </h3>
                    <span className="text-xs bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full font-semibold">
                      Objective (MCQ)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Question Statement */}
                    <div>
                      <label className={`block ${theme.text.primary} font-semibold mb-1 text-xs`}>
                        Question Title / Statement *
                      </label>
                      <input
                        type="text"
                        value={objectiveForm.title}
                        onChange={(e) => {
                          setObjectiveForm({ ...objectiveForm, title: e.target.value });
                          if (errors.objTitle) setErrors(prev => ({ ...prev, objTitle: '' }));
                        }}
                        placeholder="e.g., Which of the following is NOT a primitive type in JavaScript?"
                        className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-all text-sm ${errors.objTitle
                          ? 'border-red-500 bg-red-50 text-text-primary'
                          : 'border-primary-border bg-white text-text-primary focus:border-primary'
                          }`}
                      />
                      {errors.objTitle && <p className="text-red-500 text-xs mt-0.5">{errors.objTitle}</p>}
                    </div>

                    {/* Additional Details / Code Context */}
                    <div>
                      <label className={`block ${theme.text.primary} font-semibold mb-1 text-xs`}>
                        Context / Code Snippet (Optional)
                      </label>
                      <textarea
                        value={objectiveForm.description}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, description: e.target.value })}
                        placeholder="Optional code snippet or context for the question..."
                        rows="2"
                        className="w-full px-3 py-2 rounded-lg border-2 border-primary-border bg-white text-text-primary focus:border-primary focus:outline-none transition-all text-sm font-mono resize-none"
                      />
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className={`block ${theme.text.primary} font-semibold mb-1 text-xs`}>Difficulty</label>
                      <select
                        value={objectiveForm.difficulty}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, difficulty: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-all text-sm border-primary-border bg-white text-text-primary focus:border-primary"
                      >
                        {difficultyOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Options */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className={`block ${theme.text.primary} font-semibold text-xs`}>
                          Answer Options & Correct Answer Selection *
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Select the radio button for the correct option
                        </span>
                      </div>

                      {errors.objOptions && <p className="text-red-500 text-xs mb-2">{errors.objOptions}</p>}

                      <div className="space-y-2">
                        {objectiveForm.options.map((option, idx) => {
                          const optionLetter = String.fromCharCode(65 + idx);
                          const isCorrect = objectiveForm.correctOption === idx;

                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isCorrect
                                ? 'bg-emerald-50 border-emerald-400'
                                : 'bg-white border-slate-200'
                              }`}
                            >
                              {/* Correct radio selection */}
                              <button
                                type="button"
                                onClick={() => setObjectiveForm({ ...objectiveForm, correctOption: idx })}
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${isCorrect
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title="Click to set as correct answer"
                              >
                                {isCorrect ? '✓' : optionLetter}
                              </button>

                              {/* Option Input */}
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                placeholder={`Option ${optionLetter}`}
                                className="flex-1 px-3 py-1.5 bg-transparent border-none text-sm text-slate-800 focus:outline-none"
                              />

                              {/* Correct Badge Indicator */}
                              <button
                                type="button"
                                onClick={() => setObjectiveForm({ ...objectiveForm, correctOption: idx })}
                                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer shrink-0 transition-colors ${isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {isCorrect ? 'Correct Answer' : 'Mark Correct'}
                              </button>

                              {/* Remove Option Button */}
                              {objectiveForm.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOptionField(idx)}
                                  className="text-slate-400 hover:text-red-500 p-1 text-xs"
                                  title="Remove option"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {objectiveForm.options.length < 6 && (
                        <button
                          type="button"
                          onClick={addOptionField}
                          className="mt-2 text-xs text-secondary font-semibold hover:underline flex items-center gap-1"
                        >
                          <FiPlus /> Add another option
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddObjectiveQuestion}
                    className="w-full mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-secondary to-primary text-white font-semibold hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <FiPlus /> Add Objective Question
                  </button>
                </div>
              ) : (
                /* Coding Question Form */
                <div className="border-2 border-primary-border rounded-lg p-4 bg-primary-light">
                  <h3 className={`${theme.text.primary} font-bold mb-4 text-sm`}>Add New Coding Question</h3>

                  <div className="space-y-3">
                    {/* Question Title */}
                    <div>
                      <label className={`block ${theme.text.primary} font-semibold mb-1 text-xs`}>Question Title</label>
                      <input
                        type="text"
                        value={questionForm.title}
                        onChange={(e) => handleQuestionTitleChange(e.target.value)}
                        placeholder="e.g., Two Sum Problem"
                        className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-all text-sm ${errors.title
                          ? 'border-red-500 bg-red-50 text-text-primary'
                          : 'border-primary-border bg-white text-text-primary focus:border-primary'
                          }`}
                      />
                      {errors.title && <p className="text-red-500 text-xs mt-0.5">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                      <label className={`block ${theme.text.primary} font-semibold mb-1 text-xs`}>Description</label>
                      <textarea
                        value={questionForm.description}
                        onChange={(e) => setQuestionForm({ ...questionForm, description: e.target.value })}
                        placeholder="Describe the problem..."
                        rows="3"
                        className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-all text-sm resize-none ${errors.description
                          ? 'border-red-500 bg-red-50 text-text-primary'
                          : 'border-primary-border bg-white text-text-primary focus:border-primary'
                          }`}
                      />
                      {errors.description && <p className="text-red-500 text-xs mt-0.5">{errors.description}</p>}
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className={`block ${theme.text.primary} font-semibold mb-1 text-xs`}>Difficulty</label>
                      <select
                        value={questionForm.difficulty}
                        onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-all text-sm border-primary-border bg-white text-text-primary focus:border-primary"
                      >
                        {difficultyOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Examples */}
                    <div>
                      <label className={`block ${theme.text.primary} font-semibold mb-1 text-xs`}>Examples</label>
                      <textarea
                        value={questionForm.examples}
                        onChange={(e) => setQuestionForm({ ...questionForm, examples: e.target.value })}
                        placeholder="Input: [2,7,11,15], 9&#10;Output: [0,1]"
                        rows="2"
                        className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-all text-sm resize-none ${errors.examples
                          ? 'border-red-500 bg-red-50 text-text-primary'
                          : 'border-primary-border bg-white text-text-primary focus:border-primary'
                          }`}
                      />
                      {errors.examples && <p className="text-red-500 text-xs mt-0.5">{errors.examples}</p>}
                    </div>

                    {/* Constraints */}
                    <div>
                      <label className={`block ${theme.text.primary} font-semibold mb-1 text-xs`}>Constraints</label>
                      <textarea
                        value={questionForm.constraints}
                        onChange={(e) => setQuestionForm({ ...questionForm, constraints: e.target.value })}
                        placeholder="1 ≤ n ≤ 10^5&#10;All elements are unique"
                        rows="2"
                        className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-all text-sm resize-none ${errors.constraints
                          ? 'border-red-500 bg-red-50 text-text-primary'
                          : 'border-primary-border bg-white text-text-primary focus:border-primary'
                          }`}
                      />
                      {errors.constraints && <p className="text-red-500 text-xs mt-0.5">{errors.constraints}</p>}
                    </div>

                    {/* Starter Code */}
                    <div>
                      <label className={`block ${theme.text.primary} font-semibold mb-1 text-xs`}>Starter Code (Auto-generated)</label>
                      <textarea
                        value={questionForm.starterCode}
                        onChange={(e) => setQuestionForm({ ...questionForm, starterCode: e.target.value })}
                        placeholder="Auto-generated starter code..."
                        rows="3"
                        className="w-full px-3 py-2 rounded-lg border-2 border-primary-border bg-gray-50 text-text-primary focus:border-primary focus:outline-none transition-all resize-none font-mono text-xs"
                      />
                      <p className={`text-xs ${theme.text.secondary} mt-0.5`}>💡 Auto-generated based on question title. Edit as needed.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCodingQuestion}
                    className="w-full mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <FiPlus /> Add Question
                  </button>
                </div>
              )}

              {/* Added Questions List */}
              {questions.length > 0 && (
                <div>
                  <h3 className={`${theme.text.primary} font-bold mb-2 text-sm`}>
                    Questions Added ({questions.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="border-2 border-primary-border rounded-lg p-3 flex items-start justify-between bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-slate-200 text-slate-700 text-xs font-bold rounded-full flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <p className={`${theme.text.primary} font-semibold text-sm truncate`}>{q.title}</p>
                          </div>
                          
                          {testType === 'objective' && q.options && (
                            <div className="mt-2 pl-7 space-y-1">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2 text-xs">
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${oIdx === q.correctOption ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className={oIdx === q.correctOption ? 'font-semibold text-emerald-700' : 'text-slate-600'}>
                                    {opt}
                                  </span>
                                  {oIdx === q.correctOption && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                      CORRECT
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2 mt-2 pl-7">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${q.difficulty === 'Easy'
                              ? 'bg-emerald-100 text-emerald-700'
                              : q.difficulty === 'Medium'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                              }`}>
                              {q.difficulty}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="ml-2 px-2 py-1 rounded text-red-600 hover:bg-red-100 transition-all text-sm font-medium"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              {createError && (
                <div className="p-3 bg-red-50 border-2 border-red-400 rounded-lg">
                  <p className="text-red-700 text-sm font-semibold">❌ {createError}</p>
                </div>
              )}
              <div className="flex gap-2 pt-3 border-t-2 border-primary-border">
                <button
                  type="button"
                  onClick={() => setStep('testId')}
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-primary-border text-text-primary font-semibold transition-all text-sm hover:bg-primary-light disabled:opacity-50"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateTest}
                  disabled={questions.length === 0 || creating}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <><FiCheck /> Create {testType === 'objective' ? 'Objective' : 'Coding'} Test ({questions.length} Q)</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
