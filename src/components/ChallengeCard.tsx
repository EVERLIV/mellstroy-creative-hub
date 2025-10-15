import { Heart, Users, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChallengeCardProps {
  id: string;
  title: string;
  author: string;
  votes: number;
  participants: number;
  duration: string;
  imageUrl: string;
  status: "in-progress" | "saved" | "completed";
}

export const ChallengeCard = ({
  title,
  author,
  votes,
  participants,
  duration,
  imageUrl,
  status,
}: ChallengeCardProps) => {
  return (
    <Card className="overflow-hidden border-none bg-card rounded-2xl">
      <div className="relative h-32 overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2">
          <Button size="icon" variant="secondary" className="rounded-full h-9 w-9 bg-card/80 backdrop-blur-sm hover:bg-card">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-base text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{author}</p>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{votes}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{participants}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
        </div>
        
        <Button 
          size="sm" 
          className="w-full"
          variant={status === "in-progress" ? "default" : "outline"}
        >
          {status === "in-progress" ? "Continue" : status === "saved" ? "Start" : "View"}
        </Button>
      </div>
    </Card>
  );
};