import app from './app.js';
import { initializeBucket, initializeBusinessBucket } from './services/storageService.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);

  // Initialize MinIO buckets
  try {
    await initializeBucket();
    await initializeBusinessBucket();
  } catch (error) {
    console.error('❌ Failed to initialize MinIO buckets:', error);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Server shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
