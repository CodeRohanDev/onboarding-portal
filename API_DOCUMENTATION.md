# OnboardFlow API Documentation

## 📋 Table of Contents
- [Base Configuration](#base-configuration)
- [Authentication](#authentication)
- [User Management](#user-management)
- [Task Management](#task-management)
- [Resource Management](#resource-management)
- [Feedback Forms](#feedback-forms)
- [Error Handling](#error-handling)
- [Response Formats](#response-formats)

## 🔧 Base Configuration

### API Base URL
```
https://edunutshell-backend.onrender.com
```

### Common Headers
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"  // Required for protected endpoints
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔐 Authentication

### 1. User Login
**Endpoint:** `POST /api/users/login`

**Description:** Authenticate user and receive JWT token

**Headers:**
```javascript
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```javascript
{
  "email": "string",     // Required - User's email address
  "password": "string"   // Required - User's password
}
```

**Example Request:**
```javascript
POST https://edunutshell-backend.onrender.com/api/users/login
Content-Type: application/json

{
  "email": "john.doe@company.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```javascript
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "phone": "9876543210",
    "role": "user",                    // "admin" or "user"
    "startDate": "2024-01-15T00:00:00.000Z",
    "status": "active"
  }
}
```

**Error Response (401):**
```javascript
{
  "message": "Invalid email or password"
}
```

---

## 👥 User Management

### 1. Get All Users
**Endpoint:** `GET /api/users`

**Description:** Retrieve all users (Admin only)

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Query Parameters:**
```javascript
// Optional filters
?role=user          // Filter by role: "admin" or "user"
?status=active      // Filter by status: "active", "inactive", "pending"
?limit=10           // Limit number of results
?page=1             // Page number for pagination
```

**Example Request:**
```javascript
GET https://edunutshell-backend.onrender.com/api/users?role=user&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```javascript
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "phone": "9876543210",
    "role": "user",
    "startDate": "2024-01-15T00:00:00.000Z",
    "status": "active",
    "createdAt": "2024-01-10T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:20:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "phone": "9876543211",
    "role": "user",
    "startDate": "2024-02-01T00:00:00.000Z",
    "status": "pending",
    "createdAt": "2024-01-25T09:15:00.000Z",
    "updatedAt": "2024-01-25T09:15:00.000Z"
  }
]
```

### 2. Get User by ID
**Endpoint:** `GET /api/users/{userId}`

**Description:** Retrieve specific user details

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Path Parameters:**
```javascript
userId: string  // Required - MongoDB ObjectId of the user
```

**Example Request:**
```javascript
GET https://edunutshell-backend.onrender.com/api/users/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```javascript
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "phone": "9876543210",
  "role": "user",
  "startDate": "2024-01-15T00:00:00.000Z",
  "status": "active",
  "createdAt": "2024-01-10T10:30:00.000Z",
  "updatedAt": "2024-01-15T14:20:00.000Z"
}
```

### 3. Create New User
**Endpoint:** `POST /api/users/signup`

**Description:** Create a new user account (Admin only)

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request Body:**
```javascript
{
  "name": "string",        // Required - Full name
  "email": "string",       // Required - Email address (must be unique)
  "password": "string",    // Required - Password (min 8 characters)
  "phone": "string",       // Required - Phone number
  "role": "string",        // Required - "admin" or "user"
  "startDate": "string"    // Required - ISO date string
}
```

**Example Request:**
```javascript
POST https://edunutshell-backend.onrender.com/api/users/signup
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice.johnson@company.com",
  "password": "SecurePass123!",
  "phone": "9876543212",
  "role": "user",
  "startDate": "2024-03-01T00:00:00.000Z"
}
```

**Success Response (201):**
```javascript
{
  "message": "User created successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Alice Johnson",
    "email": "alice.johnson@company.com",
    "phone": "9876543212",
    "role": "user",
    "startDate": "2024-03-01T00:00:00.000Z",
    "status": "pending",
    "createdAt": "2024-02-20T11:45:00.000Z",
    "updatedAt": "2024-02-20T11:45:00.000Z"
  }
}
```

---

## ✅ Task Management

### 1. Get User Tasks
**Endpoint:** `GET /api/tasks/{userId}`

**Description:** Retrieve all tasks assigned to a specific user

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Path Parameters:**
```javascript
userId: string  // Required - MongoDB ObjectId of the user
```

**Query Parameters:**
```javascript
?status=pending     // Filter by status: "pending", "in-progress", "completed"
?type=onboarding    // Filter by task type
?limit=10           // Limit number of results
?sort=dueDate       // Sort by: "dueDate", "createdAt", "title"
```

**Example Request:**
```javascript
GET https://edunutshell-backend.onrender.com/api/tasks/507f1f77bcf86cd799439011?status=pending
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```javascript
[
  {
    "_id": "507f1f77bcf86cd799439021",
    "title": "Complete IT Setup",
    "description": "Set up laptop, accounts, and access cards for new employee onboarding",
    "assignedTo": "507f1f77bcf86cd799439011",
    "status": "pending",
    "type": "onboarding",
    "dueDate": "2024-01-20T18:30:00.000Z",
    "createdBy": "507f1f77bcf86cd799439001",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T09:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439022",
    "title": "Submit Required Documents",
    "description": "Upload all required onboarding documents including ID, tax forms, and emergency contacts",
    "assignedTo": "507f1f77bcf86cd799439011",
    "status": "in-progress",
    "type": "documentation",
    "dueDate": "2024-01-25T17:00:00.000Z",
    "createdBy": "507f1f77bcf86cd799439001",
    "createdAt": "2024-01-15T09:15:00.000Z",
    "updatedAt": "2024-01-18T14:30:00.000Z"
  }
]
```

### 2. Get All Tasks
**Endpoint:** `GET /api/tasks`

**Description:** Retrieve all tasks in the system (Admin only)

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Query Parameters:**
```javascript
?assignedTo=userId  // Filter by assigned user ID
?status=pending     // Filter by status
?type=onboarding    // Filter by task type
?limit=50           // Limit number of results
?page=1             // Page number for pagination
?sort=createdAt     // Sort by field
```

**Example Request:**
```javascript
GET https://edunutshell-backend.onrender.com/api/tasks?status=pending&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```javascript
[
  {
    "_id": "507f1f77bcf86cd799439021",
    "title": "Complete IT Setup",
    "description": "Set up laptop, accounts, and access cards",
    "assignedTo": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@company.com"
    },
    "status": "pending",
    "type": "onboarding",
    "dueDate": "2024-01-20T18:30:00.000Z",
    "createdBy": "507f1f77bcf86cd799439001",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T09:00:00.000Z"
  }
]
```

### 3. Create New Task
**Endpoint:** `POST /api/tasks/create`

**Description:** Create a new task and assign to user (Admin only)

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request Body:**
```javascript
{
  "title": "string",        // Required - Task title
  "description": "string",  // Required - Task description
  "assignedTo": "string",   // Required - User ID to assign task to
  "status": "string",       // Optional - Default: "pending"
  "type": "string",         // Optional - Task category
  "dueDate": "string"       // Required - ISO date string
}
```

**Example Request:**
```javascript
POST https://edunutshell-backend.onrender.com/api/tasks/create
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Complete Project Report",
  "description": "Prepare and submit the final project report before deadline",
  "assignedTo": "507f1f77bcf86cd799439011",
  "status": "pending",
  "type": "project",
  "dueDate": "2024-02-15T17:00:00.000Z"
}
```

**Success Response (201):**
```javascript
{
  "message": "Task created successfully",
  "task": {
    "_id": "507f1f77bcf86cd799439023",
    "title": "Complete Project Report",
    "description": "Prepare and submit the final project report before deadline",
    "assignedTo": "507f1f77bcf86cd799439011",
    "status": "pending",
    "type": "project",
    "dueDate": "2024-02-15T17:00:00.000Z",
    "createdBy": "507f1f77bcf86cd799439001",
    "createdAt": "2024-02-01T10:30:00.000Z",
    "updatedAt": "2024-02-01T10:30:00.000Z"
  }
}
```

### 4. Update Task Status
**Endpoint:** `PATCH /api/tasks/{taskId}/status`

**Description:** Update the status of a specific task

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Path Parameters:**
```javascript
taskId: string  // Required - MongoDB ObjectId of the task
```

**Request Body:**
```javascript
{
  "status": "string"  // Required - New status: "pending", "in-progress", "completed"
}
```

**Example Request:**
```javascript
PATCH https://edunutshell-backend.onrender.com/api/tasks/507f1f77bcf86cd799439021/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "completed"
}
```

**Success Response (200):**
```javascript
{
  "message": "Task status updated successfully",
  "task": {
    "_id": "507f1f77bcf86cd799439021",
    "title": "Complete IT Setup",
    "description": "Set up laptop, accounts, and access cards",
    "assignedTo": "507f1f77bcf86cd799439011",
    "status": "completed",
    "type": "onboarding",
    "dueDate": "2024-01-20T18:30:00.000Z",
    "createdBy": "507f1f77bcf86cd799439001",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-19T16:45:00.000Z"
  }
}
```

---

## 📚 Resource Management

### 1. Get All Resources
**Endpoint:** `GET /api/resources`

**Description:** Retrieve all available resources

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Query Parameters:**
```javascript
?language=en        // Filter by language code
?visibleTo=user     // Filter by visibility: "user", "admin"
?limit=20           // Limit number of results
?sort=createdAt     // Sort by field
```

**Example Request:**
```javascript
GET https://edunutshell-backend.onrender.com/api/resources?language=en&visibleTo=user
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```javascript
[
  {
    "_id": "507f1f77bcf86cd799439031",
    "title": "Employee Handbook",
    "description": "Complete guide to company policies, procedures, and culture",
    "fileUrl": "https://example.com/resources/employee-handbook.pdf",
    "createdBy": "507f1f77bcf86cd799439001",
    "visibleTo": ["admin", "user"],
    "language": "en",
    "createdAt": "2025-09-12T14:52:16.132Z",
    "updatedAt": "2025-09-12T14:52:16.132Z"
  },
  {
    "_id": "507f1f77bcf86cd799439032",
    "title": "Benefits Overview",
    "description": "Health insurance, retirement plans, PTO, and other benefits information",
    "fileUrl": "https://example.com/resources/benefits-guide.pdf",
    "createdBy": "507f1f77bcf86cd799439001",
    "visibleTo": ["admin", "user"],
    "language": "en",
    "createdAt": "2025-09-12T14:59:10.701Z",
    "updatedAt": "2025-09-12T14:59:10.701Z"
  }
]
```

### 2. Upload New Resource
**Endpoint:** `POST /api/resources/upload`

**Description:** Upload a new resource (Admin only)

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request Body:**
```javascript
{
  "title": "string",        // Required - Resource title
  "description": "string",  // Required - Resource description
  "fileUrl": "string",      // Required - URL to the resource file
  "visibleTo": ["string"],  // Required - Array of roles: ["user"], ["admin"], ["user", "admin"]
  "language": "string"      // Optional - Language code (default: "en")
}
```

**Example Request:**
```javascript
POST https://edunutshell-backend.onrender.com/api/resources/upload
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "IT Security Guidelines",
  "description": "Security protocols and best practices for all employees",
  "fileUrl": "https://example.com/resources/security-guidelines.pdf",
  "visibleTo": ["user", "admin"],
  "language": "en"
}
```

**Success Response (201):**
```javascript
{
  "message": "Resource uploaded successfully",
  "resource": {
    "_id": "507f1f77bcf86cd799439033",
    "title": "IT Security Guidelines",
    "description": "Security protocols and best practices for all employees",
    "fileUrl": "https://example.com/resources/security-guidelines.pdf",
    "createdBy": "507f1f77bcf86cd799439001",
    "visibleTo": ["user", "admin"],
    "language": "en",
    "createdAt": "2024-02-01T11:30:00.000Z",
    "updatedAt": "2024-02-01T11:30:00.000Z"
  }
}
```

### 3. Delete Resource
**Endpoint:** `DELETE /api/resources/{resourceId}`

**Description:** Delete a specific resource (Admin only)

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Path Parameters:**
```javascript
resourceId: string  // Required - MongoDB ObjectId of the resource
```

**Example Request:**
```javascript
DELETE https://edunutshell-backend.onrender.com/api/resources/507f1f77bcf86cd799439033
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```javascript
{
  "message": "Resource deleted successfully"
}
```

---

## 📝 Feedback Forms

### 1. Get All Forms
**Endpoint:** `GET /api/forms`

**Description:** Retrieve all feedback forms

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Query Parameters:**
```javascript
?assignedTo=user    // Filter by assigned role: "user", "admin", "both"
?active=true        // Filter by active status
?limit=10           // Limit number of results
```

**Example Request:**
```javascript
GET https://edunutshell-backend.onrender.com/api/forms?assignedTo=user
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```javascript
{
  "forms": [
    {
      "_id": "507f1f77bcf86cd799439041",
      "title": "Weekly Feedback Form",
      "description": "Weekly check-in for new employees during onboarding",
      "assignedTo": "user",
      "fields": [
        {
          "_id": "507f1f77bcf86cd799439042",
          "label": "How was your week?",
          "type": "text",
          "required": true
        },
        {
          "_id": "507f1f77bcf86cd799439043",
          "label": "Rate your overall experience",
          "type": "radio",
          "options": ["Excellent", "Good", "Average", "Poor"],
          "required": true
        }
      ],
      "createdBy": "507f1f77bcf86cd799439001",
      "createdAt": "2024-01-10T09:00:00.000Z",
      "updatedAt": "2024-01-10T09:00:00.000Z"
    }
  ]
}
```

### 2. Create New Form
**Endpoint:** `POST /api/forms/create`

**Description:** Create a new feedback form (Admin only)

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request Body:**
```javascript
{
  "title": "string",        // Required - Form title
  "description": "string",  // Required - Form description
  "assignedTo": "string",   // Required - "user", "admin", or "both"
  "fields": [               // Required - Array of form fields
    {
      "label": "string",    // Required - Field label/question
      "type": "string",     // Required - "text" or "radio"
      "options": ["string"], // Required for radio type - Array of options
      "required": boolean   // Optional - Default: true
    }
  ]
}
```

**Example Request:**
```javascript
POST https://edunutshell-backend.onrender.com/api/forms/create
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Onboarding Feedback",
  "description": "Feedback form for new employee onboarding experience",
  "assignedTo": "user",
  "fields": [
    {
      "label": "How would you rate your onboarding experience?",
      "type": "radio",
      "options": ["Excellent", "Good", "Average", "Poor"],
      "required": true
    },
    {
      "label": "What could we improve in the onboarding process?",
      "type": "text",
      "required": false
    }
  ]
}
```

**Success Response (201):**
```javascript
{
  "message": "Form created successfully",
  "form": {
    "_id": "507f1f77bcf86cd799439044",
    "title": "Onboarding Feedback",
    "description": "Feedback form for new employee onboarding experience",
    "assignedTo": "user",
    "fields": [
      {
        "_id": "507f1f77bcf86cd799439045",
        "label": "How would you rate your onboarding experience?",
        "type": "radio",
        "options": ["Excellent", "Good", "Average", "Poor"],
        "required": true
      },
      {
        "_id": "507f1f77bcf86cd799439046",
        "label": "What could we improve in the onboarding process?",
        "type": "text",
        "required": false
      }
    ],
    "createdBy": "507f1f77bcf86cd799439001",
    "createdAt": "2024-02-01T14:20:00.000Z",
    "updatedAt": "2024-02-01T14:20:00.000Z"
  }
}
```

### 3. Submit Form Response
**Endpoint:** `POST /api/forms/{formId}/submit`

**Description:** Submit a response to a feedback form

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Path Parameters:**
```javascript
formId: string  // Required - MongoDB ObjectId of the form
```

**Request Body:**
```javascript
{
  "answers": [              // Required - Array of answers
    {
      "fieldId": "string",  // Required - Field ID from the form
      "answer": "string"    // Required - User's answer
    }
  ]
}
```

**Example Request:**
```javascript
POST https://edunutshell-backend.onrender.com/api/forms/507f1f77bcf86cd799439044/submit
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "answers": [
    {
      "fieldId": "507f1f77bcf86cd799439045",
      "answer": "Excellent"
    },
    {
      "fieldId": "507f1f77bcf86cd799439046",
      "answer": "The onboarding process was very smooth. Maybe add more interactive sessions."
    }
  ]
}
```

**Success Response (201):**
```javascript
{
  "message": "Form response submitted successfully",
  "response": {
    "_id": "507f1f77bcf86cd799439047",
    "formId": "507f1f77bcf86cd799439044",
    "userId": "507f1f77bcf86cd799439011",
    "answers": [
      {
        "fieldId": "507f1f77bcf86cd799439045",
        "question": "How would you rate your onboarding experience?",
        "answer": "Excellent"
      },
      {
        "fieldId": "507f1f77bcf86cd799439046",
        "question": "What could we improve in the onboarding process?",
        "answer": "The onboarding process was very smooth. Maybe add more interactive sessions."
      }
    ],
    "submittedAt": "2024-02-05T10:15:00.000Z"
  }
}
```

### 4. Get Form Responses
**Endpoint:** `GET /api/forms/{formId}/responses`

**Description:** Get all responses for a specific form (Admin only)

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Path Parameters:**
```javascript
formId: string  // Required - MongoDB ObjectId of the form
```

**Query Parameters:**
```javascript
?userId=string  // Filter by specific user
?limit=20       // Limit number of results
?sort=submittedAt // Sort by field
```

**Example Request:**
```javascript
GET https://edunutshell-backend.onrender.com/api/forms/507f1f77bcf86cd799439044/responses
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```javascript
{
  "responses": [
    {
      "_id": "507f1f77bcf86cd799439047",
      "formId": "507f1f77bcf86cd799439044",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john.doe@company.com"
      },
      "answers": [
        {
          "fieldId": "507f1f77bcf86cd799439045",
          "question": "How would you rate your onboarding experience?",
          "answer": "Excellent"
        },
        {
          "fieldId": "507f1f77bcf86cd799439046",
          "question": "What could we improve in the onboarding process?",
          "answer": "The onboarding process was very smooth. Maybe add more interactive sessions."
        }
      ],
      "submittedAt": "2024-02-05T10:15:00.000Z"
    }
  ]
}
```

---

## ❌ Error Handling

### Common Error Responses

**400 Bad Request:**
```javascript
{
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

**401 Unauthorized:**
```javascript
{
  "message": "Access token is missing or invalid"
}
```

**403 Forbidden:**
```javascript
{
  "message": "Insufficient permissions to access this resource"
}
```

**404 Not Found:**
```javascript
{
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```javascript
{
  "message": "Internal server error",
  "error": "Detailed error message for debugging"
}
```

---

## 📋 Response Formats

### Success Response Structure
```javascript
// For single resource
{
  "message": "Operation successful",  // Optional success message
  "data": { ... }                    // Resource data
}

// For collections
{
  "data": [ ... ],                   // Array of resources
  "pagination": {                    // Optional pagination info
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Error Response Structure
```javascript
{
  "message": "Error description",    // Human-readable error message
  "error": "Technical error",       // Optional technical details
  "errors": [ ... ]                 // Optional validation errors array
}
```

### Data Types
- **ObjectId**: MongoDB ObjectId (24-character hex string)
- **ISO Date**: ISO 8601 date string (e.g., "2024-01-15T10:30:00.000Z")
- **JWT Token**: JSON Web Token string
- **Email**: Valid email address format
- **Phone**: Phone number string (format may vary)
- **URL**: Valid HTTP/HTTPS URL string

---

## 🔐 Authentication Flow

### 1. Login Process
```javascript
// Step 1: Login request
POST /api/users/login
{
  "email": "user@company.com",
  "password": "password123"
}

// Step 2: Receive token
Response: {
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}

// Step 3: Store token and use in subsequent requests
localStorage.setItem('authToken', response.accessToken);

// Step 4: Include token in API calls
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Token Usage
```javascript
// Include in all protected API calls
const token = localStorage.getItem('authToken');

fetch('https://edunutshell-backend.onrender.com/api/tasks/userId', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 📊 Rate Limiting & Best Practices

### Rate Limits
- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **File upload endpoints**: 10 requests per minute per user

### Best Practices
1. **Always include proper headers** with Content-Type and Authorization
2. **Handle errors gracefully** with proper error checking
3. **Use appropriate HTTP methods** (GET, POST, PATCH, DELETE)
4. **Validate data** before sending requests
5. **Store tokens securely** and refresh when needed
6. **Implement retry logic** for network failures
7. **Use pagination** for large data sets

### Example Implementation
```javascript
// API utility function
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'Request failed' };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// Usage example
const result = await apiCall('/api/tasks/userId', {
  method: 'GET'
});

if (result.success) {
  console.log('Tasks:', result.data);
} else {
  console.error('Error:', result.error);
}
```

This comprehensive API documentation covers all endpoints with complete request/response examples, headers, parameters, and error handling patterns used in the OnboardFlow application.