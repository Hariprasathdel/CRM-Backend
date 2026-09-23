const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const AttendanceReportRoutes = require('./attendanceReportRoutes');
const leaveRoutes = require('./leaveRoutes');
const awardRoutes = require('./awardRoutes');
const departmentRoutes = require('./departmentRoutes');
const loanRoutes = require('./loanRoutes');
const projectRoutes = require('./projectRoutes');
const recruitmentRoutes = require('./recruitmentRoutes');
const reportRoutes = require('./reportRoutes');
const payslipRoutes = require('./payslipRoutes');
const contactRoutes = require('./contactRoutes');
const activityRoutes = require('./activityRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// API Routes
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/attendance-reports', AttendanceReportRoutes);
router.use('/leaves', leaveRoutes);
router.use('/awards', awardRoutes);
router.use('/rewards', awardRoutes);
router.use('/departments', departmentRoutes);
router.use('/loans', loanRoutes);
router.use('/projects', projectRoutes);
router.use('/recruitments', recruitmentRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/reports', reportRoutes);
router.use('/payslips', payslipRoutes);
router.use('/contacts', contactRoutes);
router.use('/activities', activityRoutes);
router.use('/dashboard', dashboardRoutes);

// Health check route
router.get('/health', (req, res) => {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    res.json({
        success: true,
        status: dbState === 1 ? 'healthy' : 'degraded',
        message: 'Server is running',
        database: {
            status: dbStatusMap[dbState] || 'unknown',
            readyState: dbState,
            host: mongoose.connection.host || null,
            name: mongoose.connection.name || null
        },
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API documentation route
router.get('/docs', (req, res) => {
    res.json({
        success: true,
        message: 'API Documentation',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            employees: '/api/employees',
            attendance: '/api/attendance',
            attendanceReports: '/api/attendance-reports',
            leaves: '/api/leaves',
            awards: '/api/awards',
            departments: '/api/departments',
            loans: '/api/loans',
            projects: '/api/projects',
            recruitments: '/api/recruitments',
            reports: '/api/reports',
            payslips: '/api/payslips',
            contacts: '/api/contacts',
            activities: '/api/activities',
            dashboard: '/api/dashboard'
        }
    });
});

module.exports = router;
