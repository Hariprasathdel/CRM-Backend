require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

const User = require('../models/User');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Project = require('../models/Project');
const Award = require('../models/Award');
const Loan = require('../models/Loan');
const Payslip = require('../models/Payslip');
const Recruitment = require('../models/Recruitment');
const Report = require('../models/Report');
const AttendanceReport = require('../models/AttendanceReport');
const AwardReport = require('../models/AwardReport');

const seedData = async () => {
    try {
        console.log('🌱 Connecting to database to seed complete dataset...');
        await connectDB();

        // 1. Seed or update Admin User
        console.log('👤 Seeding Admin User...');
        let adminUser = await User.findOne({ email: 'admin@crm.com' });
        if (!adminUser) {
            adminUser = await User.create({
                name: 'CRM Administrator',
                email: 'admin@crm.com',
                password: 'password123',
                role: 'admin',
                status: 'active'
            });
            console.log('   ✅ Created admin user: admin@crm.com / password123');
        } else {
            console.log('   ℹ️ Admin user already exists');
        }

        // 2. Seed Departments
        console.log('🏢 Seeding Departments...');
        const departmentsData = [
            {
                name: 'Software Development',
                code: 'SWD',
                description: 'Full stack web, mobile, and cloud software development team',
                head: 'John Doe',
                employeeCount: 4,
                budget: 350000,
                location: 'Floor 3, Tech Wing',
                status: 'active'
            },
            {
                name: 'Marketing',
                code: 'MKT',
                description: 'Digital marketing, growth strategy, SEO, and brand campaigns',
                head: 'Jane Smith',
                employeeCount: 2,
                budget: 180000,
                location: 'Floor 2, Creative Hub',
                status: 'active'
            },
            {
                name: 'Human Resources',
                code: 'HR',
                description: 'Talent acquisition, employee relations, payroll, and culture',
                head: 'Emily Davis',
                employeeCount: 2,
                budget: 120000,
                location: 'Floor 1, Suite 102',
                status: 'active'
            },
            {
                name: 'Finance',
                code: 'FIN',
                description: 'Corporate accounting, financial planning, auditing, and investments',
                head: 'David Miller',
                employeeCount: 1,
                budget: 220000,
                location: 'Floor 1, Suite 105',
                status: 'active'
            },
            {
                name: 'Operations',
                code: 'OPS',
                description: 'Infrastructure, facilities, logistics, and office operations',
                head: 'Michael Green',
                employeeCount: 1,
                budget: 140000,
                location: 'Ground Floor, Suite 004',
                status: 'active'
            }
        ];

        for (const dept of departmentsData) {
            await Department.findOneAndUpdate(
                { name: dept.name },
                dept,
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );
        }
        console.log(`   ✅ Seeded ${departmentsData.length} departments`);

        // 3. Seed Employees
        console.log('👥 Seeding Employees...');
        const employeesData = [
            {
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1 234 567 8900',
                department: 'Software Development',
                position: 'Lead Software Engineer',
                status: 'active',
                salary: 95000,
                address: '123 Tech Blvd, San Francisco, CA',
                emergencyContact: '+1 234 567 8901',
                skills: ['React', 'Node.js', 'MongoDB', 'Docker'],
                projects: ['Enterprise CRM System', 'Mobile App'],
                performance: 'excellent',
                joinDate: new Date('2022-01-15')
            },
            {
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                phone: '+1 345 678 9012',
                department: 'Marketing',
                position: 'Marketing Director',
                status: 'active',
                salary: 82000,
                address: '456 Market Ave, New York, NY',
                emergencyContact: '+1 345 678 9013',
                skills: ['Digital Marketing', 'SEO', 'Brand Strategy'],
                projects: ['Q3 Global Brand Campaign'],
                performance: 'good',
                joinDate: new Date('2022-06-20')
            },
            {
                name: 'Robert Brown',
                email: 'robert.brown@example.com',
                phone: '+1 456 789 0123',
                department: 'Software Development',
                position: 'Senior Frontend Developer',
                status: 'active',
                salary: 88000,
                address: '789 Oak Way, Seattle, WA',
                emergencyContact: '+1 456 789 0124',
                skills: ['React', 'TypeScript', 'TailwindCSS', 'Next.js'],
                projects: ['Customer Portal Redesign'],
                performance: 'excellent',
                joinDate: new Date('2023-02-01')
            },
            {
                name: 'Emily Davis',
                email: 'emily.davis@example.com',
                phone: '+1 567 890 1234',
                department: 'Human Resources',
                position: 'HR Manager',
                status: 'active',
                salary: 75000,
                address: '321 Pine St, Chicago, IL',
                emergencyContact: '+1 567 890 1235',
                skills: ['Talent Acquisition', 'Employee Relations', 'Compliance'],
                projects: ['Employee Wellness Program'],
                performance: 'good',
                joinDate: new Date('2022-11-12')
            },
            {
                name: 'Michael Green',
                email: 'michael.green@example.com',
                phone: '+1 678 901 2345',
                department: 'Operations',
                position: 'Operations Supervisor',
                status: 'active',
                salary: 70000,
                address: '654 Maple Dr, Austin, TX',
                emergencyContact: '+1 678 901 2346',
                skills: ['Facilities', 'Logistics', 'Vendor Management'],
                projects: ['Office Expansion 2026'],
                performance: 'good',
                joinDate: new Date('2021-09-10')
            },
            {
                name: 'David Miller',
                email: 'david.miller@example.com',
                phone: '+1 789 012 3456',
                department: 'Finance',
                position: 'Senior Financial Analyst',
                status: 'active',
                salary: 90000,
                address: '987 Wall St, New York, NY',
                emergencyContact: '+1 789 012 3457',
                skills: ['Financial Modeling', 'Auditing', 'QuickBooks'],
                projects: ['Annual Budget Planning'],
                performance: 'excellent',
                joinDate: new Date('2021-04-18')
            },
            {
                name: 'Sarah Williams',
                email: 'sarah.williams@example.com',
                phone: '+1 890 123 4567',
                department: 'Software Development',
                position: 'Backend Developer',
                status: 'on_leave',
                salary: 80000,
                address: '147 Elm St, Denver, CO',
                emergencyContact: '+1 890 123 4568',
                skills: ['Node.js', 'Express', 'MongoDB', 'Redis'],
                projects: ['API Gateway V2'],
                performance: 'good',
                joinDate: new Date('2023-08-01')
            },
            {
                name: 'Alex Turner',
                email: 'alex.turner@example.com',
                phone: '+1 901 234 5678',
                department: 'Marketing',
                position: 'Content Strategist',
                status: 'active',
                salary: 62000,
                address: '258 Birch Rd, Boston, MA',
                emergencyContact: '+1 901 234 5679',
                skills: ['Copywriting', 'SEO', 'Social Media'],
                projects: ['Q3 Global Brand Campaign'],
                performance: 'good',
                joinDate: new Date('2024-01-10')
            }
        ];

        const createdEmployees = [];
        for (const emp of employeesData) {
            const saved = await Employee.findOneAndUpdate(
                { email: emp.email },
                emp,
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );
            createdEmployees.push(saved);
        }
        console.log(`   ✅ Seeded ${createdEmployees.length} employees`);

        // 4. Seed Attendance Records across recent weeks up to today
        console.log('📅 Seeding Multi-Day Attendance Records...');
        await Attendance.deleteMany({});

        const attendanceData = [];
        const now = new Date();

        // Generate past 30 days of dates (excluding weekends)
        for (let d = 30; d >= 0; d--) {
            const date = new Date(now);
            date.setDate(date.getDate() - d);
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Saturday & Sunday

            createdEmployees.forEach((emp, empIdx) => {
                let status = 'present';
                let checkIn = '09:00';
                let checkOut = '17:30';
                let workingHours = 8.5;
                let overtime = 0;

                // Occasional leave, absent, or late
                if ((empIdx + d) % 17 === 0) {
                    status = 'leave';
                    checkIn = null;
                    checkOut = null;
                    workingHours = 0;
                } else if ((empIdx + d) % 23 === 0) {
                    status = 'absent';
                    checkIn = null;
                    checkOut = null;
                    workingHours = 0;
                } else if ((empIdx + d) % 11 === 0) {
                    status = 'late';
                    checkIn = '09:45';
                    checkOut = '18:00';
                    workingHours = 8.25;
                } else if (empIdx % 2 === 0 && d % 4 === 0) {
                    overtime = 1.5;
                    checkOut = '19:00';
                    workingHours = 10;
                }

                const recDate = new Date(date);
                recDate.setHours(9, 0, 0, 0);

                attendanceData.push({
                    employeeId: emp._id,
                    date: recDate,
                    status,
                    checkIn,
                    checkOut,
                    workingHours,
                    overtime,
                    remarks: status === 'present' ? 'On time' : status
                });
            });
        }

        await Attendance.insertMany(attendanceData);
        console.log(`   ✅ Seeded ${attendanceData.length} attendance records across the past 30 days`);

        // 5. Seed Leaves
        console.log('🏖️ Seeding Leaves...');
        await Leave.deleteMany({});
        const leavesData = [
            {
                employeeId: createdEmployees[6]._id,
                employeeName: createdEmployees[6].name,
                type: 'annual',
                startDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
                endDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
                daysCount: 5,
                reason: 'Family vacation and personal travel',
                status: 'approved'
            },
            {
                employeeId: createdEmployees[7]._id,
                employeeName: createdEmployees[7].name,
                type: 'sick',
                startDate: new Date(),
                endDate: new Date(Date.now() + 1 * 24 * 3600 * 1000),
                daysCount: 1,
                reason: 'Severe seasonal flu',
                status: 'pending'
            },
            {
                employeeId: createdEmployees[2]._id,
                employeeName: createdEmployees[2].name,
                type: 'personal',
                startDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
                endDate: new Date(Date.now() + 8 * 24 * 3600 * 1000),
                daysCount: 2,
                reason: 'Attending tech conference',
                status: 'pending'
            }
        ];

        await Leave.insertMany(leavesData);
        console.log(`   ✅ Seeded ${leavesData.length} leave requests`);

        // 6. Seed Projects
        console.log('🚀 Seeding Projects...');
        await Project.deleteMany({});
        const projectsData = [
            {
                name: 'Enterprise CRM Platform',
                code: 'CRM26',
                description: 'Full featured cloud CRM application for enterprise staff and sales management',
                department: 'Software Development',
                client: 'Acme Global Corp',
                teamMembers: [createdEmployees[0]._id, createdEmployees[2]._id],
                budget: 150000,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
                status: 'ongoing',
                progress: 65,
                priority: 'high'
            },
            {
                name: 'Brand Refresh & Growth Q3',
                code: 'MKT26',
                description: 'Multi-channel brand campaign, website revamp, and social ad strategy',
                department: 'Marketing',
                client: 'Internal',
                teamMembers: [createdEmployees[1]._id, createdEmployees[7]._id],
                budget: 85000,
                startDate: new Date('2026-03-01'),
                endDate: new Date('2026-09-30'),
                status: 'ongoing',
                progress: 80,
                priority: 'medium'
            },
            {
                name: 'Office Infrastructure Upgrade',
                code: 'OPS26',
                description: 'High-speed fiber network installation, workstation ergonomic upgrades',
                department: 'Operations',
                client: 'Internal Facilities',
                teamMembers: [createdEmployees[4]._id],
                budget: 45000,
                startDate: new Date('2026-02-01'),
                endDate: new Date('2026-06-30'),
                status: 'completed',
                progress: 100,
                priority: 'medium'
            }
        ];

        await Project.insertMany(projectsData);
        console.log(`   ✅ Seeded ${projectsData.length} projects`);

        // 7. Seed Awards
        console.log('🏆 Seeding Awards...');
        await Award.deleteMany({});
        const awardsData = [
            {
                employeeId: createdEmployees[0]._id,
                employeeName: createdEmployees[0].name,
                department: createdEmployees[0].department,
                awardName: 'Gascapitol Enterprise Pioneer Award',
                type: 'gascapitol',
                amount: 1500,
                date: new Date('2026-02-15'),
                presentedBy: 'Executive Leadership',
                certificate: 'CERT-2026-001',
                description: 'Pioneered new cloud microservices architecture saving 40% compute overhead.'
            },
            {
                employeeId: createdEmployees[1]._id,
                employeeName: createdEmployees[1].name,
                department: createdEmployees[1].department,
                awardName: 'Coby Beach Growth Champion',
                type: 'coby_beach',
                amount: 1200,
                date: new Date('2026-03-20'),
                presentedBy: 'Chief Marketing Officer',
                certificate: 'CERT-2026-002',
                description: 'Spearheaded Q1 product expansion drive resulting in 180% inbound lead boost.'
            },
            {
                employeeId: createdEmployees[2]._id,
                employeeName: createdEmployees[2].name,
                department: createdEmployees[2].department,
                awardName: 'Code Quality & Architecture Champion',
                type: 'innovation',
                amount: 1000,
                date: new Date('2026-04-10'),
                presentedBy: 'VP of Engineering',
                certificate: 'CERT-2026-003',
                description: 'Achieved zero critical defect rate for two consecutive release cycles.'
            },
            {
                employeeId: createdEmployees[3]._id,
                employeeName: createdEmployees[3].name,
                department: createdEmployees[3].department,
                awardName: 'People & Culture Leadership Star',
                type: 'leadership',
                amount: 900,
                date: new Date('2026-05-18'),
                presentedBy: 'Head of People Operations',
                certificate: 'CERT-2026-004',
                description: 'Transformed onboarding workflow reducing time-to-productivity by 35%.'
            },
            {
                employeeId: createdEmployees[4]._id,
                employeeName: createdEmployees[4].name,
                department: createdEmployees[4].department,
                awardName: 'Best Team Player of the Quarter',
                type: 'team_player',
                amount: 750,
                date: new Date('2026-06-25'),
                presentedBy: 'Operations Director',
                certificate: 'CERT-2026-005',
                description: 'Exemplary cross-departmental alignment and critical incident resolution.'
            },
            {
                employeeId: createdEmployees[5]._id,
                employeeName: createdEmployees[5].name,
                department: createdEmployees[5].department,
                awardName: 'Best Employee of the Year',
                type: 'best_employee',
                amount: 1400,
                date: new Date('2026-07-15'),
                presentedBy: 'Chief Financial Officer',
                certificate: 'CERT-2026-006',
                description: 'Flawless audit execution and departmental cost-efficiency modeling.'
            },
            {
                employeeId: createdEmployees[6]._id,
                employeeName: createdEmployees[6].name,
                department: createdEmployees[6].department,
                awardName: 'Innovation in AI Automation',
                type: 'innovation',
                amount: 1100,
                date: new Date('2026-09-12'),
                presentedBy: 'Chief Technology Officer',
                certificate: 'CERT-2026-007',
                description: 'Built an internal AI agent toolchain accelerating bug triage by 50%.'
            },
            {
                employeeId: createdEmployees[7]._id,
                employeeName: createdEmployees[7].name,
                department: createdEmployees[7].department,
                awardName: 'Creative Content Excellence',
                type: 'best_employee',
                amount: 850,
                date: new Date('2026-09-28'),
                presentedBy: 'Marketing Director',
                certificate: 'CERT-2026-008',
                description: 'Produced viral product showcase garnering 250,000 organic impressions.'
            }
        ];

        const createdAwards = await Award.insertMany(awardsData);
        console.log(`   ✅ Seeded ${createdAwards.length} awards`);

        // 8. Seed Loans
        console.log('💰 Seeding Loans...');
        await Loan.deleteMany({});
        const loansData = [
            {
                employeeId: createdEmployees[2]._id,
                amount: 5000,
                interestRate: 4.5,
                tenure: 12,
                monthlyInstallment: 426.85,
                totalPaid: 2134.25,
                status: 'active',
                startDate: new Date('2026-01-01'),
                reason: 'Home improvement'
            },
            {
                employeeId: createdEmployees[4]._id,
                amount: 3000,
                interestRate: 5.0,
                tenure: 6,
                monthlyInstallment: 507.35,
                totalPaid: 3044.10,
                status: 'paid',
                startDate: new Date('2025-07-01'),
                reason: 'Emergency medical expenses'
            }
        ];

        await Loan.insertMany(loansData);
        console.log(`   ✅ Seeded ${loansData.length} loans`);

        // 9. Seed Payslips
        console.log('📄 Seeding Payslips...');
        await Payslip.deleteMany({});
        const payslipsData = [
            {
                employeeId: createdEmployees[0]._id,
                employeeName: createdEmployees[0].name,
                employeeCode: 'SWD-001',
                department: createdEmployees[0].department,
                position: createdEmployees[0].position,
                payslipNumber: 'PS-2608-0001',
                payPeriod: { month: 8, year: 2026 },
                earnings: { basicSalary: 5500, houseAllowance: 1200, transportAllowance: 400, medicalAllowance: 800, bonus: 0 },
                deductions: { pension: 550, tax: 650, insurance: 100, loanRepayment: 0 },
                totalEarnings: 7900,
                totalDeductions: 1300,
                netPay: 6600,
                paymentMethod: 'bank_transfer',
                status: 'paid'
            },
            {
                employeeId: createdEmployees[1]._id,
                employeeName: createdEmployees[1].name,
                employeeCode: 'MKT-001',
                department: createdEmployees[1].department,
                position: createdEmployees[1].position,
                payslipNumber: 'PS-2608-0002',
                payPeriod: { month: 8, year: 2026 },
                earnings: { basicSalary: 4800, houseAllowance: 1000, transportAllowance: 350, medicalAllowance: 650, bonus: 0 },
                deductions: { pension: 480, tax: 520, insurance: 100, loanRepayment: 0 },
                totalEarnings: 6800,
                totalDeductions: 1100,
                netPay: 5700,
                paymentMethod: 'bank_transfer',
                status: 'paid'
            }
        ];

        await Payslip.insertMany(payslipsData);
        console.log(`   ✅ Seeded ${payslipsData.length} payslips`);

        // 10. Seed Recruitments
        console.log('🎯 Seeding Recruitments...');
        await Recruitment.deleteMany({});
        const recruitmentsData = [
            {
                jobTitle: 'Senior Full Stack Developer',
                department: 'Software Development',
                vacancies: 2,
                description: 'We are seeking an experienced Full Stack Engineer proficient in React, Node.js, and MongoDB.',
                requirements: ['5+ years full stack experience', 'Strong proficiency in TypeScript and Node', 'AWS or GCP experience'],
                responsibilities: ['Build robust microservices', 'Mentor junior developers', 'Participate in architectural reviews'],
                qualifications: ["Bachelor's in Computer Science or equivalent"],
                experienceRequired: 5,
                salaryRange: { min: 90000, max: 120000 },
                employmentType: 'full_time',
                workLocation: 'San Francisco, CA (Hybrid)',
                status: 'open',
                applications: 14,
                shortlisted: 4,
                interviewed: 2
            },
            {
                jobTitle: 'Digital Marketing Strategist',
                department: 'Marketing',
                vacancies: 1,
                description: 'Seeking a creative digital marketer with proven experience managing PPC, SEO, and content campaigns.',
                requirements: ['3+ years B2B marketing experience', 'Google Analytics certified', 'Track record of ROAS growth'],
                responsibilities: ['Manage paid search and social campaigns', 'Optimize landing page conversion rates'],
                qualifications: ["Bachelor's in Marketing or Communications"],
                experienceRequired: 3,
                salaryRange: { min: 65000, max: 80000 },
                employmentType: 'full_time',
                workLocation: 'New York, NY (Hybrid)',
                status: 'open',
                applications: 8,
                shortlisted: 2,
                interviewed: 1
            }
        ];

        await Recruitment.insertMany(recruitmentsData);
        console.log(`   ✅ Seeded ${recruitmentsData.length} recruitment postings`);

        // 11. Seed Reports
        console.log('📊 Seeding Reports...');
        await Report.deleteMany({});
        const reportsData = [
            {
                title: 'Employee Attendance Summary',
                description: 'Comprehensive monthly attendance metrics, check-in averages, and absence rates across all departments.',
                type: 'attendance',
                format: 'PDF',
                size: '1.2 MB',
                status: 'Completed',
                generatedBy: adminUser._id,
                dateRange: {
                    start: new Date(2026, 0, 1),
                    end: new Date(2026, 0, 31)
                },
                data: {
                    period: 'January 2026',
                    totalEmployees: 8,
                    averageAttendanceRate: '94%',
                    presents: 168,
                    absents: 8,
                    leaves: 4
                }
            },
            {
                title: 'Department Performance Report',
                description: 'Operational efficiency, target completion, and performance metrics across departments.',
                type: 'performance',
                format: 'Excel',
                size: '2.5 MB',
                status: 'Completed',
                generatedBy: adminUser._id,
                dateRange: {
                    start: new Date(2025, 9, 1),
                    end: new Date(2025, 11, 31)
                },
                data: {
                    quarter: 'Q4 2025',
                    topDepartment: 'Software Development',
                    productivityScore: 92,
                    completedGoals: 18,
                    totalGoals: 20
                }
            },
            {
                title: 'Leave Analysis Report',
                description: 'Employee leave patterns, seasonal absence trends, and balance utilization breakdown.',
                type: 'leave',
                format: 'PDF',
                size: '0.8 MB',
                status: 'Completed',
                generatedBy: adminUser._id,
                dateRange: {
                    start: new Date(2026, 0, 1),
                    end: new Date(2026, 0, 31)
                },
                data: {
                    annualLeavesTaken: 12,
                    sickLeavesTaken: 5,
                    casualLeavesTaken: 3,
                    approvalRate: '90%'
                }
            },
            {
                title: 'Project Progress Report',
                description: 'Milestone delivery status, completion tracking, sprint velocities, and budget consumption.',
                type: 'project',
                format: 'PDF',
                size: '3.1 MB',
                status: 'Completed',
                generatedBy: adminUser._id,
                dateRange: {
                    start: new Date(2025, 6, 1),
                    end: new Date(2026, 0, 31)
                },
                data: {
                    activeProjects: 3,
                    completedMilestones: 14,
                    onScheduleRate: '88%',
                    totalBudgetAllocated: '$135,000'
                }
            },
            {
                title: 'Financial & Loan Allocation Report',
                description: 'Employee loan disbursements, repayment schedules, interest accruals, and departmental budgets.',
                type: 'financial',
                format: 'Excel',
                size: '1.8 MB',
                status: 'Completed',
                generatedBy: adminUser._id,
                dateRange: {
                    start: new Date(2025, 0, 1),
                    end: new Date(2025, 11, 31)
                },
                data: {
                    totalDisbursed: '$55,000',
                    totalRecovered: '$23,400',
                    activeBorrowers: 2,
                    defaultRate: '0%'
                }
            }
        ];

        await Report.insertMany(reportsData);
        console.log(`   ✅ Seeded ${reportsData.length} reports`);

        // 12. Seed Attendance Reports in AttendanceReport collection
        await AttendanceReport.deleteMany({});
        const attendanceReportsData = [
            {
                title: 'Monthly Company Attendance Report - Recent',
                reportType: 'monthly',
                dateRange: {
                    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    endDate: new Date()
                },
                department: 'all',
                employeeIds: createdEmployees.map(e => e._id),
                summary: {
                    totalEmployees: createdEmployees.length,
                    totalWorkingDays: 22,
                    totalPresent: 160,
                    totalAbsent: 5,
                    totalLeave: 8,
                    totalAbuse: 3,
                    averageAttendance: 91.5,
                    presentPercentage: 91.5,
                    absentPercentage: 2.8,
                    leavePercentage: 4.5
                },
                employeeWiseData: createdEmployees.map((e, idx) => ({
                    employeeId: e._id,
                    employeeName: e.name,
                    employeeCode: `EMP-${String(e._id).slice(-4).toUpperCase()}`,
                    department: e.department,
                    position: e.position,
                    presentDays: 20 - (idx % 2),
                    absentDays: idx % 3 === 0 ? 1 : 0,
                    leaveDays: idx % 2 === 0 ? 1 : 0,
                    abuseDays: 0,
                    totalDays: 22,
                    attendancePercentage: Math.round(((20 - (idx % 2)) / 22) * 100),
                    overtimeHours: idx * 2
                })),
                departmentWiseData: [
                    { department: 'Software Development', totalEmployees: 3, presentDays: 60, absentDays: 1, leaveDays: 2, abuseDays: 0, averageAttendance: 95.2 },
                    { department: 'Marketing', totalEmployees: 2, presentDays: 40, absentDays: 0, leaveDays: 2, abuseDays: 0, averageAttendance: 95.0 },
                    { department: 'Human Resources', totalEmployees: 1, presentDays: 21, absentDays: 0, leaveDays: 1, abuseDays: 0, averageAttendance: 95.5 },
                    { department: 'Operations', totalEmployees: 1, presentDays: 20, absentDays: 1, leaveDays: 1, abuseDays: 0, averageAttendance: 90.9 },
                    { department: 'Finance', totalEmployees: 1, presentDays: 22, absentDays: 0, leaveDays: 0, abuseDays: 0, averageAttendance: 100.0 }
                ],
                dailyData: [],
                generatedBy: adminUser._id,
                status: 'completed',
                notes: 'Automated monthly seed report'
            }
        ];
        await AttendanceReport.insertMany(attendanceReportsData);
        console.log(`   ✅ Seeded ${attendanceReportsData.length} saved attendance reports`);

        // 13. Seed Award Reports (Exactly 6 Reports)
        console.log('🏆 Seeding 6 Award Reports in AwardReport collection...');
        await AwardReport.deleteMany({});

        const getMonthName = (m) => new Date(2026, m - 1, 1).toLocaleString('default', { month: 'short' });
        const getQuarter = (m) => (m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4');

        const buildAwardReport = (title, reportType, startDate, endDate, departmentFilter, awardTypeFilter, notes) => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const matchedAwards = createdAwards.filter(a => {
                const aDate = new Date(a.date);
                if (aDate < start || aDate > end) return false;
                if (departmentFilter && departmentFilter !== 'all' && a.department !== departmentFilter) return false;
                if (awardTypeFilter && awardTypeFilter !== 'all' && a.type !== awardTypeFilter) return false;
                return true;
            });

            const summary = {
                totalAwards: matchedAwards.length,
                totalEmployeesAwarded: 0,
                totalAmount: 0,
                averageAwardAmount: 0,
                uniqueDepartments: 0,
                topPerformer: null,
                topDepartment: null,
                awardsByType: {
                    gascapitol: 0,
                    coby_beach: 0,
                    best_employee: 0,
                    innovation: 0,
                    leadership: 0,
                    team_player: 0,
                    other: 0
                }
            };

            const deptMap = {};
            const empAggMap = {};
            const typeAggMap = {};
            const monthlyAggMap = {};
            const quarterlyAggMap = {};
            const uniqueDeptSet = new Set();

            const awardData = matchedAwards.map(a => {
                const awardDate = new Date(a.date);
                const year = awardDate.getFullYear();
                const month = awardDate.getMonth() + 1;
                const monthName = getMonthName(month);
                const quarter = getQuarter(month);

                summary.totalAmount += (a.amount || 0);
                if (summary.awardsByType[a.type] !== undefined) {
                    summary.awardsByType[a.type]++;
                } else {
                    summary.awardsByType.other++;
                }

                uniqueDeptSet.add(a.department);
                if (!deptMap[a.department]) {
                    deptMap[a.department] = {
                        department: a.department,
                        totalAwards: 0,
                        totalAmount: 0,
                        uniqueEmployees: 0,
                        empIds: new Set(),
                        topAwardType: a.type
                    };
                }
                deptMap[a.department].totalAwards++;
                deptMap[a.department].totalAmount += (a.amount || 0);
                deptMap[a.department].empIds.add(String(a.employeeId));

                const empIdStr = String(a.employeeId);
                if (!empAggMap[empIdStr]) {
                    empAggMap[empIdStr] = {
                        employeeId: a.employeeId,
                        employeeCode: `EMP-${String(a.employeeId).slice(-4).toUpperCase()}`,
                        employeeName: a.employeeName,
                        department: a.department,
                        totalAwards: 0,
                        totalAmount: 0,
                        awardTypes: new Set(),
                        lastAwardDate: a.date
                    };
                }
                empAggMap[empIdStr].totalAwards++;
                empAggMap[empIdStr].totalAmount += (a.amount || 0);
                empAggMap[empIdStr].awardTypes.add(a.type);
                if (a.date > empAggMap[empIdStr].lastAwardDate) {
                    empAggMap[empIdStr].lastAwardDate = a.date;
                }

                if (!typeAggMap[a.type]) {
                    typeAggMap[a.type] = { count: 0, totalAmount: 0 };
                }
                typeAggMap[a.type].count++;
                typeAggMap[a.type].totalAmount += (a.amount || 0);

                const mKey = `${year}-${String(month).padStart(2, '0')}`;
                if (!monthlyAggMap[mKey]) {
                    monthlyAggMap[mKey] = {
                        year,
                        month,
                        monthName,
                        count: 0,
                        totalAmount: 0
                    };
                }
                monthlyAggMap[mKey].count++;
                monthlyAggMap[mKey].totalAmount += (a.amount || 0);

                const qKey = `${year}-${quarter}`;
                if (!quarterlyAggMap[qKey]) {
                    quarterlyAggMap[qKey] = {
                        year,
                        quarter,
                        count: 0,
                        totalAmount: 0
                    };
                }
                quarterlyAggMap[qKey].count++;
                quarterlyAggMap[qKey].totalAmount += (a.amount || 0);

                return {
                    awardId: a._id,
                    employeeId: a.employeeId,
                    employeeCode: `EMP-${String(a.employeeId).slice(-4).toUpperCase()}`,
                    employeeName: a.employeeName,
                    department: a.department,
                    position: createdEmployees.find(e => String(e._id) === String(a.employeeId))?.position || 'Staff',
                    awardName: a.awardName,
                    awardType: a.type,
                    awardDate: a.date,
                    amount: a.amount,
                    description: a.description,
                    presentedBy: a.presentedBy,
                    year,
                    month,
                    monthName,
                    quarter
                };
            });

            summary.totalEmployeesAwarded = Object.keys(empAggMap).length;
            summary.uniqueDepartments = uniqueDeptSet.size;
            summary.averageAwardAmount = matchedAwards.length > 0
                ? Math.round(summary.totalAmount / matchedAwards.length)
                : 0;

            const empList = Object.values(empAggMap);
            if (empList.length > 0) {
                summary.topPerformer = empList.sort((x, y) => y.totalAmount - x.totalAmount)[0].employeeName;
            }

            const deptList = Object.values(deptMap);
            if (deptList.length > 0) {
                summary.topDepartment = deptList.sort((x, y) => y.totalAwards - x.totalAwards)[0].department;
            }

            const departmentWiseData = Object.values(deptMap).map(d => ({
                department: d.department,
                totalAwards: d.totalAwards,
                totalAmount: d.totalAmount,
                uniqueEmployees: d.empIds.size,
                averageAmount: Math.round(d.totalAmount / (d.totalAwards || 1)),
                topAwardType: d.topAwardType
            }));

            const employeeWiseData = Object.values(empAggMap).map(e => ({
                employeeId: e.employeeId,
                employeeCode: e.employeeCode,
                employeeName: e.employeeName,
                department: e.department,
                totalAwards: e.totalAwards,
                totalAmount: e.totalAmount,
                awardTypes: Array.from(e.awardTypes),
                lastAwardDate: e.lastAwardDate
            }));

            const awardTypeWiseData = Object.entries(typeAggMap).map(([type, data]) => ({
                awardType: type,
                count: data.count,
                totalAmount: data.totalAmount,
                percentage: matchedAwards.length > 0 ? Math.round((data.count / matchedAwards.length) * 100) : 0
            }));

            const monthlyTrendData = Object.values(monthlyAggMap);
            const quarterlyData = Object.values(quarterlyAggMap);
            const topPerformersData = employeeWiseData.slice(0, 5);

            return {
                title,
                reportType,
                dateRange: { startDate: start, endDate: end },
                department: departmentFilter || 'all',
                employeeIds: matchedAwards.map(a => a.employeeId),
                awardIds: matchedAwards.map(a => a._id),
                filters: {
                    awardType: awardTypeFilter || 'all',
                    year: start.getFullYear(),
                    month: start.getMonth() + 1
                },
                summary,
                awardData,
                departmentWiseData,
                employeeWiseData,
                awardTypeWiseData,
                monthlyTrendData,
                quarterlyData,
                topPerformersData,
                generatedBy: adminUser._id,
                status: 'completed',
                notes
            };
        };

        const awardReportsData = [
            buildAwardReport(
                'Q1 2026 Corporate Recognition & Merit Report',
                'summary',
                '2026-01-01',
                '2026-03-31',
                'all',
                'all',
                'Executive corporate summary of Q1 achievements and top honor recipients.'
            ),
            buildAwardReport(
                'Software Engineering Innovation & Quality Awards',
                'department',
                '2026-01-01',
                '2026-09-30',
                'Software Development',
                'all',
                'Technical department review covering cloud migrations, code quality, and AI automation.'
            ),
            buildAwardReport(
                'Marketing & Brand Growth Honors Summary',
                'department',
                '2026-01-01',
                '2026-09-30',
                'Marketing',
                'all',
                'Marketing campaign leadership awards and organic expansion milestones.'
            ),
            buildAwardReport(
                'Company-Wide Best Employee & Team Player Awards',
                'category',
                '2026-01-01',
                '2026-10-06',
                'all',
                'best_employee',
                'Evaluation of peer-nominated best employee and cultural excellence awards.'
            ),
            buildAwardReport(
                'Monthly Performance & Innovation Awards - September 2026',
                'monthly',
                '2026-09-01',
                '2026-09-30',
                'all',
                'all',
                'Monthly high-impact contributors across technical and creative departments.'
            ),
            buildAwardReport(
                'Comprehensive Annual Corporate Recognition Report 2026',
                'yearly',
                '2026-01-01',
                '2026-12-31',
                'all',
                'all',
                'Full calendar year enterprise recognition audit with financial disbursements and rankings.'
            )
        ];

        await AwardReport.insertMany(awardReportsData);
        console.log(`   ✅ Seeded ${awardReportsData.length} award reports in AwardReport collection`);

        console.log('\n🎉 ALL DATABASE SEEDING COMPLETED SUCCESSFULLY!');
        console.log('----------------------------------------------------');
        console.log('🔑 Login Credentials:');
        console.log('   Email:    admin@crm.com');
        console.log('   Password: password123');
        console.log('----------------------------------------------------\n');

    } catch (error) {
        console.error('❌ Seeding Error:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database.');
    }
};

seedData();
