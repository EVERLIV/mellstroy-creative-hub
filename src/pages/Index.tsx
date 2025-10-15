import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const challenges = [
    {
      id: "1",
      title: "3 Week Challenge",
      author: "Sam Blakelock",
      votes: 324,
      participants: 1250,
      duration: "21 days",
      imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop",
      status: "in-progress" as const,
    },
    {
      id: "2",
      title: "Learning Pathway",
      author: "Alex Morgan",
      votes: 256,
      participants: 890,
      duration: "30 days",
      imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=400&fit=crop",
      status: "saved" as const,
    },
    {
      id: "3",
      title: "Fitness Journey",
      author: "Chris Johnson",
      votes: 512,
      participants: 2340,
      duration: "60 days",
      imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop",
      status: "in-progress" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Mellstroy Challenge" />
      
      <main className="max-w-lg mx-auto px-4 pt-4">
        <Tabs defaultValue="in-progress" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-secondary rounded-xl mb-6">
            <TabsTrigger value="in-progress" className="rounded-lg">In progress</TabsTrigger>
            <TabsTrigger value="saved" className="rounded-lg">Saved</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="in-progress" className="space-y-4 mt-0">
            {challenges.filter(c => c.status === "in-progress").map((challenge) => (
              <ChallengeCard key={challenge.id} {...challenge} />
            ))}
          </TabsContent>
          
          <TabsContent value="saved" className="space-y-4 mt-0">
            {challenges.filter(c => c.status === "saved").map((challenge) => (
              <ChallengeCard key={challenge.id} {...challenge} />
            ))}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4 mt-0">
            <div className="text-center py-12 text-muted-foreground">
              No completed challenges yet
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Index;