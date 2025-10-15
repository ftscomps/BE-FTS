/**
 * Blog Management System Seed Data
 * Sample categories dan tags untuk blog system
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Seeding blog management system...');

	// Create sample categories
	const categories = [
		{
			name: 'Technology',
			slug: 'technology',
			description: 'Technology related articles and tutorials',
		},
		{
			name: 'Business',
			slug: 'business',
			description: 'Business insights and strategies',
		},
		{
			name: 'Web Development',
			slug: 'web-development',
			description: 'Web development tutorials and guides',
		},
		{
			name: 'Mobile Development',
			slug: 'mobile-development',
			description: 'Mobile app development articles',
		},
		{
			name: 'DevOps',
			slug: 'devops',
			description: 'DevOps practices and tools',
		},
		{
			name: 'AI & Machine Learning',
			slug: 'ai-machine-learning',
			description: 'Artificial Intelligence and ML articles',
		},
	];

	console.log('📁 Creating categories...');
	for (const category of categories) {
		await prisma.category.upsert({
			where: { slug: category.slug },
			update: {},
			create: category,
		});
		console.log(`✅ Category created: ${category.name}`);
	}

	// Create sample tags
	const tags = [
		{ name: 'JavaScript', slug: 'javascript' },
		{ name: 'TypeScript', slug: 'typescript' },
		{ name: 'Node.js', slug: 'nodejs' },
		{ name: 'React', slug: 'react' },
		{ name: 'Vue.js', slug: 'vuejs' },
		{ name: 'Angular', slug: 'angular' },
		{ name: 'Express.js', slug: 'expressjs' },
		{ name: 'PostgreSQL', slug: 'postgresql' },
		{ name: 'MongoDB', slug: 'mongodb' },
		{ name: 'Redis', slug: 'redis' },
		{ name: 'Docker', slug: 'docker' },
		{ name: 'Kubernetes', slug: 'kubernetes' },
		{ name: 'AWS', slug: 'aws' },
		{ name: 'Azure', slug: 'azure' },
		{ name: 'Google Cloud', slug: 'google-cloud' },
		{ name: 'API Design', slug: 'api-design' },
		{ name: 'REST API', slug: 'rest-api' },
		{ name: 'GraphQL', slug: 'graphql' },
		{ name: 'Microservices', slug: 'microservices' },
		{ name: 'Testing', slug: 'testing' },
		{ name: 'Jest', slug: 'jest' },
		{ name: 'Cypress', slug: 'cypress' },
		{ name: 'CI/CD', slug: 'cicd' },
		{ name: 'Git', slug: 'git' },
		{ name: 'GitHub', slug: 'github' },
		{ name: 'GitLab', slug: 'gitlab' },
		{ name: 'Performance', slug: 'performance' },
		{ name: 'Security', slug: 'security' },
		{ name: 'SEO', slug: 'seo' },
		{ name: 'Accessibility', slug: 'accessibility' },
		{ name: 'UX/UI', slug: 'uxui' },
		{ name: 'Design System', slug: 'design-system' },
		{ name: 'Frontend', slug: 'frontend' },
		{ name: 'Backend', slug: 'backend' },
		{ name: 'Full Stack', slug: 'full-stack' },
		{ name: 'Database', slug: 'database' },
		{ name: 'Authentication', slug: 'authentication' },
		{ name: 'Authorization', slug: 'authorization' },
		{ name: 'JWT', slug: 'jwt' },
		{ name: 'OAuth', slug: 'oauth' },
		{ name: 'WebSocket', slug: 'websocket' },
		{ name: 'Real-time', slug: 'realtime' },
		{ name: 'PWA', slug: 'pwa' },
		{ name: 'SPA', slug: 'spa' },
		{ name: 'SSR', slug: 'ssr' },
		{ name: 'SSG', slug: 'ssg' },
		{ name: 'Jamstack', slug: 'jamstack' },
		{ name: 'Serverless', slug: 'serverless' },
		{ name: 'Edge Computing', slug: 'edge-computing' },
		{ name: 'Cloud Native', slug: 'cloud-native' },
		{ name: 'Open Source', slug: 'open-source' },
		{ name: 'Tutorial', slug: 'tutorial' },
		{ name: 'Guide', slug: 'guide' },
		{ name: 'Best Practices', slug: 'best-practices' },
		{ name: 'Tips & Tricks', slug: 'tips-tricks' },
		{ name: 'Case Study', slug: 'case-study' },
		{ name: 'News', slug: 'news' },
		{ name: 'Updates', slug: 'updates' },
		{ name: 'Release Notes', slug: 'release-notes' },
	];

	console.log('🏷️ Creating tags...');
	for (const tag of tags) {
		await prisma.tag.upsert({
			where: { slug: tag.slug },
			update: {},
			create: tag,
		});
		console.log(`✅ Tag created: ${tag.name}`);
	}

	console.log('🎉 Blog management system seeded successfully!');
	console.log(`📊 Created ${categories.length} categories and ${tags.length} tags`);
}

main()
	.catch((e) => {
		console.error('❌ Error seeding blog management system:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
