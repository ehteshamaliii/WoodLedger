import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import Link from "next/link";
import {
  Package,
  BarChart,
  CreditCard,
  Users,
  Zap,
  Smartphone,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <Logo size={40} className="hover-scale" />
            <h1 className="text-xl font-heading font-bold tracking-tight text-primary">WoodLedger</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:flex">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 tracking-wider uppercase">
            New V2.0 Available
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight font-heading">
            Your Furniture Business, <br />
            <span className="text-primary">Perfectly Managed.</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            The all-in-one dashboard to organize orders, track inventory, and handle payments.
            Built for modern furniture makers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="px-8 w-full group">
                Enter Dashboard
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="px-8 w-full">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            title="Order Management"
            description="Track orders from creation to delivery. Manage multiple items, clients, and delivery schedules."
            icon={<Package className="h-6 w-6" />}
          />
          <FeatureCard
            title="Inventory Control"
            description="Real-time stock tracking with alerts for low inventory. Manage furniture and fabric types."
            icon={<BarChart className="h-6 w-6" />}
          />
          <FeatureCard
            title="Payment Tracking"
            description="Handle payments, advances, and invoices. Generate printable PDF receipts."
            icon={<CreditCard className="h-6 w-6" />}
          />
          <FeatureCard
            title="Client Database"
            description="Maintain a complete client database with contact information and order history."
            icon={<Users className="h-6 w-6" />}
          />
          <FeatureCard
            title="Real-time Updates"
            description="Live updates across all devices. Never miss an order or payment notification."
            icon={<Zap className="h-6 w-6" />}
          />
          <FeatureCard
            title="Works Offline"
            description="Continue working without internet. Data syncs automatically when back online."
            icon={<Smartphone className="h-6 w-6" />}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold font-heading text-primary">WoodLedger</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 WoodLedger. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="hover:text-primary transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-card">
      <CardHeader>
        <div className="w-12 h-12 rounded-sm bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          {icon}
        </div>
        <CardTitle className="text-xl font-heading">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
