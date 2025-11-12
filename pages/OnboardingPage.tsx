import React, { useState } from 'react';
import { Trainer, Class, UserRole, ClassType } from '../types';
import { HCMC_DISTRICTS, FITNESS_ACTIVITIES, FITNESS_GOALS, CLASS_TYPES } from '../constants';
import { User, Briefcase, ArrowRight, Save, Building, Sun, Home } from 'lucide-react';
import { AUTH_LOGO_URL } from '../config/assets';


interface OnboardingPageProps {
    currentUser: Trainer;
    onComplete: (updatedUser: Trainer) => void;
}

const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const OnboardingPage: React.FC<OnboardingPageProps> = ({ currentUser, onComplete }) => {
    const [step, setStep] = useState<'role' | 'student-form' | 'trainer-profile' | 'trainer-class'>('role');
    const [formData, setFormData] = useState<Trainer>(currentUser);
    const [classData, setClassData] = useState({
        name: '', description: '', duration: 60, price: 150000, capacity: 10, classType: 'Indoor' as ClassType,
        schedule: { days: [] as string[], time: '09:00' }
    });

    const handleRoleSelect = (role: UserRole) => {
        setFormData(prev => ({ ...prev, role }));
        if (role === 'student') {
            setStep('student-form');
        } else {
            setStep('trainer-profile');
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['age', 'height', 'weight', 'price'].includes(name);
        setFormData(prev => ({
            ...prev,
            [name]: isNumeric ? (value === '' ? undefined : parseInt(value)) : value
        }));
    };
    
    const handleClassFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setClassData(prev => ({
            ...prev,
            [name]: ['duration', 'price', 'capacity'].includes(name) ? parseInt(value) || 0 : value
        }));
    };
    
    const handleDayToggle = (day: string) => {
        setClassData(prev => {
            const currentDays = prev.schedule?.days || [];
            const newDays = currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day];
            return {
                ...prev,
                schedule: { ...prev.schedule!, days: newDays }
            };
        });
    };
    
    const handleScheduleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setClassData(prev => ({
            ...prev,
            schedule: { ...prev.schedule!, time: value }
        }));
    };

    const handleToggle = (field: 'goals' | 'interests' | 'specialty', value: string) => {
        setFormData(prev => {
            const currentValues = prev[field] || [];
            const isSelected = currentValues.includes(value);
            const maxSelections = field === 'specialty' ? 3 : 5;

            if (isSelected) {
                return { ...prev, [field]: currentValues.filter(v => v !== value) };
            } else if (currentValues.length < maxSelections) {
                return { ...prev, [field]: [...currentValues, value] };
            }
            return prev;
        });
    };

    const handleStudentSubmit = () => {
        onComplete({ ...formData, onboardingCompleted: true });
    };

    const handleTrainerProfileSubmit = () => {
        setStep('trainer-class');
    };

    const handleTrainerClassSubmit = () => {
        const newClass: Class = {
            id: Date.now(),
            name: classData.name,
            description: classData.description,
            duration: classData.duration,
            price: classData.price,
            imageUrl: 'https://picsum.photos/id/119/800/600',
            capacity: classData.capacity,
            schedule: classData.schedule,
            classType: classData.classType,
            bookings: [],
        };
        onComplete({ ...formData, classes: [newClass], onboardingCompleted: true });
    };
    
    const renderRoleSelection = () => (
        <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800">Welcome to RhinoFit!</h1>
            <p className="text-slate-500 mt-2 mb-6">First, tell us what brings you here:</p>
            <p className="text-lg font-semibold text-slate-700 mb-8">Do you want to teach or learn?</p>
            <div className="mt-8 space-y-4">
                <button onClick={() => handleRoleSelect('student')} className="w-full max-w-xs p-6 bg-white border-2 border-slate-200 rounded-2xl text-left hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 group">
                    <User className="w-8 h-8 text-orange-500 mb-3" />
                    <h2 className="font-bold text-lg text-slate-800">I Want to Learn</h2>
                    <p className="text-sm text-slate-500">Find trainers and book fitness classes</p>
                </button>
                <button onClick={() => handleRoleSelect('trainer')} className="w-full max-w-xs p-6 bg-white border-2 border-slate-200 rounded-2xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 group">
                    <Briefcase className="w-8 h-8 text-blue-500 mb-3" />
                    <h2 className="font-bold text-lg text-slate-800">I Want to Teach</h2>
                    <p className="text-sm text-slate-500">Offer classes and manage students</p>
                </button>
            </div>
            <p className="text-xs text-slate-400 mt-6">⚠️ You can only choose one role per account</p>
        </div>
    );
    
    const renderStudentForm = () => (
        <div className="w-full max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 text-center">Tell Us About Yourself</h1>
            <p className="text-slate-500 mt-1 text-center">This helps us recommend the best trainers for you.</p>
            <form onSubmit={(e) => { e.preventDefault(); handleStudentSubmit(); }} className="mt-6 space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg"/>
                    </div>
                     <div className="grid grid-cols-3 gap-3">
                         <div><label htmlFor="age" className="block text-sm font-medium text-slate-600 mb-1">Age</label><input type="number" id="age" name="age" value={formData.age || ''} onChange={handleFormChange} className="w-full px-2 py-2 border border-slate-300 rounded-lg"/></div>
                         <div><label htmlFor="height" className="block text-sm font-medium text-slate-600 mb-1">Height (cm)</label><input type="number" id="height" name="height" value={formData.height || ''} onChange={handleFormChange} className="w-full px-2 py-2 border border-slate-300 rounded-lg"/></div>
                         <div><label htmlFor="weight" className="block text-sm font-medium text-slate-600 mb-1">Weight (kg)</label><input type="number" id="weight" name="weight" value={formData.weight || ''} onChange={handleFormChange} className="w-full px-2 py-2 border border-slate-300 rounded-lg"/></div>
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
                     <h3 className="font-bold text-slate-800">My Fitness Goals <span className="font-normal text-sm text-slate-400">(Max 5)</span></h3>
                     <div className="flex flex-wrap gap-2">
                        {FITNESS_GOALS.map(goal => <button type="button" key={goal} onClick={() => handleToggle('goals', goal)} className={`px-3 py-1.5 text-sm font-semibold rounded-full border ${(formData.goals || []).includes(goal) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-700 border-slate-300'}`}>{goal}</button>)}
                    </div>
                 </div>
                 <button type="submit" className="w-full flex items-center justify-center bg-[#FF6B35] text-white font-bold py-3.5 rounded-xl">
                    Finish & Find Trainers <ArrowRight className="w-5 h-5 ml-2" />
                </button>
            </form>
        </div>
    );
    
    const renderTrainerProfileForm = () => (
         <div className="w-full max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 text-center">Setup Your Trainer Profile</h1>
            <p className="text-slate-500 mt-1 text-center">This is how students will see you.</p>
             <form onSubmit={(e) => { e.preventDefault(); handleTrainerProfileSubmit(); }} className="mt-6 space-y-4">
                 <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <div><label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Full Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg"/></div>
                    <div><label htmlFor="bio" className="block text-sm font-medium text-slate-600 mb-1">About Me</label><textarea id="bio" name="bio" value={formData.bio} onChange={handleFormChange} rows={4} placeholder="Your experience, qualifications, teaching style..." className="w-full px-3 py-2 border border-slate-300 rounded-lg"/></div>
                    <div><label htmlFor="location" className="block text-sm font-medium text-slate-600 mb-1">Location</label><select id="location" name="location" value={formData.location} onChange={handleFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">{HCMC_DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                 </div>
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
                     <h3 className="font-bold text-slate-800">Specialties <span className="font-normal text-sm text-slate-400">(Max 3)</span></h3>
                     <div className="flex flex-wrap gap-2">
                        {FITNESS_ACTIVITIES.map(activity => <button type="button" key={activity} onClick={() => handleToggle('specialty', activity)} className={`px-3 py-1.5 text-sm font-semibold rounded-full border ${(formData.specialty || []).includes(activity) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-700 border-slate-300'}`}>{activity}</button>)}
                    </div>
                 </div>
                 <button type="submit" className="w-full flex items-center justify-center bg-[#FF6B35] text-white font-bold py-3.5 rounded-xl">Next: Create First Class <ArrowRight className="w-5 h-5 ml-2" /></button>
            </form>
         </div>
    );
    
    const renderTrainerClassForm = () => (
        <div className="w-full max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 text-center">Create Your First Class</h1>
            <p className="text-slate-500 mt-1 text-center">You can add more later from your profile.</p>
            <form onSubmit={(e) => { e.preventDefault(); handleTrainerClassSubmit(); }} className="mt-6 space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <div><label htmlFor="className" className="block text-sm font-medium text-slate-600 mb-1">Class Name</label><input type="text" id="className" name="name" value={classData.name} onChange={handleClassFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg"/></div>
                    <div><label htmlFor="classDesc" className="block text-sm font-medium text-slate-600 mb-1">Description</label><textarea id="classDesc" name="description" value={classData.description} onChange={handleClassFormChange} required rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg"/></div>
                    <div className="grid grid-cols-3 gap-3">
                         <div><label htmlFor="duration" className="block text-sm font-medium text-slate-600 mb-1">Duration (min)</label><input type="number" id="duration" name="duration" value={classData.duration} onChange={handleClassFormChange} className="w-full px-2 py-2 border border-slate-300 rounded-lg"/></div>
                         <div><label htmlFor="capacity" className="block text-sm font-medium text-slate-600 mb-1">Capacity</label><input type="number" id="capacity" name="capacity" value={classData.capacity} onChange={handleClassFormChange} className="w-full px-2 py-2 border border-slate-300 rounded-lg"/></div>
                         <div><label htmlFor="price" className="block text-sm font-medium text-slate-600 mb-1">Price (VND)</label><input type="number" id="price" name="price" value={classData.price} onChange={handleClassFormChange} className="w-full px-2 py-2 border border-slate-300 rounded-lg"/></div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Schedule</label>
                        <div className="p-3 border border-slate-200 rounded-lg">
                            <div className="flex items-center gap-3"><label htmlFor="time" className="text-sm font-medium text-slate-600">Time:</label><input type="time" name="time" value={classData.schedule.time} onChange={handleScheduleTimeChange} className="flex-1 w-full bg-slate-100 border-slate-300 rounded-md p-1.5"/></div>
                            <div className="mt-3"><label className="text-sm font-medium text-slate-600">Repeats on:</label><div className="mt-2 grid grid-cols-4 gap-2">{dayOptions.map(day=><button type="button" key={day} onClick={()=>handleDayToggle(day)} className={`p-2 text-xs font-bold rounded-lg border ${classData.schedule.days.includes(day) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-300'}`}>{day}</button>)}</div></div>
                        </div>
                    </div>
                </div>
                 <button type="submit" className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3.5 rounded-xl">
                    Complete Setup & View Profile <ArrowRight className="w-5 h-5 ml-2" />
                </button>
            </form>
        </div>
    );


    const renderContent = () => {
        switch (step) {
            case 'student-form': return renderStudentForm();
            case 'trainer-profile': return renderTrainerProfileForm();
            case 'trainer-class': return renderTrainerClassForm();
            case 'role':
            default: return renderRoleSelection();
        }
    }

    return (
        <div className="bg-slate-100 min-h-screen flex flex-col items-center justify-center p-4">
            <img src={AUTH_LOGO_URL} alt="RhinoFit Logo" className="w-16 h-16 mb-4" />
            {renderContent()}
        </div>
    );
};

export default OnboardingPage;
