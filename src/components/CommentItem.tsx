import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, EyeOff, Heart } from "lucide-react";

interface CommentItemProps {
  id: string;
  user: string;
  userAvatar?: string;
  content: string;
  date: string;
  likes: number;
  isSpoiler?: boolean;
}

export function CommentItem({ id, user, userAvatar, content, date, likes, isSpoiler = false }: CommentItemProps) {
  const [isRevealed, setIsRevealed] = useState(!isSpoiler);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const toggleSpoiler = () => {
    setIsRevealed(!isRevealed);
  };

  return (
    <Card className="bg-manga-surface-elevated border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={userAvatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-manga-primary text-primary-foreground text-sm">
              {user.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-manga-text-primary">{user}</div>
              <div className="text-sm text-manga-text-secondary">{date}</div>
            </div>
            
            {isSpoiler && !isRevealed ? (
              <div className="bg-manga-surface border border-border/50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-manga-text-secondary text-sm">Este comentário pode conter spoilers</p>
                  <Button 
                    size="sm" 
                    variant="manga-ghost"
                    onClick={toggleSpoiler}
                    className="text-manga-primary hover:text-manga-primary/80"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Mostrar spoiler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-3">
                {isSpoiler && (
                  <div className="flex items-center gap-2 mb-2">
                    <Button 
                      size="sm" 
                      variant="manga-ghost"
                      onClick={toggleSpoiler}
                      className="text-manga-text-secondary hover:text-manga-text-primary"
                    >
                      <EyeOff className="h-4 w-4 mr-1" />
                      Ocultar spoiler
                    </Button>
                  </div>
                )}
                <p className="text-manga-text-secondary">{content}</p>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="manga-ghost"
                onClick={handleLike}
                className={`text-sm ${isLiked ? 'text-red-400' : 'text-manga-text-muted'}`}
              >
                <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {likesCount}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}