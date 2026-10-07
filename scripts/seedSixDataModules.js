const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');

const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const EmployeeReport = require('../models/EmployeeReport');
const JobPosting = require('../models/JobPosting');
const Recruitment = require('../models/Recruitment');
const Loan = require('../models/Loan');
const LoanReport = require('../models/LoanReport');
const Payslip = require('../models/Payslip');
const PayslipHistory = require('../models/PayslipHistory');
const SavedReport = require('../models/SavedReport');

const seedSixDataModules = async () => {
    try {
        console.log('🚀 Connecting to MongoDB Atlas to seed 6 data items per module...');
        await connectDB();

        // 1. Get or create Admin user
        let adminUser = await User.findOne({ email: 'admin@crm.com' });
        if (!adminUser) {
            adminUser = await User.findOne({ role: { $in: ['admin', 'super_admin'] } }) || await User.findOne({});
        }
        if (!adminUser) {
            adminUser = await User.create({
                name: 'CRM Administrator',
                email: 'admin@crm.com',
                password: 'password123',
                role: 'admin',
                status: 'active'
            });
            console.log('   ✅ Created admin user');
        }

        // 2. Fetch existing employees
        let employees = await Employee.find({});
        if (employees.length === 0) {
            console.log('   Creating base employees...');
            const defaultEmployees = [
                { name: 'John Doe', email: 'john.doe@crm.com', phone: '+1 234 567 8900', department: 'Software Development', position: 'Lead Software Engineer', salary: 95000, status: 'active', joinDate: new Date('2023-01-15') },
                { name: 'Jane Smith', email: 'jane.smith@crm.com', phone: '+1 345 678 9012', department: 'Marketing', position: 'Marketing Director', salary: 85000, status: 'active', joinDate: new Date('2022-06-20') },
                { name: 'Robert Brown', email: 'robert.brown@crm.com', phone: '+1 456 789 0123', department: 'Software Development', position: 'Senior Frontend Developer', salary: 88000, status: 'active', joinDate: new Date('2023-03-01') },
                { name: 'Emily Davis', email: 'emily.davis@crm.com', phone: '+1 567 890 1234', department: 'Human Resources', position: 'HR Manager', salary: 75000, status: 'active', joinDate: new Date('2022-01-10') },
                { name: 'Michael Green', email: 'michael.green@crm.com', phone: '+1 678 901 2345', department: 'Operations', position: 'Operations Supervisor', salary: 72000, status: 'active', joinDate: new Date('2021-11-15') },
                { name: 'David Miller', email: 'david.miller@crm.com', phone: '+1 789 012 3456', department: 'Finance', position: 'Senior Financial Analyst', salary: 82000, status: 'active', joinDate: new Date('2022-08-01') }
            ];
            employees = await Employee.insertMany(defaultEmployees);
        }

        const getEmp = (idx) => employees[idx] || employees[0];

        // ==========================================
        // 1. SEED EMPLOYEE REPORTS (EXACTLY 6 DATA)
        // ==========================================
        console.log('\n📊 Seeding EXACTLY 6 Employee Reports...');
        await EmployeeReport.deleteMany({});

        const empDataList = employees.map(e => ({
            employeeId: e._id,
            employeeCode: e.employeeCode || `EMP-${String(e._id).slice(-4).toUpperCase()}`,
            name: e.name,
            email: e.email,
            phone: e.phone || '+1 555 010 0000',
            department: e.department || 'Software Development',
            position: e.position || 'Specialist',
            status: e.status || 'active',
            joinDate: e.joinDate || new Date('2023-01-01'),
            salary: e.salary || 75000,
            tenure: 2,
            yearsOfService: 2
        }));

        const employeeReportsData = [
            {
                title: 'Q1 2026 Comprehensive Workforce & Headcount Audit',
                reportType: 'summary',
                dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-03-31') },
                department: 'all',
                employeeIds: employees.map(e => e._id),
                filters: { status: 'all', gender: 'all', employmentType: 'all' },
                summary: {
                    totalEmployees: employees.length,
                    activeEmployees: employees.filter(e => e.status !== 'inactive' && e.status !== 'on_leave').length,
                    inactiveEmployees: 0,
                    onLeaveEmployees: 1,
                    newHires: 2,
                    terminated: 0,
                    totalDepartments: 5,
                    averageTenure: 2.4,
                    averageAge: 32,
                    maleCount: 5,
                    femaleCount: 3,
                    otherCount: 0,
                    totalPayroll: employees.reduce((s, e) => s + (e.salary || 75000), 0),
                    averageSalary: Math.round(employees.reduce((s, e) => s + (e.salary || 75000), 0) / employees.length)
                },
                employeeData: empDataList,
                departmentWiseData: [
                    { department: 'Software Development', totalEmployees: 3, activeEmployees: 3, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 2, femaleCount: 1, averageAge: 30, averageSalary: 89000, totalPayroll: 267000 },
                    { department: 'Marketing', totalEmployees: 2, activeEmployees: 2, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 1, femaleCount: 1, averageAge: 31, averageSalary: 80000, totalPayroll: 160000 },
                    { department: 'Human Resources', totalEmployees: 1, activeEmployees: 1, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 0, femaleCount: 1, averageAge: 34, averageSalary: 75000, totalPayroll: 75000 },
                    { department: 'Finance', totalEmployees: 1, activeEmployees: 1, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 1, femaleCount: 0, averageAge: 36, averageSalary: 82000, totalPayroll: 82000 },
                    { department: 'Operations', totalEmployees: 1, activeEmployees: 0, inactiveEmployees: 0, onLeaveEmployees: 1, maleCount: 1, femaleCount: 0, averageAge: 35, averageSalary: 72000, totalPayroll: 72000 }
                ],
                statusWiseData: [
                    { status: 'active', count: employees.length - 1, percentage: 87.5 },
                    { status: 'on_leave', count: 1, percentage: 12.5 }
                ],
                generatedBy: adminUser._id,
                status: 'completed'
            },
            {
                title: 'Engineering & Technical Talent Allocation Report',
                reportType: 'department',
                dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-06-30') },
                department: 'Software Development',
                employeeIds: employees.filter(e => e.department === 'Software Development').map(e => e._id),
                filters: { status: 'all', gender: 'all', employmentType: 'all' },
                summary: {
                    totalEmployees: 3,
                    activeEmployees: 3,
                    inactiveEmployees: 0,
                    onLeaveEmployees: 0,
                    newHires: 1,
                    terminated: 0,
                    totalDepartments: 1,
                    averageTenure: 2.1,
                    averageAge: 29,
                    maleCount: 2,
                    femaleCount: 1,
                    otherCount: 0,
                    totalPayroll: 267000,
                    averageSalary: 89000
                },
                employeeData: empDataList.filter(e => e.department === 'Software Development'),
                departmentWiseData: [
                    { department: 'Software Development', totalEmployees: 3, activeEmployees: 3, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 2, femaleCount: 1, averageAge: 29, averageSalary: 89000, totalPayroll: 267000 }
                ],
                statusWiseData: [{ status: 'active', count: 3, percentage: 100 }],
                generatedBy: adminUser._id,
                status: 'completed'
            },
            {
                title: 'Marketing, Growth & Operations Workforce Breakdown',
                reportType: 'department',
                dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-09-30') },
                department: 'Marketing',
                employeeIds: employees.filter(e => ['Marketing', 'Operations'].includes(e.department)).map(e => e._id),
                filters: { status: 'all', gender: 'all', employmentType: 'all' },
                summary: {
                    totalEmployees: 3,
                    activeEmployees: 2,
                    inactiveEmployees: 0,
                    onLeaveEmployees: 1,
                    newHires: 1,
                    terminated: 0,
                    totalDepartments: 2,
                    averageTenure: 2.8,
                    averageAge: 33,
                    maleCount: 2,
                    femaleCount: 1,
                    otherCount: 0,
                    totalPayroll: 232000,
                    averageSalary: 77333
                },
                employeeData: empDataList.filter(e => ['Marketing', 'Operations'].includes(e.department)),
                departmentWiseData: [
                    { department: 'Marketing', totalEmployees: 2, activeEmployees: 2, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 1, femaleCount: 1, averageAge: 31, averageSalary: 80000, totalPayroll: 160000 },
                    { department: 'Operations', totalEmployees: 1, activeEmployees: 0, inactiveEmployees: 0, onLeaveEmployees: 1, maleCount: 1, femaleCount: 0, averageAge: 35, averageSalary: 72000, totalPayroll: 72000 }
                ],
                statusWiseData: [{ status: 'active', count: 2, percentage: 66.7 }, { status: 'on_leave', count: 1, percentage: 33.3 }],
                generatedBy: adminUser._id,
                status: 'completed'
            },
            {
                title: 'Executive & Senior Leadership Compensation & Tenure Review',
                reportType: 'designation',
                dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-10-01') },
                department: 'all',
                employeeIds: employees.map(e => e._id),
                filters: { status: 'all', gender: 'all', employmentType: 'all' },
                summary: {
                    totalEmployees: 4,
                    activeEmployees: 4,
                    inactiveEmployees: 0,
                    onLeaveEmployees: 0,
                    newHires: 0,
                    terminated: 0,
                    totalDepartments: 4,
                    averageTenure: 3.5,
                    averageAge: 38,
                    maleCount: 3,
                    femaleCount: 1,
                    otherCount: 0,
                    totalPayroll: 344000,
                    averageSalary: 86000
                },
                employeeData: empDataList.slice(0, 4),
                departmentWiseData: [
                    { department: 'Software Development', totalEmployees: 1, activeEmployees: 1, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 1, femaleCount: 0, averageAge: 36, averageSalary: 95000, totalPayroll: 95000 },
                    { department: 'Marketing', totalEmployees: 1, activeEmployees: 1, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 0, femaleCount: 1, averageAge: 35, averageSalary: 85000, totalPayroll: 85000 },
                    { department: 'Human Resources', totalEmployees: 1, activeEmployees: 1, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 0, femaleCount: 1, averageAge: 37, averageSalary: 75000, totalPayroll: 75000 },
                    { department: 'Finance', totalEmployees: 1, activeEmployees: 1, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 1, femaleCount: 0, averageAge: 42, averageSalary: 89000, totalPayroll: 89000 }
                ],
                statusWiseData: [{ status: 'active', count: 4, percentage: 100 }],
                generatedBy: adminUser._id,
                status: 'completed'
            },
            {
                title: 'Corporate Retention, Tenureship & Staff Status Analysis',
                reportType: 'performance',
                dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-10-06') },
                department: 'all',
                employeeIds: employees.map(e => e._id),
                filters: { status: 'all', gender: 'all', employmentType: 'all' },
                summary: {
                    totalEmployees: employees.length,
                    activeEmployees: employees.length - 1,
                    inactiveEmployees: 0,
                    onLeaveEmployees: 1,
                    newHires: 2,
                    terminated: 0,
                    totalDepartments: 5,
                    averageTenure: 2.4,
                    averageAge: 32,
                    maleCount: 5,
                    femaleCount: 3,
                    otherCount: 0,
                    totalPayroll: 642000,
                    averageSalary: 80250
                },
                employeeData: empDataList,
                statusWiseData: [
                    { status: 'active', count: employees.length - 1, percentage: 87.5 },
                    { status: 'on_leave', count: 1, percentage: 12.5 }
                ],
                generatedBy: adminUser._id,
                status: 'completed'
            },
            {
                title: 'Annual Enterprise Staffing & Departmental Distribution 2026',
                reportType: 'detailed',
                dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') },
                department: 'all',
                employeeIds: employees.map(e => e._id),
                filters: { status: 'all', gender: 'all', employmentType: 'all' },
                summary: {
                    totalEmployees: employees.length,
                    activeEmployees: employees.length - 1,
                    inactiveEmployees: 0,
                    onLeaveEmployees: 1,
                    newHires: 3,
                    terminated: 0,
                    totalDepartments: 5,
                    averageTenure: 2.4,
                    averageAge: 32,
                    maleCount: 5,
                    femaleCount: 3,
                    otherCount: 0,
                    totalPayroll: 642000,
                    averageSalary: 80250
                },
                employeeData: empDataList,
                departmentWiseData: [
                    { department: 'Software Development', totalEmployees: 3, activeEmployees: 3, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 2, femaleCount: 1, averageAge: 30, averageSalary: 89000, totalPayroll: 267000 },
                    { department: 'Marketing', totalEmployees: 2, activeEmployees: 2, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 1, femaleCount: 1, averageAge: 31, averageSalary: 80000, totalPayroll: 160000 },
                    { department: 'Human Resources', totalEmployees: 1, activeEmployees: 1, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 0, femaleCount: 1, averageAge: 34, averageSalary: 75000, totalPayroll: 75000 },
                    { department: 'Finance', totalEmployees: 1, activeEmployees: 1, inactiveEmployees: 0, onLeaveEmployees: 0, maleCount: 1, femaleCount: 0, averageAge: 36, averageSalary: 82000, totalPayroll: 82000 },
                    { department: 'Operations', totalEmployees: 1, activeEmployees: 0, inactiveEmployees: 0, onLeaveEmployees: 1, maleCount: 1, femaleCount: 0, averageAge: 35, averageSalary: 72000, totalPayroll: 72000 }
                ],
                statusWiseData: [
                    { status: 'active', count: employees.length - 1, percentage: 87.5 },
                    { status: 'on_leave', count: 1, percentage: 12.5 }
                ],
                generatedBy: adminUser._id,
                status: 'completed'
            }
        ];

        const insertedEmpReports = await EmployeeReport.insertMany(employeeReportsData);
        console.log(`   ✅ Seeded ${insertedEmpReports.length} Employee Reports in MongoDB`);


        // ==========================================
        // 2. SEED JOB POSTINGS (EXACTLY 6 DATA)
        // ==========================================
        console.log('\n💼 Seeding EXACTLY 6 Job Postings...');
        await JobPosting.deleteMany({});
        await Recruitment.deleteMany({});

        const jobPostingsData = [
            {
                jobTitle: 'Senior Full Stack Engineer (Node.js & React)',
                jobCode: 'JOB-2026-001',
                department: 'Software Development',
                vacancies: 3,
                description: 'We are seeking an experienced Full Stack Engineer to architect high-throughput cloud microservices and build responsive frontend workflows using React and Node.js.',
                responsibilities: [
                    'Architect scalable REST APIs and event-driven backend services',
                    'Build modular and high-performance React frontends with state management',
                    'Implement robust automated test suites and participate in peer code reviews',
                    'Collaborate with product designers to translate UI/UX wireframes into production code'
                ],
                requirements: [
                    '4+ years of professional full stack software development experience',
                    'Proficiency in JavaScript (ES6+), Node.js, Express, and React',
                    'Strong hands-on experience with MongoDB and relational databases',
                    'Familiarity with Docker, Git CI/CD, and AWS cloud environments'
                ],
                qualifications: ['Bachelor degree in Computer Science, Software Engineering or equivalent'],
                skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Docker', 'REST API'],
                experienceRequired: { min: 4, max: 8, description: '4-8 years software engineering experience' },
                educationRequired: 'bachelor',
                salaryRange: { min: 95000, max: 130000, currency: 'USD', isNegotiable: true, isVisible: true },
                employmentType: 'full_time',
                workType: 'hybrid',
                workLocation: 'San Francisco, CA (Hybrid)',
                city: 'San Francisco',
                state: 'CA',
                country: 'USA',
                benefits: ['Health, Dental & Vision Insurance', '401(k) Matching', 'Unlimited PTO', 'Annual Learning Stipend'],
                status: 'open',
                priority: 'urgent',
                postedDate: new Date('2026-01-10'),
                closingDate: new Date('2026-05-31'),
                createdBy: adminUser._id
            },
            {
                jobTitle: 'Digital Marketing & Growth Lead',
                jobCode: 'JOB-2026-002',
                department: 'Marketing',
                vacancies: 2,
                description: 'Join our marketing division to lead digital user acquisition, paid performance channels, brand positioning campaigns, and product growth initiatives.',
                responsibilities: [
                    'Develop and scale data-driven digital ad campaigns across Google, Meta, and LinkedIn',
                    'Analyze conversion funnel metrics and optimize customer acquisition costs (CAC)',
                    'Partner with product teams to drive organic search and content marketing initiatives',
                    'Manage monthly advertising budgets and deliver weekly performance attribution reports'
                ],
                requirements: [
                    '3+ years leading digital marketing and paid acquisition strategies in B2B/B2C SaaS',
                    'Expertise in Google Analytics 4, Meta Ads Manager, and SEO toolchains (Ahrefs, SEMrush)',
                    'Strong analytical mindset with proven experience running A/B conversion experiments'
                ],
                qualifications: ['Bachelor degree in Marketing, Communications, or Business Administration'],
                skills: ['Digital Marketing', 'Paid Ads', 'SEO', 'Google Analytics', 'A/B Testing'],
                experienceRequired: { min: 3, max: 6, description: '3+ years digital marketing' },
                educationRequired: 'bachelor',
                salaryRange: { min: 75000, max: 105000, currency: 'USD', isNegotiable: true, isVisible: true },
                employmentType: 'full_time',
                workType: 'remote',
                workLocation: 'New York, NY (Remote)',
                city: 'New York',
                state: 'NY',
                country: 'USA',
                benefits: ['Comprehensive Medical Benefits', 'Flexible Remote Schedule', 'Wellness Reimbursement'],
                status: 'open',
                priority: 'high',
                postedDate: new Date('2026-01-15'),
                closingDate: new Date('2026-06-15'),
                createdBy: adminUser._id
            },
            {
                jobTitle: 'DevOps & Cloud Infrastructure Architect',
                jobCode: 'JOB-2026-003',
                department: 'Software Development',
                vacancies: 1,
                description: 'Lead our infrastructure modernization journey, managing automated Kubernetes clusters, Terraform IaC, secure CI/CD pipelines, and high availability deployments.',
                responsibilities: [
                    'Design resilient cloud infrastructure on AWS and GCP using Terraform',
                    'Maintain production Kubernetes clusters, observability dashboards, and alert policies',
                    'Optimize compute performance, database replication, and disaster recovery procedures',
                    'Ensure SOC2 security compliance and lead internal infrastructure hardening'
                ],
                requirements: [
                    '5+ years working in DevOps, Cloud Engineering, or Site Reliability Engineering',
                    'Hands-on expertise with Kubernetes, Terraform, Docker, and GitHub Actions',
                    'Deep understanding of Linux networking, security, and cloud cost management'
                ],
                qualifications: ['AWS Certified Solutions Architect or equivalent practical experience'],
                skills: ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'CI/CD', 'Prometheus'],
                experienceRequired: { min: 5, max: 10, description: '5+ years DevOps/SRE' },
                educationRequired: 'bachelor',
                salaryRange: { min: 120000, max: 155000, currency: 'USD', isNegotiable: true, isVisible: true },
                employmentType: 'full_time',
                workType: 'remote',
                workLocation: 'Austin, TX (Remote)',
                city: 'Austin',
                state: 'TX',
                country: 'USA',
                benefits: ['Comprehensive Health & Life Insurance', 'Home Office Stipend', 'Performance Equity Bonus'],
                status: 'open',
                priority: 'urgent',
                postedDate: new Date('2026-01-20'),
                closingDate: new Date('2026-05-15'),
                createdBy: adminUser._id
            },
            {
                jobTitle: 'Human Resources Generalist & Talent Partner',
                jobCode: 'JOB-2026-004',
                department: 'Human Resources',
                vacancies: 1,
                description: 'We are looking for a proactive HR Generalist to coordinate end-to-end recruitment, onboarding, employee engagement, benefits administration, and company culture programs.',
                responsibilities: [
                    'Coordinate full-cycle recruitment including candidate screening and interview scheduling',
                    'Administer employee benefits, health insurance programs, and leave tracking',
                    'Facilitate seamless new employee orientation and smooth departmental integration',
                    'Assist in drafting HR policies, employee handbooks, and compliance audits'
                ],
                requirements: [
                    '2+ years in human resources operations, talent acquisition, or people operations',
                    'Strong communication, empathy, interpersonal, and conflict-resolution skills',
                    'Familiarity with labor regulations, employment law, and HRIS systems'
                ],
                qualifications: ['Bachelor degree in Human Resources, Psychology, or Business Management'],
                skills: ['HR Operations', 'Recruiting', 'Employee Relations', 'HRIS', 'Onboarding'],
                experienceRequired: { min: 2, max: 5, description: '2+ years HR experience' },
                educationRequired: 'bachelor',
                salaryRange: { min: 65000, max: 85000, currency: 'USD', isNegotiable: false, isVisible: true },
                employmentType: 'full_time',
                workType: 'onsite',
                workLocation: 'Chicago, IL (Onsite)',
                city: 'Chicago',
                state: 'IL',
                country: 'USA',
                benefits: ['Medical, Vision & Dental Coverage', 'Commuter Transit Pass', 'Paid Family Leave'],
                status: 'open',
                priority: 'medium',
                postedDate: new Date('2026-02-01'),
                closingDate: new Date('2026-06-30'),
                createdBy: adminUser._id
            },
            {
                jobTitle: 'Financial Analyst & Corporate Controller',
                jobCode: 'JOB-2026-005',
                department: 'Finance',
                vacancies: 2,
                description: 'Drive financial planning, quarterly variance reporting, budget forecasting, and corporate financial model evaluations for executive stakeholders.',
                responsibilities: [
                    'Prepare monthly financial statements, budget versus actual variance analysis, and cash forecasts',
                    'Build detailed quantitative financial models to project quarterly revenue scenarios',
                    'Collaborate with department heads to audit operational expenditures and identify efficiencies',
                    'Assist external auditors during year-end financial audits and statutory filings'
                ],
                requirements: [
                    '3+ years of financial analysis, corporate accounting, or investment advisory experience',
                    'Advanced financial modeling skills in Excel, Google Sheets, and ERP platforms (NetSuite/QuickBooks)',
                    'Strong knowledge of GAAP accounting principles and financial reconciliation'
                ],
                qualifications: ['Bachelor in Accounting, Finance, Economics or CPA/CFA progress'],
                skills: ['Financial Modeling', 'Budgeting', 'GAAP', 'Forecasting', 'Excel Mastery'],
                experienceRequired: { min: 3, max: 6, description: '3+ years corporate finance' },
                educationRequired: 'bachelor',
                salaryRange: { min: 80000, max: 110000, currency: 'USD', isNegotiable: true, isVisible: true },
                employmentType: 'full_time',
                workType: 'onsite',
                workLocation: 'Boston, MA (Onsite)',
                city: 'Boston',
                state: 'MA',
                country: 'USA',
                benefits: ['401(k) Match', 'Comprehensive Medical & Life Insurance', 'Tuition Reimbursement'],
                status: 'open',
                priority: 'medium',
                postedDate: new Date('2026-02-05'),
                closingDate: new Date('2026-07-01'),
                createdBy: adminUser._id
            },
            {
                jobTitle: 'Operations & Facilities Supervisor',
                jobCode: 'JOB-2026-006',
                department: 'Operations',
                vacancies: 1,
                description: 'Oversee daily facility management, workplace logistics, vendor contract procurement, inventory monitoring, and workplace safety compliance.',
                responsibilities: [
                    'Manage corporate physical workspace, equipment procurement, and vendor service contracts',
                    'Ensure workplace health, OSHA safety compliance, and emergency protocols are upheld',
                    'Coordinate office relocations, space planning, and asset tracking workflows',
                    'Supervise facilities maintenance staff and negotiate supplier agreements'
                ],
                requirements: [
                    '3+ years supervising facilities, office operations, or supply chain logistics',
                    'Proven vendor negotiation, inventory management, and budgeting track record',
                    'Excellent organizational skills and ability to resolve facility disruptions swiftly'
                ],
                qualifications: ['Associate or Bachelor degree in Business Administration, Operations or related'],
                skills: ['Facilities Management', 'Logistics', 'Vendor Negotiation', 'Procurement', 'OSHA Safety'],
                experienceRequired: { min: 3, max: 7, description: '3+ years operations supervision' },
                educationRequired: 'bachelor',
                salaryRange: { min: 70000, max: 90000, currency: 'USD', isNegotiable: false, isVisible: true },
                employmentType: 'full_time',
                workType: 'onsite',
                workLocation: 'Seattle, WA (Onsite)',
                city: 'Seattle',
                state: 'WA',
                country: 'USA',
                benefits: ['Health & Dental Insurance', 'Paid Vacation Days', 'Life & Disability Insurance'],
                status: 'open',
                priority: 'medium',
                postedDate: new Date('2026-02-10'),
                closingDate: new Date('2026-06-30'),
                createdBy: adminUser._id
            }
        ];

        const insertedJobs = await JobPosting.insertMany(jobPostingsData);
        console.log(`   ✅ Seeded ${insertedJobs.length} Job Postings into JobPosting collection`);

        // Also mirror into Recruitment collection so both models & endpoints are active
        const recruitmentData = insertedJobs.map(j => ({
            jobTitle: j.jobTitle,
            department: j.department,
            vacancies: j.vacancies,
            description: j.description,
            requirements: j.requirements,
            responsibilities: j.responsibilities,
            skills: j.skills,
            experience: `${j.experienceRequired?.min || 3}+ years`,
            salary: `$${j.salaryRange.min.toLocaleString()} - $${j.salaryRange.max.toLocaleString()}`,
            employmentType: j.employmentType,
            workType: j.workType,
            workLocation: j.workLocation,
            status: 'open',
            postedDate: j.postedDate,
            closingDate: j.closingDate,
            applications: Math.floor(Math.random() * 8) + 3,
            createdBy: adminUser._id
        }));
        await Recruitment.insertMany(recruitmentData);
        console.log(`   ✅ Seeded ${recruitmentData.length} Recruitment records for endpoint parity`);


        // ==========================================
        // 3. SEED LOANS & LOAN REPORTS (EXACTLY 6 DATA)
        // ==========================================
        console.log('\n💳 Seeding EXACTLY 6 Loans and 6 Loan Reports...');
        await Loan.deleteMany({});
        await LoanReport.deleteMany({});

        const loansData = [
            {
                employeeId: getEmp(0)._id,
                amount: 5000,
                interestRate: 8.5,
                tenure: 12,
                startDate: new Date('2026-01-05'),
                endDate: new Date('2027-01-05'),
                status: 'active',
                monthlyInstallment: 436,
                totalPaid: 2500,
                remainingAmount: 2500,
                purpose: 'Personal home electronics & furniture purchase',
                approvedBy: adminUser._id,
                approvedAt: new Date('2026-01-05')
            },
            {
                employeeId: getEmp(1)._id,
                amount: 15000,
                interestRate: 7.5,
                tenure: 24,
                startDate: new Date('2025-11-01'),
                endDate: new Date('2027-11-01'),
                status: 'active',
                monthlyInstallment: 675,
                totalPaid: 6000,
                remainingAmount: 9000,
                purpose: 'Vehicle down-payment for daily commute',
                approvedBy: adminUser._id,
                approvedAt: new Date('2025-11-01')
            },
            {
                employeeId: getEmp(2)._id,
                amount: 25000,
                interestRate: 6.5,
                tenure: 36,
                startDate: new Date('2025-06-01'),
                endDate: new Date('2028-06-01'),
                status: 'active',
                monthlyInstallment: 766,
                totalPaid: 8000,
                remainingAmount: 17000,
                purpose: 'Residential apartment renovation & insulation',
                approvedBy: adminUser._id,
                approvedAt: new Date('2025-06-01')
            },
            {
                employeeId: getEmp(3)._id,
                amount: 8000,
                interestRate: 6.0,
                tenure: 18,
                startDate: new Date('2025-09-01'),
                endDate: new Date('2027-03-01'),
                status: 'active',
                monthlyInstallment: 466,
                totalPaid: 4000,
                remainingAmount: 4000,
                purpose: 'Executive MBA credential & certification fee',
                approvedBy: adminUser._id,
                approvedAt: new Date('2025-09-01')
            },
            {
                employeeId: getEmp(4)._id,
                amount: 3000,
                interestRate: 10.0,
                tenure: 6,
                startDate: new Date('2025-08-01'),
                endDate: new Date('2026-02-01'),
                status: 'paid',
                monthlyInstallment: 515,
                totalPaid: 3000,
                remainingAmount: 0,
                purpose: 'Emergency medical deductible coverage',
                approvedBy: adminUser._id,
                approvedAt: new Date('2025-08-01')
            },
            {
                employeeId: getEmp(5)._id,
                amount: 4500,
                interestRate: 8.0,
                tenure: 12,
                startDate: new Date('2026-02-15'),
                endDate: new Date('2027-02-15'),
                status: 'pending',
                monthlyInstallment: 391,
                totalPaid: 0,
                remainingAmount: 4500,
                purpose: 'Relocation expenses and lease deposit',
                approvedBy: adminUser._id,
                approvedAt: new Date('2026-02-15')
            }
        ];

        const insertedLoans = await Loan.insertMany(loansData);
        console.log(`   ✅ Seeded ${insertedLoans.length} Loans into MongoDB`);

        const loanDataList = insertedLoans.map((l, idx) => {
            const emp = getEmp(idx);
            return {
                loanId: l._id,
                employeeId: emp._id,
                employeeCode: emp.employeeCode || `EMP-${String(emp._id).slice(-4).toUpperCase()}`,
                employeeName: emp.name,
                department: emp.department || 'Software Development',
                position: emp.position || 'Specialist',
                amount: l.amount,
                interestRate: l.interestRate,
                tenure: l.tenure,
                monthlyInstallment: l.monthlyInstallment,
                totalPaid: l.totalPaid,
                remainingAmount: l.remainingAmount,
                status: l.status,
                startDate: l.startDate,
                endDate: l.endDate,
                purpose: l.purpose,
                paymentMethod: 'payroll_deduction',
                daysOverdue: 0,
                progressPercentage: l.amount > 0 ? Math.round((l.totalPaid / l.amount) * 100) : 0
            };
        });

        const sixLoanReports = [
            {
                title: 'Q1 2026 Corporate Employee Loan Portfolio Summary',
                reportType: 'summary',
                dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-03-31') },
                department: 'all',
                employeeIds: employees.map(e => e._id),
                loanIds: insertedLoans.map(l => l._id),
                filters: { status: 'all', minAmount: 0, maxAmount: null, paymentMethod: 'all' },
                summary: {
                    totalLoans: insertedLoans.length,
                    totalLoanAmount: 60500,
                    totalDisbursed: 56000,
                    totalRepaid: 23500,
                    totalOutstanding: 37000,
                    totalInterest: 4350,
                    activeLoans: 4,
                    paidLoans: 1,
                    defaultedLoans: 0,
                    pendingLoans: 1,
                    overdueLoans: 0,
                    averageLoanAmount: 10083,
                    averageInterestRate: 7.4,
                    averageTenure: 18,
                    recoveryRate: 38.8
                },
                loanData: loanDataList,
                departmentWiseData: [
                    { department: 'Software Development', totalLoans: 2, totalAmount: 30000, totalRepaid: 10500, totalOutstanding: 19500, activeLoans: 2, paidLoans: 0, defaultedLoans: 0, averageLoanAmount: 15000 },
                    { department: 'Marketing', totalLoans: 1, totalAmount: 15000, totalRepaid: 6000, totalOutstanding: 9000, activeLoans: 1, paidLoans: 0, defaultedLoans: 0, averageLoanAmount: 15000 },
                    { department: 'Human Resources', totalLoans: 1, totalAmount: 8000, totalRepaid: 4000, totalOutstanding: 4000, activeLoans: 1, paidLoans: 0, defaultedLoans: 0, averageLoanAmount: 8000 },
                    { department: 'Operations', totalLoans: 1, totalAmount: 3000, totalRepaid: 3000, totalOutstanding: 0, activeLoans: 0, paidLoans: 1, defaultedLoans: 0, averageLoanAmount: 3000 },
                    { department: 'Finance', totalLoans: 1, totalAmount: 4500, totalRepaid: 0, totalOutstanding: 4500, activeLoans: 0, paidLoans: 0, defaultedLoans: 0, averageLoanAmount: 4500 }
                ],
                statusWiseData: [
                    { status: 'active', count: 4, amount: 53000, percentage: 66.7 },
                    { status: 'paid', count: 1, amount: 3000, percentage: 16.7 },
                    { status: 'pending', count: 1, amount: 4500, percentage: 16.7 }
                ],
                monthlyTrendData: [
                    { year: 2026, month: 1, monthName: 'Jan 2026', disbursed: 5000, repaid: 2150, newLoans: 1, closedLoans: 0 },
                    { year: 2026, month: 2, monthName: 'Feb 2026', disbursed: 4500, repaid: 2350, newLoans: 1, closedLoans: 1 },
                    { year: 2026, month: 3, monthName: 'Mar 2026', disbursed: 0, repaid: 2450, newLoans: 0, closedLoans: 0 }
                ],
                generatedBy: adminUser._id,
                status: 'completed'
            },
            {
                title: 'Active Vehicle & Equipment Advance Assessment',
                reportType: 'active',
                dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-06-30') },
                department: 'all',
                employeeIds: employees.map(e => e._id),
                loanIds: [insertedLoans[1]._id, insertedLoans[2]._id],
                filters: { status: 'active', minAmount: 10000, maxAmount: null, paymentMethod: 'all' },
                summary: {
                    totalLoans: 2,
                    totalLoanAmount: 40000,
                    totalDisbursed: 40000,
                    totalRepaid: 14000,
                    totalOutstanding: 26000,
                    totalInterest: 2950,
                    activeLoans: 2,
                    paidLoans: 0,
                    defaultedLoans: 0,
                    pendingLoans: 0,
                    overdueLoans: 0,
                    averageLoanAmount: 20000,
                    averageInterestRate: 7.0,
                    averageTenure: 30,
                    recoveryRate: 35.0
                },
                loanData: [loanDataList[1], loanDataList[2]],
                departmentWiseData: [
                    { department: 'Marketing', totalLoans: 1, totalAmount: 15000, totalRepaid: 6000, totalOutstanding: 9000, activeLoans: 1, paidLoans: 0, defaultedLoans: 0, averageLoanAmount: 15000 },
                    { department: 'Software Development', totalLoans: 1, totalAmount: 25000, totalRepaid: 8000, totalOutstanding: 17000, activeLoans: 1, paidLoans: 0, defaultedLoans: 0, averageLoanAmount: 25000 }
                ],
                statusWiseData: [{ status: 'active', count: 2, amount: 40000, percentage: 100 }],
                generatedBy: adminUser._id,
                status: 'completed'
            },
            {
                title: 'Personal & Emergency Hardship Loan Review',
                reportType: 'detailed',
                dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-09-30') },
                department: 'all',
                employeeIds: employees.map(e => e._id),
                loanIds: [insertedLoans[0]._id, insertedLoans[4]._id, insertedLoans[5]._id],
                filters: { status: 'all', minAmount: 0, maxAmount: 6000, paymentMethod: 'all' },
                summary: {
                    totalLoans: 3,
                    totalLoanAmount: 12500,
                    totalDisbursed: 8000,
                    totalRepaid: 5500,
                    totalOutstanding: 7000,
                    totalInterest: 850,
                    activeLoans: 1,
                    paidLoans: 1,
                    defaultedLoans: 0,
                    pendingLoans: 1,
                    overdueLoans: 0,
                    averageLoanAmount: 4166,
                    averageInterestRate: 8.8,
                    averageTenure: 10,
                    recoveryRate: 44.0
                },
                loanData: [loanDataList[0], loanDataList[4], loanDataList[5]],
                statusWiseData: [
                    { status: 'active', count: 1, amount: 5000, percentage: 33.3 },
                    { status: 'paid', count: 1, amount: 3000, percentage: 33.3 },
                    { status: 'pending', count: 1, amount: 4500, percentage: 33.3 }
                ],
                generatedBy: adminUser._id,
                status: 'completed'
            },
            {
                title: 'Departmental Loan Allocation & Disbursal Breakdown',
                reportType: 'summary',
                dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-10-01') },
                department: 'Software Development',
                employeeIds: employees.filter(e => e.department === 'Software Development').map(e => e._id),
                loanIds: [insertedLoans[0]._id, insertedLoans[2]._id],
                filters: { status: 'all', minAmount: 0, maxAmount: null, paymentMethod: 'all' },
                summary: {
                    totalLoans: 2,
                    totalLoanAmount: 30000,
                    totalDisbursed: 30000,
                    totalRepaid: 10500,
                    totalOutstanding: 19500,
                    totalInterest: 2150,
                    activeLoans: 2,
                    paidLoans: 0,
                    defaultedLoans: 0,
                    pendingLoans: 0,
                    overdueLoans: 0,
                    averageLoanAmount: 15000,
                    averageInterestRate: 7.5,
                    averageTenure: 24,
                    recoveryRate: 35.0
                },
                loanData: [loanDataList[0], loanDataList[2]],
                departmentWiseData: [
                    { department: 'Software Development', totalLoans: 2, totalAmount: 30000, totalRepaid: 10500, totalOutstanding: 19500, activeLoans: 2, paidLoans: 0, defaultedLoans: 0, averageLoanAmount: 15000 }
                ],
                statusWiseData: [{ status: 'active', count: 2, amount: 30000, percentage: 100 }],
                generatedBy: adminUser._id,
                status: 'completed'
            },
            {
                title: 'Loan Repayment Schedules & Interest Recovery Audit',
                reportType: 'paid',
                dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-10-06') },
                department: 'all',
                employeeIds: employees.map(e => e._id),
                loanIds: [insertedLoans[4]._id],
                filters: { status: 'paid', minAmount: 0, maxAmount: null, paymentMethod: 'all' },
                summary: {
                    totalLoans: 1,
                    totalLoanAmount: 3000,
                    totalDisbursed: 3000,
                    totalRepaid: 3000,
                    totalOutstanding: 0,
                    totalInterest: 300,
                    activeLoans: 0,
                    paidLoans: 1,
                    defaultedLoans: 0,
                    pendingLoans: 0,
                    overdueLoans: 0,
                    averageLoanAmount: 3000,
                    averageInterestRate: 10.0,
                    averageTenure: 6,
                    recoveryRate: 100.0
                },
                loanData: [loanDataList[4]],
                statusWiseData: [{ status: 'paid', count: 1, amount: 3000, percentage: 100 }],
                generatedBy: adminUser._id,
                status: 'completed'
            },
            {
                title: 'Annual Financial Risk & Delinquency Exposure 2026',
                reportType: 'detailed',
                dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') },
                department: 'all',
                employeeIds: employees.map(e => e._id),
                loanIds: insertedLoans.map(l => l._id),
                filters: { status: 'all', minAmount: 0, maxAmount: null, paymentMethod: 'all' },
                summary: {
                    totalLoans: 6,
                    totalLoanAmount: 60500,
                    totalDisbursed: 56000,
                    totalRepaid: 23500,
                    totalOutstanding: 37000,
                    totalInterest: 4350,
                    activeLoans: 4,
                    paidLoans: 1,
                    defaultedLoans: 0,
                    pendingLoans: 1,
                    overdueLoans: 0,
                    averageLoanAmount: 10083,
                    averageInterestRate: 7.4,
                    averageTenure: 18,
                    recoveryRate: 38.8
                },
                loanData: loanDataList,
                departmentWiseData: [
                    { department: 'Software Development', totalLoans: 2, totalAmount: 30000, totalRepaid: 10500, totalOutstanding: 19500, activeLoans: 2, paidLoans: 0, defaultedLoans: 0, averageLoanAmount: 15000 },
                    { department: 'Marketing', totalLoans: 1, totalAmount: 15000, totalRepaid: 6000, totalOutstanding: 9000, activeLoans: 1, paidLoans: 0, defaultedLoans: 0, averageLoanAmount: 15000 },
                    { department: 'Human Resources', totalLoans: 1, totalAmount: 8000, totalRepaid: 4000, totalOutstanding: 4000, activeLoans: 1, paidLoans: 0, defaultedLoans: 0, averageLoanAmount: 8000 },
                    { department: 'Operations', totalLoans: 1, totalAmount: 3000, totalRepaid: 3000, totalOutstanding: 0, activeLoans: 0, paidLoans: 1, defaultedLoans: 0, averageLoanAmount: 3000 },
                    { department: 'Finance', totalLoans: 1, totalAmount: 4500, totalRepaid: 0, totalOutstanding: 4500, activeLoans: 0, paidLoans: 0, defaultedLoans: 0, averageLoanAmount: 4500 }
                ],
                statusWiseData: [
                    { status: 'active', count: 4, amount: 53000, percentage: 66.7 },
                    { status: 'paid', count: 1, amount: 3000, percentage: 16.7 },
                    { status: 'pending', count: 1, amount: 4500, percentage: 16.7 }
                ],
                generatedBy: adminUser._id,
                status: 'completed'
            }
        ];

        const insertedLoanReports = await LoanReport.insertMany(sixLoanReports);
        console.log(`   ✅ Seeded ${insertedLoanReports.length} Loan Reports into LoanReport collection`);


        // ==========================================
        // 4. SEED PAYSLIPS & PAYSLIP HISTORIES (EXACTLY 6 DATA)
        // ==========================================
        console.log('\n💵 Seeding EXACTLY 6 Payslips and 6 Payslip Histories...');
        await Payslip.deleteMany({});
        await PayslipHistory.deleteMany({});

        const payslipsData = [
            {
                employeeId: getEmp(0)._id,
                employeeName: getEmp(0).name,
                employeeCode: 'EMP-0001',
                department: 'Software Development',
                position: 'Lead Software Engineer',
                payPeriod: { month: 1, year: 2026 },
                payslipNumber: 'PS-2026-0001',
                earnings: { basicSalary: 5000, houseAllowance: 600, transportAllowance: 250, medicalAllowance: 150, bonus: 500, overtime: 0, otherEarnings: 0 },
                deductions: { tax: 150, pension: 100, loanRepayment: 50, insurance: 0, otherDeductions: 0 },
                totalEarnings: 6500,
                totalDeductions: 300,
                netPay: 6200,
                status: 'generated',
                paymentMethod: 'bank_transfer',
                bankDetails: { bankName: 'Chase Bank', accountNumber: '1234567890', accountHolder: 'John Doe' },
                generatedBy: adminUser._id
            },
            {
                employeeId: getEmp(1)._id,
                employeeName: getEmp(1).name,
                employeeCode: 'EMP-0002',
                department: 'Marketing',
                position: 'Marketing Director',
                payPeriod: { month: 1, year: 2026 },
                payslipNumber: 'PS-2026-0002',
                earnings: { basicSalary: 4500, houseAllowance: 500, transportAllowance: 200, medicalAllowance: 100, bonus: 400, overtime: 0, otherEarnings: 0 },
                deductions: { tax: 130, pension: 80, loanRepayment: 40, insurance: 0, otherDeductions: 0 },
                totalEarnings: 5700,
                totalDeductions: 250,
                netPay: 5450,
                status: 'paid',
                paymentMethod: 'bank_transfer',
                bankDetails: { bankName: 'Bank of America', accountNumber: '0987654321', accountHolder: 'Jane Smith' },
                generatedBy: adminUser._id
            },
            {
                employeeId: getEmp(2)._id,
                employeeName: getEmp(2).name,
                employeeCode: 'EMP-0003',
                department: 'Software Development',
                position: 'Senior Frontend Developer',
                payPeriod: { month: 1, year: 2026 },
                payslipNumber: 'PS-2026-0003',
                earnings: { basicSalary: 4600, houseAllowance: 450, transportAllowance: 180, medicalAllowance: 120, bonus: 300, overtime: 0, otherEarnings: 0 },
                deductions: { tax: 140, pension: 80, loanRepayment: 40, insurance: 0, otherDeductions: 0 },
                totalEarnings: 5650,
                totalDeductions: 260,
                netPay: 5390,
                status: 'sent',
                paymentMethod: 'bank_transfer',
                bankDetails: { bankName: 'Wells Fargo', accountNumber: '5678901234', accountHolder: 'Robert Brown' },
                generatedBy: adminUser._id
            },
            {
                employeeId: getEmp(3)._id,
                employeeName: getEmp(3).name,
                employeeCode: 'EMP-0004',
                department: 'Human Resources',
                position: 'HR Manager',
                payPeriod: { month: 1, year: 2026 },
                payslipNumber: 'PS-2026-0004',
                earnings: { basicSalary: 4000, houseAllowance: 350, transportAllowance: 150, medicalAllowance: 100, bonus: 400, overtime: 0, otherEarnings: 0 },
                deductions: { tax: 100, pension: 50, loanRepayment: 30, insurance: 0, otherDeductions: 0 },
                totalEarnings: 5000,
                totalDeductions: 180,
                netPay: 4820,
                status: 'generated',
                paymentMethod: 'bank_transfer',
                bankDetails: { bankName: 'Citibank', accountNumber: '4321098765', accountHolder: 'Emily Davis' },
                generatedBy: adminUser._id
            },
            {
                employeeId: getEmp(4)._id,
                employeeName: getEmp(4).name,
                employeeCode: 'EMP-0005',
                department: 'Operations',
                position: 'Operations Supervisor',
                payPeriod: { month: 1, year: 2026 },
                payslipNumber: 'PS-2026-0005',
                earnings: { basicSalary: 3800, houseAllowance: 300, transportAllowance: 120, medicalAllowance: 80, bonus: 200, overtime: 0, otherEarnings: 0 },
                deductions: { tax: 80, pension: 40, loanRepayment: 30, insurance: 0, otherDeductions: 0 },
                totalEarnings: 4500,
                totalDeductions: 150,
                netPay: 4350,
                status: 'paid',
                paymentMethod: 'bank_transfer',
                bankDetails: { bankName: 'PNC Bank', accountNumber: '7890123456', accountHolder: 'Michael Green' },
                generatedBy: adminUser._id
            },
            {
                employeeId: getEmp(5)._id,
                employeeName: getEmp(5).name,
                employeeCode: 'EMP-0006',
                department: 'Finance',
                position: 'Senior Financial Analyst',
                payPeriod: { month: 2, year: 2026 },
                payslipNumber: 'PS-2026-0006',
                earnings: { basicSalary: 5200, houseAllowance: 650, transportAllowance: 250, medicalAllowance: 200, bonus: 600, overtime: 0, otherEarnings: 0 },
                deductions: { tax: 180, pension: 100, loanRepayment: 70, insurance: 0, otherDeductions: 0 },
                totalEarnings: 6900,
                totalDeductions: 350,
                netPay: 6550,
                status: 'draft',
                paymentMethod: 'bank_transfer',
                bankDetails: { bankName: 'Capital One', accountNumber: '9876543210', accountHolder: 'David Miller' },
                generatedBy: adminUser._id
            }
        ];

        const insertedPayslips = await Payslip.insertMany(payslipsData);
        console.log(`   ✅ Seeded ${insertedPayslips.length} Payslips into MongoDB`);

        const payslipHistoriesData = [
            {
                payslipId: insertedPayslips[0]._id,
                payslipNumber: 'PS-2026-0001',
                employeeId: getEmp(0)._id,
                employeeName: getEmp(0).name,
                employeeCode: 'EMP-0001',
                department: 'Software Development',
                position: 'Lead Software Engineer',
                action: 'generated',
                previousStatus: 'draft',
                newStatus: 'generated',
                payPeriod: { month: 1, year: 2026 },
                snapshot: {
                    earnings: insertedPayslips[0].earnings,
                    deductions: insertedPayslips[0].deductions,
                    totalEarnings: 6500,
                    totalDeductions: 300,
                    netPay: 6200,
                    paymentMethod: 'bank_transfer',
                    bankDetails: insertedPayslips[0].bankDetails
                },
                performedBy: adminUser._id,
                performedByName: adminUser.name || 'CRM Administrator',
                performedByEmail: adminUser.email || 'admin@crm.com',
                performedByRole: 'admin',
                notes: 'Automated monthly payroll run executed successfully'
            },
            {
                payslipId: insertedPayslips[1]._id,
                payslipNumber: 'PS-2026-0002',
                employeeId: getEmp(1)._id,
                employeeName: getEmp(1).name,
                employeeCode: 'EMP-0002',
                department: 'Marketing',
                position: 'Marketing Director',
                action: 'paid',
                previousStatus: 'generated',
                newStatus: 'paid',
                payPeriod: { month: 1, year: 2026 },
                snapshot: {
                    earnings: insertedPayslips[1].earnings,
                    deductions: insertedPayslips[1].deductions,
                    totalEarnings: 5700,
                    totalDeductions: 250,
                    netPay: 5450,
                    paymentMethod: 'bank_transfer',
                    bankDetails: insertedPayslips[1].bankDetails
                },
                performedBy: adminUser._id,
                performedByName: adminUser.name || 'CRM Administrator',
                performedByEmail: adminUser.email || 'admin@crm.com',
                performedByRole: 'admin',
                notes: 'Direct ACH corporate disbursement verified'
            },
            {
                payslipId: insertedPayslips[2]._id,
                payslipNumber: 'PS-2026-0003',
                employeeId: getEmp(2)._id,
                employeeName: getEmp(2).name,
                employeeCode: 'EMP-0003',
                department: 'Software Development',
                position: 'Senior Frontend Developer',
                action: 'sent',
                previousStatus: 'generated',
                newStatus: 'sent',
                payPeriod: { month: 1, year: 2026 },
                snapshot: {
                    earnings: insertedPayslips[2].earnings,
                    deductions: insertedPayslips[2].deductions,
                    totalEarnings: 5650,
                    totalDeductions: 260,
                    netPay: 5390,
                    paymentMethod: 'bank_transfer',
                    bankDetails: insertedPayslips[2].bankDetails
                },
                performedBy: adminUser._id,
                performedByName: adminUser.name || 'CRM Administrator',
                performedByEmail: adminUser.email || 'admin@crm.com',
                performedByRole: 'admin',
                notes: 'Digital payslip dispatched to employee self-service portal'
            },
            {
                payslipId: insertedPayslips[3]._id,
                payslipNumber: 'PS-2026-0004',
                employeeId: getEmp(3)._id,
                employeeName: getEmp(3).name,
                employeeCode: 'EMP-0004',
                department: 'Human Resources',
                position: 'HR Manager',
                action: 'email_sent',
                previousStatus: 'generated',
                newStatus: 'generated',
                payPeriod: { month: 1, year: 2026 },
                snapshot: {
                    earnings: insertedPayslips[3].earnings,
                    deductions: insertedPayslips[3].deductions,
                    totalEarnings: 5000,
                    totalDeductions: 180,
                    netPay: 4820,
                    paymentMethod: 'bank_transfer',
                    bankDetails: insertedPayslips[3].bankDetails
                },
                performedBy: adminUser._id,
                performedByName: adminUser.name || 'CRM Administrator',
                performedByEmail: adminUser.email || 'admin@crm.com',
                performedByRole: 'admin',
                notes: 'Encrypted PDF salary slip delivered to corporate inbox'
            },
            {
                payslipId: insertedPayslips[4]._id,
                payslipNumber: 'PS-2026-0005',
                employeeId: getEmp(4)._id,
                employeeName: getEmp(4).name,
                employeeCode: 'EMP-0005',
                department: 'Operations',
                position: 'Operations Supervisor',
                action: 'paid',
                previousStatus: 'sent',
                newStatus: 'paid',
                payPeriod: { month: 1, year: 2026 },
                snapshot: {
                    earnings: insertedPayslips[4].earnings,
                    deductions: insertedPayslips[4].deductions,
                    totalEarnings: 4500,
                    totalDeductions: 150,
                    netPay: 4350,
                    paymentMethod: 'bank_transfer',
                    bankDetails: insertedPayslips[4].bankDetails
                },
                performedBy: adminUser._id,
                performedByName: adminUser.name || 'CRM Administrator',
                performedByEmail: adminUser.email || 'admin@crm.com',
                performedByRole: 'admin',
                notes: 'Salary wire completed and confirmed by PNC Treasury'
            },
            {
                payslipId: insertedPayslips[5]._id,
                payslipNumber: 'PS-2026-0006',
                employeeId: getEmp(5)._id,
                employeeName: getEmp(5).name,
                employeeCode: 'EMP-0006',
                department: 'Finance',
                position: 'Senior Financial Analyst',
                action: 'created',
                previousStatus: null,
                newStatus: 'draft',
                payPeriod: { month: 2, year: 2026 },
                snapshot: {
                    earnings: insertedPayslips[5].earnings,
                    deductions: insertedPayslips[5].deductions,
                    totalEarnings: 6900,
                    totalDeductions: 350,
                    netPay: 6550,
                    paymentMethod: 'bank_transfer',
                    bankDetails: insertedPayslips[5].bankDetails
                },
                performedBy: adminUser._id,
                performedByName: adminUser.name || 'CRM Administrator',
                performedByEmail: adminUser.email || 'admin@crm.com',
                performedByRole: 'admin',
                notes: 'Draft February salary voucher prepared for leadership approval'
            }
        ];

        const insertedPayslipHistories = await PayslipHistory.insertMany(payslipHistoriesData);
        console.log(`   ✅ Seeded ${insertedPayslipHistories.length} Payslip Histories into MongoDB`);


        // ==========================================
        // 5. SEED SAVED REPORTS (EXACTLY 6 DATA)
        // ==========================================
        console.log('\n📑 Seeding EXACTLY 6 Saved Reports...');
        await SavedReport.deleteMany({});

        const savedReportsData = [
            {
                name: 'Monthly Employee Attendance & Punctuality Audit',
                description: 'Comprehensive monthly attendance audit tracking employee check-ins, punctuality rates, and leave anomalies across all teams.',
                reportCategory: 'attendance',
                reportType: 'summary',
                configuration: {
                    dateRange: {
                        startDate: new Date('2026-01-01'),
                        endDate: new Date('2026-01-31'),
                        preset: 'this_month'
                    },
                    filters: { department: 'all', minAttendanceRate: 85 },
                    columns: [
                        { key: 'employeeName', label: 'Employee Name', width: 200, align: 'left' },
                        { key: 'department', label: 'Department', width: 160, align: 'left' },
                        { key: 'presentDays', label: 'Present Days', width: 120, align: 'center' },
                        { key: 'lateCount', label: 'Late Clock-Ins', width: 120, align: 'center' },
                        { key: 'attendanceRate', label: 'Punctuality %', width: 120, align: 'right' }
                    ],
                    sorting: { field: 'attendanceRate', direction: 'desc' },
                    groupBy: 'department',
                    aggregations: [
                        { field: 'attendanceRate', type: 'avg', label: 'Average Department Attendance' },
                        { field: 'presentDays', type: 'sum', label: 'Total Present Days' }
                    ],
                    charts: [
                        { type: 'bar', title: 'Department Attendance Averages', dataKey: 'attendanceRate', labelKey: 'department' }
                    ],
                    exportOptions: { format: 'pdf', includeCharts: true, includeSummary: true }
                },
                visibility: 'public',
                usageCount: 14,
                lastUsedAt: new Date('2026-02-01'),
                lastRunAt: new Date('2026-02-01'),
                runHistory: [
                    { runAt: new Date('2026-02-01'), runBy: adminUser._id, runByName: adminUser.name, rowCount: 8, executionTimeMs: 120, status: 'success' }
                ],
                schedule: { enabled: true, frequency: 'monthly', dayOfMonth: 1, time: '09:00' },
                tags: ['Attendance', 'HR', 'Punctuality', 'Monthly'],
                isFavorite: true,
                isTemplate: true,
                createdBy: adminUser._id,
                createdByName: adminUser.name || 'CRM Administrator'
            },
            {
                name: 'Cross-Departmental Performance & KPI Assessment',
                description: 'Departmental performance reviews, peer nominations, milestone deliverables, and staff merit scoring distribution.',
                reportCategory: 'employee',
                reportType: 'performance',
                configuration: {
                    dateRange: {
                        startDate: new Date('2025-10-01'),
                        endDate: new Date('2025-12-31'),
                        preset: 'last_quarter'
                    },
                    filters: { rating: 'all', includeReviews: true },
                    columns: [
                        { key: 'name', label: 'Staff Member', width: 200, align: 'left' },
                        { key: 'department', label: 'Department', width: 160, align: 'left' },
                        { key: 'performanceRating', label: 'Rating', width: 120, align: 'center' },
                        { key: 'kpisMet', label: 'KPIs Achieved', width: 130, align: 'center' },
                        { key: 'bonusTier', label: 'Bonus Tier', width: 130, align: 'right' }
                    ],
                    sorting: { field: 'kpisMet', direction: 'desc' },
                    groupBy: 'department',
                    charts: [
                        { type: 'pie', title: 'Performance Tier Distribution', dataKey: 'performanceRating', labelKey: 'tier' }
                    ],
                    exportOptions: { format: 'excel', includeCharts: true, includeSummary: true }
                },
                visibility: 'public',
                usageCount: 22,
                lastUsedAt: new Date('2026-01-15'),
                lastRunAt: new Date('2026-01-15'),
                runHistory: [
                    { runAt: new Date('2026-01-15'), runBy: adminUser._id, runByName: adminUser.name, rowCount: 8, executionTimeMs: 145, status: 'success' }
                ],
                schedule: { enabled: false },
                tags: ['Performance', 'KPI', 'Quarterly', 'Evaluation'],
                isFavorite: true,
                isTemplate: true,
                createdBy: adminUser._id,
                createdByName: adminUser.name || 'CRM Administrator'
            },
            {
                name: 'Quarterly Leave Utilization & Accrual Balance Summary',
                reportCategory: 'leave',
                reportType: 'detailed',
                description: 'Detailed analysis of annual leave entitlements, casual leave, sick leaves taken, and outstanding carry-forward balances.',
                configuration: {
                    dateRange: {
                        startDate: new Date('2026-01-01'),
                        endDate: new Date('2026-03-31'),
                        preset: 'this_quarter'
                    },
                    filters: { leaveType: 'all', approvedOnly: true },
                    columns: [
                        { key: 'employeeName', label: 'Employee', width: 200, align: 'left' },
                        { key: 'department', label: 'Department', width: 160, align: 'left' },
                        { key: 'annualTaken', label: 'Annual Days', width: 120, align: 'center' },
                        { key: 'sickTaken', label: 'Sick Days', width: 120, align: 'center' },
                        { key: 'balanceRemaining', label: 'Accrual Balance', width: 140, align: 'right' }
                    ],
                    sorting: { field: 'annualTaken', direction: 'desc' },
                    charts: [
                        { type: 'doughnut', title: 'Leave Types Taken', dataKey: 'count', labelKey: 'leaveType' }
                    ],
                    exportOptions: { format: 'pdf', includeCharts: false, includeSummary: true }
                },
                visibility: 'public',
                usageCount: 9,
                lastUsedAt: new Date('2026-02-10'),
                lastRunAt: new Date('2026-02-10'),
                runHistory: [
                    { runAt: new Date('2026-02-10'), runBy: adminUser._id, runByName: adminUser.name, rowCount: 8, executionTimeMs: 95, status: 'success' }
                ],
                schedule: { enabled: true, frequency: 'quarterly', dayOfMonth: 1, time: '08:30' },
                tags: ['Leave', 'HR', 'Accruals', 'Quarterly'],
                isFavorite: false,
                isTemplate: true,
                createdBy: adminUser._id,
                createdByName: adminUser.name || 'CRM Administrator'
            },
            {
                name: 'Corporate Milestone & Project Delivery Timeline',
                reportCategory: 'project',
                reportType: 'milestone',
                description: 'Executive project tracking, deliverable sprint completion rates, task burndowns, and cross-team resource allocations.',
                configuration: {
                    dateRange: {
                        startDate: new Date('2025-11-01'),
                        endDate: new Date('2026-02-28'),
                        preset: 'custom'
                    },
                    filters: { projectStatus: 'in_progress', priority: 'high' },
                    columns: [
                        { key: 'projectName', label: 'Project Name', width: 220, align: 'left' },
                        { key: 'lead', label: 'Tech Lead', width: 160, align: 'left' },
                        { key: 'progress', label: 'Completion %', width: 120, align: 'center' },
                        { key: 'tasksRemaining', label: 'Open Tasks', width: 120, align: 'center' },
                        { key: 'deadline', label: 'Target Date', width: 140, align: 'right' }
                    ],
                    sorting: { field: 'progress', direction: 'asc' },
                    charts: [
                        { type: 'bar', title: 'Project Completion Velocity', dataKey: 'progress', labelKey: 'projectName' }
                    ],
                    exportOptions: { format: 'excel', includeCharts: true, includeSummary: true }
                },
                visibility: 'public',
                usageCount: 18,
                lastUsedAt: new Date('2026-02-18'),
                lastRunAt: new Date('2026-02-18'),
                runHistory: [
                    { runAt: new Date('2026-02-18'), runBy: adminUser._id, runByName: adminUser.name, rowCount: 6, executionTimeMs: 160, status: 'success' }
                ],
                schedule: { enabled: true, frequency: 'weekly', dayOfWeek: 1, time: '09:00' },
                tags: ['Projects', 'Engineering', 'Milestones', 'Delivery'],
                isFavorite: true,
                isTemplate: true,
                createdBy: adminUser._id,
                createdByName: adminUser.name || 'CRM Administrator'
            },
            {
                name: 'Enterprise Loan Portfolio Risk & Recovery Metrics',
                reportCategory: 'loan',
                reportType: 'risk_audit',
                description: 'Audit of disbursed employee loans, monthly payroll installment withholdings, outstanding principal balances, and recovery ratios.',
                configuration: {
                    dateRange: {
                        startDate: new Date('2026-01-01'),
                        endDate: new Date('2026-06-30'),
                        preset: 'this_year'
                    },
                    filters: { status: 'all', minOutstanding: 1000 },
                    columns: [
                        { key: 'employeeName', label: 'Borrower', width: 200, align: 'left' },
                        { key: 'loanType', label: 'Category', width: 140, align: 'left' },
                        { key: 'amount', label: 'Original Principal', width: 140, align: 'right' },
                        { key: 'totalPaid', label: 'Amortized Paid', width: 140, align: 'right' },
                        { key: 'remaining', label: 'Balance Due', width: 140, align: 'right' }
                    ],
                    sorting: { field: 'remaining', direction: 'desc' },
                    charts: [
                        { type: 'doughnut', title: 'Loan Balance by Category', dataKey: 'remaining', labelKey: 'loanType' }
                    ],
                    exportOptions: { format: 'pdf', includeCharts: true, includeSummary: true }
                },
                visibility: 'public',
                usageCount: 11,
                lastUsedAt: new Date('2026-02-05'),
                lastRunAt: new Date('2026-02-05'),
                runHistory: [
                    { runAt: new Date('2026-02-05'), runBy: adminUser._id, runByName: adminUser.name, rowCount: 6, executionTimeMs: 110, status: 'success' }
                ],
                schedule: { enabled: false },
                tags: ['Loan', 'Finance', 'Audit', 'Risk'],
                isFavorite: false,
                isTemplate: true,
                createdBy: adminUser._id,
                createdByName: adminUser.name || 'CRM Administrator'
            },
            {
                name: 'Consolidated Executive Payroll & Compensation Audit',
                reportCategory: 'payslip',
                reportType: 'financial',
                description: 'Corporate payroll disbursement audit, tax obligations, medical withholdings, allowances, and net salary distributions.',
                configuration: {
                    dateRange: {
                        startDate: new Date('2026-01-01'),
                        endDate: new Date('2026-01-31'),
                        preset: 'this_month'
                    },
                    filters: { department: 'all', status: 'paid' },
                    columns: [
                        { key: 'employeeName', label: 'Employee Name', width: 200, align: 'left' },
                        { key: 'department', label: 'Department', width: 160, align: 'left' },
                        { key: 'basicSalary', label: 'Base Pay', width: 130, align: 'right' },
                        { key: 'allowances', label: 'Allowances', width: 130, align: 'right' },
                        { key: 'deductions', label: 'Deductions', width: 130, align: 'right' },
                        { key: 'netPay', label: 'Net Disbursed', width: 140, align: 'right' }
                    ],
                    sorting: { field: 'netPay', direction: 'desc' },
                    groupBy: 'department',
                    charts: [
                        { type: 'bar', title: 'Department Payroll Outlay', dataKey: 'netPay', labelKey: 'department' }
                    ],
                    exportOptions: { format: 'excel', includeCharts: true, includeSummary: true }
                },
                visibility: 'public',
                usageCount: 29,
                lastUsedAt: new Date('2026-02-01'),
                lastRunAt: new Date('2026-02-01'),
                runHistory: [
                    { runAt: new Date('2026-02-01'), runBy: adminUser._id, runByName: adminUser.name, rowCount: 6, executionTimeMs: 130, status: 'success' }
                ],
                schedule: { enabled: true, frequency: 'monthly', dayOfMonth: 30, time: '17:00' },
                tags: ['Payroll', 'Finance', 'Executive', 'Compensation'],
                isFavorite: true,
                isTemplate: true,
                createdBy: adminUser._id,
                createdByName: adminUser.name || 'CRM Administrator'
            }
        ];

        const insertedSavedReports = await SavedReport.insertMany(savedReportsData);
        console.log(`   ✅ Seeded ${insertedSavedReports.length} Saved Reports into MongoDB`);

        console.log('\n============================================================');
        console.log('🎉 SEEDING OF EXACTLY 6 DATA ITEMS PER MODULE COMPLETE:');
        console.log(`   1. Employee Reports: ${insertedEmpReports.length} documents`);
        console.log(`   2. Job Postings:     ${insertedJobs.length} documents (+ ${recruitmentData.length} recruitments)`);
        console.log(`   3. Loan Reports:     ${insertedLoanReports.length} documents (+ ${insertedLoans.length} loans)`);
        console.log(`   4. Payslip History:  ${insertedPayslipHistories.length} documents (+ ${insertedPayslips.length} payslips)`);
        console.log(`   5. Saved Reports:    ${insertedSavedReports.length} documents`);
        console.log('============================================================\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Error:', error);
        process.exit(1);
    }
};

seedSixDataModules();
