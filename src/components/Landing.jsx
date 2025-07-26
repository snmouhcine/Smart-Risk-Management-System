import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Shield,
  TrendingUp,
  Brain,
  BarChart3,
  Target,
  Clock,
  Award,
  CheckCircle,
  Activity,
  Zap,
  ArrowRight,
  Star,
  Users,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Calculator,
  FileText,
  PieChart,
  Lock,
  CreditCard,
  Check,
  X,
  Play,
  ChartBar,
  Gauge,
  Trophy,
  Rocket
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [animatedNumbers, setAnimatedNumbers] = useState({
    winRate: 0,
    users: 0,
    trades: 0,
    saved: 0
  });

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animated numbers effect
  useEffect(() => {
    const duration = 2000;
    const steps = 50;
    const interval = duration / steps;

    const targets = {
      winRate: 87,
      users: 5420,
      trades: 150000,
      saved: 2.5
    };

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setAnimatedNumbers({
        winRate: Math.floor((targets.winRate * currentStep) / steps),
        users: Math.floor((targets.users * currentStep) / steps),
        trades: Math.floor((targets.trades * currentStep) / steps),
        saved: Number(((targets.saved * currentStep) / steps).toFixed(1))
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Smart Risk Manager
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-700 hover:text-purple-600 transition-colors">Features</a>
              <a href="#benefits" className="text-slate-700 hover:text-purple-600 transition-colors">Benefits</a>
              <a href="#pricing" className="text-slate-700 hover:text-purple-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-slate-700 hover:text-purple-600 transition-colors">Testimonials</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/auth')}
                className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full blur-3xl opacity-20 animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Trusted by 5,420+ Professional Traders
            </div>
            
            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Transform Your Trading with
              <span className="block bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Intelligent Risk Management
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-8">
              Stop losing money to poor risk management. Our AI-powered platform helps you make smarter trades, 
              protect your capital, and achieve consistent profitability.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate('/auth')}
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                className="px-8 py-4 bg-white text-purple-600 rounded-xl text-lg font-semibold border-2 border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 flex items-center"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </button>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-slate-500">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-1" />
                No credit card required
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-500 mr-1" />
                Bank-level security
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-purple-500 mr-1" />
                Setup in 2 minutes
              </div>
            </div>
          </div>
          
          {/* Hero Image/Demo */}
          <div className="relative mt-16">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-100/50 to-transparent rounded-3xl" />
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-purple-100">
              {/* Dashboard preview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-3xl font-bold text-green-900">{animatedNumbers.winRate}%</p>
                  <p className="text-sm text-green-700">Average Win Rate</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl">
                  <Users className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="text-3xl font-bold text-blue-900">{animatedNumbers.users.toLocaleString()}</p>
                  <p className="text-sm text-blue-700">Active Traders</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-2xl">
                  <Activity className="w-8 h-8 text-purple-600 mb-2" />
                  <p className="text-3xl font-bold text-purple-900">{animatedNumbers.trades.toLocaleString()}</p>
                  <p className="text-sm text-purple-700">Trades Analyzed</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-6 rounded-2xl">
                  <DollarSign className="w-8 h-8 text-orange-600 mb-2" />
                  <p className="text-3xl font-bold text-orange-900">${animatedNumbers.saved}M</p>
                  <p className="text-sm text-orange-700">Saved from Losses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything You Need to
              <span className="text-purple-600"> Trade Smarter</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our comprehensive suite of tools gives you the edge you need in today's volatile markets
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: AI Analysis */}
            <div className="group relative p-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">AI-Powered Analysis</h3>
                <p className="text-slate-600 mb-4">
                  Get instant insights from our advanced AI that analyzes your trading patterns and suggests improvements
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Real-time trade analysis
                  </li>
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Personalized recommendations
                  </li>
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Risk assessment alerts
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2: Risk Management */}
            <div className="group relative p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Smart Risk Management</h3>
                <p className="text-slate-600 mb-4">
                  Never blow up your account again with our intelligent position sizing and risk controls
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Automatic position sizing
                  </li>
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Dynamic stop-loss calculation
                  </li>
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Risk-reward optimization
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Trading Journal */}
            <div className="group relative p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Advanced Journal</h3>
                <p className="text-slate-600 mb-4">
                  Track every trade with detailed analytics and learn from your patterns
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Automated trade logging
                  </li>
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Performance metrics
                  </li>
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Pattern recognition
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 4: Analytics Dashboard */}
            <div className="group relative p-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Real-Time Analytics</h3>
                <p className="text-slate-600 mb-4">
                  Visualize your performance with beautiful charts and actionable insights
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    P&L tracking
                  </li>
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Win rate analysis
                  </li>
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Daily performance stats
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 5: Checklist System */}
            <div className="group relative p-8 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Trading Checklist</h3>
                <p className="text-slate-600 mb-4">
                  Never miss a critical step with our customizable pre-trade and exit checklists
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Entry validation
                  </li>
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Exit criteria tracking
                  </li>
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Score-based decisions
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 6: Position Calculator */}
            <div className="group relative p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Position Calculator</h3>
                <p className="text-slate-600 mb-4">
                  Calculate perfect position sizes for futures contracts in seconds
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Multi-contract support
                  </li>
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Risk percentage based
                  </li>
                  <li className="flex items-center text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Real-time calculations
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Why Traders Choose
              <span className="text-purple-600"> Smart Risk Manager</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Join thousands of profitable traders who transformed their results
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Increase Your Win Rate by 40%</h3>
                  <p className="text-slate-600">
                    Our users report an average 40% increase in their win rate within the first 30 days of using our systematic approach.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Protect Your Capital</h3>
                  <p className="text-slate-600">
                    Never risk more than you should. Our smart position sizing ensures you stay in the game long-term.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Learn From Every Trade</h3>
                  <p className="text-slate-600">
                    Our AI analyzes your patterns and provides personalized insights to continuously improve your edge.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Save 10+ Hours Per Week</h3>
                  <p className="text-slate-600">
                    Automate your journaling, calculations, and analysis. Focus on what matters - making profitable trades.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Calculator */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">See Your Potential ROI</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">If you trade with</p>
                <p className="text-3xl font-bold text-slate-900">$10,000</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Improving win rate by</p>
                <p className="text-3xl font-bold text-purple-600">+15%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Could mean extra</p>
                <p className="text-3xl font-bold text-green-600">$24,000/year</p>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 mt-6">
              *Based on average user results. Individual results may vary.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Choose Your Path to
              <span className="text-purple-600"> Profitable Trading</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Start with our 14-day free trial. No credit card required.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className={`relative p-8 rounded-2xl border-2 transition-all duration-300 ${
              selectedPlan === 'starter' 
                ? 'border-purple-500 shadow-2xl scale-105' 
                : 'border-slate-200 hover:border-purple-200'
            }`}>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-600 mb-6">Perfect for new traders</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$29</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">Trading Journal</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">Basic Analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">Position Calculator</span>
                </li>
                <li className="flex items-center">
                  <X className="w-5 h-5 text-slate-300 mr-3" />
                  <span className="text-slate-400">AI Analysis</span>
                </li>
                <li className="flex items-center">
                  <X className="w-5 h-5 text-slate-300 mr-3" />
                  <span className="text-slate-400">Advanced Checklists</span>
                </li>
              </ul>
              <button
                onClick={() => {
                  setSelectedPlan('starter');
                  navigate('/auth');
                }}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                  selectedPlan === 'starter'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Start Free Trial
              </button>
            </div>

            {/* Pro Plan - Recommended */}
            <div className={`relative p-8 rounded-2xl border-2 transition-all duration-300 ${
              selectedPlan === 'pro' 
                ? 'border-purple-500 shadow-2xl scale-105' 
                : 'border-slate-200 hover:border-purple-200'
            }`}>
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-full">
                  MOST POPULAR
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Professional</h3>
              <p className="text-slate-600 mb-6">For serious traders</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$79</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">Everything in Starter</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">AI-Powered Analysis</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">Advanced Analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">Custom Checklists</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">Priority Support</span>
                </li>
              </ul>
              <button
                onClick={() => {
                  setSelectedPlan('pro');
                  navigate('/auth');
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Start Free Trial
              </button>
            </div>

            {/* Elite Plan */}
            <div className={`relative p-8 rounded-2xl border-2 transition-all duration-300 ${
              selectedPlan === 'elite' 
                ? 'border-purple-500 shadow-2xl scale-105' 
                : 'border-slate-200 hover:border-purple-200'
            }`}>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Elite</h3>
              <p className="text-slate-600 mb-6">For professional firms</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$199</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">Everything in Pro</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">Team Collaboration</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">API Access</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">Custom Integrations</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-slate-700">Dedicated Manager</span>
                </li>
              </ul>
              <button
                onClick={() => {
                  setSelectedPlan('elite');
                  navigate('/auth');
                }}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                  selectedPlan === 'elite'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Contact Sales
              </button>
            </div>
          </div>

          {/* Money-back guarantee */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center px-6 py-3 bg-green-50 rounded-full">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">30-Day Money-Back Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Trusted by
              <span className="text-purple-600"> Successful Traders</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              See what our users say about their transformation
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-6">
                "This platform completely changed my trading. My win rate went from 45% to 73% in just 2 months. 
                The AI insights are incredibly accurate."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">JR</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">James Rodriguez</p>
                  <p className="text-sm text-slate-600">Futures Trader</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-6">
                "The position calculator alone saved me from countless bad trades. I can't imagine trading without 
                this tool anymore. Worth every penny!"
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">SK</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Sarah Kim</p>
                  <p className="text-sm text-slate-600">Day Trader</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-6">
                "Finally, a trading tool that focuses on risk management! My account has grown 240% since I started 
                using Smart Risk Manager."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">MT</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Michael Thompson</p>
                  <p className="text-sm text-slate-600">Swing Trader</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join 5,420+ traders who are already using Smart Risk Manager to protect their capital and maximize profits.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate('/auth')}
              className="group px-8 py-4 bg-white text-purple-600 rounded-xl text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-purple-700 text-white rounded-xl text-lg font-semibold hover:bg-purple-800 transition-all duration-200">
              Schedule a Demo
            </button>
          </div>
          <p className="text-purple-200 mt-6 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Smart Risk Manager</span>
              </div>
              <p className="text-sm">
                Professional trading risk management platform trusted by thousands of traders worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 Smart Risk Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;