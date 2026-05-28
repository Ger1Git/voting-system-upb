import 'dotenv/config';

const requiredInProduction = ['JWT_SECRET', 'VOTING_CONTRACT_ADDRESS', 'ORACLE_PRIVATE_KEY'];

if (process.env.NODE_ENV === 'production') {
  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

/** mock | database | api */
function resolveEnrollmentSource() {
  const explicit = process.env.ENROLLMENT_SOURCE?.toLowerCase();
  if (explicit === 'mock' || explicit === 'database' || explicit === 'api') {
    return explicit;
  }
  if (process.env.MOCK_UPB_ENROLLMENT === 'true') {
    return 'mock';
  }
  if (process.env.DATABASE_URL) {
    return 'database';
  }
  if (process.env.UPB_API_URL) {
    return 'api';
  }
  return 'mock';
}

function asBoolean(value, defaultValue = false) {
  if (value == null) {
    return defaultValue;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export const config = {
  port: Number(process.env.PORT) || 5122,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-not-for-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  voterIdSalt: process.env.VOTER_ID_SALT || 'upb-voting-dev-salt',
  databaseUrl: process.env.DATABASE_URL || '',
  autoSeedOnStart: asBoolean(process.env.AUTO_SEED_ON_START, false),
  enrollmentSource: resolveEnrollmentSource(),
  upbApiUrl: process.env.UPB_API_URL || '',
  upbApiKey: process.env.UPB_API_KEY || '',
  requireFaceVerification: process.env.REQUIRE_FACE_VERIFICATION !== 'false',
  faceVerificationMaxAgeSec: Number(process.env.FACE_VERIFICATION_MAX_AGE_SEC) || 120,
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
  contractAddress: process.env.VOTING_CONTRACT_ADDRESS || '',
  oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY || '',
};
