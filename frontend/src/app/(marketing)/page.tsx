import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function MarketingPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full bg-ui-bg text-ui-text font-sans">
      
      {/* Full-bleed Hero Section with Asymmetric Focus */}
      <section className="w-full relative py-24 md:py-32 overflow-hidden border-b border-ui-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-start justify-center min-h-[60vh]">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Intercept UPI fraud in under 50ms using behavioral graph biometrics.
            </h1>
            <p className="text-base md:text-lg text-ui-muted max-w-xl leading-relaxed">
              We process high-velocity transaction streams synchronously, blocking malicious transfers before settlement. 
              Built exclusively for India’s payment infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
              <Link href="/signup" passHref>
                <Button size="lg" variant="primary">Access Developer API</Button>
              </Link>
              <Link href="/dashboard" passHref>
                <Button size="lg" variant="secondary">View Live Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Asymmetric Graphic Elements */}
        <div className="absolute right-0 top-0 w-full md:w-1/2 h-full opacity-20 pointer-events-none flex justify-end items-center">
          <div className="w-[800px] h-[800px] border border-ui-border rounded-full transform translate-x-1/3 -translate-y-1/4"></div>
          <div className="absolute w-[600px] h-[600px] border border-ui-accent rounded-full transform translate-x-1/4 -translate-y-1/8"></div>
        </div>
      </section>

      {/* Asymmetric Deep Dive Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row gap-16 md:gap-24 items-center">
          <div className="w-full md:w-5/12 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Stop treating ML models as black boxes.</h2>
            <p className="text-base text-ui-muted leading-relaxed">
              When an account is flagged, your operations team needs to know exactly why. 
              Our LightGBM pipeline outputs real-time SHAP values, translating complex feature importance 
              into actionable, human-readable reasoning in English and Hindi.
            </p>
            <ul className="space-y-4 pt-4 text-sm font-medium">
              <li className="flex items-center text-ui-text">
                <span className="w-1.5 h-1.5 bg-ui-accent rounded-full mr-3"></span>
                Real-time feature contribution metrics
              </li>
              <li className="flex items-center text-ui-text">
                <span className="w-1.5 h-1.5 bg-ui-accent rounded-full mr-3"></span>
                Deterministic hard-rule fallbacks
              </li>
              <li className="flex items-center text-ui-text">
                <span className="w-1.5 h-1.5 bg-ui-accent rounded-full mr-3"></span>
                Automated narrative generation
              </li>
            </ul>
          </div>
          
          <div className="w-full md:w-7/12">
            <Card hoverable className="p-8">
              <div className="flex justify-between items-center border-b border-ui-border pb-4 mb-6">
                <span className="text-sm font-mono text-ui-muted">Transaction ID: TX-9842A</span>
                <span className="bg-ui-riskRed/10 text-ui-riskRed border border-ui-riskRed/20 px-2 py-1 rounded text-xs font-bold">REJECTED</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-ui-border/50 pb-2">
                  <span className="text-ui-muted">Velocity (1H)</span>
                  <span className="text-ui-text font-mono">+14.2% SHAP impact</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-ui-border/50 pb-2">
                  <span className="text-ui-muted">Device Trust Score</span>
                  <span className="text-ui-text font-mono">+8.5% SHAP impact</span>
                </div>
                <div className="pt-4 p-4 bg-ui-bg rounded border border-ui-border">
                  <p className="text-sm text-ui-text leading-relaxed">
                    <strong className="text-ui-accent">Reasoning:</strong> Transaction blocked due to abnormal 1H velocity from an unrecognized device, matching known mule network patterns.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Full Bleed Graph Section */}
      <section className="w-full border-y border-ui-border bg-[#211F1D] py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row-reverse gap-16 md:gap-24 items-center">
            <div className="w-full md:w-4/12 space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">Detect Mule Networks passively.</h2>
              <p className="text-base text-ui-muted leading-relaxed">
                Money launderers use complex layering funnels to evade detection. 
                We compute Louvain communities and drain-ratios continuously across your transaction graph to isolate 
                central drain nodes before the funds exit your system.
              </p>
              <Link href="/dashboard/mule-graph" passHref>
                <Button variant="ghost" className="pl-0 mt-4 text-ui-accent">Explore Graph Tool →</Button>
              </Link>
            </div>
            
            <div className="w-full md:w-8/12 relative aspect-video bg-ui-card border border-ui-border rounded-xl flex items-center justify-center p-8 shadow-md">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-ui-accent via-transparent to-transparent pointer-events-none"></div>
                <div className="text-center space-y-4 relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-ui-riskRed bg-ui-riskRed/10 text-ui-riskRed font-mono text-xl mb-4">
                    85
                  </div>
                  <h3 className="text-lg font-bold text-ui-text font-mono">Mule Ring Detected</h3>
                  <p className="text-sm text-ui-muted font-mono">Fan-in: 5 nodes • Volume: ₹25,000</p>
                </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-3xl mx-auto px-4 py-32 text-center space-y-8">
        <h2 className="text-3xl font-bold tracking-tight">Ship fraud prevention that actually works.</h2>
        <p className="text-lg text-ui-muted">
          Our API accepts standard ISO 8583 mapped JSON payloads and responds with a definitive score in &lt;50ms.
        </p>
        <Link href="/signup" passHref>
          <Button size="lg" variant="primary">Read API Documentation</Button>
        </Link>
      </section>

    </div>
  );
}
