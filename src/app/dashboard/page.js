'use client';

import SuggestionCard from '@/components/SuggestionCard';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import { getAuthHeaders, isAuthenticated, removeToken } from '@/utils/auth';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Navbar from '../../components/Navbar';

export default function Dashboard() {
  // Core state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('user');
  const router = useRouter();
  
  // Tasks and functionality state
  const [tasks, setTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Stats derived from real data
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0
  });
  
  // Framer Motion refs
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const activityRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, threshold: 0.3 });
  const statsInView = useInView(statsRef, { once: true, threshold: 0.2 });
  const activityInView = useInView(activityRef, { once: true, threshold: 0.2 });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks', {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || []);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    const loadInitialSuggestions = async () => {
      try {
        const response = await fetch('/api/suggestions', {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    };

    const initializeData = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Get user info from token
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({ 
            id: payload.userId, 
            role: payload.role, 
            name: payload.name || payload.email?.split('@')[0] || 'User' 
          });
          setUserRole(payload.role || 'user');
        } catch (error) {
          console.error('Invalid token');
          localStorage.removeToken('token');
          router.push('/login');
          return;
        }
      }

      await fetchTasks();
      await loadInitialSuggestions();
    };
    
    initializeData();
  }, [router]); // Now all dependencies are satisfied

  // Calculate real stats from tasks
  useEffect(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const inProgress = tasks.filter(task => task.status === 'in-progress').length;
    const pending = tasks.filter(task => task.status === 'pending').length;
    const overdue = tasks.filter(task => 
      new Date(task.deadline) < new Date() && task.status !== 'completed'
    ).length;

    setStats({
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      pendingTasks: pending,
      overdueTasks: overdue
    });
  }, [tasks]);

  // Separate fetch functions for handlers
  const refetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const refetchSuggestions = async () => {
    try {
      const response = await fetch('/api/suggestions', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        refetchTasks();
        setIsTaskModalOpen(false);
        setEditingTask(null);
        // Refresh suggestions after creating a task
        setTimeout(refetchSuggestions, 1000);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      const response = await fetch(`/api/tasks/${editingTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        refetchTasks();
        setIsTaskModalOpen(false);
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        refetchTasks();
        // Refresh suggestions after status change
        setTimeout(refetchSuggestions, 1000);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          refetchTasks();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleMarkSuggestionImplemented = async (suggestionId) => {
    try {
      const response = await fetch('/api/suggestions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ suggestionId, isImplemented: true }),
      });

      if (response.ok) {
        refetchSuggestions();
      }
    } catch (error) {
      console.error('Error updating suggestion:', error);
    }
  };

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  const getActivityIcon = (type) => {
    const iconVariants = {
      initial: { scale: 0, rotate: -180 },
      animate: { scale: 1, rotate: 0 },
      hover: { scale: 1.2, rotate: 10 }
    };

    switch (type) {
      case 'task':
        return (
          <motion.div 
            className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-xl flex items-center justify-center border border-blue-500/20"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            transition={{ type: "spring", stiffness: 300 }}
          >
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </motion.div>
        );
      case 'suggestion':
        return (
          <motion.div 
            className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-600/30 rounded-xl flex items-center justify-center border border-green-500/20"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            transition={{ type: "spring", stiffness: 300 }}
          >
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </motion.div>
        );
      default:
        return (
          <motion.div 
            className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-xl flex items-center justify-center border border-purple-500/20"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            transition={{ type: "spring", stiffness: 300 }}
          >
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
        );
    }
  };

  // Generate recent activity from tasks
  const getRecentActivity = () => {
    const activity = [];
    
    // Add recent task activities
    const recentTasks = tasks.slice(0, 3);
    recentTasks.forEach((task, index) => {
      const timeAgo = index === 0 ? '2 hours ago' : index === 1 ? '4 hours ago' : '1 day ago';
      activity.push({
        id: `task-${task._id}`,
        action: task.status === 'completed' ? 'Task completed' : 'Task updated',
        description: task.title,
        time: timeAgo,
        type: 'task'
      });
    });

    // Add suggestion activities
    const recentSuggestions = suggestions.slice(0, 2);
    recentSuggestions.forEach((suggestion, index) => {
      const timeAgo = index === 0 ? '6 hours ago' : '1 day ago';
      activity.push({
        id: `suggestion-${suggestion._id}`,
        action: 'New AI suggestion',
        description: suggestion.title || 'Workflow optimization suggestion',
        time: timeAgo,
        type: 'suggestion'
      });
    });

    return activity.slice(0, 5); // Limit to 5 activities
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <motion.div 
          className="flex items-center justify-center min-h-screen pt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <motion.div 
              className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full mx-auto mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.p 
              className="text-white/80 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Loading your dashboard...
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100 
      }
    }
  };

  const statsData = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      change: stats.totalTasks > 0 ? `+${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : '0%',
      trend: stats.totalTasks > 0 ? 'up' : 'stable',
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'from-blue-500/20 to-blue-600/30',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Completed',
      value: stats.completedTasks,
      change: '+' + stats.completedTasks,
      trend: 'up',
      icon: (
        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-green-500/20 to-emerald-600/30',
      borderColor: 'border-green-500/20'
    },
    {
      title: 'In Progress',
      value: stats.inProgressTasks,
      change: stats.inProgressTasks > 0 ? `+${stats.inProgressTasks}` : '0',
      trend: stats.inProgressTasks > 0 ? 'up' : 'stable',
      icon: (
        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-purple-500/20 to-purple-600/30',
      borderColor: 'border-purple-500/20'
    },
    {
      title: 'Overdue',
      value: stats.overdueTasks,
      change: stats.overdueTasks > 0 ? `${stats.overdueTasks}` : '0',
      trend: stats.overdueTasks > 0 ? 'down' : 'stable',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.134 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: 'from-red-500/20 to-red-600/30',
      borderColor: 'border-red-500/20'
    }
  ];

  const recentActivity = getRecentActivity();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      <Navbar />
      
      {/* Animated Background */}
      <motion.div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, 40, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </motion.div>
      
      {/* Main Layout Container */}
      <div className="relative flex pt-16 min-h-screen">
        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar Navigation */}
        <motion.aside 
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:relative z-40 w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out h-screen lg:h-auto`}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="p-4 border-b border-white/10">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">Dashboard</h2>
                <p className="text-white/60 text-xs">Welcome, {user?.name}</p>
              </div>
            </motion.div>
          </div>
          
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {[
                { id: 'overview', label: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
                { id: 'tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', badge: stats.totalTasks },
                { id: 'suggestions', label: 'AI Suggestions', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', badge: suggestions.length },
                { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
              ].map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activeTab === item.id 
                        ? 'bg-blue-500/30 text-blue-200' 
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
            
            {userRole === 'admin' && (
              <motion.div 
                className="mt-8 pt-6 border-t border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-3">Admin</p>
                <div className="space-y-2">
                  <Link href="/users">
                    <motion.a className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" />
                      </svg>
                      <span className="font-medium">Users</span>
                    </motion.a>
                  </Link>
                  <Link href="/teams">
                    <motion.a className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="font-medium">Teams</span>
                    </motion.a>
                  </Link>
                </div>
              </motion.div>
            )}
          </nav>
        </motion.aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {/* Mobile menu button */}
          <div className="lg:hidden p-4 border-b border-white/10">
            <motion.button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
          </div>
          
          <div className="p-2 lg:p-3">
            {/* Tabs Navigation - Now in a more compact mobile-friendly style */}
            <motion.div 
              className="mb-2"
              initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1">
              <nav className="flex flex-wrap gap-1">
                {[
                  { id: 'overview', label: 'Overview', count: '' },
                  { id: 'tasks', label: 'Tasks', count: stats.totalTasks },
                  { id: 'suggestions', label: 'AI Suggestions', count: suggestions.length },
                  { id: 'analytics', label: 'Analytics', count: '' }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== '' && (
                      <motion.span 
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          activeTab === tab.id 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white/10 text-white/60'
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {tab.count}
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 xl:grid-cols-3 gap-6"
              >
                {/* Recent Activity */}
                <motion.div 
                  ref={activityRef}
                  className="xl:col-span-2"
                  initial={{ opacity: 0, x: -50 }}
                  animate={activityInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8 }}
                >
                  <motion.div 
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden"
                    whileHover={{ 
                      borderColor: "rgba(147, 51, 234, 0.3)",
                      boxShadow: "0 25px 50px -12px rgba(147, 51, 234, 0.2)"
                    }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <motion.h2 
                        className="text-2xl font-bold text-white"
                        initial={{ opacity: 0, y: 20 }}
                        animate={activityInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2 }}
                      >
                        Recent Activity
                      </motion.h2>
                      <motion.button 
                        className="text-blue-300 hover:text-blue-200 text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={activityInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab('tasks')}
                      >
                        View all tasks
                      </motion.button>
                    </div>
                    
                    <div className="space-y-4">
                      {recentActivity.length === 0 ? (
                        <motion.div 
                          className="text-center py-12"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className="text-white/40 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h2m0-13h10a2 2 0 012 2v11a2 2 0 01-2 2H9m0-13a2 2 0 00-2 2v1m2-1h10a2 2 0 012 2v1M9 7v1" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-white mb-2">No recent activity</h3>
                          <p className="text-white/60 mb-4">Create your first task to see activity here</p>
                          <motion.button
                            onClick={() => {
                              setEditingTask(null);
                              setIsTaskModalOpen(true);
                            }}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Create Task
                          </motion.button>
                        </motion.div>
                      ) : (
                        <AnimatePresence>
                          {recentActivity.map((activity, index) => (
                            <motion.div 
                              key={activity.id}
                              className="flex items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-white/20 group cursor-pointer"
                              initial={{ opacity: 0, x: -30 }}
                              animate={activityInView ? { opacity: 1, x: 0 } : {}}
                              transition={{ delay: 0.4 + index * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              layout
                            >
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                              >
                                {getActivityIcon(activity.type)}
                              </motion.div>
                              <div className="ml-4 flex-1">
                                <motion.p 
                                  className="text-white font-medium group-hover:text-blue-300 transition-colors"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.6 + index * 0.1 }}
                                >
                                  {activity.action}
                                </motion.p>
                                <motion.p 
                                  className="text-white/60 text-sm mt-1"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.7 + index * 0.1 }}
                                >
                                  {activity.description}
                                </motion.p>
                              </div>
                              <motion.div 
                                className="text-white/60 text-sm"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + index * 0.1 }}
                              >
                                {activity.time}
                              </motion.div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </motion.div>
                </motion.div>

                {/* Sidebar */}
                <motion.div 
                  className="space-y-8"
                  initial={{ opacity: 0, x: 50 }}
                  animate={activityInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {/* Quick Actions */}
                  <motion.div 
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden"
                    whileHover={{ 
                      borderColor: "rgba(147, 51, 234, 0.3)",
                      boxShadow: "0 25px 50px -12px rgba(147, 51, 234, 0.2)"
                    }}
                  >
                    <motion.h2 
                      className="text-xl font-bold text-white mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={activityInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.4 }}
                    >
                      Quick Actions
                    </motion.h2>
                    
                    <div className="space-y-4">
                      {[
                        { 
                          label: "Create Task", 
                          action: () => {
                            setEditingTask(null);
                            setIsTaskModalOpen(true);
                          },
                          color: "from-blue-500 to-blue-600",
                          icon: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                        },
                        { 
                          label: "View Tasks", 
                          action: () => setActiveTab('tasks'),
                          color: "from-green-500 to-emerald-600",
                          icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        },
                        { 
                          label: "AI Suggestions", 
                          action: () => setActiveTab('suggestions'),
                          color: "from-purple-500 to-purple-600",
                          icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        },
                        { 
                          label: "Analytics", 
                          action: () => setActiveTab('analytics'),
                          color: "from-yellow-500 to-orange-600",
                          icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        }
                      ].map((action, index) => (
                        <motion.button
                          key={index}
                          onClick={action.action}
                          className={`w-full p-4 bg-gradient-to-r ${action.color} rounded-xl text-white font-semibold flex items-center justify-center space-x-3 transition-all duration-300 hover:shadow-2xl border border-white/10`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={activityInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          whileHover={{ 
                            scale: 1.05, 
                            y: -3,
                            boxShadow: "0 20px 40px -10px rgba(147, 51, 234, 0.4)"
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                          </svg>
                          <span>{action.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Task Statistics */}
                  <motion.div 
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden"
                    whileHover={{ 
                      borderColor: "rgba(147, 51, 234, 0.3)",
                      boxShadow: "0 25px 50px -12px rgba(147, 51, 234, 0.2)"
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={activityInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.6 }}
                  >
                    <motion.h2 
                      className="text-xl font-bold text-white mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={activityInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.7 }}
                    >
                      Task Statistics
                    </motion.h2>
                    
                    <div className="space-y-5">
                      {[
                        { 
                          label: "Completion Rate", 
                          value: stats.totalTasks > 0 ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : '0%', 
                          color: "green" 
                        },
                        { 
                          label: "Active Tasks", 
                          value: stats.inProgressTasks, 
                          color: "blue" 
                        },
                        { 
                          label: "Pending Tasks", 
                          value: stats.pendingTasks, 
                          color: "yellow" 
                        },
                        { 
                          label: "Overdue Tasks", 
                          value: stats.overdueTasks, 
                          color: stats.overdueTasks > 0 ? "red" : "green" 
                        }
                      ].map((item, index) => (
                        <motion.div 
                          key={index}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                          initial={{ opacity: 0, x: -20 }}
                          animate={activityInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          whileHover={{ x: 5 }}
                        >
                          <span className="text-white/80 font-medium">{item.label}</span>
                          <div className="flex items-center">
                            <motion.div 
                              className={`w-3 h-3 rounded-full mr-3 ${
                                item.color === 'green' ? 'bg-green-400' :
                                item.color === 'blue' ? 'bg-blue-400' :
                                item.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'
                              }`}
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.7, 1, 0.7]
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity,
                                delay: index * 0.5
                              }}
                            />
                            <span className={`text-sm font-medium ${
                              item.color === 'green' ? 'text-green-400' :
                              item.color === 'blue' ? 'text-blue-400' :
                              item.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {item.value}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-6 flex justify-between items-center">
                  <motion.h2 
                    className="text-2xl font-bold text-white"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Your Tasks
                  </motion.h2>
                  <motion.button
                    onClick={() => {
                      setEditingTask(null);
                      setIsTaskModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Task</span>
                  </motion.button>
                </div>

                {tasks.length === 0 ? (
                  <motion.div 
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="text-white/40 mb-4">
                      <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h2m0-13h10a2 2 0 012 2v11a2 2 0 01-2 2H9m0-13a2 2 0 00-2 2v1m2-1h10a2 2 0 012 2v1M9 7v1" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No tasks yet</h3>
                    <p className="text-white/60 mb-4">Get started by creating your first task</p>
                    <motion.button
                      onClick={() => {
                        setEditingTask(null);
                        setIsTaskModalOpen(true);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Create Task
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {tasks.map((task) => (
                      <motion.div key={task._id} variants={itemVariants}>
                        <TaskCard
                          task={task}
                          onUpdateStatus={handleUpdateTaskStatus}
                          onDelete={handleDeleteTask}
                          onEdit={handleEditTask}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'suggestions' && (
              <motion.div
                key="suggestions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <motion.h2 
                  className="text-2xl font-bold text-white mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  AI Suggestions
                </motion.h2>

                {suggestions.length === 0 ? (
                  <motion.div 
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="text-white/40 mb-4">
                      <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No suggestions yet</h3>
                    <p className="text-white/60 mb-4">Add some tasks to get AI-powered workflow suggestions</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="grid gap-6 md:grid-cols-2"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {suggestions.map((suggestion) => (
                      <motion.div key={suggestion._id} variants={itemVariants}>
                        <SuggestionCard
                          suggestion={suggestion}
                          onMarkImplemented={handleMarkSuggestionImplemented}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <motion.h2 
                  className="text-2xl font-bold text-white mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Analytics Overview
                </motion.h2>

                <div className="grid md:grid-cols-2 gap-8">
                  <motion.div 
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <h4 className="text-md font-medium text-white mb-6">Task Distribution</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Completed', value: stats.completedTasks, total: stats.totalTasks, color: 'green' },
                        { label: 'In Progress', value: stats.inProgressTasks, total: stats.totalTasks, color: 'blue' },
                        { label: 'Pending', value: stats.pendingTasks, total: stats.totalTasks, color: 'gray' },
                        { label: 'Overdue', value: stats.overdueTasks, total: stats.totalTasks, color: 'red' }
                      ].map((item, index) => (
                        <motion.div 
                          key={index}
                          className="flex items-center justify-between"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                        >
                          <span className="text-sm text-white/60">{item.label}</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-white/20 rounded-full h-2 mr-2">
                              <motion.div 
                                className={`h-2 rounded-full ${
                                  item.color === 'green' ? 'bg-green-500' :
                                  item.color === 'blue' ? 'bg-blue-500' :
                                  item.color === 'gray' ? 'bg-gray-500' : 'bg-red-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ 
                                  width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` 
                                }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                              />
                            </div>
                            <span className="text-sm text-white">{item.value}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div 
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <h4 className="text-md font-medium text-white mb-6">Productivity Insights</h4>
                    <div className="space-y-4 text-sm">
                      {[
                        {
                          label: 'Completion Rate',
                          value: stats.totalTasks > 0 ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : '0%',
                          color: 'green'
                        },
                        {
                          label: 'Active Tasks',
                          value: stats.inProgressTasks,
                          color: 'blue'
                        },
                        {
                          label: 'Overdue Tasks',
                          value: stats.overdueTasks,
                          color: stats.overdueTasks > 0 ? 'red' : 'green'
                        }
                      ].map((item, index) => (
                        <motion.div 
                          key={index}
                          className={`flex justify-between items-center p-3 rounded-lg ${
                            item.color === 'red' ? 'bg-red-500/10' : 'bg-white/5'
                          }`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className={`${
                            item.color === 'red' ? 'text-red-400' : 'text-white/60'
                          }`}>
                            {item.label}
                          </span>
                          <span className={`font-medium ${
                            item.color === 'green' ? 'text-green-400' :
                            item.color === 'blue' ? 'text-blue-400' :
                            item.color === 'red' ? 'text-red-400' : 'text-white'
                          }`}>
                            {item.value}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
      />
    </div>
  );
}