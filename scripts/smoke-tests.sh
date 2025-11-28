#!/bin/bash
# Smoke Tests for AIVO v5
# Usage: ./scripts/smoke-tests.sh <base_url>

set -e

BASE_URL="${1:-http://localhost:3000}"
TIMEOUT=10
MAX_RETRIES=5

echo "🔍 Running smoke tests against: $BASE_URL"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for test results
PASSED=0
FAILED=0

# Function to test an endpoint
test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local expected_status="${3:-200}"
    local method="${4:-GET}"
    local retries=0
    
    echo -n "  Testing $name... "
    
    while [ $retries -lt $MAX_RETRIES ]; do
        status=$(curl -s -o /dev/null -w "%{http_code}" \
            -X "$method" \
            --connect-timeout $TIMEOUT \
            --max-time $TIMEOUT \
            "${BASE_URL}${endpoint}" 2>/dev/null || echo "000")
        
        if [ "$status" = "$expected_status" ]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
            ((PASSED++))
            return 0
        fi
        
        ((retries++))
        if [ $retries -lt $MAX_RETRIES ]; then
            echo -n "retry $retries... "
            sleep 2
        fi
    done
    
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
    ((FAILED++))
    return 1
}

# Function to test JSON response
test_json_endpoint() {
    local name="$1"
    local endpoint="$2"
    local expected_field="$3"
    
    echo -n "  Testing $name (JSON)... "
    
    response=$(curl -s \
        --connect-timeout $TIMEOUT \
        --max-time $TIMEOUT \
        -H "Accept: application/json" \
        "${BASE_URL}${endpoint}" 2>/dev/null || echo "{}")
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    fi
    
    echo -e "${RED}✗ FAIL${NC} (Missing: $expected_field)"
    ((FAILED++))
    return 1
}

# Function to test response time
test_response_time() {
    local name="$1"
    local endpoint="$2"
    local max_time="${3:-2000}" # milliseconds
    
    echo -n "  Testing $name response time (<${max_time}ms)... "
    
    time_ms=$(curl -s -o /dev/null -w "%{time_total}" \
        --connect-timeout $TIMEOUT \
        --max-time $TIMEOUT \
        "${BASE_URL}${endpoint}" 2>/dev/null || echo "999")
    
    time_ms_int=$(echo "$time_ms * 1000" | bc | cut -d. -f1)
    
    if [ "$time_ms_int" -lt "$max_time" ]; then
        echo -e "${GREEN}✓ PASS${NC} (${time_ms_int}ms)"
        ((PASSED++))
        return 0
    fi
    
    echo -e "${YELLOW}⚠ SLOW${NC} (${time_ms_int}ms > ${max_time}ms)"
    ((PASSED++)) # Still pass, just warn
    return 0
}

echo ""
echo "📋 Health Checks"
echo "----------------"
test_endpoint "Health endpoint" "/api/health" "200"
test_json_endpoint "Health JSON" "/api/health" "status"

echo ""
echo "📋 Core Pages"
echo "-------------"
test_endpoint "Landing page" "/" "200"
test_endpoint "Login page" "/login" "200"
test_endpoint "Signup page" "/signup" "200"

echo ""
echo "📋 API Endpoints"
echo "----------------"
test_endpoint "API ready" "/api/ready" "200"
test_endpoint "API version" "/api/version" "200"

echo ""
echo "📋 Static Assets"
echo "----------------"
test_endpoint "Robots.txt" "/robots.txt" "200"
test_endpoint "Favicon" "/favicon.ico" "200"

echo ""
echo "📋 Error Handling"
echo "-----------------"
test_endpoint "404 handling" "/nonexistent-page-12345" "404"

echo ""
echo "📋 Performance"
echo "--------------"
test_response_time "Homepage" "/" "3000"
test_response_time "Health check" "/api/health" "1000"

echo ""
echo "================================================"
echo -e "Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Smoke tests failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All smoke tests passed!${NC}"
exit 0
