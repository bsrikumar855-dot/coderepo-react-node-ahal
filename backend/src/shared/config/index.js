function getRequiredEnv(key) {
	const value = process.env[key];
	if (!value) throw new Error(`Missing required environment variable: ${key}`);
	return value;
}

function getOptionalEnv(key, defaultValue) {
	return process.env[key] || defaultValue;
}

let configInstance = null;

export function loadConfig() {
	const mongodbUri = getRequiredEnv("MONGODB_URI");
	configInstance = {
		mongodbUri,
		jwtSecret: getRequiredEnv("JWT_SECRET"),
		jwtExpiresIn: getOptionalEnv("JWT_EXPIRES_IN", "24h"),
		port: parseInt(getOptionalEnv("PORT", "8000"), 10),
		nodeEnv: getOptionalEnv("NODE_ENV", "development"),
		requestExecutionTimeoutMs: parseInt(getOptionalEnv("REQUEST_EXECUTION_TIMEOUT_MS", "15000"), 10),
	};
	return configInstance;
}

export function getConfig() {
	if (!configInstance) throw new Error("Configuration not loaded. Call initConfig() first after dotenv.config()");
	return configInstance;
}

export function initConfig() {
	configInstance = loadConfig();
	return configInstance;
}

export { getRequiredEnv, getOptionalEnv };
