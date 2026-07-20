import app from './app.js';
const port=Number(process.env.PORT||3005);
console.log('READY');
export default {port,fetch:app.fetch};