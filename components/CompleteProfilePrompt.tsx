import React from 'react';
import { UserRole } from '../types';
import { UserCheck, ArrowRight } from 'lucide-react';
import { Button } from '../src/components/ui/button';

interface CompleteProfilePromptProps {
    role: UserRole;
    onComplete: () => void;
}

const MESSAGES = {
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
} as const;

const CompleteProfilePrompt: React.FC<CompleteProfilePromptProps> = ({ role, onComplete }) => {
    const content = MESSAGES[role];

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4 md:p-5">
            <div className="flex flex-1 items-start gap-3 sm:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card shadow-inner">
                    <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground">{content.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{content.description}</p>
                </div>
            </div>
            <Button onClick={onComplete} className="w-full font-semibold sm:w-auto">
                {content.button}
                <ArrowRight />
            </Button>
        </div>
    );
};

export default CompleteProfilePrompt;
