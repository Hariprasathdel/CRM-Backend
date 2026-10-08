require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const JobPosting = require('../models/JobPosting');
const Recruitment = require('../models/Recruitment');
const Applicant = require('../models/Applicant');
const User = require('../models/User');

const seedApplicants = async () => {
    try {
        console.log('🌱 Connecting to database to seed Applicants...');
        await connectDB();

        const count = await Applicant.countDocuments();
        if (count > 0) {
            console.log(`ℹ️ Applicants already exist in database (${count} records). Skipping seed.`);
            process.exit(0);
        }

        const admin = await User.findOne({ role: 'admin' }) || await User.findOne({});
        const adminId = admin ? admin._id : null;

        // Get existing job postings or recruitments
        let jobs = await JobPosting.find({});
        if (jobs.length === 0) {
            jobs = await Recruitment.find({});
        }

        if (jobs.length === 0) {
            console.log('⚠️ No job postings found to associate applicants with.');
            process.exit(1);
        }

        const sampleApplicants = [
            {
                jobIndex: 0,
                firstName: 'Alice',
                lastName: 'Johnson',
                email: 'alice.johnson@example.com',
                phone: '+1 234 567 8901',
                currentCompany: 'Apex Cloud Systems',
                currentPosition: 'Senior React Developer',
                totalExperience: 6,
                skills: ['React', 'Node.js', 'Python', 'AWS', 'MongoDB'],
                status: 'shortlisted',
                stage: 'screening',
                rating: 4.5,
                applicationSource: 'linkedin'
            },
            {
                jobIndex: 1 % jobs.length,
                firstName: 'Bob',
                lastName: 'Smith',
                email: 'bob.smith@example.com',
                phone: '+1 345 678 9012',
                currentCompany: 'GrowthHive Agency',
                currentPosition: 'Performance Marketing Manager',
                totalExperience: 4,
                skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Google Ads'],
                status: 'interview_scheduled',
                stage: 'interview',
                rating: 4.0,
                applicationSource: 'indeed'
            },
            {
                jobIndex: 2 % jobs.length,
                firstName: 'Carol',
                lastName: 'White',
                email: 'carol.white@example.com',
                phone: '+1 456 789 0123',
                currentCompany: 'InfraScale Networks',
                currentPosition: 'DevOps Engineer',
                totalExperience: 5,
                skills: ['Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'AWS'],
                status: 'new',
                stage: 'applied',
                rating: 3.5,
                applicationSource: 'website'
            },
            {
                jobIndex: 3 % jobs.length,
                firstName: 'David',
                lastName: 'Green',
                email: 'david.green@example.com',
                phone: '+1 567 890 1234',
                currentCompany: 'PeopleFirst Global',
                currentPosition: 'Talent Acquisition Partner',
                totalExperience: 3,
                skills: ['Recruitment', 'HRIS', 'Employee Relations', 'Onboarding'],
                status: 'interviewed',
                stage: 'interview',
                rating: 4.2,
                applicationSource: 'referral'
            },
            {
                jobIndex: 4 % jobs.length,
                firstName: 'Eva',
                lastName: 'Martinez',
                email: 'eva.martinez@example.com',
                phone: '+1 678 901 2345',
                currentCompany: 'Summit Financial Advisory',
                currentPosition: 'Senior Financial Analyst',
                totalExperience: 5,
                skills: ['Financial Modeling', 'Excel', 'GAAP Accounting', 'ERP'],
                status: 'hired',
                stage: 'hired',
                rating: 4.9,
                applicationSource: 'website'
            },
            {
                jobIndex: 0,
                firstName: 'Frank',
                lastName: 'Wilson',
                email: 'frank.wilson@example.com',
                phone: '+1 789 012 3456',
                currentCompany: 'MicroStack Solutions',
                currentPosition: 'Full Stack Engineer',
                totalExperience: 7,
                skills: ['React', 'Node.js', 'Docker', 'PostgreSQL', 'GraphQL'],
                status: 'technical_round',
                stage: 'interview',
                rating: 4.7,
                applicationSource: 'linkedin'
            }
        ];

        for (const data of sampleApplicants) {
            const job = jobs[data.jobIndex];
            await Applicant.create({
                jobId: job._id,
                jobTitle: job.jobTitle || job.title,
                jobCode: job.jobCode || `JOB-${String(job._id).slice(-4).toUpperCase()}`,
                department: job.department,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                currentCompany: data.currentCompany,
                currentPosition: data.currentPosition,
                totalExperience: data.totalExperience,
                skills: data.skills,
                status: data.status,
                stage: data.stage,
                rating: data.rating,
                applicationSource: data.applicationSource,
                createdBy: adminId
            });
            console.log(`   ✅ Seeded applicant: ${data.firstName} ${data.lastName} for ${job.jobTitle || job.title}`);
        }

        console.log('🎉 All applicants seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding applicants:', err);
        process.exit(1);
    }
};

seedApplicants();
