import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Square, 
  User, 
  Bot, 
  Volume2, 
  VolumeX,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Brain,
  Calendar,
  CheckSquare,
  MessageCircle,
  Zap,
  Plus,
  Trash2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { authHelpers } from './lib/supabase';
import { ConversationService } from './lib/conversations';
import { ProfileService } from './lib/profiles';
import { ProfilePage } from './components/ProfilePage';
import { Message as VoiceMessage, VoiceFlowState, ProcessVoiceCommandResponse } from './types/voiceflow';
import { Conversation, Message as DBMessage, ConversationSummary, Profile } from './types/database';

// Extended message type for UI
interface UIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  
  // Navigation state
  const [currentView, setCurrentView] = useState<'welcome' | 'login' | 'signup' | 'dashboard' | 'voice' | 'profile'>('welcome');
  
  // Profile state
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  
  // Auth form states - using separate state objects to prevent re-renders
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    showPassword: false,
    loading: false,
    error: ''
  });
  
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    loading: false,
    error: ''
  });

  // Voice assistant states
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [voiceFlowState, setVoiceFlowState] = useState<VoiceFlowState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    error: null,
  });

  // Database conversation states
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);

  // Hooks
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported: speechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: ttsSupported,
  } = useSpeechSynthesis();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Update voice flow state based on hooks
  useEffect(() => {
    setVoiceFlowState(prev => ({
      ...prev,
      isListening,
      isSpeaking,
      error: speechError,
    }));
  }, [isListening, isSpeaking, speechError]);

  // Handle completed speech recognition
  useEffect(() => {
    if (transcript && !isListening) {
      handleVoiceCommand(transcript);
      resetTranscript();
    }
  }, [transcript, isListening]);

  // Load user conversations when authenticated and in voice view
  useEffect(() => {
    if (user && currentView === 'voice') {
      loadUserConversations();
    }
  }, [user, currentView]);

  // Load user profile when authenticated
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Load conversation messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadConversationMessages(currentConversationId);
    } else {
      setMessages([]);
      setCurrentConversation(null);
    }
  }, [currentConversationId]);

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await ProfileService.getProfile(user.id);
      if (!error && data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [user]);

  // Database operations
  const loadUserConversations = useCallback(async () => {
    if (!user) return;

    setLoadingConversations(true);
    try {
      const { data, error } = await ConversationService.getUserConversations(user.id);
      if (error) {
        console.error('Error loading conversations:', error);
        setVoiceFlowState(prev => ({ ...prev, error: 'Failed to load conversations' }));
      } else if (data) {
        setConversations(data);
        // If no current conversation and we have conversations, select the first one
        if (!currentConversationId && data.length > 0) {
          setCurrentConversationId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setVoiceFlowState(prev => ({ ...prev, error: 'Failed to load conversations' }));
    } finally {
      setLoadingConversations(false);
    }
  }, [user, currentConversationId]);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await ConversationService.getConversationHistory(conversationId);
      if (error) {
        console.error('Error loading messages:', error);
        setVoiceFlowState(prev => ({ ...prev, error: 'Failed to load messages' }));
      } else if (data) {
        setCurrentConversation(data);
        // Convert DB messages to UI messages
        const uiMessages: UIMessage[] = data.messages.map(msg => ({
          id: msg.id,
          type: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          isVoice: msg.is_voice,
        }));
        setMessages(uiMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setVoiceFlowState(prev => ({ ...prev, error: 'Failed to load messages' }));
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const createNewConversation = useCallback(async (firstMessage?: string) => {
    if (!user) return null;

    try {
      const title = firstMessage ? 
        firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '') : 
        'New Conversation';
      
      const { data, error } = await ConversationService.createConversation(user.id, title);
      if (error) {
        console.error('Error creating conversation:', error);
        setVoiceFlowState(prev => ({ ...prev, error: 'Failed to create conversation' }));
        return null;
      }

      if (data) {
        // Add to conversations list
        setConversations(prev => [data, ...prev]);
        // Set as current conversation
        setCurrentConversationId(data.id);
        return data;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      setVoiceFlowState(prev => ({ ...prev, error: 'Failed to create conversation' }));
    }
    return null;
  }, [user]);

  const saveMessageToDatabase = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    isVoice: boolean = false
  ) => {
    try {
      const { data, error } = await ConversationService.addMessage(
        conversationId,
        role,
        content,
        isVoice
      );
      
      if (error) {
        console.error('Error saving message:', error);
        setVoiceFlowState(prev => ({ ...prev, error: 'Failed to save message' }));
        return null;
      }

      // Update conversations list to reflect new last_message_at
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, last_message_at: new Date().toISOString(), last_message_content: content }
            : conv
        ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      );

      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      setVoiceFlowState(prev => ({ ...prev, error: 'Failed to save message' }));
      return null;
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    setDeletingConversationId(conversationId);
    try {
      const { error } = await ConversationService.deleteConversation(conversationId);
      if (error) {
        console.error('Error deleting conversation:', error);
        setVoiceFlowState(prev => ({ ...prev, error: 'Failed to delete conversation' }));
      } else {
        // Remove from conversations list
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        // If this was the current conversation, clear it
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null);
          setMessages([]);
          setCurrentConversation(null);
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setVoiceFlowState(prev => ({ ...prev, error: 'Failed to delete conversation' }));
    } finally {
      setDeletingConversationId(null);
    }
  }, [currentConversationId]);

  // Memoized handlers to prevent re-renders
  const handleLoginEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, email: e.target.value, error: '' }));
  }, []);

  const handleLoginPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, password: e.target.value, error: '' }));
  }, []);

  const handleSignupEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupForm(prev => ({ ...prev, email: e.target.value, error: '' }));
  }, []);

  const handleSignupPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupForm(prev => ({ ...prev, password: e.target.value, error: '' }));
  }, []);

  const handleSignupConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value, error: '' }));
  }, []);

  const handleTextInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);
  }, []);

  const toggleLoginPasswordVisibility = useCallback(() => {
    setLoginForm(prev => ({ ...prev, showPassword: !prev.showPassword }));
  }, []);

  const toggleSignupPasswordVisibility = useCallback(() => {
    setSignupForm(prev => ({ ...prev, showPassword: !prev.showPassword }));
  }, []);

  const toggleSignupConfirmPasswordVisibility = useCallback(() => {
    setSignupForm(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }));
  }, []);

  // Auth handlers
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.email || !loginForm.password) {
      setLoginForm(prev => ({ ...prev, error: 'Please fill in all fields' }));
      return;
    }

    setLoginForm(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const { error } = await authHelpers.signIn(loginForm.email, loginForm.password);
      
      if (error) {
        setLoginForm(prev => ({ ...prev, error: error.message, loading: false }));
      } else {
        setCurrentView('dashboard');
        setLoginForm({ email: '', password: '', showPassword: false, loading: false, error: '' });
      }
    } catch (err) {
      setLoginForm(prev => ({ 
        ...prev, 
        error: 'An unexpected error occurred', 
        loading: false 
      }));
    }
  }, [loginForm.email, loginForm.password]);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupForm.email || !signupForm.password || !signupForm.confirmPassword) {
      setSignupForm(prev => ({ ...prev, error: 'Please fill in all fields' }));
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupForm(prev => ({ ...prev, error: 'Passwords do not match' }));
      return;
    }

    if (signupForm.password.length < 6) {
      setSignupForm(prev => ({ ...prev, error: 'Password must be at least 6 characters' }));
      return;
    }

    setSignupForm(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const { error } = await authHelpers.signUp(signupForm.email, signupForm.password);
      
      if (error) {
        setSignupForm(prev => ({ ...prev, error: error.message, loading: false }));
      } else {
        setCurrentView('login');
        setSignupForm({ 
          email: '', 
          password: '', 
          confirmPassword: '', 
          showPassword: false, 
          showConfirmPassword: false, 
          loading: false, 
          error: '' 
        });
      }
    } catch (err) {
      setSignupForm(prev => ({ 
        ...prev, 
        error: 'An unexpected error occurred', 
        loading: false 
      }));
    }
  }, [signupForm.email, signupForm.password, signupForm.confirmPassword]);

  const handleSignOut = useCallback(async () => {
    await authHelpers.signOut();
    setCurrentView('welcome');
    setMessages([]);
    setTextInput('');
    setConversations([]);
    setCurrentConversationId(null);
    setCurrentConversation(null);
  }, []);

  // Voice command processing
  const processVoiceCommand = useCallback(async (message: string): Promise<string> => {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-voice-command`;
    
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content,
    }));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ProcessVoiceCommandResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to process voice command');
    }

    return data.response || 'I apologize, but I couldn\'t generate a response.';
  }, [messages]);

  const handleVoiceCommand = useCallback(async (message: string) => {
    if (!message.trim() || !user) return;

    // Create conversation if none exists
    let conversationId = currentConversationId;
    if (!conversationId) {
      const newConversation = await createNewConversation(message);
      if (!newConversation) return;
      conversationId = newConversation.id;
    }

    const userMessage: UIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      isVoice: true,
    };

    // Optimistic update - add message to UI immediately
    setMessages(prev => [...prev, userMessage]);
    setVoiceFlowState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Save user message to database
      await saveMessageToDatabase(conversationId, 'user', message, true);

      // Process voice command
      const response = await processVoiceCommand(message);
      
      const assistantMessage: UIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      // Add assistant message to UI
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message to database
      await saveMessageToDatabase(conversationId, 'assistant', response, false);
      
      // Speak the response
      if (ttsSupported) {
        speak(response);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setVoiceFlowState(prev => ({ ...prev, error: errorMessage }));
      
      const errorResponse: UIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I apologize, but I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setVoiceFlowState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [user, currentConversationId, createNewConversation, saveMessageToDatabase, processVoiceCommand, speak, ttsSupported]);

  const handleTextSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    await handleVoiceCommand(textInput);
    setTextInput('');
  }, [textInput, handleVoiceCommand]);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
  }, [stopSpeaking]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setTextInput('');
    resetTranscript();
    stopSpeaking();
    setCurrentConversationId(null);
    setCurrentConversation(null);
  }, [resetTranscript, stopSpeaking]);

  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setCurrentConversation(null);
    setMessages([]);
    setTextInput('');
    resetTranscript();
    stopSpeaking();
  }, [resetTranscript, stopSpeaking]);

  const handleConversationSelect = useCallback((conversationId: string) => {
    if (conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
      stopSpeaking(); // Stop any current speech
    }
  }, [currentConversationId, stopSpeaking]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Navigation handlers
  const navigateToLogin = useCallback(() => setCurrentView('login'), []);
  const navigateToSignup = useCallback(() => setCurrentView('signup'), []);
  const navigateToDashboard = useCallback(() => setCurrentView('dashboard'), []);
  const navigateToVoice = useCallback(() => setCurrentView('voice'), []);
  const navigateToWelcome = useCallback(() => setCurrentView('welcome'), []);
  const navigateToProfile = useCallback(() => setCurrentView('profile'), []);

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Profile Screen
  if (currentView === 'profile') {
    return <ProfilePage onBack={navigateToDashboard} />;
  }

  // Welcome Screen
  if (currentView === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <Brain className="w-16 h-16 text-blue-600 mr-4" />
              <h1 className="text-5xl font-bold text-gray-800">Cortex™</h1>
            </div>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Your unified life management platform. Organize tasks, manage schedules, 
              and interact with your intelligent voice assistant - all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {user ? (
                <>
                  <button
                    onClick={navigateToDashboard}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={navigateToLogin}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </button>
                  <button
                    onClick={navigateToSignup}
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors border-2 border-blue-600 flex items-center justify-center"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Account
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
              <p className="text-gray-600">Intelligent calendar management with AI-powered suggestions</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <CheckSquare className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Task Management</h3>
              <p className="text-gray-600">Organize and prioritize your tasks with smart automation</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <MessageCircle className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Voice Assistant</h3>
              <p className="text-gray-600">Natural language interaction with your personal AI assistant</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login Screen
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your Cortex™ account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={loginForm.email}
                onChange={handleLoginEmailChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={loginForm.showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={handleLoginPasswordChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={toggleLoginPasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {loginForm.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {loginForm.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {loginForm.error}
              </div>
            )}

            <button
              type="submit"
              disabled={loginForm.loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loginForm.loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={navigateToSignup}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign up
              </button>
            </p>
            <button
              onClick={navigateToWelcome}
              className="text-gray-500 hover:text-gray-700 text-sm mt-2"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Signup Screen
  if (currentView === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
            <p className="text-gray-600">Join Cortex™ and organize your life</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={signupForm.email}
                onChange={handleSignupEmailChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={signupForm.showPassword ? 'text' : 'password'}
                  value={signupForm.password}
                  onChange={handleSignupPasswordChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={toggleSignupPasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {signupForm.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={signupForm.showConfirmPassword ? 'text' : 'password'}
                  value={signupForm.confirmPassword}
                  onChange={handleSignupConfirmPasswordChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={toggleSignupConfirmPasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {signupForm.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {signupForm.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {signupForm.error}
              </div>
            )}

            <button
              type="submit"
              disabled={signupForm.loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {signupForm.loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={navigateToLogin}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign in
              </button>
            </p>
            <button
              onClick={navigateToWelcome}
              className="text-gray-500 hover:text-gray-700 text-sm mt-2"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Screen
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Profile Avatar */}
              <button
                onClick={navigateToProfile}
                className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-full h-full p-1 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {userProfile?.nickname || 'Profile'}
                </span>
              </button>
              
              <button
                onClick={navigateToVoice}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Voice Assistant
              </button>
              <button
                onClick={handleSignOut}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <Calendar className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold">Schedule</h3>
              </div>
              <p className="text-gray-600 mb-4">Manage your calendar and appointments</p>
              <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors">
                View Calendar
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <CheckSquare className="w-8 h-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold">Tasks</h3>
              </div>
              <p className="text-gray-600 mb-4">Organize and track your to-do items</p>
              <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors">
                Manage Tasks
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <MessageCircle className="w-8 h-8 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold">Voice Assistant</h3>
              </div>
              <p className="text-gray-600 mb-4">Chat with your AI-powered assistant</p>
              <button
                onClick={navigateToVoice}
                className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors"
              >
                Start Conversation
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <Zap className="w-8 h-8 text-yellow-600 mr-3" />
                <h3 className="text-xl font-semibold">Quick Actions</h3>
              </div>
              <p className="text-gray-600 mb-4">Shortcuts to common tasks</p>
              <button className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-200 transition-colors">
                View Actions
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <Brain className="w-8 h-8 text-indigo-600 mr-3" />
                <h3 className="text-xl font-semibold">Insights</h3>
              </div>
              <p className="text-gray-600 mb-4">AI-powered productivity insights</p>
              <button className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors">
                View Insights
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <User className="w-8 h-8 text-gray-600 mr-3" />
                <h3 className="text-xl font-semibold">Profile</h3>
              </div>
              <p className="text-gray-600 mb-4">Manage your account settings</p>
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Voice Assistant Screen
  if (currentView === 'voice') {
    const getStatusText = () => {
      if (voiceFlowState.error) return 'Error occurred';
      if (voiceFlowState.isProcessing) return 'Processing...';
      if (voiceFlowState.isSpeaking) return 'Speaking...';
      if (voiceFlowState.isListening) return 'Listening...';
      return 'Ready to help';
    };

    const getStatusColor = () => {
      if (voiceFlowState.error) return 'text-red-600';
      if (voiceFlowState.isProcessing) return 'text-yellow-600';
      if (voiceFlowState.isSpeaking) return 'text-green-600';
      if (voiceFlowState.isListening) return 'text-blue-600';
      return 'text-gray-600';
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white shadow-xl flex flex-col`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Conversations</h2>
              <button
                onClick={toggleSidebar}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <button
              onClick={handleNewConversation}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start a new conversation to get started</p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors group ${
                      currentConversationId === conversation.id
                        ? 'bg-blue-100 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleConversationSelect(conversation.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-800 truncate">
                          {conversation.title}
                        </h3>
                        {conversation.last_message_content && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conversation.last_message_content}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conversation.last_message_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        disabled={deletingConversationId === conversation.id}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all ml-2"
                      >
                        {deletingConversationId === conversation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-600" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center">
              {!sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3"
                >
                  <Menu className="w-5 h-5 text-gray-500" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center">
                  <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
                  {currentConversation ? currentConversation.title : 'VoiceFlow Assistant™'}
                </h1>
                <p className={`text-sm ${getStatusColor()}`}>
                  {getStatusText()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Profile Avatar */}
              <button
                onClick={navigateToProfile}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-full h-full p-0.5 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {userProfile?.nickname || 'Profile'}
                </span>
              </button>
              
              <button
                onClick={navigateToDashboard}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {loadingMessages ? (
              <div className="text-center mt-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">Welcome to VoiceFlow Assistant™</p>
                <p>Start a conversation by speaking or typing a message</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 mr-2" />
                        ) : (
                          <Bot className="w-4 h-4 mr-2" />
                        )}
                        <span className="text-xs opacity-75">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        {message.isVoice && (
                          <Volume2 className="w-3 h-3 ml-2 opacity-75" />
                        )}
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Interim Transcript */}
          {(interimTranscript || voiceFlowState.isListening) && (
            <div className="px-6 pb-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-4xl mx-auto">
                <div className="flex items-center">
                  <Mic className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    {interimTranscript || 'Listening...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {voiceFlowState.error && (
            <div className="px-6 pb-2">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-4xl mx-auto">
                <p className="text-sm">{voiceFlowState.error}</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-4">
                {/* Microphone Button */}
                <button
                  onClick={handleMicToggle}
                  disabled={!speechSupported || voiceFlowState.isProcessing}
                  className={`p-4 rounded-full transition-all duration-200 ${
                    voiceFlowState.isListening
                      ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {voiceFlowState.isListening ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </button>

                {/* Stop Speaking Button */}
                {voiceFlowState.isSpeaking && (
                  <button
                    onClick={handleStopSpeaking}
                    className="p-4 rounded-full bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                  >
                    <Square className="w-6 h-6" />
                  </button>
                )}

                {/* Processing Indicator */}
                {voiceFlowState.isProcessing && (
                  <div className="flex items-center text-yellow-600">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}

                {/* Speaking Indicator */}
                {voiceFlowState.isSpeaking && (
                  <div className="flex items-center text-green-600">
                    <Volume2 className="w-5 h-5 mr-2" />
                    <span className="text-sm">Speaking...</span>
                  </div>
                )}
              </div>

              {/* Text Input */}
              <form onSubmit={handleTextSubmit} className="flex gap-3">
                <input
                  ref={textInputRef}
                  type="text"
                  value={textInput}
                  onChange={handleTextInputChange}
                  placeholder="Type your message or use the microphone..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={voiceFlowState.isProcessing}
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || voiceFlowState.isProcessing}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>

              {/* Browser Support Info */}
              {!speechSupported && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                  <p className="text-sm">
                    Speech recognition is not supported in your browser. You can still use text input.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;