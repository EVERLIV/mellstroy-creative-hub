import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Explore = () => {
  const allChallenges = [
    {
      id: "1",
      title: "Morning Routine Challenge",
      author: "Emma Wilson",
      votes: 789,
      participants: 3200,
      duration: "30 days",
      imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop",
      status: "saved" as const,
    },
    {
      id: "2",
      title: "Creative Writing Sprint",
      author: "David Chen",
      votes: 445,
      participants: 1560,
      duration: "14 days",
      imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=400&fit=crop",
      status: "saved" as const,
    },
    {
      id: "3",
      title: "Healthy Cooking",
      author: "Sophie Martin",
      votes: 923,
      participants: 4100,
      duration: "21 days",
      imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=400&fit=crop",
      status: "saved" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Explore" />
      
      <main className="max-w-lg mx-auto px-4 pt-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search challenges..." 
            className="pl-10 h-12 rounded-xl border-border bg-secondary"
          />
        </div>
        
        <h2 className="text-lg font-semibold mb-4">Popular Challenges</h2>
        
        <div className="space-y-4">
          {allChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} {...challenge} />
          ))}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Explore;