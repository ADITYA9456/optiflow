'use client';

import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import Navbar from '../components/Navbar';
import companyConfig from '../config/company';

export default function HomePage() {
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, threshold: 0.3 });
  const featuresInView = useInView(featuresRef, { once: true, threshold: 0.2 });
  const pricingInView = useInView(pricingRef, { once: true, threshold: 0.2 });

  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Extract configuration data
  const { hero, features, pricing, contact, theme } = companyConfig;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section ref={heroRef} id="home" className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Animated Background */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        
        <motion.div 
          className="relative max-w-6xl mx-auto text-center"
          style={{ y, opacity }}
        >
          {/* Logo Animation */}
          <motion.div 
            className="mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <div className={`w-24 h-24 mx-auto bg-gradient-to-r ${theme.logoGradient} rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/10`}>
              <motion.svg 
                className="w-12 h-12 text-white" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </motion.svg>
            </div>
          </motion.div>
          
          <div className="space-y-8">
            <motion.h1 
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight"
              initial={{ opacity: 0, y: 50 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: theme.animations.heroDelay }}
            >
              <motion.span 
                className="inline-block"
                initial={{ opacity: 0, x: -50 }}
                animate={heroInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: theme.animations.heroDelay + 0.1 }}
              >
                {hero.title.line1}
              </motion.span>{' '}
              <motion.span 
                className="inline-block"
                initial={{ opacity: 0, x: 50 }}
                animate={heroInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: theme.animations.heroDelay + 0.3 }}
              >
                {hero.title.line2}
              </motion.span>
              <motion.span 
                className={`block bg-gradient-to-r ${theme.accentGradient} bg-clip-text text-transparent`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: theme.animations.heroDelay + 0.5 }}
              >
                {hero.title.line3}
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed font-light"
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: theme.animations.heroDelay + 0.7 }}
            >
              {hero.subtitle}
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
              initial={{ opacity: 0, y: 40 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: theme.animations.heroDelay + 0.9 }}
            >
              <Link href="/signup">
                <motion.button 
                  className={`group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r ${theme.primaryGradient} rounded-xl shadow-2xl border border-white/10 overflow-hidden hover:shadow-purple-500/30`}
                  whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(147, 51, 234, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: theme.animations.heroDelay + 1.1 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative z-10">{hero.primaryButtonText}</span>
                  <motion.svg 
                    className="w-5 h-5 ml-2 relative z-10" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </motion.svg>
                </motion.button>
              </Link>
              
              <motion.button 
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden hover:bg-white/20"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: theme.animations.heroDelay + 1.3 }}
              >
                <span>{hero.secondaryButtonText}</span>
                <motion.svg 
                  className="w-5 h-5 ml-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  whileHover={{ scale: 1.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M9 16v-2a2 2 0 012-2h2a2 2 0 012 2v2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </motion.svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="mt-16 text-gray-400"
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: theme.animations.heroDelay + 1.5 }}
            >
              <p className="text-sm mb-6">{hero.trustLine}</p>
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8">
                {hero.trustedCompanies.map((company, index) => (
                  <motion.div 
                    key={index}
                    className="bg-white/5 backdrop-blur-sm px-4 sm:px-6 py-3 rounded-lg border border-white/10 text-gray-300 font-medium cursor-pointer text-sm sm:text-base"
                    initial={{ opacity: 0, y: 20 }}
                    animate={heroInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: theme.animations.heroDelay + 1.7 + index * 0.1 }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -5,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      transition: { type: "spring", stiffness: 400 }
                    }}
                  >
                    {company}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id="features" className="py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-800/30 to-slate-900/50"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <motion.h2 
              className="text-4xl md:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.span 
                className="inline-block"
                initial={{ x: -100, opacity: 0 }}
                animate={featuresInView ? { x: 0, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {features.title.line1}
              </motion.span>{' '}
              <motion.span 
                className="inline-block"
                initial={{ x: 100, opacity: 0 }}
                animate={featuresInView ? { x: 0, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {features.title.line2}
              </motion.span>{' '}
              <motion.span 
                className="inline-block"
                initial={{ y: 50, opacity: 0 }}
                animate={featuresInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {features.title.line3}
              </motion.span>
              <motion.span 
                className={`block bg-gradient-to-r ${theme.accentGradient} bg-clip-text text-transparent`}
                initial={{ opacity: 0, scale: 0 }}
                animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                {features.title.line4}
              </motion.span>
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {features.subtitle}
            </motion.p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.items.map((feature, index) => (
              <motion.div 
                key={index} 
                className="group relative p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 cursor-pointer overflow-hidden"
                initial={{ opacity: 0, y: 100, rotateX: 45 }}
                animate={featuresInView ? { 
                  opacity: 1, 
                  y: 0, 
                  rotateX: 0,
                  transition: { 
                    duration: 0.8, 
                    delay: index * 0.2,
                    type: "spring",
                    stiffness: 100 
                  }
                } : {}}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  rotateY: 5,
                  boxShadow: "0 25px 50px -12px rgba(147, 51, 234, 0.3)",
                  borderColor: "rgba(147, 51, 234, 0.5)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                
                <div className="relative z-10">
                  <motion.div 
                    className="text-5xl mb-6 origin-center"
                    whileHover={{ 
                      scale: 1.1, 
                      y: -5,
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: index * 0.2 + 0.3 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <motion.h3 
                    className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors duration-300"
                    initial={{ opacity: 0 }}
                    animate={featuresInView ? { opacity: 1 } : {}}
                    transition={{ delay: index * 0.2 + 0.5 }}
                  >
                    {feature.title}
                  </motion.h3>
                  <motion.p 
                    className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300"
                    initial={{ opacity: 0 }}
                    animate={featuresInView ? { opacity: 1 } : {}}
                    transition={{ delay: index * 0.2 + 0.7 }}
                  >
                    {feature.description}
                  </motion.p>
                </div>
                
                {/* Animated border */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-transparent"
                  style={{
                    background: "linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(59, 130, 246, 0.3))",
                    backgroundClip: "padding-box",
                  }}
                  initial={{ opacity: 0 }}
                  whileHover={{ 
                    opacity: 1,
                    transition: { duration: 0.3 }
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            animate={pricingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <motion.h2 
              className="text-4xl md:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={pricingInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.span 
                className="inline-block"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={pricingInView ? { rotateY: 0, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {pricing.title.line1}
              </motion.span>{' '}
              <motion.span 
                className="inline-block"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={pricingInView ? { rotateY: 0, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {pricing.title.line2}
              </motion.span>
              <motion.span 
                className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 50 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                {pricing.title.line3}
              </motion.span>
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300"
              initial={{ opacity: 0 }}
              animate={pricingInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              {pricing.subtitle}
            </motion.p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricing.plans.map((plan, index) => (
              <motion.div 
                key={index}
                className={`group relative p-8 rounded-3xl backdrop-blur-sm border cursor-pointer overflow-hidden ${
                  plan.isPopular 
                    ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-purple-500/50 shadow-2xl shadow-purple-500/20' 
                    : 'bg-white/5 border-white/10'
                }`}
                initial={{ 
                  opacity: 0, 
                  y: 100, 
                  rotateX: 45,
                  scale: plan.isPopular ? 0.9 : 0.8
                }}
                animate={pricingInView ? { 
                  opacity: 1, 
                  y: 0, 
                  rotateX: 0,
                  scale: plan.isPopular ? 1.05 : 1,
                  transition: { 
                    duration: 0.8, 
                    delay: index * 0.2,
                    type: "spring",
                    stiffness: 100 
                  }
                } : {}}
                whileHover={{ 
                  scale: plan.isPopular ? 1.08 : 1.05, 
                  y: -15,
                  rotateY: 5,
                  boxShadow: plan.isPopular 
                    ? "0 25px 50px -12px rgba(147, 51, 234, 0.5)" 
                    : "0 25px 50px -12px rgba(59, 130, 246, 0.3)",
                  borderColor: plan.isPopular 
                    ? "rgba(147, 51, 234, 0.8)" 
                    : "rgba(147, 51, 234, 0.5)"
                }}
                whileTap={{ scale: plan.isPopular ? 1.02 : 0.98 }}
              >
                {plan.isPopular && (
                  <motion.div 
                    className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: index * 0.2 + 0.5 }}
                  >
                    <motion.div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg"
                      animate={{ 
                        boxShadow: [
                          "0 4px 15px rgba(147, 51, 234, 0.4)",
                          "0 8px 25px rgba(147, 51, 234, 0.6)",
                          "0 4px 15px rgba(147, 51, 234, 0.4)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      MOST POPULAR
                    </motion.div>
                  </motion.div>
                )}
                
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <motion.h3 
                      className="text-2xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={pricingInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: index * 0.2 + 0.3 }}
                    >
                      {plan.name}
                    </motion.h3>
                    <motion.p 
                      className="text-gray-400 mb-6 leading-relaxed group-hover:text-gray-300 transition-colors duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={pricingInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: index * 0.2 + 0.4 }}
                    >
                      {plan.description}
                    </motion.p>
                    
                    <motion.div 
                      className="mb-8"
                      initial={{ scale: 0 }}
                      animate={pricingInView ? { scale: 1 } : {}}
                      transition={{ type: "spring", delay: index * 0.2 + 0.5 }}
                    >
                      <motion.span 
                        className="text-5xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300"
                        whileHover={{ scale: 1.1 }}
                      >
                        {plan.price}
                      </motion.span>
                      <span className="text-gray-400 text-lg">{plan.period}</span>
                    </motion.div>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <motion.li 
                        key={featureIndex} 
                        className="flex items-center text-gray-300 group-hover:text-gray-200 transition-all duration-300"
                        initial={{ opacity: 0, x: -20 }}
                        animate={pricingInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: index * 0.2 + featureIndex * 0.1 + 0.6 }}
                        whileHover={{ x: 5, color: "#a855f7" }}
                      >
                        <motion.div 
                          className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ type: "spring" }}
                        >
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </motion.div>
                        <span className="leading-relaxed">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                  
                  <Link href="/signup" className="block">
                    <motion.button 
                      className={`w-full py-4 px-6 rounded-xl font-semibold text-lg relative overflow-hidden transition-all duration-300 ${
                        plan.isPopular 
                          ? `bg-gradient-to-r ${theme.secondaryGradient} text-white shadow-2xl shadow-purple-500/30` 
                          : 'bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20'
                      }`}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: plan.isPopular 
                          ? "0 25px 50px -12px rgba(147, 51, 234, 0.5)" 
                          : "0 15px 35px -5px rgba(255, 255, 255, 0.1)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={pricingInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: index * 0.2 + 0.8 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      <span className="relative z-10">{plan.buttonText}</span>
                    </motion.button>
                  </Link>
                </div>
                
                {/* Enhanced glow effect for popular plan */}
                {plan.isPopular && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer 
        className="relative bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 border-t border-white/10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, threshold: 0.1 }}
      >
        {/* Animated background elements */}
        <motion.div 
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <motion.div 
            className="absolute top-20 left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"
            animate={{ 
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 right-20 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"
            animate={{ 
              x: [0, -20, 0],
              y: [0, 15, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </motion.div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            
            {/* Company Info */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <motion.div 
                className="flex items-center mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${theme.logoGradient} rounded-2xl flex items-center justify-center mr-4`}>
                  <motion.svg 
                    className="w-7 h-7 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </motion.svg>
                </div>
                <h3 className="text-2xl font-bold text-white">{companyConfig.company.name}</h3>
              </motion.div>
              
              <motion.p 
                className="text-gray-300 leading-relaxed mb-6 max-w-md"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                {companyConfig.company.description}
              </motion.p>
              
              {/* Social Media Icons */}
              <motion.div 
                className="flex space-x-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                {[
                  { name: 'Twitter', icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                  { name: 'LinkedIn', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 2a2 2 0 11-4 0 2 2 0 014 0z' },
                  { name: 'GitHub', icon: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22' }
                ].map((social, index) => (
                  <motion.a 
                    key={social.name}
                    href="#"
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/20 transition-all duration-300"
                    whileHover={{ 
                      scale: 1.1, 
                      y: -2,
                      backgroundColor: "rgba(255, 255, 255, 0.1)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <svg className="w-5 h-5 text-gray-300 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={social.icon} />
                    </svg>
                  </motion.a>
                ))}
              </motion.div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold text-white mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'About Us', 'Contact', 'Blog', 'Help Center'].map((link, index) => (
                  <motion.li 
                    key={link}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <motion.a 
                      href="#" 
                      className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group"
                      whileHover={{ x: 5 }}
                    >
                      <motion.span 
                        className="w-1 h-1 bg-purple-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        whileHover={{ scale: 1.5 }}
                      />
                      {link}
                    </motion.a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold text-white mb-6">Get in Touch</h4>
              <div className="space-y-4">
                {contact.contactMethods.map((method, index) => (
                  <motion.div 
                    key={method.label}
                    className="flex items-center space-x-3 group"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                    viewport={{ once: true }}
                  >
                    <motion.div 
                      className={`w-8 h-8 bg-gradient-to-r ${method.color} rounded-lg flex items-center justify-center`}
                      whileHover={{ 
                        scale: 1.1,
                        rotate: 5
                      }}
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d={method.icon} fillRule="evenodd" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                    <div>
                      <div className="text-sm text-gray-400">{method.label}</div>
                      <div className="text-gray-300 text-sm font-medium">{method.value}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Newsletter Signup */}
          <motion.div 
            className="border-t border-white/10 pt-12 mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="max-w-2xl mx-auto text-center">
              <motion.h4 
                className="text-2xl font-bold text-white mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                viewport={{ once: true }}
              >
                Stay Updated
              </motion.h4>
              <motion.p 
                className="text-gray-300 mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                viewport={{ once: true }}
              >
                Get the latest updates, tips, and insights delivered to your inbox.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                viewport={{ once: true }}
              >
                <motion.input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all duration-300"
                  whileFocus={{ scale: 1.02 }}
                />
                <motion.button 
                  className={`px-6 py-3 bg-gradient-to-r ${theme.primaryGradient} text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Subscribe
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* Bottom Bar */}
          <motion.div 
            className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <motion.p 
              className="text-gray-400 text-sm mb-4 md:mb-0"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              viewport={{ once: true }}
            >
              © 2025 {companyConfig.company.name}. All rights reserved.
            </motion.p>
            
            <motion.div 
              className="flex space-x-6"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              viewport={{ once: true }}
            >
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link, index) => (
                <motion.a 
                  key={link}
                  href="#" 
                  className="text-gray-400 hover:text-white text-sm transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  {link}
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll to top button */}
        <motion.button 
          className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 z-50"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <motion.svg 
            className="w-6 h-6 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            whileHover={{ y: -2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </motion.svg>
        </motion.button>
      </motion.footer>
    </div>
  );
}