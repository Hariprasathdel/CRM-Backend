const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'));

// ==================== ROUTES ====================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/awards', require('./routes/awardRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/loans', require('./routes/loanRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/recruitments', require('./routes/recruitmentRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/employee-reports', require('./routes/employeeReportRoutes')); 
app.use('/api/payslips', require('./routes/payslipRoutes'));
app.use('api/attendance-reports', require('./routes/attendanceReportRoutes'));
app.use('api/dashboard', require('./routes/dashboardRoutes'));

// Test route
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API is working!' });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'CRM Employee Dashboard API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            employees: '/api/employees',
            attendance: '/api/attendance',
            leaves: '/api/leaves',
            awards: '/api/awards',
            departments: '/api/departments',
            loans: '/api/loans',
            projects: '/api/projects',
            recruitments: '/api/recruitments',
            reports: '/api/reports',
            employeeReports: '/api/employee-reports',
            attendanceReports: '/api/attendance-reports',
            payslips: '/api/payslips',
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
});