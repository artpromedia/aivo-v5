/**
 * SSL/TLS Configuration for Production WebSocket (wss://)
 * Author: artpromedia
 * Date: 2025-11-23
 */

import * as fs from "fs";
import * as https from "https";
import { Server as HTTPServer } from "http";

export interface SSLConfig {
	enabled: boolean;
	keyPath?: string;
	certPath?: string;
	caPath?: string;
	passphrase?: string;
}

/**
 * Load SSL configuration from environment
 */
export function getSSLConfig(): SSLConfig {
	return {
		enabled: process.env.SSL_ENABLED === "true",
		keyPath: process.env.SSL_KEY_PATH,
		certPath: process.env.SSL_CERT_PATH,
		caPath: process.env.SSL_CA_PATH,
		passphrase: process.env.SSL_PASSPHRASE
	};
}

/**
 * Create HTTPS server with SSL/TLS certificates
 */
export function createSecureServer(app: any): HTTPServer | https.Server {
	const sslConfig = getSSLConfig();

	if (!sslConfig.enabled) {
		console.log("ℹ️  Running in HTTP mode (development)");
		return app.server as HTTPServer;
	}

	try {
		if (!sslConfig.keyPath || !sslConfig.certPath) {
			throw new Error("SSL_KEY_PATH and SSL_CERT_PATH must be set when SSL is enabled");
		}

		const httpsOptions: https.ServerOptions = {
			key: fs.readFileSync(sslConfig.keyPath),
			cert: fs.readFileSync(sslConfig.certPath)
		};

		// Add CA certificate if provided
		if (sslConfig.caPath) {
			httpsOptions.ca = fs.readFileSync(sslConfig.caPath);
		}

		// Add passphrase if provided
		if (sslConfig.passphrase) {
			httpsOptions.passphrase = sslConfig.passphrase;
		}

		console.log("✅ SSL/TLS enabled (wss://)");
		console.log(`   Key: ${sslConfig.keyPath}`);
		console.log(`   Cert: ${sslConfig.certPath}`);

		return https.createServer(httpsOptions, app.server);
	} catch (error) {
		console.error("❌ Failed to load SSL certificates:", error);
		console.log("ℹ️  Falling back to HTTP mode");
		return app.server as HTTPServer;
	}
}

/**
 * Get WebSocket URL scheme based on SSL configuration
 */
export function getWebSocketScheme(): "ws" | "wss" {
	const sslConfig = getSSLConfig();
	return sslConfig.enabled ? "wss" : "ws";
}

/**
 * Validate SSL certificate files exist
 */
export function validateSSLCertificates(): boolean {
	const sslConfig = getSSLConfig();

	if (!sslConfig.enabled) {
		return true;
	}

	if (!sslConfig.keyPath || !sslConfig.certPath) {
		console.error("❌ SSL enabled but SSL_KEY_PATH or SSL_CERT_PATH not set");
		return false;
	}

	if (!fs.existsSync(sslConfig.keyPath)) {
		console.error(`❌ SSL key file not found: ${sslConfig.keyPath}`);
		return false;
	}

	if (!fs.existsSync(sslConfig.certPath)) {
		console.error(`❌ SSL cert file not found: ${sslConfig.certPath}`);
		return false;
	}

	if (sslConfig.caPath && !fs.existsSync(sslConfig.caPath)) {
		console.error(`❌ SSL CA file not found: ${sslConfig.caPath}`);
		return false;
	}

	console.log("✅ SSL certificates validated");
	return true;
}
