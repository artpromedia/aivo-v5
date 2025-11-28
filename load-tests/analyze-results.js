#!/usr/bin/env node

/**
 * Load Test Results Analyzer
 * 
 * Parses k6 JSON output and validates against thresholds.
 * Outputs summary and fails if thresholds are exceeded.
 */

const fs = require('fs');
const path = require('path');

// Performance thresholds
const THRESHOLDS = {
  // Response time thresholds (P95 in ms)
  normal_p95: 2000,     // Normal load: P95 < 2s
  peak_p95: 5000,       // Peak load: P95 < 5s
  ai_p95: 30000,        // AI endpoints: P95 < 30s
  
  // Error rate thresholds
  error_rate: 0.01,     // < 1% error rate
  ws_error_rate: 0.05,  // < 5% WebSocket error rate
  
  // Specific endpoint thresholds (P95 in ms)
  health_p95: 100,
  auth_p95: 500,
  dashboard_p95: 1000,
  homework_p95: 1000,
  assessment_p95: 2000,
  regulation_p95: 500,
};

function loadResults(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load results from ${filePath}: ${error.message}`);
    return null;
  }
}

function analyzeMetrics(results) {
  const analysis = {
    passed: true,
    summary: [],
    failures: [],
    warnings: [],
  };
  
  const metrics = results.metrics || {};
  
  // Analyze HTTP request duration
  if (metrics.http_req_duration) {
    const p95 = metrics.http_req_duration.values?.['p(95)'] || 0;
    const avg = metrics.http_req_duration.values?.avg || 0;
    const max = metrics.http_req_duration.values?.max || 0;
    
    analysis.summary.push({
      metric: 'HTTP Request Duration',
      p95: `${p95.toFixed(2)}ms`,
      avg: `${avg.toFixed(2)}ms`,
      max: `${max.toFixed(2)}ms`,
    });
    
    if (p95 > THRESHOLDS.normal_p95) {
      analysis.failures.push({
        metric: 'HTTP P95',
        value: p95,
        threshold: THRESHOLDS.normal_p95,
        message: `P95 response time (${p95.toFixed(2)}ms) exceeds threshold (${THRESHOLDS.normal_p95}ms)`,
      });
      analysis.passed = false;
    }
  }
  
  // Analyze error rate
  if (metrics.http_req_failed) {
    const errorRate = metrics.http_req_failed.values?.rate || 0;
    
    analysis.summary.push({
      metric: 'Error Rate',
      value: `${(errorRate * 100).toFixed(2)}%`,
    });
    
    if (errorRate > THRESHOLDS.error_rate) {
      analysis.failures.push({
        metric: 'Error Rate',
        value: errorRate,
        threshold: THRESHOLDS.error_rate,
        message: `Error rate (${(errorRate * 100).toFixed(2)}%) exceeds threshold (${(THRESHOLDS.error_rate * 100).toFixed(2)}%)`,
      });
      analysis.passed = false;
    }
  }
  
  // Analyze custom metrics
  const customMetrics = [
    { name: 'homework_create_duration', displayName: 'Homework Create Duration' },
    { name: 'hint_request_duration', displayName: 'Hint Request Duration' },
    { name: 'assessment_question_duration', displayName: 'Assessment Question Duration' },
    { name: 'ws_latency', displayName: 'WebSocket Latency' },
    { name: 'ws_connection_time', displayName: 'WebSocket Connection Time' },
  ];
  
  for (const metric of customMetrics) {
    if (metrics[metric.name]) {
      const p95 = metrics[metric.name].values?.['p(95)'] || 0;
      const avg = metrics[metric.name].values?.avg || 0;
      
      analysis.summary.push({
        metric: metric.displayName,
        p95: `${p95.toFixed(2)}ms`,
        avg: `${avg.toFixed(2)}ms`,
      });
    }
  }
  
  // Analyze WebSocket errors
  if (metrics.ws_errors) {
    const wsErrorRate = metrics.ws_errors.values?.rate || 0;
    
    analysis.summary.push({
      metric: 'WebSocket Error Rate',
      value: `${(wsErrorRate * 100).toFixed(2)}%`,
    });
    
    if (wsErrorRate > THRESHOLDS.ws_error_rate) {
      analysis.failures.push({
        metric: 'WebSocket Error Rate',
        value: wsErrorRate,
        threshold: THRESHOLDS.ws_error_rate,
        message: `WebSocket error rate (${(wsErrorRate * 100).toFixed(2)}%) exceeds threshold (${(THRESHOLDS.ws_error_rate * 100).toFixed(2)}%)`,
      });
      analysis.passed = false;
    }
  }
  
  // Analyze request counts
  if (metrics.http_reqs) {
    const count = metrics.http_reqs.values?.count || 0;
    const rate = metrics.http_reqs.values?.rate || 0;
    
    analysis.summary.push({
      metric: 'Total Requests',
      count: count,
      rate: `${rate.toFixed(2)}/s`,
    });
  }
  
  // Analyze WebSocket connections
  if (metrics.ws_connections) {
    const count = metrics.ws_connections.values?.count || 0;
    
    analysis.summary.push({
      metric: 'WebSocket Connections',
      count: count,
    });
  }
  
  return analysis;
}

function printSummary(analysis, testType) {
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Load Test Results Analysis - ${testType}`);
  console.log('='.repeat(60) + '\n');
  
  // Print summary table
  console.log('📈 Metrics Summary:');
  console.log('-'.repeat(60));
  
  for (const item of analysis.summary) {
    const values = Object.entries(item)
      .filter(([key]) => key !== 'metric')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    console.log(`  ${item.metric}: ${values}`);
  }
  
  console.log('-'.repeat(60));
  
  // Print failures
  if (analysis.failures.length > 0) {
    console.log('\n❌ Threshold Violations:');
    for (const failure of analysis.failures) {
      console.log(`  - ${failure.message}`);
    }
  }
  
  // Print warnings
  if (analysis.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of analysis.warnings) {
      console.log(`  - ${warning}`);
    }
  }
  
  // Print result
  console.log('\n' + '='.repeat(60));
  if (analysis.passed) {
    console.log('✅ All thresholds passed!');
  } else {
    console.log('❌ Some thresholds exceeded - test failed');
  }
  console.log('='.repeat(60) + '\n');
  
  return analysis.passed;
}

function generateMarkdownReport(analysis, testType, outputPath) {
  let md = `# Load Test Report - ${testType}\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n\n`;
  
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  
  for (const item of analysis.summary) {
    const values = Object.entries(item)
      .filter(([key]) => key !== 'metric')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    md += `| ${item.metric} | ${values} |\n`;
  }
  
  if (analysis.failures.length > 0) {
    md += `\n## ❌ Threshold Violations\n\n`;
    for (const failure of analysis.failures) {
      md += `- ${failure.message}\n`;
    }
  }
  
  md += `\n## Result\n\n`;
  md += analysis.passed ? '✅ **PASSED**\n' : '❌ **FAILED**\n';
  
  fs.writeFileSync(outputPath, md);
  console.log(`📄 Report saved to ${outputPath}`);
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const resultFiles = args.length > 0 
    ? args 
    : [
        'learner-journey-results.json',
        'api-load-results.json',
        'websocket-load-results.json',
      ];
  
  let allPassed = true;
  
  for (const file of resultFiles) {
    const filePath = path.resolve(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${file} (file not found)`);
      continue;
    }
    
    console.log(`\n📂 Analyzing: ${file}`);
    
    const results = loadResults(filePath);
    if (!results) {
      allPassed = false;
      continue;
    }
    
    const analysis = analyzeMetrics(results);
    const testType = path.basename(file, '.json').replace(/-results$/, '');
    
    const passed = printSummary(analysis, testType);
    allPassed = allPassed && passed;
    
    // Generate markdown report
    const reportPath = filePath.replace('.json', '-report.md');
    generateMarkdownReport(analysis, testType, reportPath);
  }
  
  process.exit(allPassed ? 0 : 1);
}

main();
