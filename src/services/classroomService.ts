import { ClassroomCourse, HomeworkItem } from '../types';
import { googleClientId } from '../lib/firebase';

const SAMPLE_COURSES: ClassroomCourse[] = [
  {
    id: 'course_py_101',
    name: 'CS102: Python & Data Analysis',
    section: 'Sec 1 (Computer Science)',
    descriptionHeading: 'Fundamental Python, Algorithms, and Automation',
    color: '#3b82f6',
  },
  {
    id: 'course_math_201',
    name: 'MTH201: Discrete Mathematics & Logic',
    section: 'Sec 2',
    descriptionHeading: 'Set theory, graphs, and Boolean algebra',
    color: '#ef4444',
  },
  {
    id: 'course_web_301',
    name: 'INT305: Full-Stack Web Development',
    section: 'Sec 3',
    descriptionHeading: 'React, Node.js, and Cloud Databases',
    color: '#10b981',
  },
  {
    id: 'course_fin_101',
    name: 'ACT101: Personal Finance & Accounting',
    section: 'Sec 1',
    descriptionHeading: 'Income, expense, and investment principles',
    color: '#f59e0b',
  },
];

export const getSampleCourses = (): ClassroomCourse[] => SAMPLE_COURSES;

export const getSampleHomework = (): HomeworkItem[] => {
  const today = new Date();
  const d1 = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const d2 = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const d3 = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dPast = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return [
    {
      id: 'hw_sample_1',
      courseId: 'course_py_101',
      courseName: 'CS102: Python & Data Analysis',
      title: 'Lab 4: W3Schools Functions & List Comprehensions',
      description: 'ให้นักศึกษาทำแบบฝึกหัด Python เรื่อง Functions (*args) และ List Comprehensions ส่งไฟล์ .py',
      dueDate: d1,
      dueTime: '23:59',
      status: 'in_progress',
      maxPoints: 100,
      alternateLink: 'https://classroom.google.com',
      source: 'google_classroom',
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'hw_sample_2',
      courseId: 'course_math_201',
      courseName: 'MTH201: Discrete Mathematics & Logic',
      title: 'Assignment 3: Truth Tables & Boolean Logic',
      description: 'แบบฝึกหัดพิสูจน์ความสมมูลของประพจน์ และเขียนตารางค่าความจริงบทที่ 3',
      dueDate: d2,
      dueTime: '17:00',
      status: 'not_started',
      maxPoints: 50,
      alternateLink: 'https://classroom.google.com',
      source: 'google_classroom',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'hw_sample_3',
      courseId: 'course_web_301',
      courseName: 'INT305: Full-Stack Web Development',
      title: 'Project Milestone 2: UI Design & Firebase Setup',
      description: 'ส่งลิงก์ GitHub และตัวอย่าง UI ที่เชื่อมต่อกับ Firestore Database',
      dueDate: d3,
      dueTime: '20:00',
      status: 'not_started',
      maxPoints: 100,
      alternateLink: 'https://classroom.google.com',
      source: 'google_classroom',
      createdAt: Date.now(),
    },
    {
      id: 'hw_sample_4',
      courseId: 'course_fin_101',
      courseName: 'ACT101: Personal Finance & Accounting',
      title: 'Quiz 1: Monthly Budget & Expense Categorization',
      description: 'สรุปการจัดหมวดหมู่รายรับรายจ่าย พร้อมจัดทำรายงานงบการเงินส่วนบุคคล',
      dueDate: dPast,
      dueTime: '12:00',
      status: 'turned_in',
      maxPoints: 20,
      alternateLink: 'https://classroom.google.com',
      source: 'google_classroom',
      createdAt: Date.now() - 86400000 * 4,
    },
  ];
};

/**
 * Syncs real coursework from Google Classroom API using OAuth access token
 */
export const fetchClassroomData = async (accessToken: string): Promise<{ courses: ClassroomCourse[]; homework: HomeworkItem[] }> => {
  try {
    // 1. Fetch active courses
    const coursesRes = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!coursesRes.ok) {
      throw new Error(`Google Classroom API error: ${coursesRes.statusText}`);
    }

    const coursesData = await coursesRes.json();
    const rawCourses = coursesData.courses || [];
    const courses: ClassroomCourse[] = rawCourses.map((c: any) => ({
      id: c.id,
      name: c.name,
      section: c.section,
      descriptionHeading: c.descriptionHeading,
      room: c.room,
      color: '#3b82f6',
    }));

    const homeworkList: HomeworkItem[] = [];

    // 2. Fetch coursework for each course
    for (const course of rawCourses) {
      try {
        const cwRes = await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (cwRes.ok) {
          const cwData = await cwRes.json();
          const list = cwData.courseWork || [];
          for (const item of list) {
            let dueDate = '';
            let dueTime = '23:59';
            if (item.dueDate) {
              const y = item.dueDate.year;
              const m = String(item.dueDate.month).padStart(2, '0');
              const d = String(item.dueDate.day).padStart(2, '0');
              dueDate = `${y}-${m}-${d}`;
            } else {
              // Default to 7 days ahead
              const future = new Date(Date.now() + 7 * 86400000);
              dueDate = future.toISOString().split('T')[0];
            }

            if (item.dueTime) {
              const h = String(item.dueTime.hours || 0).padStart(2, '0');
              const min = String(item.dueTime.minutes || 0).padStart(2, '0');
              dueTime = `${h}:${min}`;
            }

            homeworkList.push({
              id: item.id,
              courseId: course.id,
              courseName: course.name,
              title: item.title,
              description: item.description,
              dueDate,
              dueTime,
              status: 'not_started',
              alternateLink: item.alternateLink,
              maxPoints: item.maxPoints,
              source: 'google_classroom',
              createdAt: Date.now(),
            });
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch coursework for ${course.id}:`, err);
      }
    }

    return { courses, homework: homeworkList };
  } catch (error) {
    console.error('fetchClassroomData error:', error);
    throw error;
  }
};
