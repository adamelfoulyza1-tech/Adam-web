import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Task, ExpenseItem, HomeworkItem, UserProgress } from '../types';

const TASKS_COLLECTION = 'daily_tasks';
const EXPENSES_COLLECTION = 'user_expenses';
const HOMEWORK_COLLECTION = 'classroom_homework';
const PROGRESS_COLLECTION = 'python_progress';

// --- Local Storage Fallbacks & Cache ---
const getLocal = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
};

// ===================== TASKS =====================

export const subscribeTasks = (onUpdate: (tasks: Task[]) => void) => {
  try {
    const q = query(collection(db, TASKS_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          tasks.push({ ...docSnap.data(), id: docSnap.id } as Task);
        });
        tasks.sort((a, b) => b.createdAt - a.createdAt);
        setLocal('cached_tasks', tasks);
        onUpdate(tasks);
      },
      (error) => {
        console.warn('Firestore tasks listener fallback to local:', error);
        onUpdate(getLocal<Task[]>('cached_tasks', []));
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn('subscribeTasks error:', e);
    onUpdate(getLocal<Task[]>('cached_tasks', []));
    return () => {};
  }
};

export const saveTask = async (task: Task): Promise<void> => {
  // Update local cache first
  const current = getLocal<Task[]>('cached_tasks', []);
  const idx = current.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    current[idx] = task;
  } else {
    current.unshift(task);
  }
  setLocal('cached_tasks', current);

  try {
    const ref = doc(db, TASKS_COLLECTION, task.id);
    await setDoc(ref, task, { merge: true });
  } catch (err) {
    console.warn('Firestore saveTask offline fallback:', err);
  }
};

export const removeTask = async (id: string): Promise<void> => {
  const current = getLocal<Task[]>('cached_tasks', []);
  setLocal(
    'cached_tasks',
    current.filter((t) => t.id !== id)
  );

  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, id));
  } catch (err) {
    console.warn('Firestore removeTask offline fallback:', err);
  }
};

// ===================== EXPENSES =====================

export const subscribeExpenses = (onUpdate: (expenses: ExpenseItem[]) => void) => {
  try {
    const q = query(collection(db, EXPENSES_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: ExpenseItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ ...docSnap.data(), id: docSnap.id } as ExpenseItem);
        });
        items.sort((a, b) => b.createdAt - a.createdAt);
        setLocal('cached_expenses', items);
        onUpdate(items);
      },
      (error) => {
        console.warn('Firestore expenses listener fallback to local:', error);
        onUpdate(getLocal<ExpenseItem[]>('cached_expenses', []));
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn('subscribeExpenses error:', e);
    onUpdate(getLocal<ExpenseItem[]>('cached_expenses', []));
    return () => {};
  }
};

export const saveExpense = async (expense: ExpenseItem): Promise<void> => {
  const current = getLocal<ExpenseItem[]>('cached_expenses', []);
  const idx = current.findIndex((e) => e.id === expense.id);
  if (idx >= 0) {
    current[idx] = expense;
  } else {
    current.unshift(expense);
  }
  setLocal('cached_expenses', current);

  try {
    const ref = doc(db, EXPENSES_COLLECTION, expense.id);
    await setDoc(ref, expense, { merge: true });
  } catch (err) {
    console.warn('Firestore saveExpense offline fallback:', err);
  }
};

export const removeExpense = async (id: string): Promise<void> => {
  const current = getLocal<ExpenseItem[]>('cached_expenses', []);
  setLocal(
    'cached_expenses',
    current.filter((e) => e.id !== id)
  );

  try {
    await deleteDoc(doc(db, EXPENSES_COLLECTION, id));
  } catch (err) {
    console.warn('Firestore removeExpense offline fallback:', err);
  }
};

// ===================== HOMEWORK / CLASSROOM =====================

export const subscribeHomework = (onUpdate: (homework: HomeworkItem[]) => void) => {
  try {
    const q = query(collection(db, HOMEWORK_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: HomeworkItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ ...docSnap.data(), id: docSnap.id } as HomeworkItem);
        });
        items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        setLocal('cached_homework', items);
        onUpdate(items);
      },
      (error) => {
        console.warn('Firestore homework listener fallback to local:', error);
        onUpdate(getLocal<HomeworkItem[]>('cached_homework', []));
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn('subscribeHomework error:', e);
    onUpdate(getLocal<HomeworkItem[]>('cached_homework', []));
    return () => {};
  }
};

export const saveHomework = async (item: HomeworkItem): Promise<void> => {
  const current = getLocal<HomeworkItem[]>('cached_homework', []);
  const idx = current.findIndex((h) => h.id === item.id);
  if (idx >= 0) {
    current[idx] = item;
  } else {
    current.unshift(item);
  }
  setLocal('cached_homework', current);

  try {
    const ref = doc(db, HOMEWORK_COLLECTION, item.id);
    await setDoc(ref, item, { merge: true });
  } catch (err) {
    console.warn('Firestore saveHomework offline fallback:', err);
  }
};

export const saveBatchHomework = async (items: HomeworkItem[]): Promise<void> => {
  const current = getLocal<HomeworkItem[]>('cached_homework', []);
  const map = new Map<string, HomeworkItem>();
  current.forEach((h) => map.set(h.id, h));
  items.forEach((h) => map.set(h.id, h));
  const merged = Array.from(map.values());
  setLocal('cached_homework', merged);

  for (const item of items) {
    try {
      const ref = doc(db, HOMEWORK_COLLECTION, item.id);
      await setDoc(ref, item, { merge: true });
    } catch (e) {
      console.warn('Batch save homework error:', e);
    }
  }
};

export const removeHomework = async (id: string): Promise<void> => {
  const current = getLocal<HomeworkItem[]>('cached_homework', []);
  setLocal(
    'cached_homework',
    current.filter((h) => h.id !== id)
  );

  try {
    await deleteDoc(doc(db, HOMEWORK_COLLECTION, id));
  } catch (err) {
    console.warn('Firestore removeHomework offline fallback:', err);
  }
};

// ===================== PYTHON PROGRESS =====================

const DEFAULT_PROGRESS: UserProgress = {
  completedExerciseIds: [],
  totalXp: 0,
  level: 1,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  solvedCountByTopic: {},
};

export const getProgress = async (): Promise<UserProgress> => {
  const local = getLocal<UserProgress>('cached_python_progress', DEFAULT_PROGRESS);
  try {
    const ref = doc(db, PROGRESS_COLLECTION, 'user_main');
    const snap = await getDocs(query(collection(db, PROGRESS_COLLECTION)));
    let found = local;
    snap.forEach((d) => {
      if (d.id === 'user_main') {
        found = { ...DEFAULT_PROGRESS, ...d.data() } as UserProgress;
      }
    });
    setLocal('cached_python_progress', found);
    return found;
  } catch (err) {
    console.warn('Firestore getProgress offline fallback:', err);
    return local;
  }
};

export const saveProgress = async (progress: UserProgress): Promise<void> => {
  setLocal('cached_python_progress', progress);
  try {
    const ref = doc(db, PROGRESS_COLLECTION, 'user_main');
    await setDoc(ref, progress, { merge: true });
  } catch (err) {
    console.warn('Firestore saveProgress offline fallback:', err);
  }
};
