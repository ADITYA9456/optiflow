# OptiFlow Landing Page Configuration

## Overview
The OptiFlow landing page has been enhanced with a flexible configuration system that allows easy customization for different companies without modifying the main code. This makes it perfect for white-labeling or creating company-specific versions.

## Quick Start

### Switching Between Configurations

1. **Open the configuration file**: `src/config/company.js`
2. **Change the ACTIVE_COMPANY variable**:
   ```javascript
   // Change this line to switch configurations
   export const ACTIVE_COMPANY = 'optiflow'; // or 'capgemini' or 'infosys'
   ```
3. **Restart your development server** to see the changes

### Available Configurations

- **optiflow** - Default OptiFlow branding
- **capgemini** - Enterprise-focused CapgeProdx branding
- **infosys** - Digital transformation InfoFlow branding

## Customization Guide

### Creating a New Company Configuration

1. **Add your company to the `companyConfigs` object** in `src/config/company.js`:

```javascript
export const companyConfigs = {
  // ... existing configurations

  yourcompany: {
    company: {
      name: "YourCompany Flow",
      tagline: "Your Custom Tagline",
      description: "Your company description...",
      email: "hello@yourcompany.com",
      phone: "+1 (555) 000-0000",
      location: "Your City, Country"
    },
    hero: {
      title: {
        line1: "Transform",
        line2: "Your",
        line3: "Business" // This line gets the gradient effect
      },
      subtitle: "Your custom subtitle here...",
      primaryButtonText: "Get Started",
      secondaryButtonText: "Learn More",
      trustLine: "Trusted by leading companies",
      trustedCompanies: ["Company A", "Company B", "Company C"]
    },
    // ... copy and customize other sections
  }
};
```

2. **Update the ACTIVE_COMPANY variable**:
```javascript
export const ACTIVE_COMPANY = 'yourcompany';
```

### Configuration Structure

#### Company Information
```javascript
company: {
  name: "Company Name",           // Used in metadata and branding
  tagline: "Your Tagline",       // Company tagline
  description: "Description",     // Company description
  email: "contact@company.com",   // Contact email
  phone: "+1 (555) 123-4567",    // Contact phone
  location: "City, Country"       // Office location
}
```

#### Hero Section
```javascript
hero: {
  title: {
    line1: "First",     // Regular text
    line2: "Second",    // Regular text  
    line3: "Third"      // Gets gradient effect
  },
  subtitle: "Hero subtitle text",
  primaryButtonText: "Main CTA",
  secondaryButtonText: "Secondary CTA",
  trustLine: "Social proof text",
  trustedCompanies: ["Company1", "Company2", "Company3"]
}
```

#### Features Section
```javascript
features: {
  title: {
    line1: "First",
    line2: "Second", 
    line3: "Third",
    line4: "Fourth"  // Gets gradient effect
  },
  subtitle: "Features description",
  items: [
    {
      icon: '🚀',
      title: 'Feature Name',
      description: 'Feature description...'
    }
    // ... more features
  ]
}
```

#### Pricing Section
```javascript
pricing: {
  title: {
    line1: "Simple",
    line2: "Transparent", 
    line3: "Pricing"  // Gets gradient effect
  },
  subtitle: "Pricing description",
  plans: [
    {
      name: 'Plan Name',
      price: '$29',
      period: '/month',
      description: 'Plan description',
      features: ['Feature 1', 'Feature 2'],
      buttonText: 'Get Started',
      isPopular: false  // Set to true for featured plan
    }
    // ... more plans
  ]
}
```

#### Contact Section
```javascript
contact: {
  title: {
    line1: "Ready to",
    line2: "Get Started?" // Gets gradient effect
  },
  subtitle: "Contact section description",
  features: ['Free trial', 'No credit card', 'Cancel anytime'],
  primaryButtonText: "Start Trial",
  secondaryButtonText: "Contact Sales",
  contactMethods: [
    {
      icon: 'SVG_PATH_HERE',
      color: 'from-blue-500 to-purple-500',
      label: 'Email',
      value: 'hello@company.com'
    }
    // ... more contact methods
  ]
}
```

#### Theme Customization
```javascript
theme: {
  primaryGradient: "from-blue-600 to-purple-600",     // Main buttons
  secondaryGradient: "from-purple-600 to-pink-600",   // Secondary buttons
  accentGradient: "from-blue-400 via-purple-400 to-pink-400", // Text gradients
  logoGradient: "from-blue-500 to-purple-600",        // Logo background
  
  animations: {
    heroDelay: 0.3,      // Hero section animation delay
    staggerDelay: 0.2,   // General stagger delay
    featureDelay: 0.2,   // Features animation delay
    pricingDelay: 0.2    // Pricing animation delay
  }
}
```

### Color Schemes

The theme system uses Tailwind CSS gradient classes. Here are some popular combinations:

**Professional Blue:**
```javascript
primaryGradient: "from-blue-600 to-indigo-600",
secondaryGradient: "from-indigo-600 to-purple-600",
accentGradient: "from-blue-400 via-indigo-400 to-purple-400"
```

**Vibrant Purple/Pink:**
```javascript
primaryGradient: "from-purple-600 to-pink-600",
secondaryGradient: "from-pink-600 to-rose-600", 
accentGradient: "from-purple-400 via-pink-400 to-rose-400"
```

**Corporate Green:**
```javascript
primaryGradient: "from-green-600 to-emerald-600",
secondaryGradient: "from-emerald-600 to-teal-600",
accentGradient: "from-green-400 via-emerald-400 to-teal-400"
```

## Features

### ✅ What's Included

- **Complete configuration system** for easy company switching
- **Responsive design** that works on all devices  
- **Smooth Framer Motion animations** with configurable timing
- **Professional glassmorphism design** with modern aesthetics
- **Three pre-built company configurations** (OptiFlow, Capgemini, Infosys)
- **Flexible theming system** with gradient customization
- **SEO-friendly structure** with proper metadata support

### 🎨 Design Enhancements

- **Enhanced spacing and alignment** for professional appearance
- **Improved mobile responsiveness** with better breakpoints
- **Refined color schemes** with consistent gradients
- **Subtle micro-interactions** for better user experience
- **Optimized animation timing** for smooth performance
- **Professional typography** with proper hierarchy

### 🚀 Performance Optimizations

- **Framer Motion optimizations** for smooth 60fps animations
- **Responsive image handling** for faster loading
- **Efficient component structure** with minimal re-renders
- **CSS-in-JS optimizations** with Tailwind utilities

## File Structure

```
src/
├── config/
│   └── company.js          # Main configuration file
├── app/
│   └── page.js            # Landing page component
└── components/
    └── Navbar.js          # Navigation component
```

## Development Notes

- **No backend changes required** - All configurations are frontend-only
- **Maintains existing functionality** - All features work as before
- **Easy to extend** - Add new sections or modify existing ones
- **Type-safe** - Use TypeScript for better development experience (optional)

## Best Practices

1. **Test each configuration** before deploying
2. **Keep consistent branding** within each company configuration
3. **Optimize images** for different company logos/assets
4. **Validate contact information** for each company
5. **Test responsive design** on multiple devices
6. **Check accessibility** with different color schemes

## Support

For questions or customization help, refer to the main OptiFlow documentation or create an issue in the project repository.