import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Target, Award } from "lucide-react";

const Profile = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Profile" />
      
      <main className="max-w-lg mx-auto px-4 pt-6">
        <Card className="p-6 border-none rounded-2xl mb-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop" />
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Sam Miller</h2>
              <p className="text-muted-foreground">@sammiller</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">45</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">1.2k</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
          </div>
          
          <Button variant="outline" className="w-full">
            Edit Profile
          </Button>
        </Card>
        
        <h3 className="text-lg font-semibold mb-4">Achievements</h3>
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Trophy, label: "Champion", color: "text-yellow-500" },
            { icon: Target, label: "Focused", color: "text-blue-500" },
            { icon: Award, label: "Winner", color: "text-purple-500" },
          ].map((achievement, i) => {
            const Icon = achievement.icon;
            return (
              <Card key={i} className="p-4 border-none rounded-2xl flex flex-col items-center gap-2">
                <Icon className={`h-8 w-8 ${achievement.color}`} />
                <span className="text-xs text-muted-foreground text-center">{achievement.label}</span>
              </Card>
            );
          })}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Profile;