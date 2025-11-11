export interface Review {
  reviewerName: string;
  rating: number;
  comment: string;
}

export type ClassType = 'Indoor' | 'Outdoor' | 'Home';
export type UserRole = 'student' | 'trainer';

export interface Booking {
  date: string;
  time: string;
  userId: string;
  status: 'booked' | 'attended' | 'cancelled';
  hasLeftReview?: boolean;
}

export interface Class {
  id: number;
  name:string;
  description: string;
  duration: number; // in minutes
  price: number;
  imageUrl: string;
  capacity: number;
  schedule?: { days: string[]; time: string; };
  bookings?: Booking[];
  classType: ClassType;
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'trainer';
  timestamp: string;
  status?: 'sent' | 'read';
}

export interface Trainer {
  id: string;
  name: string;
  specialty: string[];
  rating: number;
  reviews: number;
  location: string;
  price: number; // "Starting from" price
  imageUrl: string;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  isPremium: boolean;
  bio: string;
  reviewsData: Review[];
  classes: Class[];
  chatHistory: Message[];
  aiWarning?: string;
  galleryImages?: string[];
  favoriteTrainerIds?: string[];
  onboardingCompleted?: boolean;
  role?: UserRole;
  phone?: string;
  // New student profile fields
  age?: number;
  height?: number; // in cm
  weight?: number; // in kg
  goals?: string[];
  interests?: string[]; // "Sport values"
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

// For AI Meal Planner
export interface Meal {
  name: string;
  description: string;
}

export interface DailyPlan {
  day: string;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks: Meal;
  };
  daily_summary: {
    calories: string;
    protein: string;
  };
}

export type Duration = 'day' | 'week' | 'month';
export type EatingStyle = 'Cooking' | 'Eat Out' | 'Mix';
export type DietType = 'Anything' | 'Vegetarian' | 'Vegan' | 'Low-Carb';


export interface DietaryPreferences {
  duration: Duration;
  eatingStyle: EatingStyle;
  dietType: DietType;
  allergies: string;
  dislikes: string;
}

export interface MealPlan {
  id: number;
  name: string;
  createdAt: string;
  plan: DailyPlan[];
  preferences: DietaryPreferences;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizerName: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  location: string;
  imageUrl: string;
  interestedUserIds: string[];
}