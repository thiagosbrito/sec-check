/**
 * Animation utilities for smooth, professional transitions
 * Designed to eliminate snapping and provide subtle, fluid motion
 */

// Smooth easing curves - no harsh endings
export const easings = {
  // For gentle, natural feeling animations
  easeOut: [0.25, 0.1, 0.25, 1],
  // For smooth fade ins/outs
  easeInOut: [0.4, 0, 0.2, 1],
  // For bouncy but controlled animations
  easeOutBack: [0.34, 1.56, 0.64, 1],
  // For very subtle spring effect
  gentleSpring: [0.25, 0.46, 0.45, 0.94],
} as const;

// Smooth spring configurations - higher damping, lower stiffness
export const springs = {
  // Very gentle spring - almost no bounce
  gentle: {
    type: "spring" as const,
    stiffness: 120,
    damping: 25,
    mass: 1,
  },
  // Subtle spring with slight bounce
  subtle: {
    type: "spring" as const,
    stiffness: 150,
    damping: 20,
    mass: 1,
  },
  // Smooth spring for hover effects
  smooth: {
    type: "spring" as const,
    stiffness: 200,
    damping: 18,
    mass: 0.8,
  },
  // For very quick but smooth responses
  snappy: {
    type: "spring" as const,
    stiffness: 300,
    damping: 25,
    mass: 0.6,
  },
} as const;

// Duration-based transitions with smooth easing
export const durations = {
  // For very quick transitions
  fast: {
    duration: 0.2,
    ease: easings.easeOut,
  },
  // Standard transition duration
  normal: {
    duration: 0.3,
    ease: easings.easeOut,
  },
  // For more deliberate animations
  slow: {
    duration: 0.5,
    ease: easings.easeInOut,
  },
  // For page/section transitions
  page: {
    duration: 0.6,
    ease: easings.easeInOut,
  },
} as const;

// Pre-configured animation variants for common use cases
export const variants = {
  // Fade in/out with smooth scaling
  fadeScale: {
    hidden: {
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        ...durations.normal,
        scale: springs.gentle,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: durations.fast,
    },
  },

  // Slide up with fade
  slideUp: {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        opacity: durations.normal,
        y: springs.gentle,
      },
    },
  },

  // Gentle slide from left
  slideLeft: {
    hidden: {
      opacity: 0,
      x: -20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        opacity: durations.normal,
        x: springs.gentle,
      },
    },
  },

  // Container for staggered children
  staggerContainer: {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: easings.easeOut,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  },

  // Subtle hover scale - no snapping
  hoverScale: {
    scale: 1.02,
    transition: springs.gentle,
  },

  // Gentle rotate for icons
  hoverRotate: {
    rotate: 5,
    transition: springs.smooth,
  },

  // Smooth button press
  buttonPress: {
    scale: 0.98,
    transition: springs.snappy,
  },

  // Card hover effect - very subtle
  cardHover: {
    y: -2,
    scale: 1.01,
    transition: springs.gentle,
  },

  // Mobile menu slide
  mobileMenu: {
    hidden: {
      height: 0,
      opacity: 0,
    },
    visible: {
      height: "auto",
      opacity: 1,
      transition: {
        height: springs.gentle,
        opacity: durations.normal,
      },
    },
  },

  // Progress bar animation
  progress: {
    initial: { scaleX: 0 },
    animate: { scaleX: 1 },
    transition: {
      duration: 0.8,
      ease: easings.easeOut,
    },
  },
} as const;

// Hover animations for interactive elements
export const hoverAnimations = {
  // Gentle lift for cards
  gentleLift: {
    y: -3,
    scale: 1.01,
    transition: springs.gentle,
  },

  // Subtle glow effect (for buttons)
  glow: {
    boxShadow: "0 0 20px rgba(147, 51, 234, 0.3)",
    transition: durations.normal,
  },

  // Icon rotation
  iconSpin: {
    rotate: 360,
    transition: {
      duration: 0.6,
      ease: easings.easeInOut,
    },
  },

  // Text color change
  textGlow: {
    textShadow: "0 0 8px rgba(147, 51, 234, 0.6)",
    transition: durations.normal,
  },
} as const;

// Page transition variants
export const pageTransitions = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: easings.easeInOut,
    },
  },
} as const;

// Dashboard-specific animations (more subtle)
export const dashboardAnimations = {
  // Very subtle fade in for dashboard elements
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: easings.easeOut,
      },
    },
  },

  // Minimal slide for dashboard cards
  slideIn: {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: easings.easeOut,
      },
    },
  },

  // Dashboard container stagger
  stagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  },

  // Gentle hover for dashboard interactive elements
  hover: {
    scale: 1.005,
    transition: springs.gentle,
  },

  // Progress animations for scans
  scanProgress: {
    hidden: { width: 0 },
    visible: {
      width: "100%",
      transition: {
        duration: 1.2,
        ease: easings.easeOut,
      },
    },
  },
} as const;
