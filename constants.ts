import { Category, ClassType, EatingStyle, DietType } from './types';

export const HCMC_DISTRICTS: string[] = [
  "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5",
  "Quận 6", "Quận 7", "Quận 8", "Quận 9", "Quận 10",
  "Quận 11", "Quận 12", "Quận Bình Thạnh", "Quận Gò Vấp",
  "Quận Phú Nhuận", "Quận Tân Bình", "Quận Tân Phú",
  "Quận Bình Tân", "Thành phố Thủ Đức", "Huyện Bình Chánh",
  "Huyện Cần Giờ", "Huyện Củ Chi", "Huyện Hóc Môn", "Huyện Nhà Bè"
];

export const FITNESS_ACTIVITIES: string[] = [
    'Yoga', 
    'Pilates', 
    'HIIT', 
    'CrossFit', 
    'Strength Training', 
    'Boxing', 
    'MMA', 
    'Swimming', 
    'Dance Fitness', 
    'Spin Class', 
    'Running', 
    'Calisthenics', 
    'Functional Training', 
    'Mobility & Flexibility', 
    'Nutritionist', 
    'Tennis', 
    'Badminton', 
    'Personal Training', 
    'Kickboxing',
    'Gym Coach',
];

export const FITNESS_GOALS: string[] = [
    "Weight Loss",
    "Muscle Gain",
    "Improve Endurance",
    "Increase Flexibility",
    "Learn a New Skill",
    "Stress Relief",
    "Improve Overall Health",
    "Train for an Event",
    "Increase Strength",
    "Improve Diet"
];

export const CLASS_TYPES: ClassType[] = ['Indoor', 'Outdoor', 'Home'];

export const EATING_STYLES: { id: EatingStyle, label: string }[] = [
    { id: 'Cooking', label: 'Cooking at Home' },
    { id: 'Eat Out', label: 'Eating Out' },
    { id: 'Mix', label: 'A Mix of Both' },
];

export const DIET_TYPES: { id: DietType, label: string }[] = [
    { id: 'Anything', label: 'Anything' },
    { id: 'Vegetarian', label: 'Vegetarian' },
    { id: 'Vegan', label: 'Vegan' },
    { id: 'Low-Carb', label: 'Low-Carb' },
];


export const CATEGORIES: Category[] = [
  { id: 'gym', name: 'Gym', icon: 'dumbbell' },
  { id: 'yoga', name: 'Yoga', icon: 'flower-2' },
  { id: 'boxing', name: 'Boxing', icon: 'hand' },
  { id: 'swimming', name: 'Swimming', icon: 'waves' },
  { id: 'pickleball', name: 'Pickleball', icon: 'disc-3' },
  { id: 'dance', name: 'Dance', icon: 'music-2' },
  { id: 'running', name: 'Running', icon: 'footprints' },
];
