async function main() {
  if (!process.env.DATABASE_URL) {
    process.loadEnvFile('.env.local');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const { seedWritingContent } = await import('../src/lib/writing-state');
  await seedWritingContent();
  console.log('Learning content seeded without replacing existing identifiers.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
