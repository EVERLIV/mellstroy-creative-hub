import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ImagePlus } from "lucide-react";
import { useState } from "react";

const Create = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Create Challenge" />
      
      <main className="max-w-lg mx-auto px-4 pt-6">
        <form className="space-y-6">
          <Card className="p-6 space-y-4 border-none rounded-2xl">
            <div className="space-y-2">
              <Label htmlFor="title">Challenge Title</Label>
              <Input
                id="title"
                placeholder="Enter challenge name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 rounded-xl border-border bg-secondary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your challenge..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-32 rounded-xl border-border bg-secondary resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-12 rounded-xl border-border bg-secondary"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="border-2 border-dashed border-border rounded-xl h-40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-secondary transition-colors">
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Upload cover image</p>
              </div>
            </div>
          </Card>
          
          <Button type="submit" size="lg" className="w-full">
            Create Challenge
          </Button>
        </form>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Create;