import React, { useState, useEffect } from 'react';
import { Class, ClassType } from '../types';
import { X, Save, Building, Sun, Home } from 'lucide-react';

interface AddEditClassModalProps {
    cls: Class | null | undefined;
    onSave: (classData: Class) => void;
    onCancel: () => void;
}

const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type FormData = Omit<Class, 'id' | 'bookings'>;

const AddEditClassModal: React.FC<AddEditClassModalProps> = ({ cls, onSave, onCancel }) => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        duration: 60,
        price: 150000,
        imageUrl: 'https://picsum.photos/id/119/800/600',
        capacity: 10,
        schedule: { days: [], time: '09:00' },
        classType: 'Indoor'
    });
    
    useEffect(() => {
        if (cls) {
            setFormData({
                name: cls.name,
                description: cls.description,
                duration: cls.duration,
                price: cls.price,
                imageUrl: cls.imageUrl,
                capacity: cls.capacity,
                schedule: cls.schedule || { days: [], time: '09:00' },
                classType: cls.classType || 'Indoor',
            });
        } else {
            // Reset to default for new class
            setFormData({
                name: '',
                description: '',
                duration: 60,
                price: 150000,
                imageUrl: 'https://picsum.photos/id/119/800/600',
                capacity: 10,
                schedule: { days: [], time: '09:00' },
                classType: 'Indoor'
            });
        }
    }, [cls]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'duration' || name === 'price' || name === 'capacity') ? parseInt(value) || 0 : value
        }));
    };

    const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            schedule: { ...prev.schedule!, [name]: value }
        }));
    };
    
    const handleDayToggle = (day: string) => {
        setFormData(prev => {
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
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData: Class = {
            id: cls?.id || 0,
            bookings: cls?.bookings || [],
            ...formData,
            ...(cls as any)?._dbId && { _dbId: (cls as any)._dbId }
        };
        onSave(finalData);
    };
    
    const classTypeOptions: { id: ClassType, label: string, icon: React.FC<any> }[] = [
        { id: 'Indoor', label: 'Indoor', icon: Building },
        { id: 'Outdoor', label: 'Outdoor', icon: Sun },
        { id: 'Home', label: 'Home', icon: Home },
    ];

    if (cls === undefined) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden transform animate-slide-up flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">{cls ? 'Edit Class' : 'Add New Class'}</h2>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                
                <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
                    <div className="p-5 space-y-3 flex-1 overflow-y-auto">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Class Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} required className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Class Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {classTypeOptions.map(opt => (
                                    <button
                                        type="button"
                                        key={opt.id}
                                        onClick={() => setFormData(prev => ({...prev, classType: opt.id}))}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-colors ${formData.classType === opt.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                    >
                                        <opt.icon className={`w-5 h-5 mb-1 ${formData.classType === opt.id ? 'text-blue-600' : 'text-slate-500'}`} />
                                        <span className={`text-xs font-semibold ${formData.classType === opt.id ? 'text-blue-700' : 'text-slate-600'}`}>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                         <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-slate-600 mb-1">Duration</label>
                                <input placeholder="min" type="number" id="duration" name="duration" value={formData.duration} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                            </div>
                            <div>
                                <label htmlFor="capacity" className="block text-sm font-medium text-slate-600 mb-1">Capacity</label>
                                <input type="number" id="capacity" name="capacity" value={formData.capacity} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                            </div>
                             <div>
                                <label htmlFor="price" className="block text-sm font-medium text-slate-600 mb-1">Price</label>
                                 <div className="relative">
                                    <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-sm">VND</span>
                                </div>
                            </div>
                        </div>
                        {/* Schedule Editor */}
                        <div>
                             <label className="block text-sm font-medium text-slate-600 mb-2">Recurring Schedule</label>
                             <div className="p-3 border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <label htmlFor="time" className="text-sm font-medium text-slate-600">Time:</label>
                                    <input type="time" name="time" value={formData.schedule?.time} onChange={handleScheduleChange} className="flex-1 w-full bg-slate-100 border-slate-300 rounded-md text-sm p-1.5 focus:ring-blue-500 focus:border-blue-500 text-slate-800"/>
                                </div>
                                <div className="mt-3">
                                    <label className="text-sm font-medium text-slate-600">Repeats on:</label>
                                    <div className="mt-2 grid grid-cols-4 gap-2">
                                        {dayOptions.map(day => {
                                            const isSelected = formData.schedule?.days.includes(day);
                                            return (
                                                <button type="button" key={day} onClick={() => handleDayToggle(day)} className={`p-2 text-xs font-bold rounded-lg transition-colors border ${isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}>
                                                    {day}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                             </div>
                        </div>
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-slate-600 mb-1">Image URL</label>
                            <input type="text" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                        </div>
                    </div>
                
                    <div className="p-5 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-3">
                        <button type="button" onClick={onCancel} className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-xl transition-colors hover:bg-gray-100">
                            Cancel
                        </button>
                        <button type="submit" className="w-full flex items-center justify-center bg-[#FF6B35] text-white font-bold py-2.5 rounded-xl transition-colors hover:bg-orange-600">
                           <Save className="w-5 h-5 mr-2" />
                           Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditClassModal;