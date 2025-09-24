import React, { useState, useEffect } from 'react';
import { Brain, Mail, Lock, Eye, EyeOff, User, ArrowRight, ArrowLeft, CheckCircle, Calendar, Clock, Lightbulb, StickyNote, TrendingUp, Activity, Bell, Plus, Mic, MessageCircle, Send, Volume2, Home, MessageSquare, Zap, Check, ChevronLeft, ChevronRight, FileText, Settings } from 'lucide-react';

type Screen = 'welcome' | 'login' | 'signup' | 'onboarding' | 'dashboard' | 'voiceflow' | 'calendar' | 'settings';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{type: 'user' | 'assistant', text: string, timestamp: Date}>>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const features = [
    {
      icon: Calendar,
      title: "CalendarFuse 360™",
      description: "Seamlessly integrate all your calendars into one unified view. Never miss an important event or double-book again.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: MessageSquare,
      title: "VoiceFlow Assistant™",
      description: "Your intelligent voice companion that understands context and helps you manage tasks through natural conversation.",
      color: "from-teal-500 to-teal-600"
    },
    {
      icon: Zap,
      title: "Smart Prioritize™",
      description: "AI-powered task prioritization that learns your patterns and automatically organizes your day for maximum productivity.",
      color: "from-blue-600 to-teal-500"
    },
    {
      icon: Brain,
      title: "Unified Life Hub™",
      description: "Your central command center that connects all aspects of your digital life into one intelligent, cohesive experience.",
      color: "from-teal-600 to-blue-600"
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateSignUp = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentScreen === 'login') {
      if (validateLogin()) {
        console.log('Login submitted:', { email: formData.email, password: formData.password });
        // Navigate to onboarding after successful login
        navigateToScreen('onboarding');
      }
    } else if (currentScreen === 'signup') {
      if (validateSignUp()) {
        console.log('Sign up submitted:', formData);
        // Navigate to onboarding after successful signup
        navigateToScreen('onboarding');
      }
    }
  };

  const navigateToScreen = (screen: Screen) => {
    setCurrentScreen(screen);
    setIsLoaded(false);
    setErrors({});
    setCurrentFeature(0);
    setTimeout(() => setIsLoaded(true), 100);
  };

  const nextFeature = () => {
    if (currentFeature < features.length - 1) {
      setCurrentFeature(currentFeature + 1);
    } else {
      // Navigate to dashboard after onboarding completion
      navigateToScreen('dashboard');
    }
  };

  const prevFeature = () => {
    if (currentFeature > 0) {
      setCurrentFeature(currentFeature - 1);
    }
  };

  const goToFeature = (index: number) => {
    setCurrentFeature(index);
  };

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setVoiceText("How can I help you today?");
        setIsListening(false);
      }, 2000);
    }
  };

  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      const newMessage = { type: 'user' as const, text: message, timestamp: new Date() };
      setConversationHistory(prev => [...prev, newMessage]);
      
      // Simulate AI response
      setTimeout(() => {
        const responses = [
          "I'd be happy to help you with that. Let me check your calendar and tasks.",
          "Based on your schedule, I recommend focusing on your high-priority tasks first.",
          "I've found some relevant information for you. Would you like me to create a reminder?",
          "Your next meeting is in 30 minutes. Should I prepare a summary of the agenda?"
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        const aiMessage = { type: 'assistant' as const, text: response, timestamp: new Date() };
        setConversationHistory(prev => [...prev, aiMessage]);
      }, 1000);
      
      setVoiceText('');
    }
  };

  const DashboardScreen = () => {
    const todaysTasks = [
      { id: 1, title: "Review quarterly reports", completed: false, priority: "high" },
      { id: 2, title: "Team standup meeting", completed: true, priority: "medium" },
      { id: 3, title: "Update project timeline", completed: false, priority: "high" },
      { id: 4, title: "Call with client", completed: false, priority: "low" },
      { id: 5, title: "Prepare presentation slides", completed: true, priority: "medium" }
    ];

    const upcomingEvents = [
      { id: 1, title: "Product Strategy Meeting", time: "2:00 PM", type: "meeting" },
      { id: 2, title: "Doctor Appointment", time: "4:30 PM", type: "personal" },
      { id: 3, title: "Dinner with Sarah", time: "7:00 PM", type: "social" }
    ];

    const proactiveSuggestions = [
      { id: 1, title: "Schedule focus time", description: "You have 2 hours free this afternoon - perfect for deep work on your presentation." },
      { id: 2, title: "Prepare for tomorrow", description: "Tomorrow's client meeting could benefit from reviewing last quarter's metrics." },
      { id: 3, title: "Take a break", description: "You've been productive today! Consider a 15-minute walk to recharge." }
    ];

    const completedTasks = todaysTasks.filter(task => task.completed).length;
    const totalTasks = todaysTasks.length;
    const progressPercentage = (completedTasks / totalTasks) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-teal-50/10">
        {/* Header */}
        <div 
          className={`bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-6 py-4 transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-slate-800">Your Unified Hub</h1>
              <p className="text-sm text-slate-600 mt-1">Welcome back! Here's your day at a glance.</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-slate-600 hover:text-blue-600 transition-colors duration-300">
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">JD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Today's Tasks Card */}
            <div 
              className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 transition-all duration-1000 ease-out delay-200 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-xl mr-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Today's Tasks</h3>
                </div>
                <span className="text-sm text-slate-500">{completedTasks}/{totalTasks}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-2">{Math.round(progressPercentage)}% complete</p>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {todaysTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      task.completed 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-slate-300 hover:border-blue-400'
                    } transition-colors duration-300`}>
                      {task.completed && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={`text-sm flex-1 ${
                      task.completed ? 'text-slate-500 line-through' : 'text-slate-700'
                    }`}>
                      {task.title}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'high' ? 'bg-red-400' :
                      task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events Card */}
            <div 
              className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 transition-all duration-1000 ease-out delay-300 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="bg-teal-100 p-2 rounded-xl mr-3">
                  <Calendar className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Upcoming Events</h3>
              </div>
              
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        event.type === 'meeting' ? 'bg-blue-500' :
                        event.type === 'personal' ? 'bg-teal-500' : 'bg-purple-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{event.title}</p>
                      <p className="text-xs text-slate-600">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors duration-300">
                View Full Calendar
              </button>
            </div>

            {/* Proactive Suggestions Card */}
            <div 
              className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 transition-all duration-1000 ease-out delay-400 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 p-2 rounded-xl mr-3">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Smart Suggestions</h3>
              </div>
              
              <div className="space-y-4">
                {proactiveSuggestions.slice(0, 2).map((suggestion) => (
                  <div key={suggestion.id} className="p-3 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl">
                    <p className="text-sm font-medium text-slate-800 mb-1">{suggestion.title}</p>
                    <p className="text-xs text-slate-600">{suggestion.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Notes Card */}
            <div 
              className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 transition-all duration-1000 ease-out delay-500 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-2 rounded-xl mr-3">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Quick Notes</h3>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-700">Remember to follow up with the design team about the new mockups</p>
                  <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-700">Ideas for weekend project: AI-powered recipe suggestions</p>
                  <p className="text-xs text-slate-500 mt-1">Yesterday</p>
                </div>
              </div>
              
              <button className="w-full mt-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300">
                Add New Note
              </button>
            </div>

            {/* Productivity Insights Card */}
            <div 
              className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 transition-all duration-1000 ease-out delay-600 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-xl mr-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Productivity</h3>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-light text-slate-800 mb-1">87%</div>
                  <p className="text-sm text-slate-600">Weekly completion rate</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Focus time today</span>
                  <span className="font-medium text-slate-800">4h 32m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tasks completed</span>
                  <span className="font-medium text-slate-800">12/15</span>
                </div>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div 
              className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 transition-all duration-1000 ease-out delay-700 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-2 rounded-xl mr-3">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">Completed "Team standup meeting"</p>
                    <p className="text-xs text-slate-500">30 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">Added new task "Update project timeline"</p>
                    <p className="text-xs text-slate-500">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">Created note about design feedback</p>
                    <p className="text-xs text-slate-500">2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <button 
          className={`fixed bottom-20 right-6 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{ transitionDelay: '800ms' }}
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Mobile Navigation */}
        <div 
          className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-200/50 px-6 py-3 transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '900ms' }}
        >
          <div className="flex items-center justify-around">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('voice')}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 ${
                activeTab === 'voice' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <Mic className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Voice Assistant</span>
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 ${
                activeTab === 'calendar' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <Calendar className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Calendar</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 ${
                activeTab === 'settings' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <Settings className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  };
  const WelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 overflow-hidden">
      {/* Background Abstract Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-teal-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-tl from-teal-200/20 to-blue-200/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-blue-100/10 to-teal-100/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Logo Section */}
        <div 
          className={`mb-8 transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-full blur-lg scale-150"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-teal-600 p-6 rounded-3xl shadow-xl">
              <Brain className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>

        {/* Title Section */}
        <div 
          className={`text-center mb-6 transition-all duration-1000 ease-out delay-300 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-5xl md:text-7xl font-light text-slate-800 mb-2 tracking-tight">
            Welcome to{' '}
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Cortex
            </span>
            <sup className="text-lg text-slate-500 ml-1">™</sup>
          </h1>
        </div>

        {/* Tagline */}
        <div 
          className={`text-center mb-12 transition-all duration-1000 ease-out delay-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-xl md:text-2xl font-light text-slate-600 max-w-lg mx-auto leading-relaxed">
            Your Life, Unified.{' '}
            <br className="hidden sm:block" />
            <span className="text-teal-600">Your Mind, Freed.</span>
          </p>
        </div>

        {/* Abstract Illustration */}
        <div 
          className={`mb-16 transition-all duration-1000 ease-out delay-700 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="relative w-72 h-56 md:w-96 md:h-72">
            {/* Central Hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full shadow-xl animate-pulse"></div>
            
            {/* Connecting Nodes */}
            <div className="absolute top-6 left-12 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full opacity-70 animate-pulse delay-200"></div>
            <div className="absolute top-12 right-16 w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-500 rounded-full opacity-60 animate-pulse delay-400"></div>
            <div className="absolute bottom-12 left-16 w-12 h-12 bg-gradient-to-br from-blue-300 to-teal-400 rounded-full opacity-50 animate-pulse delay-600"></div>
            <div className="absolute bottom-6 right-12 w-9 h-9 bg-gradient-to-br from-teal-300 to-blue-400 rounded-full opacity-65 animate-pulse delay-300"></div>
            
            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 384 288">
              <defs>
                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <path d="M 192 144 Q 80 80 68 56" stroke="url(#line-gradient)" strokeWidth="3" fill="none" className="animate-pulse delay-100" />
              <path d="M 192 144 Q 304 100 320 84" stroke="url(#line-gradient)" strokeWidth="3" fill="none" className="animate-pulse delay-300" />
              <path d="M 192 144 Q 100 200 84 204" stroke="url(#line-gradient)" strokeWidth="3" fill="none" className="animate-pulse delay-500" />
              <path d="M 192 144 Q 284 188 300 200" stroke="url(#line-gradient)" strokeWidth="3" fill="none" className="animate-pulse delay-700" />
            </svg>
          </div>
        </div>

        {/* Call-to-Action Buttons */}
        <div 
          className={`flex flex-col items-center space-y-4 transition-all duration-1000 ease-out delay-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <button 
            onClick={() => navigateToScreen('signup')}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative text-lg">Create Account</span>
          </button>
          
          <button 
            onClick={() => navigateToScreen('dashboard')}
            className="text-slate-600 hover:text-blue-600 font-medium transition-colors duration-300 underline decoration-transparent hover:decoration-blue-600 underline-offset-4"
          >
            View Dashboard (Demo)
          </button>
          
          <button 
            onClick={() => navigateToScreen('voiceflow')}
            className="text-teal-600 hover:text-teal-700 font-medium transition-colors duration-300"
          >
            Try Voice Assistant (Demo)
          </button>
        </div>

        {/* Feature Hints */}
        <div 
          className={`mt-12 text-center transition-all duration-1000 ease-out delay-1200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Unified Life Hub™
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse delay-200"></div>
              VoiceFlow Assistant™
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-400"></div>
              CalendarFuse 360™
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const LoginScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-teal-50/10 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button 
          onClick={() => navigateToScreen('welcome')}
          className="mb-8 flex items-center text-slate-600 hover:text-blue-600 transition-colors duration-300"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Login Card */}
        <div 
          className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-teal-600 p-4 rounded-2xl shadow-lg">
              <Brain className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-light text-slate-800 text-center mb-8">
            Log In to Your Account
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-xl focus:outline-none transition-colors duration-300 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-transparent focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-12 pr-12 py-4 bg-slate-50 border-2 rounded-xl focus:outline-none transition-colors duration-300 ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-transparent focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button type="button" className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-300">
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Log In
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-4 text-sm text-slate-500">or continue with</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center py-3 px-4 border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-colors duration-300">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center py-3 px-4 border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-colors duration-300">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <span className="text-slate-600">Don't have an account? </span>
            <button 
              onClick={() => navigateToScreen('signup')}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const SignUpScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-teal-50/10 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button 
          onClick={() => navigateToScreen('welcome')}
          className="mb-8 flex items-center text-slate-600 hover:text-blue-600 transition-colors duration-300"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Sign Up Card */}
        <div 
          className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-teal-600 p-4 rounded-2xl shadow-lg">
              <Brain className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-light text-slate-800 text-center mb-8">
            Create Your Account
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field */}
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-xl focus:outline-none transition-colors duration-300 ${
                    errors.fullName 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-transparent focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            {/* Email Field */}
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-xl focus:outline-none transition-colors duration-300 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-transparent focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-12 pr-12 py-4 bg-slate-50 border-2 rounded-xl focus:outline-none transition-colors duration-300 ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-transparent focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <div className="relative">
                <Check className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full pl-12 pr-12 py-4 bg-slate-50 border-2 rounded-xl focus:outline-none transition-colors duration-300 ${
                    errors.confirmPassword 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-transparent focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Terms and Privacy */}
            <div className="text-sm text-slate-600 text-center">
              By signing up, you agree to our{' '}
              <button type="button" className="text-blue-600 hover:text-blue-700 underline">
                Terms of Service
              </button>{' '}
              and{' '}
              <button type="button" className="text-blue-600 hover:text-blue-700 underline">
                Privacy Policy
              </button>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Sign Up
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-4 text-sm text-slate-500">or continue with</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* Social Sign Up */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center py-3 px-4 border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-colors duration-300">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center py-3 px-4 border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-colors duration-300">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <span className="text-slate-600">Already have an account? </span>
            <button 
              onClick={() => navigateToScreen('login')}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const OnboardingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-teal-50/10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button 
          onClick={() => navigateToScreen('welcome')}
          className="flex items-center text-slate-600 hover:text-blue-600 transition-colors duration-300"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <button 
          onClick={() => console.log('Skip onboarding')}
          className="text-slate-600 hover:text-blue-600 transition-colors duration-300"
        >
          Skip
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Title */}
        <div 
          className={`text-center mb-12 transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-4xl md:text-5xl font-light text-slate-800 mb-4">
            Discover Key Features
          </h1>
          <p className="text-lg text-slate-600 max-w-md mx-auto">
            Let's explore what makes Cortex™ your perfect digital companion
          </p>
        </div>

        {/* Feature Carousel */}
        <div 
          className={`w-full max-w-md mx-auto mb-8 transition-all duration-1000 ease-out delay-300 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentFeature * 100}%)` }}
            >
              {features.map((feature, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
                    {/* Feature Icon */}
                    <div className="flex justify-center mb-6">
                      <div className={`bg-gradient-to-br ${feature.color} p-6 rounded-3xl shadow-lg`}>
                        <feature.icon className="w-12 h-12 text-white" />
                      </div>
                    </div>

                    {/* Feature Title */}
                    <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                      {feature.title}
                    </h3>

                    {/* Feature Description */}
                    <p className="text-slate-600 leading-relaxed text-lg">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        <div 
          className={`flex items-center justify-center space-x-3 mb-8 transition-all duration-1000 ease-out delay-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => goToFeature(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentFeature
                  ? 'bg-blue-600 scale-125'
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        {/* Navigation Controls */}
        <div 
          className={`flex items-center justify-between w-full max-w-md mx-auto transition-all duration-1000 ease-out delay-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Previous Button */}
          <button
            onClick={prevFeature}
            disabled={currentFeature === 0}
            className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
              currentFeature === 0
                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                : 'border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Next/Done Button */}
          <button
            onClick={nextFeature}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center"
          >
            {currentFeature === features.length - 1 ? (
              <>
                Get Started
                <Check className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-6 pb-6">
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-teal-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentFeature + 1) / features.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-slate-500">
          <span>{currentFeature + 1} of {features.length}</span>
          <span>{Math.round(((currentFeature + 1) / features.length) * 100)}% Complete</span>
        </div>
      </div>
    </div>
  );

  if (currentScreen === 'voiceflow') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentScreen('welcome')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <Brain className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-800">Talk to VoiceFlow</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-sm text-gray-600">{isListening ? 'Listening...' : 'Ready'}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-8">
          {/* Conversation History */}
          <div className="flex-1 mb-8 space-y-4 overflow-y-auto">
            {conversationHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-12 h-12 text-blue-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to Assist</h2>
                <p className="text-gray-600 mb-6">Ask me anything about your schedule, tasks, or let me help organize your day.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {[
                    "What's on my schedule today?",
                    "Help me prioritize my tasks",
                    "Set a reminder for tomorrow",
                    "Show me my productivity insights"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <span className="text-gray-700">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {conversationHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voice Visualizer */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <button
                onClick={handleVoiceToggle}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 animate-pulse'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                <Mic className="w-8 h-8 text-white" />
              </button>
              
              {/* Voice Waves Animation */}
              {isListening && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-20 h-20 border-2 border-red-300 rounded-full animate-ping"
                      style={{
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: '1.5s'
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Text Input */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center p-4">
              <input
                type="text"
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(voiceText)}
                placeholder="Type your message or use voice..."
                className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500"
              />
              <button
                onClick={() => handleSendMessage(voiceText)}
                disabled={!voiceText.trim()}
                className="ml-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-around">
            {[
              { icon: Home, label: 'Dashboard', screen: 'dashboard' as const },
              { icon: Mic, label: 'Voice Assistant', screen: 'voiceflow' as const },
              { icon: Calendar, label: 'Calendar', screen: 'calendar' as const },
              { icon: Settings, label: 'Settings', screen: 'settings' as const }
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentScreen(item.screen)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                  currentScreen === item.screen
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentScreen === 'welcome' && <WelcomeScreen />}
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'signup' && <SignUpScreen />}
      {currentScreen === 'onboarding' && <OnboardingScreen />}
      {currentScreen === 'dashboard' && <DashboardScreen />}
    </>
  );
}

export default App;