import React from 'react';
import { UserRole } from '../types';
import { UserCheck, ArrowRight } from 'lucide-react';

interface CompleteProfilePromptProps {
    role: UserRole;
    onComplete: () => void;
}

const CompleteProfilePrompt: React.FC<CompleteProfilePromptProps> = ({ role, onComplete }) => {
    const messages = {
        student: {
            title: "Complete Your Profile!",
            description: "Add your fitness stats and goals to get better trainer recommendations.",
            button: "Complete Now"
        },
        trainer: {
            title: "Strengthen Your Profile!",
            description: "A detailed bio and specialties help you attract more clients.",
            button: "Edit Profile"
        }
    };

    const content = messages[role];

    return (
        <div className="bg-gradient-to-br from-orange-50 to-blue-50 p-4 rounded-xl shadow-sm border border-slate-200/80">
            <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-inner">
                    <UserCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800">{content.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{content.description}</p>
                </div>
            </div>
            <button 
                onClick={onComplete} 
                className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm"
            >
                {content.button}
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

export default CompleteProfilePrompt;
