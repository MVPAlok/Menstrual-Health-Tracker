import { redisClient, isRedisConnected, onRedisReady } from './config/redis';
import { getNotificationQueue } from './queues/notificationQueue';
import { Worker, Job } from 'bullmq';
import { connectionOptions } from './queues/notificationQueue';

async function testRedisSuite() {
  console.log('🧪 Starting NariCare Redis & BullMQ Deep Verification Suite...\n');

  // 1. Test basic Redis PING & Connectivity
  console.log('--- 1. Testing Redis Direct Connection & PING ---');
  try {
    const pingResult = await redisClient.ping();
    console.log(`✅ Redis PING response: "${pingResult}"`);
  } catch (err: any) {
    console.error('❌ Redis PING failed:', err.message);
    console.log('⚠️ Is Redis running locally on port 6379 or via docker container?');
    process.exit(1);
  }

  // 2. Test Key Operations (SET, GET, SETEX, DEL)
  console.log('\n--- 2. Testing Key Cache Operations (SET, GET, EXPIRE, DEL) ---');
  const testKey = 'naricare:test:sample_key';
  const testValue = JSON.stringify({ status: 'active', timestamp: Date.now() });

  await redisClient.set(testKey, testValue, 'EX', 60);
  console.log(`✅ SET key "${testKey}" with 60s expiration`);

  const fetchedValue = await redisClient.get(testKey);
  if (fetchedValue === testValue) {
    console.log('✅ GET key verified matching value successfully');
  } else {
    throw new Error(`GET value mismatch. Expected ${testValue}, got ${fetchedValue}`);
  }

  const ttl = await redisClient.ttl(testKey);
  console.log(`✅ TTL for key "${testKey}": ${ttl} seconds remaining`);

  await redisClient.del(testKey);
  const deletedValue = await redisClient.get(testKey);
  if (deletedValue === null) {
    console.log('✅ DEL key verified deletion successfully');
  } else {
    throw new Error('Key was not deleted properly');
  }

  // 3. Test BullMQ Queue & Worker Execution
  console.log('\n--- 3. Testing BullMQ Queue Producing & Worker Consumption ---');
  const queue = getNotificationQueue();

  let workerProcessed = false;
  let processedJobId: string | null = null;

  // Create temporary worker for test
  const testWorker = new Worker(
    'push-notifications',
    async (job: Job) => {
      console.log(`⚙️ [Test Worker] Picked up job #${job.id} with data:`, job.data);
      if (job.data.testPayload === 'naricare-test-123') {
        workerProcessed = true;
        processedJobId = job.id || null;
      }
    },
    { connection: connectionOptions }
  );

  await testWorker.waitUntilReady();
  console.log('✅ Test BullMQ Worker is ready');

  // Enqueue test job
  const job = await queue.add('test-job', {
    userId: 'test-user-999',
    title: 'Test Notification',
    body: 'Redis & BullMQ verification test',
    testPayload: 'naricare-test-123',
  });

  console.log(`📦 Enqueued test job #${job.id} to "push-notifications" queue`);

  // Wait up to 5 seconds for worker to process
  for (let i = 0; i < 50; i++) {
    if (workerProcessed) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  await testWorker.close();

  if (workerProcessed) {
    console.log(`✅ BullMQ Worker successfully processed job #${processedJobId}`);
  } else {
    throw new Error('BullMQ worker failed to process the test job within timeout');
  }

  console.log('\n🌟 All Redis & BullMQ Deep Verification Tests PASSED Successfully!');
  process.exit(0);
}

// Execute suite when Redis is ready
onRedisReady(() => {
  testRedisSuite().catch((err) => {
    console.error('❌ Redis verification suite failed:', err);
    process.exit(1);
  });
});
