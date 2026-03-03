/**
 * ============================================================================
 * Benchmark: POST /identify
 * ============================================================================
 *
 * What is being measured:
 *   - End-to-end latency of the /identify endpoint under concurrent load.
 *   - This includes: Express middleware, Zod validation, Prisma transaction
 *     (DB lookup + potential insert), and JSON serialization.
 *
 * Expected performance range (local dev, PostgreSQL in Docker):
 *   - Requests/sec: 300–1500 depending on machine and DB connection pool
 *   - Avg Latency:  5–30ms
 *   - P95 Latency:  10–60ms
 *   - Errors:       0 (all requests should return 200)
 *
 * Possible optimization ideas:
 *   - Connection pooling: Tune PrismaClient pool size via `connection_limit` in DATABASE_URL
 *   - Read replicas: Offload read queries if scaling horizontally
 *   - Caching: Cache frequent lookups (e.g., by email) in Redis for read-heavy workloads
 *   - Batch inserts: If ingesting bulk contacts, batch upserts reduce round trips
 *   - Indexing: Already indexed on email, phoneNumber, linkedId — verify with EXPLAIN ANALYZE
 * ============================================================================
 */

import autocannon from 'autocannon';

const BASE_URL = process.env.BENCHMARK_URL || 'http://localhost:3000';

async function runBenchmark(): Promise<void> {
    console.log('='.repeat(60));
    console.log('  Benchmark: POST /identify');
    console.log('='.repeat(60));
    console.log(`  Target:       ${BASE_URL}/identify`);
    console.log('  Requests:     1000');
    console.log('  Connections:  10 concurrent');
    console.log('  Payload:      {"email":"bench@test.com","phoneNumber":"123456"}');
    console.log('='.repeat(60));
    console.log('');

    const result = await autocannon({
        url: `${BASE_URL}/identify`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: 'bench@test.com',
            phoneNumber: '123456',
        }),
        connections: 10, // 10 concurrent connections
        amount: 1000, // Total 1000 requests
    });

    // --- Format and print results ---
    const avgLatency = result.latency.average;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p95Latency = (result.latency as any).p95 ?? result.latency.p99;
    const rps = result.requests.average;
    const totalRequests = result.requests.total;
    const non2xx = result.non2xx;
    const errors = result.errors;
    const duration = (result.duration / 1000).toFixed(2);

    console.log('='.repeat(60));
    console.log('  BENCHMARK RESULTS');
    console.log('='.repeat(60));
    console.log(`  Total Requests:     ${totalRequests}`);
    console.log(`  Duration:           ${duration}s`);
    console.log(`  Requests/sec:       ${rps.toFixed(0)}`);
    console.log(`  Avg Latency:        ${avgLatency.toFixed(2)}ms`);
    console.log(`  P95 Latency:        ${p95Latency}ms`);
    console.log(`  Non-2xx Responses:  ${non2xx}`);
    console.log(`  Errors:             ${errors}`);
    console.log('='.repeat(60));

    if (non2xx > 0 || errors > 0) {
        console.log('\n⚠️  WARNING: Some requests failed. Check server logs.');
    } else {
        console.log('\n✅  All requests returned 2xx. No errors detected.');
    }
}

runBenchmark().catch((err) => {
    console.error('Benchmark failed:', err.message);
    process.exit(1);
});
