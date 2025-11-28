# AIVO v5 Load Testing

Performance and load testing suite using [k6](https://k6.io/).

## Overview

This suite tests AIVO's performance under various load conditions:

- **Smoke Test**: Quick validation with minimal load (5 VUs)
- **Normal Load**: Simulates typical school day usage (100 VUs)
- **Peak Load**: Start of school day surge (500 VUs)
- **Stress Test**: Find breaking points (1000 VUs)
- **Soak Test**: Extended duration for memory leaks (200 VUs for 1 hour)

## Prerequisites

### Install k6

**macOS:**
```bash
brew install k6
```

**Ubuntu/Debian:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Docker:**
```bash
docker pull grafana/k6
```

### Install Dependencies

```bash
cd load-tests
pnpm install
```

## Running Tests

### Smoke Test (Quick Validation)
```bash
pnpm run test:smoke
```

### Normal Load Test
```bash
pnpm run test:normal
```

### Peak Load Test
```bash
pnpm run test:peak
```

### Stress Test
```bash
pnpm run test:stress
```

### API Load Test
```bash
pnpm run test:api
```

### WebSocket Load Test
```bash
pnpm run test:websocket
```

### Custom Target URL
```bash
k6 run \
  --env BASE_URL=https://staging.aivo.app \
  --env WS_URL=wss://staging.aivo.app \
  scenarios/learner-journey.ts
```

## Performance Thresholds

| Metric | Normal Load | Peak Load | AI Endpoints |
|--------|-------------|-----------|--------------|
| P95 Response Time | < 2s | < 5s | < 30s |
| Error Rate | < 1% | < 1% | < 1% |
| WebSocket Errors | < 5% | < 5% | N/A |

### Endpoint-Specific Thresholds

| Endpoint | P95 Threshold |
|----------|---------------|
| Health | 100ms |
| Auth | 500ms |
| Dashboard | 1s |
| Homework | 1s |
| Assessment | 2s |
| Regulation | 500ms |

## Test Scenarios

### Learner Journey (`scenarios/learner-journey.ts`)

Simulates a realistic learner session:
1. Login
2. View dashboard
3. Start homework
4. Request AI hints
5. Submit answers
6. Emotion check-in
7. Take assessment

### API Load (`scenarios/api-load.ts`)

Tests API endpoints with weighted distribution:
- 30% Dashboard views
- 20% Homework operations
- 15% Assessment queries
- 15% Regulation endpoints
- 10% User profile
- 10% Miscellaneous

### WebSocket Load (`scenarios/websocket-load.ts`)

Tests real-time features:
- Connection establishment
- Message throughput
- Latency measurement
- Connection stability

## Analyzing Results

```bash
node analyze-results.js
```

Or specify specific result files:
```bash
node analyze-results.js learner-journey-results.json api-load-results.json
```

The analyzer will:
- Parse k6 JSON output
- Validate against thresholds
- Generate markdown reports
- Exit with code 1 if thresholds exceeded

## CI Integration

Load tests run automatically:
- **Weekly**: Every Sunday at 2 AM UTC
- **On-demand**: Via GitHub Actions workflow dispatch

### Manual Trigger

1. Go to Actions → "Load Testing"
2. Click "Run workflow"
3. Select scenario and options
4. View results in artifacts

## Test Data

Tests require pre-seeded test accounts:
- `test-learner-{0-99}@aivo.test`
- `test-teacher-{0-19}@aivo.test`

Password: `TestPassword123!`

### Seeding Test Data

```bash
pnpm --filter @aivo/services run seed:load-test-users
```

## Grafana k6 Cloud (Optional)

For enhanced visualization and distributed testing:

```bash
k6 cloud scenarios/learner-journey.ts
```

Set your token:
```bash
k6 login cloud --token YOUR_TOKEN
```

## Troubleshooting

### Tests Fail to Connect
- Verify target URL is accessible
- Check firewall rules
- Ensure test users exist

### High Error Rates
- Review server logs during test
- Check rate limiting configuration
- Verify database connection pools

### Memory Issues
- Reduce VU count
- Add think time between requests
- Use `--no-summary` for large tests

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 TypeScript Guide](https://k6.io/docs/using-k6/javascript-compatibility-mode/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)
- [k6 Scenarios](https://k6.io/docs/using-k6/scenarios/)
