import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { localLoginSchema } from "@shared/auth-schemas";
import { Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import type { z } from "zod";

type LoginForm = z.infer<typeof localLoginSchema>;

export default function GMLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(localLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => apiRequest("POST", "/api/auth/login", data),
    onSuccess: () => {
      toast({
        title: "Connexion réussie !",
        description: "Bienvenue dans votre espace Maître de Jeu.",
        variant: "default",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Vérifiez votre email et mot de passe",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-cosmic-void text-aged-parchment relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cosmic-void via-charcoal to-cosmic-void"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-64 h-64 bg-eldritch-green rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blood-burgundy rounded-full blur-3xl opacity-20"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md bg-charcoal border-aged-gold shadow-2xl eldritch-glow">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-aged-gold/20 border border-aged-gold">
                <LogIn className="h-8 w-8 text-aged-gold" />
              </div>
            </div>
            <CardTitle className="text-2xl font-cinzel text-aged-gold">
              Connexion Maître de Jeu
            </CardTitle>
            <CardDescription className="text-aged-parchment font-source">
              Accédez à votre espace de direction de jeu
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-aged-parchment">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className="bg-cosmic-void border-aged-gold text-aged-parchment placeholder-aged-parchment/50"
                  placeholder="votre@email.com"
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-blood-burgundy">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-aged-parchment">
                  <Lock className="inline h-4 w-4 mr-2" />
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                    className="bg-cosmic-void border-aged-gold text-aged-parchment placeholder-aged-parchment/50 pr-12"
                    placeholder="Votre mot de passe"
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-aged-parchment" />
                    ) : (
                      <Eye className="h-4 w-4 text-aged-parchment" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-blood-burgundy">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-blood-burgundy hover:bg-dark-crimson text-bone-white font-source py-3 mt-6"
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connexion...
                  </div>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-aged-parchment">
                Pas encore de compte ?{" "}
                <Button
                  variant="link"
                  className="text-aged-gold hover:text-eldritch-green p-0 h-auto font-normal"
                  onClick={() => navigate("/gm-signup")}
                  data-testid="link-signup"
                >
                  S'inscrire
                </Button>
              </p>
              <p className="text-xs text-aged-parchment/70 mt-2">
                Ou{" "}
                <Button
                  variant="link"
                  className="text-aged-gold hover:text-eldritch-green p-0 h-auto font-normal"
                  onClick={() => navigate("/api/login")}
                  data-testid="link-replit-auth"
                >
                  continuer avec Replit
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}