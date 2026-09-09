// generate-keys.js — run with: node generate-keys.js
const { generateKeyPairSync } = require('crypto');
const fs = require('fs');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength  : 2048,
  publicKeyEncoding : { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync('private.pem', privateKey);
fs.writeFileSync('public.pem',  publicKey);

console.log('=== PRIVATE KEY ===');
console.log(privateKey);
console.log('=== PUBLIC KEY ===');
console.log(publicKey);