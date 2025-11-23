"""
WebSocket Load Testing Script
Author: artpromedia
Date: 2025-11-23

Usage:
    python load_test_websockets.py --connections 100 --duration 60 --url ws://localhost:8000/ws
"""

import asyncio
import websockets
import json
import time
import argparse
from datetime import datetime
from typing import List, Dict
import statistics


class LoadTester:
    def __init__(self, url: str, token: str, num_connections: int, duration: int):
        self.url = f"{url}?token={token}"
        self.num_connections = num_connections
        self.duration = duration
        
        # Metrics
        self.connection_times: List[float] = []
        self.message_latencies: List[float] = []
        self.messages_sent = 0
        self.messages_received = 0
        self.errors = 0
        self.successful_connections = 0
        self.failed_connections = 0
        
    async def connect_and_test(self, connection_id: int):
        """Connect and run test for single WebSocket connection"""
        try:
            start_connect = time.time()
            
            async with websockets.connect(self.url) as websocket:
                connection_time = time.time() - start_connect
                self.connection_times.append(connection_time)
                self.successful_connections += 1
                
                print(f"[{connection_id}] Connected in {connection_time:.3f}s")
                
                # Wait for connection confirmation
                confirmation = await websocket.recv()
                data = json.loads(confirmation)
                
                if data.get("type") == "connection_established":
                    print(f"[{connection_id}] Connection confirmed")
                
                # Subscribe to a test learner
                learner_id = f"learner-test-{connection_id}"
                await websocket.send(json.dumps({
                    "type": "subscribe_learner",
                    "learner_id": learner_id
                }))
                self.messages_sent += 1
                
                # Run test for duration
                end_time = time.time() + self.duration
                
                while time.time() < end_time:
                    # Send ping
                    send_time = time.time()
                    await websocket.send(json.dumps({"type": "ping"}))
                    self.messages_sent += 1
                    
                    # Wait for pong
                    response = await asyncio.wait_for(
                        websocket.recv(),
                        timeout=5.0
                    )
                    receive_time = time.time()
                    self.messages_received += 1
                    
                    # Calculate latency
                    latency = (receive_time - send_time) * 1000  # ms
                    self.message_latencies.append(latency)
                    
                    # Send Virtual Brain interaction
                    await websocket.send(json.dumps({
                        "type": "virtual_brain_interact",
                        "data": {
                            "learner_id": learner_id,
                            "type": "question_response",
                            "content": "Test content",
                            "response": "Test response",
                            "context": {"test": True}
                        }
                    }))
                    self.messages_sent += 1
                    
                    # Wait a bit
                    await asyncio.sleep(1)
                
                # Unsubscribe
                await websocket.send(json.dumps({
                    "type": "unsubscribe_learner",
                    "learner_id": learner_id
                }))
                self.messages_sent += 1
                
                print(f"[{connection_id}] Test completed")
                
        except Exception as e:
            self.failed_connections += 1
            self.errors += 1
            print(f"[{connection_id}] Error: {str(e)}")
    
    async def run(self):
        """Run load test with multiple connections"""
        print(f"\n{'='*60}")
        print(f"WebSocket Load Test")
        print(f"{'='*60}")
        print(f"URL: {self.url.split('?')[0]}")
        print(f"Connections: {self.num_connections}")
        print(f"Duration: {self.duration}s")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}\n")
        
        start_time = time.time()
        
        # Create all connections concurrently
        tasks = [
            self.connect_and_test(i)
            for i in range(self.num_connections)
        ]
        
        await asyncio.gather(*tasks, return_exceptions=True)
        
        total_time = time.time() - start_time
        
        # Print results
        self.print_results(total_time)
    
    def print_results(self, total_time: float):
        """Print test results"""
        print(f"\n{'='*60}")
        print(f"Load Test Results")
        print(f"{'='*60}\n")
        
        # Connection Statistics
        print("Connection Statistics:")
        print(f"  Successful: {self.successful_connections}")
        print(f"  Failed: {self.failed_connections}")
        print(f"  Success Rate: {(self.successful_connections / self.num_connections * 100):.2f}%")
        
        if self.connection_times:
            print(f"\nConnection Times:")
            print(f"  Average: {statistics.mean(self.connection_times):.3f}s")
            print(f"  Median: {statistics.median(self.connection_times):.3f}s")
            print(f"  Min: {min(self.connection_times):.3f}s")
            print(f"  Max: {max(self.connection_times):.3f}s")
        
        # Message Statistics
        print(f"\nMessage Statistics:")
        print(f"  Sent: {self.messages_sent}")
        print(f"  Received: {self.messages_received}")
        print(f"  Throughput: {self.messages_sent / total_time:.2f} msg/s")
        
        if self.message_latencies:
            print(f"\nLatency Statistics (ms):")
            print(f"  Average: {statistics.mean(self.message_latencies):.2f}ms")
            print(f"  Median: {statistics.median(self.message_latencies):.2f}ms")
            print(f"  Min: {min(self.message_latencies):.2f}ms")
            print(f"  Max: {max(self.message_latencies):.2f}ms")
            print(f"  P95: {statistics.quantiles(self.message_latencies, n=20)[18]:.2f}ms")
            print(f"  P99: {statistics.quantiles(self.message_latencies, n=100)[98]:.2f}ms")
        
        # Error Statistics
        print(f"\nError Statistics:")
        print(f"  Total Errors: {self.errors}")
        print(f"  Error Rate: {(self.errors / self.messages_sent * 100):.2f}%")
        
        # Overall Statistics
        print(f"\nOverall:")
        print(f"  Total Duration: {total_time:.2f}s")
        print(f"  Connections/Second: {self.num_connections / total_time:.2f}")
        
        print(f"\n{'='*60}\n")


async def main():
    parser = argparse.ArgumentParser(description="WebSocket Load Testing")
    parser.add_argument(
        "--url",
        default="ws://localhost:8000/ws",
        help="WebSocket URL"
    )
    parser.add_argument(
        "--token",
        required=True,
        help="JWT access token for authentication"
    )
    parser.add_argument(
        "--connections",
        type=int,
        default=10,
        help="Number of concurrent connections"
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=30,
        help="Test duration in seconds"
    )
    
    args = parser.parse_args()
    
    tester = LoadTester(
        url=args.url,
        token=args.token,
        num_connections=args.connections,
        duration=args.duration
    )
    
    await tester.run()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n\nError: {str(e)}")
