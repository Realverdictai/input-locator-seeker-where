
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { SignUpData, UserType } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";

interface AuthFormProps {
  onAuthSuccess: () => void;
}

const AuthForm = ({ onAuthSuccess }: AuthFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [signUpData, setSignUpData] = useState<SignUpData>({
    email: '',
    password: '',
    user_type: 'pi_lawyer',
    company_name: '',
    bar_number: ''
  });
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Starting signup process with data:', {
        email: signUpData.email,
        user_type: signUpData.user_type,
        company_name: signUpData.company_name,
        has_bar_number: !!signUpData.bar_number
      });
      
      // Validation
      if (!signUpData.email?.trim()) {
        throw new Error('Email is required');
      }
      if (!signUpData.password || signUpData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      if (!signUpData.company_name?.trim()) {
        throw new Error('Company/Firm name is required');
      }
      if (!signUpData.user_type) {
        throw new Error('Account type is required');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(signUpData.email.trim())) {
        throw new Error('Please enter a valid email address');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email.trim(),
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            user_type: signUpData.user_type,
            company_name: signUpData.company_name.trim(),
            bar_number: signUpData.bar_number?.trim() || null,
            phone: null
          }
        }
      });

      if (error) {
        console.error('Signup error details:', error);
        throw error;
      }

      console.log('Signup response:', {
        user_id: data.user?.id,
        email_confirmed: data.user?.email_confirmed_at,
        has_session: !!data.session
      });

      // Handle different signup scenarios
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link. Please check your email to complete registration.",
        });
      } else if (data.user && data.session) {
        toast({
          title: "Account created successfully!",
          description: "Welcome to Verdict AI!",
        });
        
        // Small delay to ensure profile is created
        setTimeout(() => {
          onAuthSuccess();
        }, 1000);
      } else if (data.user) {
        toast({
          title: "Account created",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = "An error occurred while creating your account.";
      
      if (error?.message) {
        if (error.message.includes('User already registered')) {
          errorMessage = "An account with this email already exists. Please try signing in instead.";
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "Password is too weak. Please choose a stronger password (at least 6 characters).";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes('Email rate limit exceeded')) {
          errorMessage = "Too many email requests. Please wait a moment before trying again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error creating account",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Starting signin process for:', signInData.email);
      
      if (!signInData.email?.trim() || !signInData.password) {
        throw new Error('Please enter both email and password');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(signInData.email.trim())) {
        throw new Error('Please enter a valid email address');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email.trim(),
        password: signInData.password
      });

      if (error) {
        console.error('Signin error details:', error);
        throw error;
      }

      console.log('Signin response:', {
        user_id: data.user?.id,
        has_session: !!data.session
      });

      if (data.user && data.session) {
        toast({
          title: "Signed in successfully!",
          description: "Welcome back to Verdict AI!",
        });
        
        // Small delay to ensure profile is loaded
        setTimeout(() => {
          onAuthSuccess();
        }, 500);
      }
    } catch (error: any) {
      console.error('Signin error:', error);
      
      let errorMessage = "An error occurred while signing in.";
      
      if (error?.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Please check your email and confirm your account before signing in.";
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Too many login attempts. Please wait a moment and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error signing in",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verdict AI - Legal Platform</CardTitle>
          <CardDescription>
            Sign in to access case evaluation and mediation tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInData.email}
                    onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInData.password}
                    onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-type">Account Type *</Label>
                  <Select 
                    value={signUpData.user_type} 
                    onValueChange={(value: UserType) => setSignUpData({...signUpData, user_type: value})}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pi_lawyer">PI Plaintiff Lawyer</SelectItem>
                      <SelectItem value="insurance_defense">Insurance/Defense Counsel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password * (min. 6 characters)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                    required
                    disabled={isLoading}
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company/Firm Name *</Label>
                  <Input
                    id="company"
                    type="text"
                    value={signUpData.company_name}
                    onChange={(e) => setSignUpData({...signUpData, company_name: e.target.value})}
                    required
                    disabled={isLoading}
                    autoComplete="organization"
                  />
                </div>
                
                {signUpData.user_type === 'pi_lawyer' && (
                  <div className="space-y-2">
                    <Label htmlFor="bar-number">Bar Number (Optional)</Label>
                    <Input
                      id="bar-number"
                      type="text"
                      value={signUpData.bar_number}
                      onChange={(e) => setSignUpData({...signUpData, bar_number: e.target.value})}
                      disabled={isLoading}
                    />
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;
