// Company Configuration
// Edit this file to customize the landing page for different companies

const companyConfig = {
  // Company Branding
  company: {
    name: "OptiFlow",
    tagline: "Optimize Your Workflow",
    description: "Transform your productivity with AI-powered task management, team collaboration, and intelligent workflow optimization.",
    email: "hello@optiflow.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA"
  },

  // Hero Section
  hero: {
    title: {
      line1: "Optimize",
      line2: "Your",
      line3: "Workflow" // This line gets the gradient effect
    },
    subtitle: "Transform your productivity with AI-powered task management, team collaboration, and intelligent workflow optimization.",
    primaryButtonText: "Start Free Trial",
    secondaryButtonText: "Watch Demo",
    trustLine: "Trusted by 10,000+ teams worldwide",
    trustedCompanies: ["Microsoft", "Google", "Spotify"]
  },

  // Features Section
  features: {
    title: {
      line1: "Powerful",
      line2: "Features",
      line3: "for",
      line4: "Modern Teams" // This line gets the gradient effect
    },
    subtitle: "Everything you need to streamline workflows, boost productivity, and achieve your goals faster.",
    items: [
      {
        icon: '🚀',
        title: 'Smart Task Management',
        description: 'AI-powered task optimization with intelligent prioritization and deadline management.'
      },
      {
        icon: '👥',
        title: 'Team Collaboration',
        description: 'Seamless team coordination with real-time updates and role-based permissions.'
      },
      {
        icon: '📊',
        title: 'Advanced Analytics',
        description: 'Comprehensive insights into productivity patterns and workflow optimization.'
      },
      {
        icon: '🤖',
        title: 'AI Suggestions',
        description: 'Machine learning algorithms provide personalized workflow recommendations.'
      },
      {
        icon: '⚡',
        title: 'Real-time Updates',
        description: 'Instant synchronization across all devices and team members.'
      },
      {
        icon: '🔒',
        title: 'Enterprise Security',
        description: 'Bank-level security with role-based access control and data encryption.'
      }
    ]
  },

  // Pricing Section
  pricing: {
    title: {
      line1: "Simple,",
      line2: "Transparent",
      line3: "Pricing" // This line gets the gradient effect
    },
    subtitle: "Choose the perfect plan for your team's needs",
    plans: [
      {
        name: 'Starter',
        price: '$0',
        period: '/month',
        description: 'Perfect for individuals and small projects',
        features: [
          'Up to 10 tasks',
          'Basic analytics',
          'Email support',
          'Mobile app access'
        ],
        buttonText: 'Get Started Free',
        isPopular: false
      },
      {
        name: 'Professional',
        price: '$29',
        period: '/month',
        description: 'Ideal for growing teams and businesses',
        features: [
          'Unlimited tasks',
          'Advanced analytics',
          'Team collaboration',
          'Priority support',
          'AI suggestions',
          'Custom workflows'
        ],
        buttonText: 'Start Free Trial',
        isPopular: true
      },
      {
        name: 'Enterprise',
        price: '$99',
        period: '/month',
        description: 'For large organizations with advanced needs',
        features: [
          'Everything in Professional',
          'Advanced security',
          'Custom integrations',
          'Dedicated support',
          'On-premise deployment',
          'SLA guarantee'
        ],
        buttonText: 'Contact Sales',
        isPopular: false
      }
    ]
  },

  // Contact Section
  contact: {
    title: {
      line1: "Ready to Get",
      line2: "Started?" // This line gets the gradient effect
    },
    subtitle: "Join thousands of teams who have transformed their productivity with OptiFlow",
    features: [
      '14-day free trial',
      'No credit card required', 
      'Cancel anytime',
      '24/7 support included'
    ],
    primaryButtonText: "Start Free Trial",
    secondaryButtonText: "Contact Sales",
    contactMethods: [
      { 
        icon: 'M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z', 
        color: 'from-blue-500 to-purple-500', 
        label: 'Email', 
        value: 'hello@optiflow.com' 
      },
      { 
        icon: 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z', 
        color: 'from-green-500 to-emerald-500', 
        label: 'Office', 
        value: 'San Francisco, CA' 
      },
      { 
        icon: 'M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z', 
        color: 'from-orange-500 to-red-500', 
        label: 'Phone', 
        value: '+1 (555) 123-4567' 
      }
    ]
  },

  // Design Customization
  theme: {
    primaryGradient: "from-blue-600 to-purple-600",
    secondaryGradient: "from-purple-600 to-pink-600",
    accentGradient: "from-blue-400 via-purple-400 to-pink-400",
    logoGradient: "from-blue-500 to-purple-600",
    
    // Animation delays and timing
    animations: {
      heroDelay: 0.3,
      staggerDelay: 0.2,
      featureDelay: 0.2,
      pricingDelay: 0.2
    }
  }
};

// Alternative company configurations for easy switching
export const companyConfigs = {
  // Default OptiFlow Configuration
  optiflow: companyConfig,

  // Capgemini Configuration Example
  capgemini: {
    ...companyConfig,
    company: {
      name: "CapgeProdx",
      tagline: "Accelerate Digital Excellence",
      description: "Transform your digital delivery with AI-powered project management, enterprise collaboration, and intelligent workflow optimization.",
      email: "hello@capgeprodx.com",
      phone: "+1 (555) 789-0123",
      location: "Paris, France"
    },
    hero: {
      ...companyConfig.hero,
      title: {
        line1: "Accelerate",
        line2: "Digital",
        line3: "Excellence"
      },
      subtitle: "Transform your digital delivery with enterprise-grade project management, team collaboration, and AI-driven productivity solutions.",
      trustLine: "Trusted by Fortune 500 companies worldwide",
      trustedCompanies: ["Airbus", "L'Oréal", "Société Générale"]
    },
    features: {
      ...companyConfig.features,
      title: {
        line1: "Enterprise",
        line2: "Solutions",
        line3: "for",
        line4: "Digital Leaders"
      },
      subtitle: "Comprehensive digital transformation tools designed for enterprise-scale operations and compliance.",
    },
    pricing: {
      ...companyConfig.pricing,
      title: {
        line1: "Enterprise",
        line2: "Ready",
        line3: "Solutions"
      }
    },
    contact: {
      ...companyConfig.contact,
      title: {
        line1: "Ready to Transform",
        line2: "Your Enterprise?"
      },
      subtitle: "Join leading enterprises who have accelerated their digital transformation with CapgeProdx",
      contactMethods: [
        { 
          icon: 'M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z', 
          color: 'from-blue-500 to-purple-500', 
          label: 'Email', 
          value: 'enterprise@capgeprodx.com' 
        },
        { 
          icon: 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z', 
          color: 'from-green-500 to-emerald-500', 
          label: 'Headquarters', 
          value: 'Paris, France' 
        },
        { 
          icon: 'M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z', 
          color: 'from-orange-500 to-red-500', 
          label: 'Phone', 
          value: '+33 1 47 54 50 00' 
        }
      ]
    }
  },

  // Infosys Configuration Example
  infosys: {
    ...companyConfig,
    company: {
      name: "InfoFlow",
      tagline: "Navigate Next-Gen Productivity",
      description: "Navigate digital transformation with AI-powered workflow automation, cognitive insights, and next-generation collaboration tools.",
      email: "hello@infoflow.com",
      phone: "+91 80 2852 0261",
      location: "Bangalore, India"
    },
    hero: {
      ...companyConfig.hero,
      title: {
        line1: "Navigate",
        line2: "Next-Gen",
        line3: "Productivity"
      },
      subtitle: "Navigate digital transformation with AI-powered workflow automation, cognitive insights, and next-generation collaboration tools.",
      trustLine: "Powering digital journeys for Global 2000 companies",
      trustedCompanies: ["Nasdaq", "Rolls-Royce", "Vanguard"]
    },
    features: {
      ...companyConfig.features,
      title: {
        line1: "Cognitive",
        line2: "Innovation",
        line3: "for",
        line4: "Digital Leaders"
      },
      subtitle: "Next-generation productivity tools with AI-driven automation and cognitive intelligence for enterprise excellence.",
    },
    pricing: {
      ...companyConfig.pricing,
      title: {
        line1: "Scalable",
        line2: "Digital",
        line3: "Solutions"
      }
    },
    contact: {
      ...companyConfig.contact,
      title: {
        line1: "Ready to Navigate",
        line2: "Your Digital Future?"
      },
      subtitle: "Join global enterprises who have accelerated their digital transformation with InfoFlow",
      contactMethods: [
        { 
          icon: 'M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z', 
          color: 'from-blue-500 to-purple-500', 
          label: 'Email', 
          value: 'digital@infoflow.com' 
        },
        { 
          icon: 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z', 
          color: 'from-green-500 to-emerald-500', 
          label: 'Global HQ', 
          value: 'Bangalore, India' 
        },
        { 
          icon: 'M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z', 
          color: 'from-orange-500 to-red-500', 
          label: 'Phone', 
          value: '+91 80 2852 0261' 
        }
      ]
    }
  }
};

// Set the active company configuration here
// Change 'optiflow' to 'capgemini' or 'infosys' to switch configurations
export const ACTIVE_COMPANY = 'optiflow';

// Export the active configuration
export default companyConfigs[ACTIVE_COMPANY];