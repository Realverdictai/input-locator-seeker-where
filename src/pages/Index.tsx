import { Scale, TrendingUp, Shield, Zap, BarChart3, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Professional Header */}
      <header className="glass-panel sticky top-0 z-50 border-b-0 mb-0">
        <div className="container-pro py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-glow rounded-xl flex items-center justify-center shadow-lg">
                <Scale className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-foreground">CaseLogic</h1>
                <p className="text-xs text-muted-foreground font-medium tracking-wide">Professional</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/evaluator" className="nav-item">Case Evaluator</Link>
              <Link to="/admin" className="nav-item">Data Management</Link>
              <Link to="/evaluator" className="accent-button">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="section-spacing">
        <div className="container-pro">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="display-heading mb-6">
                Advanced Settlement
                <span className="block text-gradient animate-float">Analytics Platform</span>
              </h1>
              <p className="body-large max-w-2xl mx-auto mb-8">
                Leverage data-driven insights from 313+ verified settlement cases to make informed 
                decisions with precision and confidence in personal injury litigation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/evaluator" className="accent-button">
                <Zap className="w-5 h-5 mr-2" />
                Start Case Analysis
              </Link>
              <Link to="/admin" className="premium-button">
                <BarChart3 className="w-5 h-5 mr-2" />
                View Data Insights
              </Link>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="professional-card p-8 text-center group hover:scale-[1.02] transition-transform duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-secondary to-primary-glow rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:animate-float">
                  <BarChart3 className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="card-heading">Data-Driven Analysis</h3>
                <p className="body-medium">
                  Linear model analysis of 313 verified settlement cases for accurate valuations
                </p>
              </div>

              <div className="professional-card p-8 text-center group hover:scale-[1.02] transition-transform duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-accent to-warning rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:animate-glow">
                  <Shield className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="card-heading">Risk Assessment</h3>
                <p className="body-medium">
                  Advanced policy exceedance analysis with real-time risk indicators
                </p>
              </div>

              <div className="professional-card p-8 text-center group hover:scale-[1.02] transition-transform duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:animate-float">
                  <TrendingUp className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="card-heading">Precision Targeting</h3>
                <p className="body-medium">
                  Single-number proposals within $25K-$50K ranges for strategic negotiations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-spacing bg-muted/20">
        <div className="container-pro">
          <div className="text-center mb-12">
            <h2 className="section-heading text-gradient">Trusted by Legal Professionals</h2>
            <p className="body-large">Data that drives results</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="metric-card hover:scale-105 transition-transform duration-300">
              <div className="metric-value">313+</div>
              <div className="metric-label">Verified Cases</div>
            </div>
            <div className="metric-card hover:scale-105 transition-transform duration-300">
              <div className="metric-value">$2.4M</div>
              <div className="metric-label">Avg Settlement Range</div>
            </div>
            <div className="metric-card hover:scale-105 transition-transform duration-300">
              <div className="metric-value">92%</div>  
              <div className="metric-label">Accuracy Rate</div>
            </div>
            <div className="metric-card hover:scale-105 transition-transform duration-300">
              <div className="metric-value">24/7</div>
              <div className="metric-label">Platform Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing">
        <div className="container-pro">
          <div className="glass-panel p-12 text-center max-w-4xl mx-auto">
            <h2 className="section-heading mb-6 text-gradient">Ready to Transform Your Practice?</h2>
            <p className="body-large mb-8 max-w-2xl mx-auto">
              Join leading legal professionals who rely on CaseLogic Pro for strategic 
              settlement analysis and risk assessment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/evaluator" className="accent-button">
                <Zap className="w-5 h-5 mr-2" />
                Start Free Analysis
              </Link>
              <div className="premium-button cursor-pointer">
                <Users className="w-5 h-5 mr-2" />
                Schedule Demo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}  
      <footer className="border-t bg-muted/30 py-12">
        <div className="container-pro">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-lg flex items-center justify-center shadow-md">
                <Scale className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-serif font-bold text-foreground">CaseLogic Professional</span>
                <p className="text-xs text-muted-foreground">Advanced Settlement Analytics</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © 2024 CaseLogic Professional. Data-driven legal technology.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}