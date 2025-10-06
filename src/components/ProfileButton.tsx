import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProfileButtonProps {
  level: number;
  onClick: () => void;
}

export const ProfileButton: React.FC<ProfileButtonProps> = ({ level, onClick }) => {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className="relative hover:bg-primary/20 transition-all duration-300 gap-2 group"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow-primary">
          <User className="w-5 h-5 text-game-dark" />
        </div>
        <Badge 
          variant="secondary" 
          className="absolute -bottom-1 -right-1 bg-secondary text-game-dark text-xs px-1.5 py-0 min-w-[1.5rem] h-5 flex items-center justify-center font-bold"
        >
          {level}
        </Badge>
      </div>
    </Button>
  );
};
