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

        // 4. Seed Attendance Records for Today
        console.log('📅 Seeding Attendance...');
        const today = new Date();
        today.setHours(9, 0, 0, 0);

        await Attendance.deleteMany({
            date: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
        });

        const attendanceData = [
            { employeeId: createdEmployees[0]._id, date: today, status: 'present', checkIn: '08:55', checkOut: '17:30', workingHours: 8.5 },
            { employeeId: createdEmployees[1]._id, date: today, status: 'present', checkIn: '09:05', checkOut: '17:45', workingHours: 8.5 },
            { employeeId: createdEmployees[2]._id, date: today, status: 'present', checkIn: '08:45', checkOut: '17:15', workingHours: 8.5 },
            { employeeId: createdEmployees[3]._id, date: today, status: 'present', checkIn: '09:12', checkOut: '17:50', workingHours: 8.5 },
            { employeeId: createdEmployees[4]._id, date: today, status: 'present', checkIn: '08:30', checkOut: '17:00', workingHours: 8.5 },
            { employeeId: createdEmployees[5]._id, date: today, status: 'present', checkIn: '09:00', checkOut: '17:30', workingHours: 8.5 },
            { employeeId: createdEmployees[6]._id, date: today, status: 'leave', workingHours: 0, remarks: 'On approved annual leave' },
            { employeeId: createdEmployees[7]._id, date: today, status: 'absent', workingHours: 0, remarks: 'Sick leave notice' }
        ];

        await Attendance.insertMany(attendanceData);
        console.log(`   ✅ Seeded ${attendanceData.length} attendance records for today`);

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
                awardName: 'Developer of the Quarter',
                type: 'best_employee',
                description: 'Outstanding technical leadership and rapid feature turnaround',
                date: new Date('2026-06-15')
            },
            {
                employeeId: createdEmployees[2]._id,
                employeeName: createdEmployees[2].name,
                department: createdEmployees[2].department,
                awardName: 'Code Quality Champion',
                type: 'innovation',
                description: 'Achieving zero defect rate on frontend delivery for 3 months straight',
                date: new Date('2026-05-10')
            },
            {
                employeeId: createdEmployees[1]._id,
                employeeName: createdEmployees[1].name,
                department: createdEmployees[1].department,
                awardName: 'Top Campaign Producer',
                type: 'leadership',
                description: 'Exceeded inbound leads generation target by 140%',
                date: new Date('2026-07-20')
            }
        ];

        await Award.insertMany(awardsData);
        console.log(`   ✅ Seeded ${awardsData.length} awards`);

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
