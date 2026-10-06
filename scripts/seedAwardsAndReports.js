const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Award = require('../models/Award');
const AwardReport = require('../models/AwardReport');
const Employee = require('../models/Employee');
const User = require('../models/User');

const getMonthName = (m) => new Date(2026, m - 1, 1).toLocaleString('default', { month: 'short' });
const getQuarter = (m) => (m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4');

const seedAwardsAndReports = async () => {
    try {
        console.log('🏆 Starting Award & Award Reports Seeding...');
        await connectDB();

        // 1. Get or create Admin user for generatedBy
        let adminUser = await User.findOne({ email: 'admin@crm.com' });
        if (!adminUser) {
            adminUser = await User.findOne({});
        }
        if (!adminUser) {
            adminUser = await User.create({
                name: 'CRM Administrator',
                email: 'admin@crm.com',
                password: 'password123',
                role: 'admin',
                status: 'active'
            });
            console.log('   ✅ Created default admin user for reports');
        }

        // 2. Fetch existing employees
        let employees = await Employee.find({ status: { $ne: 'inactive' } });
        if (employees.length === 0) {
            employees = await Employee.find({});
        }
        if (employees.length === 0) {
            throw new Error('No employees found in database! Please run seedAll.js first.');
        }

        console.log(`   Found ${employees.length} employees to associate with awards.`);

        const empMap = {};
        employees.forEach(e => {
            empMap[e.name] = e;
        });

        // Helper to get employee safely
        const getEmp = (index, fallbackName, dept, pos) => {
            if (employees[index]) return employees[index];
            return employees[0];
        };

        const emp0 = getEmp(0); // John Doe (Software Development)
        const emp1 = getEmp(1); // Jane Smith (Marketing)
        const emp2 = getEmp(2); // Robert Brown (Software Development)
        const emp3 = getEmp(3); // Emily Davis (Human Resources)
        const emp4 = getEmp(4); // Michael Green (Operations)
        const emp5 = getEmp(5); // David Miller (Finance)
        const emp6 = getEmp(6); // Sarah Williams (Software Development)
        const emp7 = getEmp(7); // Alex Turner (Marketing)

        // 3. Seed Awards
        console.log('🎖️ Seeding 8 Awards with complete details & monetary amounts...');
        await Award.deleteMany({});

        const awardsData = [
            {
                employeeId: emp0._id,
                employeeName: emp0.name,
                department: emp0.department || 'Software Development',
                awardName: 'Gascapitol Enterprise Pioneer Award',
                type: 'gascapitol',
                amount: 1500,
                date: new Date('2026-02-15'),
                presentedBy: 'Executive Leadership',
                certificate: 'CERT-2026-001',
                description: 'Pioneered new cloud microservices architecture saving 40% compute overhead.'
            },
            {
                employeeId: emp1._id,
                employeeName: emp1.name,
                department: emp1.department || 'Marketing',
                awardName: 'Coby Beach Growth Champion',
                type: 'coby_beach',
                amount: 1200,
                date: new Date('2026-03-20'),
                presentedBy: 'Chief Marketing Officer',
                certificate: 'CERT-2026-002',
                description: 'Spearheaded Q1 product expansion drive resulting in 180% inbound lead boost.'
            },
            {
                employeeId: emp2._id,
                employeeName: emp2.name,
                department: emp2.department || 'Software Development',
                awardName: 'Code Quality & Architecture Champion',
                type: 'innovation',
                amount: 1000,
                date: new Date('2026-04-10'),
                presentedBy: 'VP of Engineering',
                certificate: 'CERT-2026-003',
                description: 'Achieved zero critical defect rate for two consecutive release cycles.'
            },
            {
                employeeId: emp3._id,
                employeeName: emp3.name,
                department: emp3.department || 'Human Resources',
                awardName: 'People & Culture Leadership Star',
                type: 'leadership',
                amount: 900,
                date: new Date('2026-05-18'),
                presentedBy: 'Head of People Operations',
                certificate: 'CERT-2026-004',
                description: 'Transformed onboarding workflow reducing time-to-productivity by 35%.'
            },
            {
                employeeId: emp4._id,
                employeeName: emp4.name,
                department: emp4.department || 'Operations',
                awardName: 'Best Team Player of the Quarter',
                type: 'team_player',
                amount: 750,
                date: new Date('2026-06-25'),
                presentedBy: 'Operations Director',
                certificate: 'CERT-2026-005',
                description: 'Exemplary cross-departmental alignment and critical incident resolution.'
            },
            {
                employeeId: emp5._id,
                employeeName: emp5.name,
                department: emp5.department || 'Finance',
                awardName: 'Best Employee of the Year',
                type: 'best_employee',
                amount: 1400,
                date: new Date('2026-07-15'),
                presentedBy: 'Chief Financial Officer',
                certificate: 'CERT-2026-006',
                description: 'Flawless audit execution and departmental cost-efficiency modeling.'
            },
            {
                employeeId: emp6._id,
                employeeName: emp6.name,
                department: emp6.department || 'Software Development',
                awardName: 'Innovation in AI Automation',
                type: 'innovation',
                amount: 1100,
                date: new Date('2026-09-12'),
                presentedBy: 'Chief Technology Officer',
                certificate: 'CERT-2026-007',
                description: 'Built an internal AI agent toolchain accelerating bug triage by 50%.'
            },
            {
                employeeId: emp7._id,
                employeeName: emp7.name,
                department: emp7.department || 'Marketing',
                awardName: 'Creative Content Excellence',
                type: 'best_employee',
                amount: 850,
                date: new Date('2026-09-28'),
                presentedBy: 'Marketing Director',
                certificate: 'CERT-2026-008',
                description: 'Produced viral product showcase garnering 250,000 organic impressions.'
            }
        ];

        const insertedAwards = await Award.insertMany(awardsData);
        console.log(`   ✅ Seeded ${insertedAwards.length} Awards into MongoDB`);

        // 4. Helper function to compile award report structure
        const buildReportObject = (title, reportType, startDate, endDate, departmentFilter, awardTypeFilter, notes) => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            // Filter awards for this report
            const matchedAwards = insertedAwards.filter(a => {
                const aDate = new Date(a.date);
                if (aDate < start || aDate > end) return false;
                if (departmentFilter && departmentFilter !== 'all' && a.department !== departmentFilter) return false;
                if (awardTypeFilter && awardTypeFilter !== 'all' && a.type !== awardTypeFilter) return false;
                return true;
            });

            // Calculate aggregations
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

                // Dept
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

                // Emp
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

                // Type
                if (!typeAggMap[a.type]) {
                    typeAggMap[a.type] = { count: 0, totalAmount: 0 };
                }
                typeAggMap[a.type].count++;
                typeAggMap[a.type].totalAmount += (a.amount || 0);

                // Monthly
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

                // Quarterly
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
                    position: employees.find(e => String(e._id) === String(a.employeeId))?.position || 'Staff',
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

        // 5. Build Exactly 6 Award Reports
        console.log('📊 Seeding EXACTLY 6 Award Reports into AwardReport collection...');
        await AwardReport.deleteMany({});

        const sixAwardReports = [
            // Report 1: Q1 2026 Corporate Recognition & Merit Report
            buildReportObject(
                'Q1 2026 Corporate Recognition & Merit Report',
                'summary',
                '2026-01-01',
                '2026-03-31',
                'all',
                'all',
                'Executive corporate summary of Q1 achievements and top honor recipients.'
            ),
            // Report 2: Software Engineering Innovation & Quality Awards
            buildReportObject(
                'Software Engineering Innovation & Quality Awards',
                'department',
                '2026-01-01',
                '2026-09-30',
                'Software Development',
                'all',
                'Technical department review covering cloud migrations, code quality, and AI automation.'
            ),
            // Report 3: Marketing & Brand Growth Honors Summary
            buildReportObject(
                'Marketing & Brand Growth Honors Summary',
                'department',
                '2026-01-01',
                '2026-09-30',
                'Marketing',
                'all',
                'Marketing campaign leadership awards and organic expansion milestones.'
            ),
            // Report 4: Company-Wide Best Employee & Team Player Awards
            buildReportObject(
                'Company-Wide Best Employee & Team Player Awards',
                'category',
                '2026-01-01',
                '2026-10-06',
                'all',
                'best_employee',
                'Evaluation of peer-nominated best employee and cultural excellence awards.'
            ),
            // Report 5: Monthly Performance & Innovation Awards - September 2026
            buildReportObject(
                'Monthly Performance & Innovation Awards - September 2026',
                'monthly',
                '2026-09-01',
                '2026-09-30',
                'all',
                'all',
                'Monthly high-impact contributors across technical and creative departments.'
            ),
            // Report 6: Comprehensive Annual Corporate Recognition Report 2026
            buildReportObject(
                'Comprehensive Annual Corporate Recognition Report 2026',
                'yearly',
                '2026-01-01',
                '2026-12-31',
                'all',
                'all',
                'Full calendar year enterprise recognition audit with financial disbursements and rankings.'
            )
        ];

        const insertedReports = await AwardReport.insertMany(sixAwardReports);
        console.log(`   ✅ Seeded ${insertedReports.length} Award Reports in AwardReport collection!`);
        insertedReports.forEach((r, i) => {
            console.log(`      ${i + 1}. [${r.reportType.toUpperCase()}] ${r.title} (${r.awardData.length} awards, $${r.summary.totalAmount})`);
        });

        console.log('\n🎉 AWARD & AWARD REPORTS SEEDING FINISHED SUCCESSFULLY!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Error:', error);
        process.exit(1);
    }
};

seedAwardsAndReports();
