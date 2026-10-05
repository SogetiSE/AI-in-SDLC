import { prisma } from '../src/models/prisma.js';
import { seedDemoData } from '../src/lib/demo-data.js';

async function main(): Promise<void> {
	console.log('🌱 Seeding Zava database...');
	await seedDemoData();
	console.log('✅ Seeded demo data');
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
