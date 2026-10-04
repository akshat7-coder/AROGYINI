process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_value_32_chars_min";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/arogyini_test";
process.env.SMS_PROVIDER = "memory";
// Blank these so a developer's own .env cannot change what the suite asserts: several tests
// cover the no-LLM-key fallback path, and the bot URLs are only ever stubbed.
process.env.LLM_API_KEY = "";
process.env.MEDICAL_BOT_URL = "http://medical.test";
process.env.LEGAL_BOT_URL = "http://legal.test";
