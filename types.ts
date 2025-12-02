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
  imageUrls?: string[]; // Multiple images for premium trainers
  capacity: number;
  schedule?: { days: string[]; time: string; };
  bookings?: Booking[];
  classType: ClassType;
  language?: string[]; // Languages spoken in the class
  level?: string; // Class level (e.g., "Beginner", "Intermediate", "Advanced", "Beginner to Intermediate")
  kids_friendly?: boolean; // Indicates if the class is suitable for children
  disability_friendly?: boolean; // Indicates if the class is accessible for people with disabilities
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
  shortDescription?: string; // Short description for cards
  experienceYears?: number; // Years of experience
  lastSeen?: string | null; // ISO timestamp of last activity
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
export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extremely_active';

export interface DietaryPreferences {
  duration: Duration;
  eatingStyle: EatingStyle;
  dietType: DietType;
  allergies: string;
  dislikes: string;
  // Calorie calculation fields
  age?: number;
  weight?: number; // in kg
  height?: number; // in cm
  gender?: Gender;
  activityLevel?: ActivityLevel;
  targetCalories?: number; // Optional: user can override calculated calories
}

export interface MealPlan {
  id: string;
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

export interface Venue {
  id: string;
  name: string;
  category: 'tennis' | 'pickleball' | 'golf' | 'boxing' | 'gym' | 'billiards' | 'basketball' | 'swimming' | 'yoga' | 'other';
  description: string;
  address: string;
  district: string;
  imageUrl: string;
  imageUrls: string[];
  pricePerHour: number;
  pricePerMonth: number;
  membershipPlans: {
    name: string;
    duration: string; // "1 month", "3 months", "6 months", "1 year"
    price: number;
    features: string[];
  }[];
  amenities: string[]; // "Parking", "Locker Room", "Shower", "WiFi", etc.
  equipment: string[];
  trainerAvailability: boolean;
  operatingHours: {
    day: string;
    open: string;
    close: string;
  }[];
  capacity: number;
  rating: number;
  reviews: number;
  phone?: string;
  email?: string;
  website?: string;
}