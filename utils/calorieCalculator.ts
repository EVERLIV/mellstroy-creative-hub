import { Gender, ActivityLevel } from '../types';

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 * This is the number of calories your body burns at rest
 */
export function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
  // Mifflin-St Jeor Equation
  // Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) + 5
  // Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) - 161
  
  const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
  
  if (gender === 'male') {
    return baseBMR + 5;
  } else {
    return baseBMR - 161;
  }
}

/**
 * Activity level multipliers for TDEE calculation
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,        // Little or no exercise
  light: 1.375,          // Exercise 1-3 times/week
  moderate: 1.55,        // Exercise 4-5 times/week
  very_active: 1.725,    // Daily exercise or intense exercise 3-4 times/week
  extremely_active: 1.9, // Intense exercise 6-7 times/week or physical job
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * This is the total number of calories you burn in a day including activity
 */
export function calculateTDEE(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel
): number {
  const bmr = calculateBMR(weight, height, age, gender);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmr * multiplier);
}

/**
 * Get activity level description
 */
export function getActivityLevelDescription(level: ActivityLevel): string {
  const descriptions: Record<ActivityLevel, string> = {
    sedentary: 'Little or no exercise',
    light: 'Exercise 1-3 times/week',
    moderate: 'Exercise 4-5 times/week',
    very_active: 'Daily exercise or intense exercise 3-4 times/week',
    extremely_active: 'Intense exercise 6-7 times/week',
  };
  return descriptions[level];
}
