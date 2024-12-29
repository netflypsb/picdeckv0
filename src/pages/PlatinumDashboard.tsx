import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { AlphaTestingBanner } from '@/components/AlphaTestingBanner';
import { MainUploadSection } from '@/components/sections/premium/MainUploadSection';
import { OutputSection } from '@/components/sections/premium/OutputSection';
import { WatermarkSection } from '@/components/sections/premium/WatermarkSection';
import { HowToSection } from '@/components/sections/premium/HowToSection';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useUserTier } from '@/hooks/use-user-tier';
import { useToast } from '@/components/ui/use-toast';

export default function PlatinumDashboard() {
  const navigate = useNavigate();
  const { tier, isLoading } = useUserTier();
  const { toast } = useToast();
  const watermarkRef = useRef<{ getWatermarkSettings: () => any }>(null);
  const [outputFormat, setOutputFormat] = useState('png');
  const [isLossless, setIsLossless] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      if (!isLoading && tier !== 'platinum') {
        toast({
          title: "Access Denied",
          description: "This dashboard is only available for Platinum tier users.",
          variant: "destructive"
        });
        navigate('/free-dashboard');
      }
    };

    checkAuth();
  }, [tier, isLoading, navigate, toast]);

  const handleProcessStart = () => {
    return {
      ...watermarkRef.current?.getWatermarkSettings(),
      outputFormat,
      isLossless
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AlphaTestingBanner />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Platinum Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/account')}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Account
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <MainUploadSection 
            onProcessStart={handleProcessStart}
            outputFormat={outputFormat}
            isLossless={isLossless}
          />
          <OutputSection 
            onFormatChange={setOutputFormat}
            onQualityChange={setIsLossless}
          />
          <WatermarkSection ref={watermarkRef} />
          <HowToSection />
        </div>
      </main>

      <footer className="mt-auto py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PicDeck. All rights reserved.</p>
      </footer>
    </div>
  );
}