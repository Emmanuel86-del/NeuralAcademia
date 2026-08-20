export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface SeedAssessment {
  title: string;
  description: string;
  category: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  time_limit_minutes: number;
  questions: AssessmentQuestion[];
}

export const seedAssessments: SeedAssessment[] = [
  {
    title: 'AI Fundamentals Quiz',
    description: 'Test your understanding of core AI and machine learning concepts.',
    category: 'AI Fundamentals',
    skill_level: 'beginner',
    time_limit_minutes: 15,
    questions: [
      {
        id: 'q1',
        question: 'What is machine learning?',
        options: [
          'A type of computer hardware',
          'A subset of AI where systems learn patterns from data',
          'A programming language for robots',
          'A database management system',
        ],
        correct_answer: 1,
        explanation: 'Machine Learning is a subset of AI where systems learn patterns from data instead of being explicitly programmed.',
      },
      {
        id: 'q2',
        question: 'Which type of learning uses labeled training data?',
        options: ['Unsupervised learning', 'Reinforcement learning', 'Supervised learning', 'Transfer learning'],
        correct_answer: 2,
        explanation: 'Supervised learning uses labeled data where the model learns to map inputs to known outputs.',
      },
      {
        id: 'q3',
        question: 'What does a neural network use to adjust weights during training?',
        options: ['Random guessing', 'Backpropagation and gradient descent', 'Manual tuning by engineers', 'A voting system'],
        correct_answer: 1,
        explanation: 'Backpropagation calculates gradients, and gradient descent updates weights to minimize error.',
      },
      {
        id: 'q4',
        question: 'What is NLP primarily concerned with?',
        options: [
          'Network security protocols',
          'Natural language processing — human language understanding',
          'Numerical logic processing',
          'Neural logic programming',
        ],
        correct_answer: 1,
        explanation: 'NLP (Natural Language Processing) focuses on how computers understand and generate human language.',
      },
      {
        id: 'q5',
        question: 'Which is a key principle of AI ethics?',
        options: ['Maximizing speed at all costs', 'Fairness and avoiding bias', 'Collecting as much data as possible', 'Keeping algorithms secret'],
        correct_answer: 1,
        explanation: 'Fairness and avoiding bias is a core AI ethics principle — AI must not discriminate against groups.',
      },
    ],
  },
];

// Sample phrases used by LanguageCoach.tsx
export const samplePhrases = [
  { id: '1', phrase: 'Welcome to the advanced neural learning academy platform.', language: 'English' },
  { id: '2', phrase: 'Mastering software engineering requires consistent practice and debugging.', language: 'English' },
  { id: '3', phrase: 'Curriculum evaluation and assessment tracks student performance.', language: 'English' }
];

// Helper functions for assessment saving & state tracking
export function saveAssessmentScore(quizId: string, score: number, total: number) {
  const history = JSON.parse(localStorage.getItem('neural_academy_assessments') || '{}');
  history[quizId] = {
    score,
    total,
    percentage: Math.round((score / total) * 100),
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('neural_academy_assessments', JSON.stringify(history));
}

export function getSavedAssessments() {
  return JSON.parse(localStorage.getItem('neural_academy_assessments') || '{}');
}