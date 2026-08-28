export type Priority = 'low' | 'medium' | 'high';
export type TaskCategory = 'study' | 'work' | 'personal' | 'coding' | 'finance' | 'other';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  priority: Priority;
  category: TaskCategory;
  status: TaskStatus;
  subtasks?: { id: string; title: string; completed: boolean }[];
  createdAt: number;
  updatedAt: number;
}

export type ExpenseType = 'income' | 'expense';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'education'
  | 'entertainment'
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'gift'
  | 'other';

export interface ExpenseItem {
  id: string;
  type: ExpenseType;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  time?: string;
  note?: string;
  slipImage?: string; // Base64 data url or image URL
  slipImageName?: string;
  createdAt: number;
}

export interface HomeworkItem {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  status: 'not_started' | 'in_progress' | 'turned_in';
  alternateLink?: string;
  maxPoints?: number;
  source: 'google_classroom' | 'manual';
  createdAt: number;
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  color?: string;
}

export type PythonDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type PythonTopic =
  | 'syntax'
  | 'variables'
  | 'datatypes'
  | 'numbers'
  | 'strings'
  | 'booleans'
  | 'operators'
  | 'lists'
  | 'tuples'
  | 'sets'
  | 'dictionaries'
  | 'ifelse'
  | 'whileloops'
  | 'forloops'
  | 'functions'
  | 'lambda'
  | 'arrays'
  | 'classes'
  | 'inheritance'
  | 'iterators'
  | 'polymorphism'
  | 'scope'
  | 'modules'
  | 'dates'
  | 'math'
  | 'json'
  | 'regex'
  | 'pip'
  | 'tryexcept'
  | 'userinput'
  | 'formatting'
  | 'filehandling';

export interface PythonExercise {
  id: string;
  topic: PythonTopic;
  topicName: string;
  title: string;
  difficulty: PythonDifficulty;
  description: string;
  w3schoolsUrl: string;
  initialCode: string;
  expectedOutput?: string;
  testCode?: string;
  validationType: 'exact_output' | 'contains_code' | 'regex_match' | 'function_test';
  solution: string;
  hints: string[];
  explanation: string;
}

export interface UserProgress {
  completedExerciseIds: string[];
  totalXp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  solvedCountByTopic: Record<string, number>;
}

export type ActivePage = 'tasks' | 'expenses' | 'classroom' | 'python' | 'settings';

export type ThemeAccent = 'red' | 'blue' | 'dual';
