import Link from 'next/link';
import { QrCode, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl w-full space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center px-4 py-2 rounded-full glass text-blue-400 text-sm font-medium mb-4">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Secure Event Access
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="gradient-text">QR Event</span> Management
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Generate secure, one-time use QR codes for your event invitations and manage guest check-ins with ease.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 max-w-2xl mx-auto">
          <FeatureCard 
            icon={<QrCode className="w-8 h-8 text-blue-400" />}
            title="Instant QR"
            description="Generate unique QR tokens for each guest instantly."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-8 h-8 text-purple-400" />}
            title="Secure Validation"
            description="Prevent duplicate entries with one-time use tokens."
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-12">
          <p className="text-sm text-slate-500 italic">
            Please use your personalized invitation link to access your QR code.
          </p>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl glass text-left space-y-4 transition-transform hover:scale-105">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
