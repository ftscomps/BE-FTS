/**
 * Production database seeding script
 * Creates default admin account for production environment
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Starting production database seeding...');

	try {
		// Check if default admin already exists
		const existingAdmin = await prisma.user.findUnique({
			where: { email: 'admin@fts.biz.id' },
		});

		if (existingAdmin) {
			console.log('✅ Default admin account already exists');
			return;
		}

		// Create default admin account
		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash('adminmas123', saltRounds);

		const defaultAdmin = await prisma.user.create({
			data: {
				email: 'admin@fts.biz.id',
				name: 'FTS Administrator',
				passwordHash: hashedPassword,
				role: 'super_admin',
			},
		});

		console.log('✅ Default admin account created successfully');
		console.log(`   Email: ${defaultAdmin.email}`);
		console.log(`   Name: ${defaultAdmin.name}`);
		console.log(`   Role: ${defaultAdmin.role}`);

		// Create sample projects for demonstration
		const sampleProjects = [
			{
				title: 'FTS Company Profile',
				description:
					'Official company profile website for Fujiyama Technology Solutions built with modern web technologies.',
				imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/fts-profile.jpg',
				liveUrl: 'https://fujiyama-technology.com',
				githubUrl: 'https://github.com/riofach/fts-website',
				tags: ['web', 'company', 'profile', 'react'],
				createdBy: defaultAdmin.id,
			},
			{
				title: 'E-Commerce Platform',
				description:
					'Full-featured e-commerce platform with payment integration, inventory management, and analytics dashboard.',
				imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/ecommerce-platform.jpg',
				liveUrl: 'https://demo-ecommerce.com',
				githubUrl: 'https://github.com/riofach/ecommerce-platform',
				tags: ['ecommerce', 'nodejs', 'react', 'mongodb'],
				createdBy: defaultAdmin.id,
			},
			{
				title: 'Task Management System',
				description:
					'Collaborative task management system with real-time updates, team collaboration features, and advanced analytics.',
				imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/task-manager.jpg',
				liveUrl: 'https://task-manager-demo.com',
				githubUrl: 'https://github.com/riofach/task-manager',
				tags: ['saas', 'collaboration', 'nodejs', 'typescript'],
				createdBy: defaultAdmin.id,
			},
		];

		for (const projectData of sampleProjects) {
			await prisma.project.create({
				data: projectData,
			});
		}

		console.log('✅ Sample projects created successfully');

		// Log initial setup activity
		await prisma.activityLog.create({
			data: {
				userId: defaultAdmin.id,
				action: 'CREATE',
				resourceType: 'system',
				resourceId: defaultAdmin.id,
				details: {
					message: 'Production database initialized with default admin and sample projects',
					adminEmail: defaultAdmin.email,
					projectsCreated: sampleProjects.length,
				},
				ipAddress: '127.0.0.1',
				userAgent: 'Production Seed Script',
			},
		});

		console.log('✅ Production database seeding completed successfully');
		console.log('\n🎯 Next steps:');
		console.log('1. Login to admin dashboard with: admin@fts.biz.id / adminmas123');
		console.log('2. Change default password immediately');
		console.log('3. Configure Cloudinary credentials');
		console.log('4. Update project information as needed');
	} catch (error) {
		console.error('❌ Error during production seeding:', error);
		throw error;
	}
}

main()
	.catch((e) => {
		console.error('❌ Seeding failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
