import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

// Validation schema for authentication
const authSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: 'Email invalide' })
    .max(255, { message: 'Email trop long' }),
  password: z.string()
    .min(6, { message: 'Minimum 6 caractères' })
    .max(72, { message: 'Mot de passe trop long' }),
  username: z.string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,16}$/, {
      message: 'Pseudo invalide (3-16 caractères alphanumériques)'
    })
    .optional()
});

interface AuthProps {
  onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async () => {
    // Validate inputs with zod
    try {
      const validationData = isLogin 
        ? { email, password }
        : { email, password, username };
      
      authSchema.parse(validationData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Connexion réussie !",
          description: "Bienvenue dans Lucky Stop !",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username
            }
          }
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Compte créé !",
          description: "Vérifiez votre email pour confirmer votre inscription.",
        });
      }
    } catch (error: any) {
      let message = "Une erreur s'est produite";
      
      if (error.message.includes('Invalid login credentials')) {
        message = "Email ou mot de passe incorrect";
      } else if (error.message.includes('User already registered')) {
        message = "Cet email est déjà utilisé";
      } else if (error.message.includes('Password should be')) {
        message = "Le mot de passe doit contenir au moins 6 caractères";
      } else if (error.message.includes('Invalid email')) {
        message = "Email invalide";
      }

      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-game theme-neon flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-8">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="mb-6 border-wheel-border hover:bg-button-hover"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            LUCKY STOP
          </h1>
          <p className="text-text-secondary">
            {isLogin ? 'Connectez-vous pour jouer' : 'Créez votre compte'}
          </p>
        </div>
      </div>

      {/* Auth Form */}
      <Card className="w-full max-w-md p-6 bg-button-bg border-wheel-border">
        <div className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-primary flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-input"
            />
          </div>

          {/* Username (only for signup) */}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-text-primary flex items-center gap-2">
                <User className="w-4 h-4" />
                Pseudo
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="VotrePseudo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background border-input"
              />
            </div>
          )}

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-text-primary">
              Mot de passe
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-input pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-gradient-primary hover:scale-105 transition-all duration-300"
            size="lg"
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'Créer le compte')}
          </Button>

          {/* Switch Mode */}
          <div className="text-center pt-4">
            <p className="text-text-muted text-sm">
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
            </p>
            <Button
              onClick={() => setIsLogin(!isLogin)}
              variant="link"
              className="text-primary hover:text-primary/80 p-0"
            >
              {isLogin ? "Créer un compte" : "Se connecter"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};