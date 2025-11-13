import { Venue } from '../types';

export const mockVenues: Venue[] = [
    {
        id: 'venue-1',
        name: 'Elite Tennis Club',
        category: 'tennis',
        description: 'Premium tennis facility with 8 professional courts, including 4 indoor and 4 outdoor courts. Features state-of-the-art lighting, high-quality court surfaces, and professional coaching services. Perfect for both recreational players and competitive training.',
        address: '123 Nguyen Hue Boulevard',
        district: 'District 1',
        imageUrl: 'https://images.unsplash.com/photo-1622163642992-6b3273c8b390?w=800',
        imageUrls: [
            'https://images.unsplash.com/photo-1622163642992-6b3273c8b390?w=800',
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800'
        ],
        pricePerHour: 500000,
        pricePerMonth: 8000000,
        membershipPlans: [
            {
                name: 'Basic',
                duration: '1 month',
                price: 8000000,
                features: ['Unlimited court access', 'Locker room access', 'Free parking']
            },
            {
                name: 'Premium',
                duration: '3 months',
                price: 21000000,
                features: ['Unlimited court access', 'Locker room access', 'Free parking', 'Free coaching session', 'Priority booking']
            },
            {
                name: 'Elite',
                duration: '6 months',
                price: 36000000,
                features: ['Unlimited court access', 'Locker room access', 'Free parking', 'Unlimited coaching sessions', 'Priority booking', 'Guest passes']
            }
        ],
        amenities: ['Parking', 'Locker Room', 'Shower', 'WiFi', 'Pro Shop', 'Cafe', 'Air Conditioning'],
        equipment: ['Professional Tennis Courts', 'Ball Machines', 'Training Equipment', 'Racket Rental'],
        trainerAvailability: true,
        operatingHours: [
            { day: 'Monday - Friday', open: '06:00', close: '22:00' },
            { day: 'Saturday - Sunday', open: '07:00', close: '20:00' }
        ],
        capacity: 32,
        rating: 4.8,
        reviews: 156,
        phone: '+84 28 3823 4567',
        email: 'info@elitetennis.vn',
        website: 'www.elitetennis.vn'
    },
    {
        id: 'venue-2',
        name: 'Golden Pickleball Arena',
        category: 'pickleball',
        description: 'Modern pickleball facility with 6 dedicated courts, perfect for players of all skill levels. Features climate-controlled environment, professional-grade surfaces, and organized tournaments. Great community atmosphere with regular social events.',
        address: '456 Le Loi Street',
        district: 'District 3',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
        imageUrls: [
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
            'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800'
        ],
        pricePerHour: 300000,
        pricePerMonth: 5000000,
        membershipPlans: [
            {
                name: 'Standard',
                duration: '1 month',
                price: 5000000,
                features: ['Court access', 'Equipment rental', 'Locker access']
            },
            {
                name: 'Annual',
                duration: '1 year',
                price: 50000000,
                features: ['Unlimited court access', 'Free equipment rental', 'Locker access', 'Tournament entry', 'Social events']
            }
        ],
        amenities: ['Parking', 'Locker Room', 'Shower', 'WiFi', 'Equipment Rental', 'Snack Bar'],
        equipment: ['Pickleball Courts', 'Paddles', 'Balls', 'Nets'],
        trainerAvailability: true,
        operatingHours: [
            { day: 'Monday - Sunday', open: '08:00', close: '21:00' }
        ],
        capacity: 24,
        rating: 4.6,
        reviews: 89,
        phone: '+84 28 3825 7890'
    },
    {
        id: 'venue-3',
        name: 'Phoenix Boxing Gym',
        category: 'boxing',
        description: 'Professional boxing training facility with full-size ring, heavy bags, speed bags, and complete training equipment. Experienced coaches available for all skill levels. Perfect for fitness enthusiasts and competitive boxers.',
        address: '789 Tran Hung Dao Street',
        district: 'District 5',
        imageUrl: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800',
        imageUrls: [
            'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800',
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
        ],
        pricePerHour: 200000,
        pricePerMonth: 3000000,
        membershipPlans: [
            {
                name: 'Monthly',
                duration: '1 month',
                price: 3000000,
                features: ['Unlimited gym access', 'Group classes', 'Locker access']
            },
            {
                name: '3-Month',
                duration: '3 months',
                price: 7500000,
                features: ['Unlimited gym access', 'Group classes', 'Locker access', 'Personal training discount']
            }
        ],
        amenities: ['Parking', 'Locker Room', 'Shower', 'WiFi', 'Water Station', 'First Aid'],
        equipment: ['Boxing Ring', 'Heavy Bags', 'Speed Bags', 'Punching Mitts', 'Jump Ropes', 'Weight Training Area'],
        trainerAvailability: true,
        operatingHours: [
            { day: 'Monday - Friday', open: '06:00', close: '22:00' },
            { day: 'Saturday', open: '08:00', close: '18:00' },
            { day: 'Sunday', open: '09:00', close: '17:00' }
        ],
        capacity: 40,
        rating: 4.9,
        reviews: 234,
        phone: '+84 28 3856 1234'
    },
    {
        id: 'venue-4',
        name: 'PowerFit Gym & Fitness Center',
        category: 'gym',
        description: 'State-of-the-art fitness center with modern equipment, spacious workout areas, and professional trainers. Features cardio zone, strength training area, functional training space, and group fitness studios.',
        address: '321 Vo Van Tan Street',
        district: 'District 3',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        imageUrls: [
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
            'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
        ],
        pricePerHour: 150000,
        pricePerMonth: 2500000,
        membershipPlans: [
            {
                name: 'Basic',
                duration: '1 month',
                price: 2500000,
                features: ['Gym access', 'Locker room', 'Shower facilities']
            },
            {
                name: 'Premium',
                duration: '1 month',
                price: 3500000,
                features: ['Gym access', 'Group classes', 'Locker room', 'Shower facilities', 'Personal training session']
            },
            {
                name: 'Annual',
                duration: '1 year',
                price: 30000000,
                features: ['Unlimited gym access', 'All group classes', 'Locker room', 'Shower facilities', 'Monthly personal training', 'Guest passes']
            }
        ],
        amenities: ['Parking', 'Locker Room', 'Shower', 'WiFi', 'Water Station', 'Protein Bar', 'Air Conditioning', 'Music System'],
        equipment: ['Cardio Machines', 'Free Weights', 'Weight Machines', 'Functional Training Equipment', 'Yoga Mats', 'Resistance Bands'],
        trainerAvailability: true,
        operatingHours: [
            { day: 'Monday - Friday', open: '05:00', close: '23:00' },
            { day: 'Saturday - Sunday', open: '06:00', close: '22:00' }
        ],
        capacity: 100,
        rating: 4.7,
        reviews: 312,
        phone: '+84 28 3829 5678',
        email: 'info@powerfit.vn'
    },
    {
        id: 'venue-5',
        name: 'Royal Billiards Club',
        category: 'billiards',
        description: 'Premium billiards club with 12 professional tables, elegant atmosphere, and full bar service. Perfect for casual games, tournaments, and social gatherings. Professional-grade tables with premium cues available.',
        address: '555 Nguyen Trai Street',
        district: 'District 1',
        imageUrl: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
        imageUrls: [
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800'
        ],
        pricePerHour: 200000,
        pricePerMonth: 4000000,
        membershipPlans: [
            {
                name: 'Regular',
                duration: '1 month',
                price: 4000000,
                features: ['Table access', 'Cue rental', 'Member discounts']
            },
            {
                name: 'VIP',
                duration: '3 months',
                price: 10000000,
                features: ['Priority table booking', 'Free cue rental', 'Member discounts', 'Tournament entry', 'Complimentary drinks']
            }
        ],
        amenities: ['Parking', 'Bar', 'WiFi', 'Air Conditioning', 'VIP Lounge', 'Snack Service'],
        equipment: ['Professional Billiards Tables', 'Premium Cues', 'Chalk', 'Racks', 'Cue Racks'],
        trainerAvailability: false,
        operatingHours: [
            { day: 'Monday - Thursday', open: '14:00', close: '24:00' },
            { day: 'Friday - Saturday', open: '14:00', close: '02:00' },
            { day: 'Sunday', open: '12:00', close: '22:00' }
        ],
        capacity: 48,
        rating: 4.5,
        reviews: 127,
        phone: '+84 28 3821 3456',
        email: 'info@royalbilliards.vn'
    }
];

