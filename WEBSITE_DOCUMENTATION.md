# OnboardFlow - Employee Onboarding Platform Documentation

## 🎨 Color Theme & Design System

### Primary Colors
```css
/* Main Brand Colors */
--primary: #0f0f1a          /* Dark navy blue - main background */
--secondary: #1a1a2e        /* Slightly lighter navy */
--dark: #0a0a14            /* Deepest dark for contrast */
--accent: #8b5cf6          /* Purple accent - primary CTA */
--accent-light: #a78bfa    /* Light purple for hover states */
--accent-dark: #7c3aed     /* Dark purple for active states */

/* Status Colors */
--success: #10b981         /* Green for completed states */
--warning: #f59e0b         /* Orange/yellow for in-progress */
--danger: #ef4444          /* Red for pending/error states */

/* Extended Palette */
--purple-deep: #4c1d95     /* Deep purple for gradients */
--blue-deep: #1e3a8a       /* Deep blue for gradients */
```

### Gradient Backgrounds
```css
/* Main Background Gradient */
.gradient-bg {
  background: linear-gradient(135deg, #0a0a14, #0f0f1a, #1a1a2e, #4c1d95, #1e3a8a);
}

/* Progress Bar Gradient */
.progress-bar {
  background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 50%, #3b82f6 100%);
}

/* Glass Card Effect */
.glass-card {
  background: rgba(15, 15, 26, 0.6);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(139,92,246,0.2);
  box-shadow: 0 8px 32px rgba(139,92,246,0.1);
}
```

### Typography & Spacing
- **Font Family**: System fonts (Next.js default)
- **Primary Text**: White (#ffffff)
- **Secondary Text**: Light gray (#d1d5db)
- **Muted Text**: Gray (#9ca3af)
- **Border Radius**: 8px (standard), 12px (cards), 16px (modals)
- **Shadows**: Subtle purple-tinted shadows for depth

## 📁 Project Structure

### Root Directory
```
onboardflow-frontend/
├── .git/                    # Git repository
├── .next/                   # Next.js build output
├── components/              # Reusable UI components
├── contexts/                # React context providers
├── lib/                     # Utility functions and API calls
├── node_modules/            # Dependencies
├── pages/                   # Next.js pages (file-based routing)
├── public/                  # Static assets
├── styles/                  # Global CSS styles
├── .gitignore              # Git ignore rules
├── next-env.d.ts           # Next.js TypeScript declarations
├── next.config.js          # Next.js configuration
├── package.json            # Project dependencies and scripts
├── package-lock.json       # Locked dependency versions
├── postcss.config.js       # PostCSS configuration
├── README.md               # Project documentation
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

### Pages Structure
```
pages/
├── auth/
│   └── login.js            # Login page with Google OAuth option
├── admin/
│   ├── dashboard.js        # Admin dashboard overview
│   ├── employees.js        # Employee management
│   ├── feedback.js         # Feedback form management
│   ├── profile.js          # Admin profile settings
│   ├── resources.js        # Resource management
│   └── tasks.js            # Task management
├── 404.js                  # Custom 404 error page
├── _app.js                 # App wrapper with AuthProvider
├── _error.js               # Custom error page
├── admin-dashboard.js      # Legacy admin dashboard
├── employee-dashboard.js   # Main employee dashboard
├── feedback.js             # Employee feedback forms
├── index.js                # Home page (redirects based on role)
├── profile.js              # Employee profile settings
├── resources.js            # Employee resources view
├── security.js             # Security settings
├── settings.js             # General settings
└── tasks.js                # Employee task management
```

### Components Structure
```
components/
├── AdminProfile.js         # Admin profile component
├── Layout.js               # Main layout with sidebar navigation
├── Modal.tsx               # Reusable modal component (TypeScript)
├── ProgressBar.tsx         # Progress bar component (TypeScript)
├── ProtectedRoute.js       # Route protection wrapper
├── SidebarNav.tsx          # Admin sidebar navigation (TypeScript)
├── Table.tsx               # Reusable table component (TypeScript)
├── TaskCard.js             # Individual task card display
├── TaskModal.js            # Task detail modal with status updates
└── TaskModal.js            # Task interaction modal
```

### Library Structure
```
lib/
├── api.js                  # All API endpoint functions
├── onboardingUtils.js      # Onboarding phase calculations
└── sampleData.js           # Mock data for fallbacks
```

## 🔌 API Integration

### Base Configuration
```javascript
const API_BASE_URL = 'https://edunutshell-backend.onrender.com';
```

### Authentication APIs
```javascript
// Login
POST /api/users/login
Body: { email, password }
Response: { accessToken, user: { id, name, email, phone, role, startDate } }

// User Management
GET /api/users                    # Get all users (admin only)
GET /api/users/{userId}           # Get specific user
POST /api/users/signup            # Create new user (admin only)
```

### Task Management APIs
```javascript
// Task Operations
GET /api/tasks/{userId}           # Get user's tasks
GET /api/tasks                    # Get all tasks (admin only)
POST /api/tasks/create            # Create new task (admin only)
PATCH /api/tasks/{taskId}/status  # Update task status
```

### Resource Management APIs
```javascript
// Resource Operations
GET /api/resources                # Get all resources
POST /api/resources/upload        # Upload new resource (admin only)
DELETE /api/resources/{id}        # Delete resource (admin only)
```

### Feedback Form APIs
```javascript
// Form Operations
GET /api/forms                    # Get all forms
POST /api/forms/create            # Create new form (admin only)
POST /api/forms/{formId}/submit   # Submit form response
GET /api/forms/{formId}/responses # Get form responses (admin only)
```

### API Response Format
```javascript
// Success Response
{
  success: true,
  data: { ... }
}

// Error Response
{
  success: false,
  error: "Error message"
}
```

## 🎯 Core Functionalities

### 1. Authentication System
- **Login Flow**: Email/password authentication with JWT tokens
- **Role-based Access**: Admin and User roles with different permissions
- **Session Management**: Persistent login with localStorage
- **Auto-redirect**: Based on user role (admin → admin dashboard, user → employee dashboard)

### 2. Employee Dashboard
- **Welcome Section**: Personalized greeting with user avatar and stats
- **Progress Tracking**: Overall onboarding progress with visual indicators
- **Task Management**: View, update, and complete assigned tasks
- **Quick Stats**: Completed, in-progress, and pending task counts
- **Recent Activity**: Timeline of recent actions and updates
- **Resource Access**: Quick access to onboarding materials

### 3. Task Management System
- **Task Cards**: Visual task representation with progress bars
- **Status Updates**: Three-state progression (Pending → In Progress → Completed)
- **Task Details**: Comprehensive task information in modal view
- **Due Date Tracking**: Visual indicators for task deadlines
- **Category System**: Dynamic categorization based on onboarding phase

### 4. Admin Panel
- **Employee Management**: Create, view, and manage employee accounts
- **Task Assignment**: Create and assign tasks to specific employees
- **Resource Management**: Upload and organize onboarding resources
- **Feedback Forms**: Create custom feedback forms and view responses
- **Analytics Dashboard**: Overview of onboarding progress and statistics

### 5. Resource Management
- **File Organization**: Categorized resources with descriptions
- **Access Control**: Role-based visibility (admin, user, or both)
- **Multi-language Support**: Resources can be tagged with language
- **External Links**: Support for both file uploads and external URLs

### 6. Feedback System
- **Dynamic Forms**: Admin-created forms with multiple field types
- **Response Collection**: Secure submission and storage of feedback
- **Analytics**: Admin view of all form responses with user details
- **Field Types**: Text areas and multiple choice questions

## 🔐 Authentication & Authorization

### User Roles
```javascript
// Admin Role
- Full access to admin panel
- Employee management
- Task creation and assignment
- Resource management
- Feedback form creation
- View all analytics

// User Role (Employee)
- Personal dashboard access
- Task viewing and updates
- Resource access (based on permissions)
- Feedback form submission
- Profile management
```

### Protected Routes
```javascript
// Admin-only routes
/admin/*

// User authentication required
/employee-dashboard
/tasks
/resources
/feedback
/profile
/settings

// Public routes
/auth/login
/404
/_error
```

### Token Management
```javascript
// Storage
localStorage.setItem('authToken', token);
localStorage.setItem('userData', JSON.stringify(user));

// API Headers
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## 🎨 UI Components & Styling

### Layout System
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Sidebar Navigation**: Collapsible sidebar with active state indicators
- **Glass Morphism**: Translucent cards with backdrop blur effects
- **Gradient Backgrounds**: Multi-color gradients for visual depth

### Component Library
```javascript
// Core Components
<Layout />              // Main layout wrapper with navigation
<TaskCard />            // Individual task display card
<TaskModal />           // Task detail and interaction modal
<ProgressBar />         // Visual progress indicator
<Table />               // Data table with sorting
<Modal />               // Generic modal wrapper
<SidebarNav />          // Admin navigation sidebar
```

### Animation & Interactions
- **Hover Effects**: Scale and shadow transformations on cards
- **Loading States**: Spinner animations for async operations
- **Transitions**: Smooth color and size transitions
- **Status Indicators**: Color-coded status badges and progress bars

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First */
sm: 640px     /* Small devices */
md: 768px     /* Medium devices */
lg: 1024px    /* Large devices */
xl: 1280px    /* Extra large devices */
```

### Mobile Adaptations
- **Collapsible Sidebar**: Hidden on mobile, accessible via hamburger menu
- **Stacked Layouts**: Grid layouts become single-column on mobile
- **Touch-friendly**: Larger touch targets for mobile interactions
- **Responsive Typography**: Scalable text sizes across devices

## 🔧 Configuration Files

### Next.js Configuration
```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
}
```

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f0f1a',
        secondary: '#1a1a2e',
        // ... (full color palette)
      }
    }
  }
}
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "jsx": "preserve",
    "strict": false
  }
}
```

## 📦 Dependencies

### Core Dependencies
```json
{
  "next": "13.4.19",           // React framework
  "react": "18.2.0",           // UI library
  "react-dom": "18.2.0"        // DOM renderer
}
```

### Development Dependencies
```json
{
  "@types/node": "24.5.1",     // Node.js types
  "@types/react": "19.1.13",   // React types
  "autoprefixer": "10.4.14",   // CSS autoprefixer
  "postcss": "8.4.24",         // CSS processor
  "tailwindcss": "3.4.7",      // Utility-first CSS
  "typescript": "5.9.2"        // TypeScript compiler
}
```

## 🚀 Development Scripts

```json
{
  "dev": "next dev",           // Development server
  "build": "next build",       // Production build
  "start": "next start",       // Production server
  "lint": "next lint"          // Code linting
}
```

## 🔄 State Management

### Context Providers
```javascript
// AuthContext
- User authentication state
- Login/logout functions
- Token management
- Profile updates

// Global State
- User data persistence
- Authentication status
- Role-based permissions
```

### Local State Patterns
```javascript
// Component State
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
const [error, setError] = useState('');

// Form State
const [formData, setFormData] = useState({
  field1: '',
  field2: ''
});
```

## 🎯 Key Features Summary

### Employee Experience
1. **Personalized Dashboard** - Welcome screen with progress tracking
2. **Task Management** - Interactive task cards with status updates
3. **Resource Library** - Organized onboarding materials
4. **Feedback System** - Submit feedback through custom forms
5. **Profile Management** - Update personal information and settings

### Admin Experience
1. **Employee Management** - Create and manage employee accounts
2. **Task Assignment** - Create tasks and assign to employees
3. **Resource Management** - Upload and organize resources
4. **Form Builder** - Create custom feedback forms
5. **Analytics Dashboard** - Monitor onboarding progress

### Technical Features
1. **Responsive Design** - Works on all device sizes
2. **Real-time Updates** - Live task status updates
3. **Role-based Access** - Secure admin and user areas
4. **API Integration** - Full backend connectivity
5. **Modern UI** - Glass morphism and gradient design

This documentation provides a complete overview of the OnboardFlow platform, including all colors, structure, APIs, and functionalities needed to recreate the website.