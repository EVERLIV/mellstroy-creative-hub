import { Trainer } from '../types';

/**
 * Checks if a student's profile has the essential information filled out.
 * @param user The user object to check.
 * @returns True if the profile is considered complete, false otherwise.
 */
export const isStudentProfileComplete = (user: Trainer): boolean => {
    return !!(
        user.bio && user.bio.trim() !== '' &&
        user.age && user.age > 0 &&
        user.height && user.height > 0 &&
        user.weight && user.weight > 0 &&
        user.goals && user.goals.length > 0
    );
};

/**
 * Checks if a trainer's profile has the essential information filled out.
 * @param trainer The trainer object to check.
 * @returns True if the profile is considered complete, false otherwise.
 */
export const isTrainerProfileComplete = (trainer: Trainer): boolean => {
    return !!(
        trainer.bio && trainer.bio.trim().length > 30 &&
        trainer.specialty && trainer.specialty.length > 0 &&
        trainer.classes && trainer.classes.length > 0
    );
};
