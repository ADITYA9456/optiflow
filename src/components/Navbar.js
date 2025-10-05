'use client';

import { removeToken } from '@/utils/auth';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsLoggedIn(true);
        setUserRole(payload.role || 'user');
        setUserName(payload.name || 'User');
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setUserRole('');
    setUserName('');
    router.push('/');
  };

  return (
    <motion.nav 
      className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 shadow-2xl"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <motion.div 
              className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
              whileHover={{ 
                rotate: 360,
                boxShadow: "0 10px 25px rgba(147, 51, 234, 0.4)"
              }}
              transition={{ duration: 0.6 }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </motion.div>
            <Link href="/" className="text-xl font-bold text-white hover:text-blue-200 transition-colors">
              OptiFlow
            </Link>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {!isLoggedIn ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link href="/" className="relative text-white hover:text-blue-200 transition-colors font-medium group">
                    Home
                    <motion.div
                      className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"
                    />
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link href="/#features" className="relative text-white hover:text-blue-200 transition-colors font-medium group">
                    Features
                    <motion.div
                      className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"
                    />
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link href="/#pricing" className="relative text-white hover:text-blue-200 transition-colors font-medium group">
                    Pricing
                    <motion.div
                      className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"
                    />
                  </Link>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link href="/login" className="relative text-white hover:text-blue-200 transition-colors font-medium group">
                    Login
                    <motion.div
                      className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"
                    />
                  </Link>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      href="/signup" 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 relative overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      <span className="relative z-10">Get Started</span>
                    </Link>
                  </motion.div>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link href="/dashboard" className="relative text-white hover:text-blue-200 transition-colors font-medium group">
                    Dashboard
                    <motion.div
                      className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"
                    />
                  </Link>
                </motion.div>
                {userRole === 'admin' && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Link href="/teams" className="relative text-white hover:text-blue-200 transition-colors font-medium group">
                        Teams
                        <motion.div
                          className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"
                        />
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Link href="/users" className="relative text-white hover:text-blue-200 transition-colors font-medium group">
                        Users
                        <motion.div
                          className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"
                        />
                      </Link>
                    </motion.div>
                  </>
                )}
                <motion.div 
                  className="flex items-center space-x-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div 
                    className="flex items-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <motion.div 
                      className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-white text-sm font-semibold">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </motion.div>
                    <span className="text-white font-medium">{userName}</span>
                    {userRole === 'admin' && (
                      <motion.span 
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-900 px-2 py-1 rounded-md text-xs font-bold shadow-lg"
                        animate={{ 
                          boxShadow: [
                            "0 0 10px rgba(251, 191, 36, 0.3)",
                            "0 0 20px rgba(251, 191, 36, 0.6)",
                            "0 0 10px rgba(251, 191, 36, 0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ADMIN
                      </motion.span>
                    )}
                  </motion.div>
                  <motion.button
                    onClick={handleLogout}
                    className="text-white hover:text-red-400 transition-colors font-medium px-3 py-1 rounded-lg hover:bg-red-500/10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Logout
                  </motion.button>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <motion.div 
            className="md:hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-blue-200 transition-colors p-2 rounded-lg hover:bg-white/10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ rotate: isMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </motion.svg>
            </motion.button>
          </motion.div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              className="md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="px-2 pt-2 pb-3 space-y-1 bg-white/10 backdrop-blur-xl rounded-xl mt-2 border border-white/20 shadow-2xl"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {!isLoggedIn ? (
                  <>
                    {[
                      { href: "/", label: "Home" },
                      { href: "/#features", label: "Features" },
                      { href: "/#pricing", label: "Pricing" },
                      { href: "/login", label: "Login" }
                    ].map((item, index) => (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link 
                          href={item.href} 
                          className="block px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-all duration-300 font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Link 
                        href="/signup" 
                        className="block px-3 py-2 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold mt-2 shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </motion.div>
                  </>
                ) : (
                  <>
                    {[
                      { href: "/dashboard", label: "Dashboard" },
                      ...(userRole === 'admin' ? [
                        { href: "/teams", label: "Teams" },
                        { href: "/users", label: "Users" }
                      ] : [])
                    ].map((item, index) => (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link 
                          href={item.href} 
                          className="block px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-all duration-300 font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      </motion.div>
                    ))}
                    
                    <motion.div 
                      className="px-3 py-2 border-t border-white/20 mt-2 pt-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-white font-medium block">{userName}</span>
                          {userRole === 'admin' && (
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-900 px-2 py-0.5 rounded text-xs font-bold">
                              ADMIN
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-white hover:bg-red-500/20 rounded-lg transition-all duration-300 font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Logout
                      </motion.button>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}