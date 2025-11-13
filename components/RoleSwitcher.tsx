import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { User, Briefcase } from 'lucide-react';

interface RoleSwitcherProps {
    currentRole: UserRole;
    onRoleChange: (role: UserRole) => void;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [prevRole, setPrevRole] = useState<UserRole>(currentRole);

    useEffect(() => {
        if (prevRole !== currentRole) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setIsAnimating(false);
            }, 400);
            setPrevRole(currentRole);
            return () => clearTimeout(timer);
        }
    }, [currentRole, prevRole]);

    const isStudent = currentRole === 'student';

    return (
        <div className="relative bg-gray-100 p-1.5 rounded-xl shadow-inner border border-gray-200/50 overflow-hidden">
            {/* Animated background slider */}
            <div
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-lg shadow-md transition-all duration-400 ease-out ${
                    isStudent 
                        ? 'left-1.5 translate-x-0' 
                        : 'left-1.5 translate-x-[calc(100%+6px)]'
                } ${isAnimating ? 'scale-[1.02] shadow-lg' : 'scale-100'}`}
                style={{
                    boxShadow: isAnimating 
                        ? '0 8px 16px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)' 
                        : '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)'
                }}
            />
            
            {/* Buttons Container */}
            <div className="relative grid grid-cols-2 gap-0">
                {/* Student Button */}
                <button 
                    onClick={() => onRoleChange('student')}
                    className={`relative z-10 px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 min-w-0 ${
                        isStudent 
                            ? 'text-blue-600' 
                            : 'text-gray-600 hover:text-gray-800'
                    } ${isAnimating && isStudent ? 'scale-[1.02]' : ''}`}
                    type="button"
                >
                    <User className={`w-4 h-4 transition-all duration-300 ${
                        isStudent 
                            ? 'text-blue-600 scale-110' 
                            : 'text-gray-600 scale-100'
                    }`} />
                    <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                        isStudent ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                        Student
                    </span>
                </button>
                
                {/* Trainer Button */}
                <button 
                    onClick={() => onRoleChange('trainer')}
                    className={`relative z-10 px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 min-w-0 ${
                        !isStudent 
                            ? 'text-blue-600' 
                            : 'text-gray-600 hover:text-gray-800'
                    } ${isAnimating && !isStudent ? 'scale-[1.02]' : ''}`}
                    type="button"
                >
                    <Briefcase className={`w-4 h-4 transition-all duration-300 ${
                        !isStudent 
                            ? 'text-blue-600 scale-110' 
                            : 'text-gray-600 scale-100'
                    }`} />
                    <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                        !isStudent ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                        Trainer
                    </span>
                </button>
            </div>
        </div>
    );
};

export default RoleSwitcher;
