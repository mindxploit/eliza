export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  chapters: Chapter[];
  totalDuration: number; // in minutes
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string;
  order: number;
  duration: number; // in minutes
  exercises?: Exercise[];
  quizzes?: Quiz[];
}

export interface Exercise {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  type: 'coding' | 'written' | 'practical';
  solution?: string;
}

export interface Quiz {
  id: string;
  chapterId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface StudentProgress {
  studentId: string;
  courseId: string;
  currentChapter: string;
  completedChapters: string[];
  lastAccessedAt: string;
  progressPercentage: number;
}

export interface CourseConfig {
  apiUrl: string;
  apiKey: string;
}

export interface MessageTemplate {
  type: 'chapter_intro' | 'chapter_complete' | 'quiz_result' | 'course_progress';
  template: string;
  variables: string[];
}
