/**
 * Deterministic Personalization - Rule-based suggestions from stored preferences.
 * No AI, only template matching based on memories.
 */

const memoryService = require('./memory.service');
const logger = require('../utils/logger');

// Template-based suggestions organized by preference type
const SUGGESTION_TEMPLATES = {
  programming_language: {
    python: {
      projects: [
        'Flask REST API',
        'Django Blog Platform',
        'Python Automation Tool',
        'FastAPI Microservice',
        'Data Analysis with Pandas',
        'Web Scraper with BeautifulSoup',
        'Discord Bot with discord.py',
        'Machine Learning Model with scikit-learn',
      ],
      learning: [
        'Master Python decorators',
        'Learn async/await patterns',
        'Explore Python design patterns',
        'Study Django ORM concepts',
        'Practice list comprehensions',
      ],
      tools: [
        'PyCharm IDE',
        'VS Code with Python extension',
        'Jupyter Notebook',
        'Poetry for dependency management',
        'pylint for code quality',
      ],
    },
    javascript: {
      projects: [
        'React Dashboard App',
        'Node.js REST API',
        'Express.js Blog Platform',
        'Real-time Chat with Socket.io',
        'Chrome Extension',
        'Next.js E-commerce Site',
        'Vue.js Todo Application',
        'TypeScript Library Package',
      ],
      learning: [
        'Master JavaScript closures',
        'Learn async/await and Promises',
        'Explore React Hooks patterns',
        'Study Node.js streams',
        'Practice functional programming',
      ],
      tools: [
        'VS Code',
        'Chrome DevTools',
        'npm/yarn package managers',
        'ESLint for code quality',
        'Webpack/Vite bundlers',
      ],
    },
    java: {
      projects: [
        'Spring Boot REST API',
        'Android Mobile App',
        'Microservices with Spring Cloud',
        'JavaFX Desktop Application',
        'Maven Multi-module Project',
        'JPA/Hibernate CRUD App',
      ],
      learning: [
        'Master Java Streams API',
        'Learn Spring Boot fundamentals',
        'Explore design patterns in Java',
        'Study JVM internals',
        'Practice multithreading',
      ],
      tools: [
        'IntelliJ IDEA',
        'Eclipse IDE',
        'Maven/Gradle build tools',
        'JUnit for testing',
        'SonarQube for code quality',
      ],
    },
    cpp: {
      projects: [
        'Game Engine with OpenGL/SDL',
        'System Monitoring Tool',
        'High-Performance Web Server',
        'Custom Memory Allocator',
        'Real-time Trading System',
        'Cross-platform GUI with Qt',
        '3D Graphics Renderer',
        'Network Protocol Implementation',
        'Operating System Kernel Module',
      ],
      learning: [
        'Master C++ STL containers',
        'Learn smart pointers and RAII',
        'Explore C++17/20 features',
        'Study template metaprogramming',
        'Practice move semantics',
        'Understand memory management',
      ],
      tools: [
        'Visual Studio',
        'CLion IDE',
        'CMake build system',
        'GDB debugger',
        'Valgrind for memory analysis',
        'Clang-format for code style',
      ],
      skills: [
        'Memory management',
        'Object-oriented programming',
        'Data structures and algorithms',
        'Multithreading and concurrency',
        'Performance optimization',
        'Low-level system programming',
      ],
    },
  },
  tech_stack: {
    mern: {
      projects: [
        'Full-stack E-commerce Platform',
        'Social Media Dashboard',
        'Task Management System',
        'Real-time Collaboration Tool',
        'Content Management System',
      ],
      learning: [
        'MongoDB aggregation pipelines',
        'Express middleware patterns',
        'React Context and Redux',
        'Node.js performance optimization',
      ],
    },
    django: {
      projects: [
        'Multi-tenant SaaS Platform',
        'RESTful API with DRF',
        'Blog with Django CMS',
        'Authentication System',
        'Admin Dashboard',
      ],
      learning: [
        'Django ORM optimization',
        'Class-based views',
        'Django REST Framework',
        'Celery for async tasks',
      ],
    },
  },
  career_goal: {
    'full-stack developer': {
      skills: [
        'Master frontend frameworks (React/Vue)',
        'Build RESTful APIs',
        'Learn database design (SQL & NoSQL)',
        'Practice DevOps basics (Docker, CI/CD)',
        'Study system design patterns',
      ],
      projects: [
        'Personal Portfolio Website',
        'Full-stack Blog Platform',
        'E-commerce Site with Payment',
        'Real-time Chat Application',
        'Task Management System',
      ],
    },
    'backend developer': {
      skills: [
        'Master API design patterns',
        'Learn database optimization',
        'Study microservices architecture',
        'Practice authentication/authorization',
        'Explore message queues (RabbitMQ, Kafka)',
      ],
      projects: [
        'RESTful API with Authentication',
        'Microservices Backend',
        'GraphQL API Server',
        'Real-time Notification Service',
        'Data Pipeline Service',
      ],
    },
    'data scientist': {
      skills: [
        'Master Python data libraries (Pandas, NumPy)',
        'Learn machine learning algorithms',
        'Study statistical analysis',
        'Practice data visualization',
        'Explore deep learning frameworks',
      ],
      projects: [
        'Predictive Model for Sales',
        'Customer Segmentation Analysis',
        'Time Series Forecasting',
        'Image Classification with CNN',
        'NLP Sentiment Analysis',
      ],
    },
  },
  interest: {
    ai: {
      projects: [
        'Chatbot with NLP',
        'Image Recognition System',
        'Recommendation Engine',
        'Sentiment Analysis Tool',
        'Text Summarization API',
      ],
      learning: [
        'Neural network fundamentals',
        'NLP with transformers',
        'Computer vision basics',
        'ML model deployment',
      ],
    },
    'web development': {
      projects: [
        'Progressive Web App (PWA)',
        'Responsive Portfolio Site',
        'Single Page Application (SPA)',
        'Headless CMS Integration',
        'Serverless Web App',
      ],
      learning: [
        'Modern CSS (Grid, Flexbox)',
        'Frontend performance optimization',
        'Web accessibility (WCAG)',
        'SEO best practices',
      ],
    },
    'mobile development': {
      projects: [
        'React Native Cross-platform App',
        'Flutter Mobile App',
        'Android Native App',
        'iOS Swift Application',
        'Mobile Game with Unity',
      ],
      learning: [
        'Mobile UI/UX principles',
        'Native vs cross-platform',
        'Push notifications',
        'Mobile app security',
      ],
    },
  },
};

/**
 * Get personalized suggestions based on user's stored memories.
 * @param {string} userId
 * @param {string} suggestionType - 'projects' | 'learning' | 'tools' | 'skills'
 * @param {string|null} inlineLanguage - language extracted directly from the user's query (highest priority)
 */
async function getSuggestions(userId, suggestionType = 'projects', inlineLanguage = null) {
  try {
    const langTemplateKeys = Object.keys(SUGGESTION_TEMPLATES.programming_language);

    // ── Priority 1: language named directly in the query ("Suggest a Python project") ──
    if (inlineLanguage) {
      const langKey = findMatchingKey(inlineLanguage, langTemplateKeys);
      if (langKey && SUGGESTION_TEMPLATES.programming_language[langKey]) {
        const suggestions =
          SUGGESTION_TEMPLATES.programming_language[langKey][suggestionType] ||
          SUGGESTION_TEMPLATES.programming_language[langKey].projects;
        return { found: true, preference: langKey, preferenceType: 'programming_language', suggestionType, suggestions };
      }
    }

    // ── Priority 2: look in stored memories ──
    const memories = await memoryService.retrieve(userId, { limit: 100 });

    if (!memories || memories.length === 0) {
      return {
        found: false,
        message:
          "I don't have any preferences stored yet.\n\nTo personalise suggestions, save your language preference:\n• \"Remember that I prefer Python\"\n• \"Remember that my preferred programming language is JavaScript\"",
      };
    }

    // Helper: scan a memory's value for a known language keyword
    function extractLangFromValue(val = '') {
      return findMatchingKey(val.toLowerCase(), langTemplateKeys);
    }

    // Look for programming language preference (broad search across all memories)
    const langMemory = memories.find((m) => {
      if (m.category?.toLowerCase() === 'programming_language') return true;
      if (m.type?.toLowerCase() === 'preference') {
        const v = (m.value || '').toLowerCase();
        // value mentions a language keyword OR common language-context words
        if (/\b(language|programming|code|prefer|favorite|favourite)\b/i.test(v)) return true;
        // value IS or contains a known language name
        if (extractLangFromValue(v)) return true;
      }
      return false;
    });

    // Look for tech stack preference
    const stackMemory = memories.find((m) =>
      m.category?.toLowerCase() === 'tech_stack' || /tech\s+stack|framework/i.test(m.value)
    );

    // Look for career goal
    const careerMemory = memories.find((m) =>
      m.category?.toLowerCase() === 'career_goal' ||
      m.category?.toLowerCase() === 'goal' ||
      /career|job|developer|engineer|scientist/i.test(m.value)
    );

    // Look for interests
    const interestMemory = memories.find((m) =>
      m.category?.toLowerCase() === 'interest' ||
      /interest|hobby|learn\s+about|exploring/i.test(m.value)
    );

    let suggestions = null;
    let preference = null;
    let prefType = null;

    // Try programming language first
    if (langMemory) {
      const langValue = (langMemory.value || '').toLowerCase().trim();
      const langKey = findMatchingKey(langValue, langTemplateKeys);
      if (langKey && SUGGESTION_TEMPLATES.programming_language[langKey]) {
        preference = langKey;
        prefType = 'programming_language';
        suggestions =
          SUGGESTION_TEMPLATES.programming_language[langKey][suggestionType] ||
          SUGGESTION_TEMPLATES.programming_language[langKey].projects;
      }
    }

    // Try career goal
    if (!suggestions && careerMemory) {
      const careerValue = (careerMemory.value || '').toLowerCase().trim();
      const careerKey = findMatchingKey(careerValue, Object.keys(SUGGESTION_TEMPLATES.career_goal));
      if (careerKey && SUGGESTION_TEMPLATES.career_goal[careerKey]) {
        preference = careerKey;
        prefType = 'career_goal';
        suggestions =
          SUGGESTION_TEMPLATES.career_goal[careerKey][suggestionType] ||
          SUGGESTION_TEMPLATES.career_goal[careerKey].projects;
      }
    }

    // Try interest
    if (!suggestions && interestMemory) {
      const interestValue = (interestMemory.value || '').toLowerCase().trim();
      const interestKey = findMatchingKey(interestValue, Object.keys(SUGGESTION_TEMPLATES.interest));
      if (interestKey && SUGGESTION_TEMPLATES.interest[interestKey]) {
        preference = interestKey;
        prefType = 'interest';
        suggestions =
          SUGGESTION_TEMPLATES.interest[interestKey][suggestionType] ||
          SUGGESTION_TEMPLATES.interest[interestKey].projects;
      }
    }

    // Try tech stack
    if (!suggestions && stackMemory) {
      const stackValue = (stackMemory.value || '').toLowerCase().trim();
      const stackKey = findMatchingKey(stackValue, Object.keys(SUGGESTION_TEMPLATES.tech_stack));
      if (stackKey && SUGGESTION_TEMPLATES.tech_stack[stackKey]) {
        preference = stackKey;
        prefType = 'tech_stack';
        suggestions =
          SUGGESTION_TEMPLATES.tech_stack[stackKey][suggestionType] ||
          SUGGESTION_TEMPLATES.tech_stack[stackKey].projects;
      }
    }

    if (suggestions && suggestions.length > 0) {
      return { found: true, preference, preferenceType: prefType, suggestionType, suggestions };
    }

    return {
      found: false,
      message:
        "I found your stored preferences but they don't match any of my templates yet.\n\nTry saving one of these:\n• \"Remember that I prefer Python\"\n• \"Remember that I prefer JavaScript\"\n• \"Remember I'm interested in AI\"\n• \"Remember my career goal is full-stack developer\"",
    };
  } catch (err) {
    logger.error('Suggestions service error:', err);
    return { found: false, message: 'Could not retrieve suggestions.', error: err.message };
  }
}

/**
 * Find matching key in templates (fuzzy match)
 */
function findMatchingKey(value, keys) {
  const normalized = value.toLowerCase().trim();
  // Exact match first
  const exact = keys.find((k) => k.toLowerCase() === normalized);
  if (exact) return exact;
  
  // Partial match
  const partial = keys.find((k) => normalized.includes(k.toLowerCase()) || k.toLowerCase().includes(normalized));
  if (partial) return partial;
  
  // Alias matching
  const aliases = {
    js: 'javascript',
    py: 'python',
    'c++': 'cpp',
    'c plus plus': 'cpp',
    'node.js': 'javascript',
    react: 'javascript',
    vue: 'javascript',
    django: 'python',
    flask: 'python',
    'full stack': 'full-stack developer',
    backend: 'backend developer',
    frontend: 'full-stack developer',
    ml: 'data scientist',
    'machine learning': 'data scientist',
    'data science': 'data scientist',
    'artificial intelligence': 'ai',
    web: 'web development',
    mobile: 'mobile development',
  };
  
  const aliasKey = aliases[normalized];
  if (aliasKey) {
    return keys.find((k) => k.toLowerCase() === aliasKey.toLowerCase());
  }
  
  return null;
}

module.exports = {
  getSuggestions,
};
