import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function Subscribe() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation('/pricing');
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
