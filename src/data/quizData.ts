import type { AssessmentQuestion } from '@/types';

// Deterministic pseudo-random based on a numeric seed so the same lesson
// always produces the same 10-question quiz.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Generic programming-concept question bank. These are deliberately broad so
// they apply across the coding courses. Questions are shuffled per-lesson so
// each lesson gets a different 10-question subset.
const QUESTION_BANK: AssessmentQuestion[] = [
  {
    id: 'q01',
    question: 'What does a variable store in programming?',
    options: ['A fixed value that never changes', 'A named reference to a data value', 'A type of loop', 'A function definition'],
    correct_answer: 1,
    explanation: 'A variable is a named container that holds a value which can be read or changed during program execution.',
  },
  {
    id: 'q02',
    question: 'Which loop type guarantees the body runs at least once?',
    options: ['for loop', 'while loop', 'do-while loop', 'foreach loop'],
    correct_answer: 2,
    explanation: 'A do-while loop checks its condition after the body executes, so the body always runs at least once.',
  },
  {
    id: 'q03',
    question: 'What is the purpose of a function?',
    options: ['To store data permanently', 'To group reusable code that performs a task', 'To speed up network requests', 'To define a class'],
    correct_answer: 1,
    explanation: 'Functions encapsulate a sequence of statements into a reusable, named block that can be called multiple times.',
  },
  {
    id: 'q04',
    question: 'What does an if statement do?',
    options: ['Repeats code multiple times', 'Executes code conditionally based on a boolean test', 'Defines a variable', 'Imports a module'],
    correct_answer: 1,
    explanation: 'An if statement evaluates a condition and runs its block only when the condition is true.',
  },
  {
    id: 'q05',
    question: 'Which data type represents text?',
    options: ['Integer', 'Boolean', 'String', 'Float'],
    correct_answer: 2,
    explanation: 'Strings are sequences of characters used to represent textual data.',
  },
  {
    id: 'q06',
    question: 'What is an array?',
    options: ['A single value', 'An ordered collection of elements', 'A type of function', 'A conditional statement'],
    correct_answer: 1,
    explanation: 'An array is an ordered, indexable collection that stores multiple values under a single name.',
  },
  {
    id: 'q07',
    question: 'What does "scope" refer to in programming?',
    options: ['The size of a file', 'The visibility region of a variable', 'The number of loops in a program', 'The speed of execution'],
    correct_answer: 1,
    explanation: 'Scope defines where a variable is accessible — e.g., local variables exist only inside their function.',
  },
  {
    id: 'q08',
    question: 'What is recursion?',
    options: ['A function that calls itself', 'A type of array', 'A database query', 'A loop that never ends'],
    correct_answer: 0,
    explanation: 'Recursion is when a function calls itself to solve a smaller instance of the same problem, with a base case to stop.',
  },
  {
    id: 'q09',
    question: 'What does "null" or "None" represent?',
    options: ['An empty string', 'The absence of a value', 'A numeric zero', 'A boolean false'],
    correct_answer: 1,
    explanation: 'null/None is a special value indicating that a variable has no value or points to nothing.',
  },
  {
    id: 'q10',
    question: 'Which operator checks equality in most languages?',
    options: ['=', '==', '+', '!='],
    correct_answer: 1,
    explanation: '== compares two values for equality. A single = is assignment. Some languages use === for strict equality.',
  },
  {
    id: 'q11',
    question: 'What is a parameter?',
    options: ['A variable passed into a function', 'A type of loop', 'A database table', 'A class attribute'],
    correct_answer: 0,
    explanation: 'A parameter is a value you pass into a function so the function can use it during execution.',
  },
  {
    id: 'q12',
    question: 'What does a boolean express?',
    options: ['A number with decimals', 'A true or false value', 'A sequence of characters', 'A collection of items'],
    correct_answer: 1,
    explanation: 'Booleans represent one of two states: true or false, used for logical conditions and flags.',
  },
  {
    id: 'q13',
    question: 'What is the purpose of a return statement?',
    options: ['To print output to the console', 'To send a value back from a function', 'To repeat a loop', 'To declare a variable'],
    correct_answer: 1,
    explanation: 'A return statement ends a function and sends a value back to the caller.',
  },
  {
    id: 'q14',
    question: 'What is a class in object-oriented programming?',
    options: ['A loop construct', 'A blueprint for creating objects', 'A type of variable', 'A network protocol'],
    correct_answer: 1,
    explanation: 'A class defines the structure and behavior (attributes and methods) that its instances (objects) will have.',
  },
  {
    id: 'q15',
    question: 'What does "encapsulation" mean in OOP?',
    options: ['Running multiple threads', 'Bundling data and methods together and restricting access', 'Copying objects', 'Inheriting from a parent class'],
    correct_answer: 1,
    explanation: 'Encapsulation hides internal state and groups related data and behavior, exposing only what is needed.',
  },
  {
    id: 'q16',
    question: 'What is inheritance in OOP?',
    options: ['A way to copy arrays', 'A mechanism for a class to derive properties from another class', 'A loop type', 'A data type'],
    correct_answer: 1,
    explanation: 'Inheritance lets a child class reuse and extend the attributes and methods of a parent class.',
  },
  {
    id: 'q17',
    question: 'What is the time complexity of accessing an array element by index?',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
    correct_answer: 2,
    explanation: 'Array indexing is constant time O(1) because the memory address can be computed directly.',
  },
  {
    id: 'q18',
    question: 'Which data structure follows Last-In-First-Out (LIFO) order?',
    options: ['Queue', 'Stack', 'Array', 'Tree'],
    correct_answer: 1,
    explanation: 'A stack adds and removes elements from the same end (the top), so the last item added is the first removed.',
  },
  {
    id: 'q19',
    question: 'What does a hash table provide?',
    options: ['Sorted storage', 'Fast key-value lookups', 'Fixed-size arrays', 'Tree traversal'],
    correct_answer: 1,
    explanation: 'Hash tables use a hash function to map keys to buckets, giving average O(1) insertion and lookup.',
  },
  {
    id: 'q20',
    question: 'What is the purpose of a database index?',
    options: ['To store images', 'To speed up query lookups on columns', 'To define table relationships', 'To encrypt data'],
    correct_answer: 1,
    explanation: 'An index creates a lookup structure on one or more columns so the database can find rows without scanning the whole table.',
  },
  {
    id: 'q21',
    question: 'What does SQL stand for?',
    options: ['Simple Query Language', 'Structured Query Language', 'Standard Question Logic', 'System Queue Layer'],
    correct_answer: 1,
    explanation: 'SQL stands for Structured Query Language, used to manage and query relational databases.',
  },
  {
    id: 'q22',
    question: 'Which keyword filters rows in a SQL query?',
    options: ['SELECT', 'WHERE', 'FROM', 'ORDER BY'],
    correct_answer: 1,
    explanation: 'The WHERE clause specifies a condition that rows must satisfy to be included in the result set.',
  },
  {
    id: 'q23',
    question: 'What is a foreign key?',
    options: ['A primary identifier for a row', 'A column that references another table\u2019s primary key', 'An encrypted column', 'A type of index'],
    correct_answer: 1,
    explanation: 'A foreign key creates a link between two tables by referencing the primary key of the related table.',
  },
  {
    id: 'q24',
    question: 'What does the "async/await" pattern help with?',
    options: ['Sorting arrays', 'Writing asynchronous code that reads sequentially', 'Defining classes', 'Creating databases'],
    correct_answer: 1,
    explanation: 'async/await lets you write promise-based asynchronous code that looks synchronous, avoiding deeply nested callbacks.',
  },
  {
    id: 'q25',
    question: 'What is a REST API?',
    options: ['A database engine', 'An architectural style for web services using HTTP verbs', 'A programming language', 'A UI framework'],
    correct_answer: 1,
    explanation: 'REST (Representational State Transfer) uses HTTP methods like GET, POST, PUT, DELETE to interact with resources via URLs.',
  },
  {
    id: 'q26',
    question: 'What is the difference between == and === in JavaScript?',
    options: ['There is no difference', '== checks value, === checks value and type', '=== is faster', '== is for strings only'],
    correct_answer: 1,
    explanation: '== performs type coercion before comparing values; === checks both value and type without coercion (strict equality).',
  },
  {
    id: 'q27',
    question: 'What is a closure?',
    options: ['A way to end a function', 'A function that retains access to its enclosing scope\u2019s variables', 'A type of loop', 'A database operation'],
    correct_answer: 1,
    explanation: 'A closure is a function bundled with references to its surrounding lexical environment, letting it access outer variables after the outer function returns.',
  },
  {
    id: 'q28',
    question: 'What does the term "mutability" refer to?',
    options: ['Whether a value can be changed after creation', 'The speed of a function', 'A type of error', 'A sorting algorithm'],
    correct_answer: 0,
    explanation: 'Mutable objects can be modified in place after creation; immutable objects cannot — you create a new value instead.',
  },
];

/**
 * Generates a deterministic 10-question quiz for a given lesson.
 * The lessonId seeds the shuffle so every visit shows the same questions.
 */
export function generateLessonQuiz(lessonId: number): AssessmentQuestion[] {
  const shuffled = seededShuffle(QUESTION_BANK, lessonId * 7919);
  return shuffled.slice(0, 10);
}
