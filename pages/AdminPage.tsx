
import React, { useState } from 'react';
import { Trainer, Class, ClassType } from '../types';
import { HCMC_DISTRICTS, CLASS_TYPES } from '../constants';
import { UserPlus, PlusCircle, User, BookOpen, Users } from 'lucide-react';

interface AdminPageProps {
    trainers: Trainer[];
    onCreateTrainer: (trainerData: Omit<Trainer, 'id'>) => void;
    onCreateCourse: (trainerId: string, courseData: Omit<Class, 'id'>) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ trainers, onCreateTrainer, onCreateCourse }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'courses'>('users');

    const [newTrainer, setNewTrainer] = useState({ name: '', specialty: '', location: HCMC_DISTRICTS[0], price: 150000 });
    const [newCourse, setNewCourse] = useState({ trainerId: trainers[0]?.id || '', name: '', description: '', duration: 60, price: 150000, capacity: 10, classType: CLASS_TYPES[0] as ClassType });

    const handleTrainerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewTrainer(prev => ({ ...prev, [name]: name === 'price' ? parseInt(value) || 0 : value }));
    };

    const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewCourse(prev => ({ ...prev, [name]: ['duration', 'price', 'capacity'].includes(name) ? parseInt(value) || 0 : value }));
    };

    const handleCreateTrainer = (e: React.FormEvent) => {
        e.preventDefault();
        const trainerData: Omit<Trainer, 'id'> = {
            ...newTrainer,
            specialty: newTrainer.specialty.split(',').map(s => s.trim()),
            rating: 5.0,
            reviews: 0,
            imageUrl: `https://i.pravatar.cc/300?u=${Date.now()}`,
            verificationStatus: 'verified',
            isPremium: false,
            bio: 'Newly added trainer. Bio pending update.',
            reviewsData: [],
            classes: [],
            chatHistory: [],
        };
        onCreateTrainer(trainerData);
        setNewTrainer({ name: '', specialty: '', location: HCMC_DISTRICTS[0], price: 150000 }); // Reset form
    };

    const handleCreateCourse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCourse.trainerId) {
            alert("Please select a trainer.");
            return;
        }
        const { trainerId, ...courseData } = newCourse;
        const finalCourseData = {
            ...courseData,
            imageUrl: 'https://picsum.photos/id/121/800/600',
            bookings: [],
        };
        onCreateCourse(trainerId, finalCourseData);
        setNewCourse({ trainerId: trainers[0]?.id || '', name: '', description: '', duration: 60, price: 150000, capacity: 10, classType: CLASS_TYPES[0] as ClassType }); // Reset form
    };

    return (
        <div className="bg-muted h-full overflow-y-auto">
            <div className="p-4 pt-6 pb-safe-nav">
                <h1 className="text-2xl font-bold text-foreground text-center mb-4">Admin Dashboard</h1>
                <div className="bg-muted p-1 rounded-xl grid grid-cols-2 gap-1 mb-4">
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                        <Users className="w-4 h-4" /> Manage Trainers
                    </button>
                    <button onClick={() => setActiveTab('courses')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'courses' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                       <BookOpen className="w-4 h-4" /> Manage Courses
                    </button>
                </div>

                {activeTab === 'users' && (
                    <div className="space-y-4 animate-fade-in">
                        <form onSubmit={handleCreateTrainer} className="bg-card p-4 rounded-xl shadow-sm border border-border/80 space-y-3">
                            <h2 className="font-bold text-foreground flex items-center"><UserPlus className="w-5 h-5 mr-2 text-primary"/>Create New Trainer</h2>
                            <input name="name" value={newTrainer.name} onChange={handleTrainerChange} placeholder="Full Name" required className="w-full px-3 py-2 border border-border rounded-lg"/>
                            <input name="specialty" value={newTrainer.specialty} onChange={handleTrainerChange} placeholder="Specialties (comma-separated)" required className="w-full px-3 py-2 border border-border rounded-lg"/>
                            <select name="location" value={newTrainer.location} onChange={handleTrainerChange} className="w-full px-3 py-2 border border-border rounded-lg bg-card">
                                {HCMC_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <input type="number" name="price" value={newTrainer.price} onChange={handleTrainerChange} placeholder="Starting Price" required className="w-full px-3 py-2 border border-border rounded-lg"/>
                            <button type="submit" className="w-full bg-primary text-white font-bold py-2.5 rounded-xl">Add Trainer</button>
                        </form>
                        <div className="bg-card p-4 rounded-xl shadow-sm border border-border/80">
                             <h2 className="font-bold text-foreground mb-2">Existing Trainers ({trainers.length})</h2>
                             <ul className="space-y-2 max-h-60 overflow-y-auto">
                                {trainers.map(t => <li key={t.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-md text-sm"><span className="font-semibold">{t.name}</span> <span className="text-muted-foreground">{t.location}</span></li>)}
                             </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'courses' && (
                     <div className="space-y-4 animate-fade-in">
                        <form onSubmit={handleCreateCourse} className="bg-card p-4 rounded-xl shadow-sm border border-border/80 space-y-3">
                            <h2 className="font-bold text-foreground flex items-center"><PlusCircle className="w-5 h-5 mr-2 text-emerald-500"/>Create New Course</h2>
                            <select name="trainerId" value={newCourse.trainerId} onChange={handleCourseChange} required className="w-full px-3 py-2 border border-border rounded-lg bg-card">
                                <option value="" disabled>Select a Trainer</option>
                                {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <input name="name" value={newCourse.name} onChange={handleCourseChange} placeholder="Course Name" required className="w-full px-3 py-2 border border-border rounded-lg"/>
                            <textarea name="description" value={newCourse.description} onChange={handleCourseChange} placeholder="Description" required className="w-full px-3 py-2 border border-border rounded-lg"/>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" name="duration" value={newCourse.duration} onChange={handleCourseChange} placeholder="Duration (min)" required className="w-full px-3 py-2 border border-border rounded-lg"/>
                                <input type="number" name="capacity" value={newCourse.capacity} onChange={handleCourseChange} placeholder="Capacity" required className="w-full px-3 py-2 border border-border rounded-lg"/>
                            </div>
                            <input type="number" name="price" value={newCourse.price} onChange={handleCourseChange} placeholder="Price (VND)" required className="w-full px-3 py-2 border border-border rounded-lg"/>
                             <select name="classType" value={newCourse.classType} onChange={handleCourseChange} className="w-full px-3 py-2 border border-border rounded-lg bg-card">
                                {CLASS_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                            </select>
                            <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-2.5 rounded-xl">Add Course</button>
                        </form>
                         <div className="bg-card p-4 rounded-xl shadow-sm border border-border/80">
                             <h2 className="font-bold text-foreground mb-2">Existing Courses</h2>
                             <div className="space-y-3 max-h-60 overflow-y-auto">
                                {trainers.map(t => t.classes.length > 0 && (
                                    <div key={t.id}>
                                        <h3 className="font-semibold text-sm text-muted-foreground border-b pb-1 mb-1">{t.name}</h3>
                                        <ul className="space-y-1">
                                            {t.classes.map(c => <li key={c.id} className="text-sm p-1 bg-muted/50 rounded">{c.name}</li>)}
                                        </ul>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
