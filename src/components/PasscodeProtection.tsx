import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PasscodeProtectionProps {
  children: React.ReactNode;
}

const CORRECT_PASSCODE = "4155";

export const PasscodeProtection = ({ children }: PasscodeProtectionProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passcode === CORRECT_PASSCODE) {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the magnetic separator calculator!",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect passcode. Please try again.",
        variant: "destructive",
      });
      setPasscode('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Required</CardTitle>
            <CardDescription>
              Please enter the passcode to access the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="text-center"
                autoFocus
              />
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};