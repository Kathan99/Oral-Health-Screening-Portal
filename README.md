Dental Health Screeing Portal is a full-stack MERN application designed to streamline the remote dental screening process. It provides a secure, role-based platform where patients can upload images of their teeth for review, and administrators can perform detailed diagnostic annotations and generate professional, single-page PDF reports.

---

## Key Features

-   **Role-Based Authentication**: Secure JWT-based authentication for two distinct user roles: `patient` and `admin`.
-   **Multi-Image Patient Submissions**: Patients can upload multiple images at once as part of a single submission, providing a comprehensive view for the administrator.
-   **Advanced Image Annotation**: A powerful, interactive tool for admins to review patient images. Key features include:
    -   **Multi-Image Workflow**: Admins can easily switch between all images in a submission.
    -   **Unified Diagnostic Legend**: Admins define a single, consistent legend (e.g., "Red = Stains") that applies across all annotated images for a clean, professional report.
    -   **Drawing Tools**: Includes tools for drawing rectangles, circles, and arrows to mark specific areas of concern.
-   **Dynamic PDF Report Generation**: One-click generation of a professional, single-page PDF report that includes:
    -   Patient and submission details.
    -   A clean, side-by-side grid layout of all annotated images.
    -   The single, unified legend explaining the color-coded annotations.
-   **Clean & Professional UI**: A redesigned, intuitive user interface for both patient and admin dashboards to ensure a seamless user experience.

---

## Tech Stack

| Category      | Technology                                    |
| :------------ | :-------------------------------------------- |
| **Frontend** | React, React Router, Axios                    |
| **Backend** | Node.js, Express.js                           |
| **Database** | MongoDB (with Mongoose)                       |
| **Auth** | JSON Web Tokens (JWT), bcrypt.js              |
| **File Handling**| Multer                                   |
| **Annotation**| Konva.js, React-Konva                         |
| **PDF Generation**| pdf-lib                                  |

---

## Local Setup and Installation

### Prerequisites
-   Node.js & npm
-   MongoDB (A connection string from a service like MongoDB Atlas is required)

# Navigate to the server directory
cd backend

# Install dependencies
npm install

# Create a .env file in the /server directory with the following content:
# MONGO_URI="your_mongodb_connection_string"
# JWT_SECRET="your_super_secret_key_for_jwt"
# PORT=5001

# Create the initial admin user (one-time setup)
node createAdmin.js

# Start the backend server
npm start

# Open a NEW terminal and navigate to the frontend directory
cd Frontend

# Install dependencies
npm install

# Start the React development server
npm start