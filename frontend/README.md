# Shiplio Frontend

A simple React frontend for testing the Shiplio driver and warehouse management system.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- Backend server running on `http://localhost:3000`

### Installation

```bash
cd frontend
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🧪 Testing the Workflow

### 1. Login
Use any of the test accounts to login:

**Drivers:**
- driver1@shiplio.dev / Test@123456
- driver2@shiplio.dev / Test@123456
- driver3@shiplio.dev / Test@123456

**Warehouse Staff:**
- warehouse1@shiplio.dev / Test@123456
- warehouse2@shiplio.dev / Test@123456

**Customer:**
- customer@shiplio.dev / Test@123456

### 2. Complete Workflow Test

1. **Customer** → Login and create a new shipment
2. **Driver** → Login and see the pending shipment
3. **Driver** → Accept the shipment
4. **Driver** → Mark as picked up
5. **Warehouse** → Login and see the picked-up shipment in inbox
6. **Warehouse** → Receive the shipment
7. **Warehouse** → Start processing
8. **Warehouse** → Mark ready for dispatch

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx          # Authentication
│   │   ├── DriverDashboard.tsx    # Driver workflow
│   │   ├── WarehouseDashboard.tsx # Warehouse workflow
│   │   └── CustomerDashboard.tsx  # Customer shipment creation
│   ├── styles/
│   │   ├── login.css              # Login page styles
│   │   └── dashboard.css          # Dashboard styles
│   ├── api.ts                     # API client and endpoints
│   ├── App.tsx                    # Main app component
│   ├── App.css                    # Main app styles
│   └── main.tsx                   # Entry point
├── index.html                     # HTML template
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies
```

## 🎯 Features

### Driver Dashboard
- View available shipments to pick up
- Accept pending shipments
- View accepted shipments
- Mark shipments as picked up

### Warehouse Dashboard
- View inbox of picked-up shipments
- Receive shipments from drivers
- Start processing received shipments
- Mark shipments ready for dispatch
- View ready shipments

### Customer Dashboard
- Create new shipments with full details
- Track shipment creation

## 🔗 API Integration

The frontend communicates with the backend via REST API:

- **Base URL:** `http://localhost:3000`
- **Authentication:** JWT tokens stored in localStorage
- **Proxy:** `/api` routes are proxied to backend

## 📝 Environment

No environment variables needed for local development. The app connects to:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

## 🛠 Build for Production

```bash
npm run build
npm run preview
```

## 📦 Dependencies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **Vite** - Build tool

## 🐛 Troubleshooting

**CORS Issues:**
- Make sure backend is running on port 3000
- Check that Vite proxy config in `vite.config.ts` is correct

**Login Fails:**
- Verify backend is running
- Check DATABASE_URL is configured in backend `.env`
- Seed database with: `npm run seed` (in backend folder)

**Shipment not appearing:**
- Refresh the page
- Make sure customer created shipment first
- Check browser console for API errors

## 📚 Next Steps

To extend this frontend:
1. Add search/filter functionality for shipments
2. Add shipment history and tracking
3. Add notifications/real-time updates
4. Add admin dashboard for all users management
5. Add reporting and analytics
