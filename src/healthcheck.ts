/**
 * Health Check Script untuk Docker Container
 * Berguna untuk Docker health checks dan Railway monitoring
 */

import http from 'http';

// Health check options
const options = {
	host: 'localhost',
	port: process.env['PORT'] || 3000,
	path: '/health',
	timeout: 2000,
	method: 'GET',
};

// Health check request
const request = http.request(options, (res) => {
	console.log(`Health check status: ${res.statusCode}`);
	if (res.statusCode === 200) {
		process.exit(0);
	} else {
		process.exit(1);
	}
});

// Handle request error
request.on('error', (err) => {
	console.error('Health check failed:', err.message);
	process.exit(1);
});

// Handle timeout
request.on('timeout', () => {
	console.error('Health check timeout');
	request.destroy();
	process.exit(1);
});

// Send request
request.end();
