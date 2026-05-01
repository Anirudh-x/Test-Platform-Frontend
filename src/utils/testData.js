export const testQuestions = [];

export const languages = [
  { id: 'none', name: 'Select' },
  { id: 'python', name: 'Python' },
  { id: 'cpp', name: 'C++' },
  { id: 'java', name: 'Java' },
  { id: 'javascript', name: 'JavaScript' }
];

export const formatTime = (seconds) => {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

/**
 * Generates a language-specific starter code stub for a question.
 * Uses the admin-supplied starterCode for Python; generates syntax-appropriate
 * stubs for other languages so the editor never shows Python code to a
 * student who selected JavaScript / C++ / Java.
 *
 * @param {object} question  - question object from backend { title, starterCode }
 * @param {string} language  - language id: 'python' | 'cpp' | 'java' | 'javascript'
 * @returns {string} starter code string
 */
export const generateStarterCode = (question, language) => {
  if (!question) return '';

  // Use the admin-provided code as-is for Python (it was authored for Python)
  if (language === 'python') {
    return question.starterCode || '# Write your solution here\npass';
  }

  // Derive a camelCase function name from the question title
  const fnName = (question.title || 'solution')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('');

  switch (language) {
    case 'javascript':
      return `/**\n * ${question.title}\n */\nfunction ${fnName}() {\n    // Write your solution here\n\n}`;

    case 'cpp':
      return `#include <bits/stdc++.h>\nusing namespace std;\n\n// ${question.title}\nvoid ${fnName}() {\n    // Write your solution here\n\n}`;

    case 'java':
      return `// ${question.title}\nclass Solution {\n    public void ${fnName}() {\n        // Write your solution here\n\n    }\n}`;

    default:
      return `// Write your solution for: ${question.title}\n`;
  }
};
