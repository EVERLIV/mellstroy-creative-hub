import React, { useState } from 'react';
import { HCMC_DISTRICTS } from '../constants';
import { X, Search } from 'lucide-react';

interface DistrictFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDistrict: (district: string) => void;
    currentDistrict: string;
}

const DistrictFilterModal: React.FC<DistrictFilterModalProps> = ({ isOpen, onClose, onSelectDistrict, currentDistrict }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredDistricts = HCMC_DISTRICTS.filter(d => 
        d.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (district: string) => {
        onSelectDistrict(district);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[90] flex flex-col justify-end animate-fade-in" onClick={onClose}>
            <div 
                className="bg-white rounded-t-2xl w-full h-[85vh] flex flex-col transform animate-slide-up-full shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800">Select District</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                    <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for a district..."
                            className="w-full h-11 pl-10 pr-4 bg-slate-100 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </header>
                
                <div className="flex-1 overflow-y-auto">
                    <ul className="divide-y divide-slate-100">
                        <li>
                            <button 
                                onClick={() => handleSelect('All Districts')}
                                className={`w-full text-left px-5 py-3 font-semibold transition-colors ${currentDistrict === 'All Districts' ? 'bg-orange-50 text-[#FF6B35]' : 'hover:bg-slate-50'}`}
                            >
                                All Districts
                            </button>
                        </li>
                        {filteredDistricts.map(district => (
                            <li key={district}>
                                <button
                                    onClick={() => handleSelect(district)}
                                    className={`w-full text-left px-5 py-3 font-semibold transition-colors ${currentDistrict === district ? 'bg-orange-50 text-[#FF6B35]' : 'hover:bg-slate-50'}`}
                                >
                                    {district}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DistrictFilterModal;