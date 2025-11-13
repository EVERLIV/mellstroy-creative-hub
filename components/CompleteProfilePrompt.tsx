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
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-3 rounded-xl shadow-sm border border-border">
            <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-card shadow-inner">
                    <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm">{content.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{content.description}</p>
                </div>
            </div>
            <button 
                onClick={onComplete} 
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-all duration-200 text-sm shadow-md"
            >
                <span>{content.button}</span>
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

export default CompleteProfilePrompt;
