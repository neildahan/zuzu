export interface User {
  _id: string;
  name: string;
  role: 'trainer' | 'client' | 'admin';
  email: string;
  password?: string;
  trainerId?: string | { _id: string; name: string };
  locale: 'en' | 'he';
  avatarUrl?: string;
  gender?: 'male' | 'female';
  height?: number;
  weight?: number;
  goal?: string;
  token?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Program {
  _id: string;
  trainerId: string | { _id: string; name: string };
  clientId: string | { _id: string; name: string };
  name: string;
  description?: string;
  weekCount: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Workout {
  _id: string;
  programId: string;
  name: string;
  dayOfWeek: number;
  weekNumber: number;
  type: 'strength' | 'cardio' | 'hybrid';
  order: number;
}

export interface ExerciseTargets {
  sets: number;
  repsMin: number;
  repsMax?: number;
  weight?: number;
  rir?: number;
  restBetweenSets: number;
  restAfterExercise: number;
}

export interface Exercise {
  _id: string;
  workoutId: string;
  templateId?: string;
  name: string;
  nameHe?: string;
  muscleGroup?: string;
  order: number;
  targets: ExerciseTargets;
  videoUrl?: string;
  notes?: string;
  notesHe?: string;
}

export interface ExerciseTemplate {
  _id: string;
  name: string;
  nameHe?: string;
  muscleGroup?: string;
  videoUrl?: string;
  notes?: string;
  notesHe?: string;
  defaultTargets?: Partial<ExerciseTargets>;
}

export interface SetData {
  setNumber: number;
  reps: number;
  weight: number;
  rir?: number;
  isCompleted: boolean;
}

export interface WorkoutLogExercise {
  exerciseId: string | Exercise;
  templateId?: string;
  name?: string;
  nameHe?: string;
  muscleGroup?: string;
  sets: SetData[];
}

export interface WorkoutLog {
  _id: string;
  clientId: string | User;
  workoutId?: string | Workout;
  programId?: string | Program;
  weekNumber: number;
  date: string;
  isCompleted: boolean;
  exercises: WorkoutLogExercise[];
  createdAt?: string;
}

export interface AdminStats {
  clients: number;
  trainers: number;
  programs: number;
  activePrograms: number;
  logs: number;
  completedLogs: number;
  templates: number;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PaginatedLogs {
  logs: WorkoutLog[];
  total: number;
  page: number;
  totalPages: number;
}
