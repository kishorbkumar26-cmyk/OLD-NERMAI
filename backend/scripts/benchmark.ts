import autocannon from 'autocannon';

async function runBenchmark() {
  console.log('Starting benchmark against /api/v1/health/live...');
  
  const result = await autocannon({
    url: 'http://localhost:3000/api/v1/health/live',
    connections: 10, // Default concurrency
    pipelining: 1, 
    duration: 10, // Run for 10 seconds
  });

  console.log('\n--- Benchmark Results ---');
  console.log(`Requests/sec: ${result.requests.average}`);
  console.log(`Latency P97.5:  ${result.latency.p97_5} ms`);
  console.log(`Latency P99:  ${result.latency.p99} ms`);
  console.log('-------------------------\n');
}

runBenchmark().catch(console.error);
