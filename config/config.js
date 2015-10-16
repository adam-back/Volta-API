var config = {
  'development': {
    'username': 'adamback',
    'password': null,
    'database': 'volta',
    'host': '127.0.0.1',
    'dialect': 'postgres',
    'port': 5432,
    'secret': 'iamallama',
    'appSecret': 'notsosecret',
    'issuer': 'seniorllama',
    'googleApiKey': null,
    'ekmApiKey': null
  },
  'production': {
    'username': process.env.DB_USERNAME,
    'password': process.env.DB_PASSWORD,
    'database': process.env.DB_NAME,
    'host': process.env.DB_HOST,
    'dialect': 'postgres',
    'port': 5432,
    'secret': process.env.JWT_SECRET,
    'appSecret': process.env.APP_JWT_SECRET,
    'issuer': process.env.JWT_ISSUER,
    'googleApiKey': process.env.GOOGLE_API_KEY,
    'ekmApiKey': process.env.EKM_API_KEY
  }
};

module.exports = config;
