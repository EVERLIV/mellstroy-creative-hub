import React from 'react';
import { UserRole } from '../types';
import { User, Briefcase } from 'lucide-react';

interface RoleSwitcherProps {
    currentRole: UserRole;
    onRoleChange: (role: UserRole) => void;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
    return (
        <div className="relative bg-slate-200 p-1 rounded-xl grid grid-cols-2 gap-1">
            {/* Animated background indicator */}
            <div
                className={`absolute top-1 bottom-1 w-[calc(50%-2px)] bg-white rounded-lg shadow-sm transition-transform duration-300 ease-in-out
                    ${currentRole === 'student' ? 'translate-x-0' : 'translate-x-[calc(100%+4px)]'}`}
            />
            {/* Buttons are positioned relative to sit on top */}
            <button 
                onClick={() => onRoleChange('student')}
                className={`relative z-10 px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 
                    ${currentRole === 'student' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <User className="w-4 h-4" /> Student
            </button>
            <button 
                onClick={() => onRoleChange('trainer')}
                className={`relative z-10 px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2
                    ${currentRole === 'trainer' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Briefcase className="w-4 h-4" /> Trainer
            </button>
        </div>
    );
};

export default RoleSwitcher;