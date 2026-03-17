


import crypto from 'crypto';

const generateSecret = () => {
  
  return crypto.randomBytes(32).toString('hex');
};

const secret = generateSecret();
console.log('\n=== JWT Secret Key ===');
console.log(secret);
console.log('\nCopy this to your .env file as:');
console.log(`JWT_SECRET=${secret}\n`);

