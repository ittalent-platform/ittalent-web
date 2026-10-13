export const E2E_BACKEND_PORT = 3101;
export const E2E_WEB_PORT = 5174;
export const E2E_STORAGE_PORT = 3201;
export const E2E_API_URL = `http://localhost:${E2E_BACKEND_PORT}`;
export const E2E_WEB_URL = `http://localhost:${E2E_WEB_PORT}`;
export const E2E_STORAGE_URL = `http://127.0.0.1:${E2E_STORAGE_PORT}`;
export const E2E_MONGODB_URI =
  process.env.E2E_MONGODB_URI ??
  "mongodb://127.0.0.1:27017/ittalent_myapps_e2e?replicaSet=rs0&directConnection=true";
export const E2E_BACKEND_DIR = "../ittalent-backend-cv";
export const E2E_ACCESS_SECRET = "document-e2e-access-secret-32-characters";
export const E2E_REFRESH_SECRET = "document-e2e-refresh-secret-32-characters";

export const backendEnv = {
  PORT: String(E2E_BACKEND_PORT),
  MONGODB_URI: E2E_MONGODB_URI,
  CORS_ORIGIN: E2E_WEB_URL,
  APP_BASE_URL: E2E_WEB_URL,
  WEB_URL: E2E_WEB_URL,
  OPENAPI_SERVER_URL: E2E_API_URL,
  E2E_DOCUMENT_STORAGE_URL: E2E_STORAGE_URL,
  JWT_ACCESS_SECRET: E2E_ACCESS_SECRET,
  JWT_REFRESH_SECRET: E2E_REFRESH_SECRET,
  NODE_ENV: "development",
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: "1000",
};
