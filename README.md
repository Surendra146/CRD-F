# Multi-Tenant Business Dashboard & CRM

A production-ready full-stack web application for multi-tenant business analytics and CRM system with Excel data integration.

## Tech Stack

### Backend
- **Node.js** with **Express.js**
- **MongoDB** with Mongoose
- **JWT Authentication** (access + refresh tokens)
- **bcryptjs** for password hashing
- **multer** for file uploads
- **xlsx** for Excel parsing
- **express-rate-limit** for API protection

### Frontend
- **React 19** with Hooks
- **React Router** v7 for routing
- **Tailwind CSS** for styling
- **Shadcn/UI** components
- **Recharts** for data visualization
- **@phosphor-icons/react** for icons
- **react-dropzone** for file uploads
- **xlsx** for Excel processing
- **axios** for API calls

## Features

### 1. Authentication & Authorization
- User registration and login
- JWT-based authentication with httpOnly cookies
- Role-based access control (Admin, Manager, Viewer)
- Refresh token rotation
- Password reset functionality
- Brute force protection

### 2. Multi-Tenant Support
- Tenant isolation at database level
- Separate data for each organization
- User belongs to specific tenant

### 3. Dashboard Creation Flow
- Create custom dashboards
- Configure multiple Excel sources per dashboard
- Name and describe each data source

### 4. Excel Upload & Processing
- Drag-and-drop file upload
- Support for .xlsx and .xls files
- Automatic header detection
- Column mapping interface
- Map Excel columns to: date, store, category, amount
- Data validation and processing

### 5. Analytics & Visualization
- Dynamic filtering (date range, store, category)
- Multiple chart types (Line, Bar, Pie)
- Real-time data aggregation
- Group by date, store, or category
- Revenue metrics and transaction counts
- Interactive dashboards

### 6. Design System
- Swiss & High-Contrast design archetype
- Monochrome color palette with accent colors
- Sharp edges and flat design
- Dense, information-rich layouts
- IBM Plex Sans typography
- Responsive design

## Default Credentials

**Admin Account:**
- Email: `admin@crm.com`
- Password: `Admin@123`
- Role: admin

## User Roles & Permissions

### Admin
- Full access to all features
- Create, update, delete dashboards
- Upload and map Excel files
- Manage users (future feature)

### Manager
- Create, update, delete dashboards
- Upload and map Excel files
- View analytics

### Viewer
- View dashboards only
- View analytics
- No create/edit/delete permissions

## Workflow

1. **Register/Login** - Create account or login with credentials
2. **Create Dashboard** - Define dashboard name, description, and number of Excel sources
3. **Upload Excel Files** - Drag-and-drop Excel files for each source
4. **Map Columns** - Map Excel columns to dashboard fields (date, amount, store, category)
5. **View Analytics** - Filter and visualize data with multiple chart types

## Security Features

- Password hashing with bcrypt
- JWT authentication with httpOnly cookies
- Refresh token rotation
- Rate limiting on API endpoints
- Brute force protection (5 attempts = 15 min lockout)
- Helmet.js security headers
- CORS configuration
- Input validation with express-validator
- MongoDB injection protection

## License

MIT

## Author

Built with Emergent AI
