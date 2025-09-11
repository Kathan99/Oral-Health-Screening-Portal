# Remote Health Screening Portal

This is a full-stack MERN application designed to streamline the remote health screening process. It provides a secure, role-based platform where patients can upload multiple images for review, and administrators can perform detailed diagnostic annotations and generate professional, single-page PDF reports.

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
-   **Cloud-Native Storage**: All patient images, annotations, and final reports are stored securely and permanently in an AWS S3 bucket, making the application scalable and reliable for deployment.
-   **Professional UI/UX**: A clean, professionally styled, and intuitive user interface for both patient and admin dashboards to ensure a seamless user experience.

---

## Tech Stack

| Category         | Technology                               |
| :--------------- | :--------------------------------------- |
| **Frontend** | React, React Router, Axios               |
| **Backend** | Node.js, Express.js                      |
| **Database** | MongoDB (with Mongoose)                  |
| **Auth** | JSON Web Tokens (JWT), bcrypt.js         |
| **Cloud Storage**| AWS S3                                   |
| **File Handling**| Multer                                   |
| **Annotation** | Konva.js, React-Konva                      |
| **PDF Generation**| pdf-lib                                  |

---

## Local Setup and Installation

### Prerequisites
-   Node.js & npm
-   MongoDB (A connection string from a service like MongoDB Atlas is required)
-   AWS S3 Bucket and Credentials

### 1. Clone the Repository
```bash
git clone https://github.com/Kathan99/Oral-Health-Screening-Portal.git
cd Oral-Health-Screening-Portal

# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create a .env file in the /backend directory with the following content:
# MONGO_URI="your_mongodb_connection_string"
# JWT_SECRET="your_super_secret_key_for_jwt"
# PORT=5001
# AWS_S3_BUCKET_NAME="your-s3-bucket-name"
# AWS_REGION="your-s3-bucket-region"
# AWS_ACCESS_KEY_ID="your-aws-access-key-id"
# AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"

# Create the initial admin user (one-time setup)
node createAdmin.js

# Start the backend server
npm start

# Open a NEW terminal and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the React development server
npm start