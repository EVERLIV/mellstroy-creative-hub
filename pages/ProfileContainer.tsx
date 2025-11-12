import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import { Trainer, UserRole, Class } from '../types';
import ProfilePage from './ProfilePage';
import StudentProfilePage from './StudentProfilePage';
import EditAboutMePage from './EditAboutMePage';
import EditTrainerProfilePage from './EditTrainerProfilePage';
import AddEditClassModal from '../components/AddEditClassModal';

const ProfileContainer: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<Trainer | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState(true);
  const [editingClass, setEditingClass] = useState<Class | null | undefined>(undefined);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        toast({
          variant: "destructive",
          title: "Profile not found",
          description: "Please complete onboarding first.",
        });
        navigate('/onboarding');
        return;
      }

      // Load user role directly from Supabase database
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const role: UserRole = roleData?.role === 'trainer' ? 'trainer' : 'student';
      setUserRole(role);

      // Load classes if trainer
      let classes: Class[] = [];
      if (role === 'trainer') {
        const { data: classesData } = await supabase
          .from('classes')
          .select('*')
          .eq('trainer_id', user.id);

        if (classesData) {
          console.log('loadUserData - Loading classes from DB:', classesData);
          
          classes = classesData.map((c, index) => {
            const classData = {
              id: Date.now() + index, // Generate temp numeric ID
              name: c.name,
              description: c.description || '',
              duration: c.duration_minutes,
              price: parseFloat(c.price.toString()),
              imageUrl: c.image_urls && c.image_urls.length > 0 ? c.image_urls[0] : (c.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48'),
              capacity: c.capacity,
              classType: c.class_type as any,
              schedule: c.schedule_days && c.schedule_time ? {
                days: c.schedule_days,
                time: c.schedule_time
              } : undefined,
              bookings: [],
              _dbId: c.id, // Store actual DB ID separately
              image_urls: c.image_urls || (c.image_url ? [c.image_url] : []),
              language: (c as any).language || [],
              level: (c as any).level || '',
            };
            
            console.log(`loadUserData - Class ${c.id} loaded:`, {
              dbId: c.id,
              language: classData.language,
              level: classData.level,
              rawLanguage: (c as any).language,
              rawLevel: (c as any).level
            });
            
            return classData;
          });
        }
      }

      setCurrentUser({
        id: profile.id,
        name: profile.username || '',
        specialty: profile.specialty || [],
        rating: profile.rating ? parseFloat(profile.rating.toString()) : 0,
        reviews: profile.reviews_count || 0,
        location: profile.location || '',
        price: profile.price_per_hour ? parseFloat(profile.price_per_hour.toString()) : 0,
        imageUrl: profile.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400',
        verificationStatus: profile.is_verified ? 'verified' : 'unverified',
        isPremium: profile.is_premium || false,
        bio: profile.bio || '',
        shortDescription: (profile as any).short_description || '',
        experienceYears: (profile as any).experience_years || undefined,
        lastSeen: (profile as any).last_seen ?? null,
        phone: profile.phone || '',
        reviewsData: [],
        classes,
        chatHistory: [],
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        goals: profile.goals || [],
        interests: profile.interests || [],
        role,
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!user) return;

    try {
      // Map UI role to database role
      // student in UI = client in database
      const dbRole = newRole === 'student' ? 'client' as const : 'trainer' as const;

      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: user.id, role: dbRole },
          { onConflict: 'user_id,role' }
        );
      
      if (error) {
        console.error('Role upsert error:', error);
        throw error;
      }

      // Update local state immediately after saving to Supabase
      setUserRole(newRole);
      
      // Update currentUser role
      if (currentUser) {
        setCurrentUser({ ...currentUser, role: newRole });
      }
      
      // If switching to trainer, load classes
      if (newRole === 'trainer') {
        const { data: classesData } = await supabase
          .from('classes')
          .select('*')
          .eq('trainer_id', user.id);

        if (classesData && currentUser) {
          const classes = classesData.map((c, index) => ({
            id: Date.now() + index,
            name: c.name,
            description: c.description || '',
            duration: c.duration_minutes,
            price: parseFloat(c.price.toString()),
            imageUrl: c.image_urls && c.image_urls.length > 0 ? c.image_urls[0] : (c.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48'),
            capacity: c.capacity,
            classType: c.class_type as any,
            schedule: c.schedule_days && c.schedule_time ? {
              days: c.schedule_days,
              time: c.schedule_time
            } : undefined,
            bookings: [],
            _dbId: c.id,
            image_urls: c.image_urls || (c.image_url ? [c.image_url] : []),
            language: (c as any).language || [],
            level: (c as any).level || '',
          }));
          
          setCurrentUser({ ...currentUser, classes, role: newRole });
        }
      } else if (currentUser) {
        // Switching to student - clear classes
        setCurrentUser({ ...currentUser, classes: [], role: newRole });
      }
      
      toast({
        title: "Role updated",
        description: `Switched to ${newRole} mode.`,
      });
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to change role.",
      });
    }
  };

  const handleSaveProfile = async (updatedUser: Trainer) => {
    if (!user) return;

    try {
      const updateData: any = {
        username: updatedUser.name,
        bio: updatedUser.bio,
        location: updatedUser.location,
        avatar_url: updatedUser.imageUrl,
      };

      // Add role-specific fields
      if (userRole === 'trainer') {
        updateData.specialty = updatedUser.specialty;
        updateData.price_per_hour = updatedUser.price;
        updateData.phone = updatedUser.phone;
        updateData.short_description = updatedUser.shortDescription || null;
        updateData.experience_years = updatedUser.experienceYears || null;
      } else {
        // Student fields
        updateData.age = updatedUser.age;
        updateData.height = updatedUser.height;
        updateData.weight = updatedUser.weight;
        updateData.goals = updatedUser.goals;
        updateData.interests = updatedUser.interests;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      setCurrentUser(updatedUser);
      setIsEditingProfile(false);
      
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile.",
      });
    }
  };

  const handleClassSave = async (cls: Class & { _dbId?: string; image_urls?: string[] }) => {
    if (!user) return;

    try {
      const dbId = (cls as any)?._dbId;
      
      console.log('handleClassSave - Received class data:', {
        language: cls.language,
        level: cls.level,
        fullCls: cls
      });
      
      // Prepare base update data with required fields
      const baseData: any = {
        name: cls.name,
        description: cls.description,
        duration_minutes: cls.duration,
        price: cls.price,
        capacity: cls.capacity,
        class_type: cls.classType,
        image_url: cls.imageUrl,
        image_urls: cls.image_urls || [cls.imageUrl],
        schedule_days: cls.schedule?.days || null,
        schedule_time: cls.schedule?.time || null,
        kids_friendly: cls.kids_friendly || false,
        disability_friendly: cls.disability_friendly || false,
      };

      // Always include language and level (they should always be present from form)
      const updateDataWithLanguage = { ...baseData };
      // Language should always be an array (even if empty)
      updateDataWithLanguage.language = Array.isArray(cls.language) 
        ? cls.language 
        : (cls.language ? [cls.language] : []);
      // Level should be string or null
      updateDataWithLanguage.level = (cls.level && cls.level.trim() !== '') ? cls.level : null;
      
      console.log('handleClassSave - Prepared data for save:', {
        language: updateDataWithLanguage.language,
        level: updateDataWithLanguage.level,
        languageType: typeof updateDataWithLanguage.language,
        levelType: typeof updateDataWithLanguage.level,
        isArray: Array.isArray(updateDataWithLanguage.language),
        fullData: updateDataWithLanguage
      });
      
      const performSave = async (dataToSave: any) => {
        console.log('performSave - Saving to database:', {
          dbId,
          isNew: editingClass === null || !dbId,
          dataToSave
        });
        
        if (editingClass === null || !dbId) {
          // Create new class
          const insertData = {
            ...dataToSave,
            trainer_id: user.id,
          };
          
          console.log('performSave - Inserting new class:', insertData);
          
          const { data, error } = await supabase
            .from('classes')
            .insert(insertData)
            .select();
          
          if (error) {
            console.error('performSave - Insert error:', error);
            throw error;
          }
          
          console.log('performSave - Insert success:', data);
        } else {
          // Update existing class using DB ID
          console.log('performSave - Updating class:', { dbId, dataToSave });
          
          const { data, error } = await supabase
            .from('classes')
            .update(dataToSave)
            .eq('id', dbId)
            .eq('trainer_id', user.id)
            .select();
          
          if (error) {
            console.error('performSave - Update error:', error);
            throw error;
          }
          
          console.log('performSave - Update success:', data);
        }
      };

      // Save directly to Supabase - always include language and level
      await performSave(updateDataWithLanguage);

      toast({
        title: "Class saved",
        description: editingClass === null ? "New class created!" : "Class updated!",
      });

      // Reload data directly from Supabase to get updated values
      setEditingClass(undefined);
      
      // Reload classes from Supabase immediately
      if (user) {
        const { data: classesData } = await supabase
          .from('classes')
          .select('*')
          .eq('trainer_id', user.id);

        if (classesData && currentUser) {
          const updatedClasses = classesData.map((c, index) => ({
            id: Date.now() + index,
            name: c.name,
            description: c.description || '',
            duration: c.duration_minutes,
            price: parseFloat(c.price.toString()),
            imageUrl: c.image_urls && c.image_urls.length > 0 ? c.image_urls[0] : (c.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48'),
            capacity: c.capacity,
            classType: c.class_type as any,
            schedule: c.schedule_days && c.schedule_time ? {
              days: c.schedule_days,
              time: c.schedule_time
            } : undefined,
            bookings: [],
            _dbId: c.id,
            image_urls: c.image_urls || (c.image_url ? [c.image_url] : []),
            language: (c as any).language || [],
            level: (c as any).level || '',
          }));
          
          console.log('After save - Reloaded classes from Supabase:', updatedClasses);
          
          setCurrentUser({ ...currentUser, classes: updatedClasses });
        }
      }
      
      // Also call loadUserData to ensure everything is synced
      loadUserData();
    } catch (error: any) {
      console.error('Error saving class:', error);
      const errorMessage = error?.message || '';
      let userMessage = errorMessage || "Failed to save class. Please check all fields are filled correctly.";
      
      // Provide helpful message if language/level columns are missing
      if (errorMessage.includes('language') || errorMessage.includes('level') || error?.code === '42703') {
        userMessage = "Language/level columns not found in database. Please run the migration SQL in Supabase SQL Editor (see fix_language_column.sql file).";
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: userMessage,
      });
    }
  };

  const handleDeleteClass = async (classId: number) => {
    if (!user) return;

    try {
      // Find the class to get its DB ID
      const classToDelete = currentUser?.classes.find(c => c.id === classId);
      if (!classToDelete || !(classToDelete as any)._dbId) return;

      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', (classToDelete as any)._dbId)
        .eq('trainer_id', user.id);

      if (error) throw error;

      toast({
        title: "Class deleted",
        description: "The class has been removed.",
      });

      loadUserData();
    } catch (error: any) {
      console.error('Error deleting class:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete class.",
      });
    }
  };

  const handleStartVerification = () => {
    navigate('/verification');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show edit profile page
  if (isEditingProfile) {
    if (userRole === 'trainer') {
      return (
        <EditTrainerProfilePage
          user={currentUser}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditingProfile(false)}
        />
      );
    } else {
      return (
        <EditAboutMePage
          user={currentUser}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditingProfile(false)}
        />
      );
    }
  }

  return (
    <>
      {userRole === 'trainer' ? (
        <ProfilePage
          trainer={currentUser}
          onEdit={() => setIsEditingProfile(true)}
          onManageClass={(cls) => setEditingClass(cls)}
          onDeleteClass={handleDeleteClass}
          userRole={userRole}
          onRoleChange={handleRoleChange}
          onStartVerification={handleStartVerification}
          onLogout={handleLogout}
        />
      ) : (
        currentUser ? (
          <StudentProfilePage
            currentUser={currentUser}
            userRole={userRole}
            onRoleChange={handleRoleChange}
            onLogout={handleLogout}
            onNavigateToBookings={() => navigate('/bookings')}
            onNavigateToChats={() => navigate('/chat')}
            onEditProfile={() => setIsEditingProfile(true)}
            onSaveProfile={handleSaveProfile}
          />
        ) : null
      )}

      {editingClass !== undefined && (
        <AddEditClassModal
          cls={editingClass}
          onSave={handleClassSave}
          onCancel={() => setEditingClass(undefined)}
        />
      )}
    </>
  );
};

export default ProfileContainer;
