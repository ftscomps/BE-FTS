import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Import types untuk environment variables
interface EnvVars {
	DEFAULT_ADMIN_EMAIL: string;
	DEFAULT_ADMIN_PASSWORD: string;
	DEFAULT_ADMIN_NAME: string;
	DEFAULT_ADMIN_ROLE: string;
}

/**
 * Seed script untuk initial data
 * Membuat default admin account dan data awal lainnya
 */
const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Starting database seeding...');

	try {
		// Get environment variables dengan default values
		const env: EnvVars = {
			DEFAULT_ADMIN_EMAIL: process.env['DEFAULT_ADMIN_EMAIL'] || 'admin@fts.biz.id',
			DEFAULT_ADMIN_PASSWORD: process.env['DEFAULT_ADMIN_PASSWORD'] || 'adminmas123',
			DEFAULT_ADMIN_NAME: process.env['DEFAULT_ADMIN_NAME'] || 'Administrator',
			DEFAULT_ADMIN_ROLE: process.env['DEFAULT_ADMIN_ROLE'] || 'super_admin',
		};

		console.log('📧 Creating default admin account...');
		console.log(`Email: ${env.DEFAULT_ADMIN_EMAIL}`);

		// Hash password untuk default admin
		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(env.DEFAULT_ADMIN_PASSWORD, saltRounds);

		// Create default admin user
		const defaultAdmin = await prisma.user.upsert({
			where: { email: env.DEFAULT_ADMIN_EMAIL },
			update: {
				name: env.DEFAULT_ADMIN_NAME,
				passwordHash: hashedPassword,
				role: env.DEFAULT_ADMIN_ROLE,
			},
			create: {
				email: env.DEFAULT_ADMIN_EMAIL,
				name: env.DEFAULT_ADMIN_NAME,
				passwordHash: hashedPassword,
				role: env.DEFAULT_ADMIN_ROLE,
			},
		});

		console.log(`✅ Default admin user created/updated: ${defaultAdmin.email}`);

		// Log activity untuk admin creation
		await prisma.activityLog.create({
			data: {
				userId: defaultAdmin.id,
				action: 'CREATE',
				resourceType: 'user',
				resourceId: defaultAdmin.id,
				details: {
					message: 'Default admin account created during seeding',
					email: defaultAdmin.email,
					role: defaultAdmin.role,
				},
				ipAddress: '127.0.0.1',
				userAgent: 'Seed Script',
			},
		});

		console.log('📝 Activity log created for admin creation');

		// Create sample projects (optional, untuk testing)
		console.log('🚀 Creating sample projects...');

		const sampleProjects = [
			{
				title: 'E-Commerce Platform',
				description: 'Modern e-commerce platform built with React and Node.js',
				imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567/ecommerce.jpg',
				liveUrl: 'https://example-ecommerce.com',
				githubUrl: 'https://github.com/example/ecommerce',
				tags: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
			},
			{
				title: 'Task Management System',
				description: 'Collaborative task management tool with real-time updates',
				imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567/taskmanager.jpg',
				liveUrl: 'https://example-tasks.com',
				githubUrl: 'https://github.com/example/tasks',
				tags: ['Vue.js', 'Express', 'MongoDB', 'Socket.io'],
			},
			{
				title: 'Weather Dashboard',
				description: 'Real-time weather monitoring dashboard with data visualization',
				imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567/weather.jpg',
				liveUrl: 'https://example-weather.com',
				githubUrl: 'https://github.com/example/weather',
				tags: ['TypeScript', 'Chart.js', 'OpenWeather API', 'PWA'],
			},
		];

		for (const projectData of sampleProjects) {
			const project = await prisma.project.create({
				data: {
					...projectData,
					createdBy: defaultAdmin.id,
				},
			});

			console.log(`✅ Sample project created: ${project.title}`);

			// Log activity untuk project creation
			await prisma.activityLog.create({
				data: {
					userId: defaultAdmin.id,
					action: 'CREATE',
					resourceType: 'project',
					resourceId: project.id,
					details: {
						message: 'Sample project created during seeding',
						title: project.title,
						tags: project.tags,
					},
					ipAddress: '127.0.0.1',
					userAgent: 'Seed Script',
				},
			});
		}

		console.log('🎉 Database seeding completed successfully!');
		console.log('\n📋 Summary:');
		console.log(`- Default admin: ${env.DEFAULT_ADMIN_EMAIL}`);
		console.log(`- Sample projects: ${sampleProjects.length}`);
		console.log(`- Activity logs: ${1 + sampleProjects.length}`);
	} catch (error) {
		console.error('❌ Error during seeding:', error);
		throw error;
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
