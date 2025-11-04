// Deploy chatbot to 0G Compute Testnet
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function deployChatbot() {
  console.log('🚀 Deploying chatbot to 0G Compute Testnet...\n');

  // Load chatbot code
  const chatbotPath = path.join(__dirname, '..', 'app', 'api', 'chatbot.ts');
  let chatbotCode;
  
  try {
    // Try to read TypeScript file
    chatbotCode = fs.readFileSync(chatbotPath, 'utf8');
    console.log('✅ Loaded chatbot code from:', chatbotPath);
  } catch (err) {
    // Fallback to JavaScript if exists
    const chatbotJsPath = path.join(__dirname, '..', 'app', 'api', 'chatbot.js');
    if (fs.existsSync(chatbotJsPath)) {
      chatbotCode = fs.readFileSync(chatbotJsPath, 'utf8');
      console.log('✅ Loaded chatbot code from:', chatbotJsPath);
    } else {
      throw new Error('Chatbot file not found');
    }
  }

  // Check for 0G CLI
  const { execSync } = require('child_process');
  try {
    execSync('npx 0g --version', { stdio: 'ignore' });
    console.log('✅ 0G CLI found\n');
  } catch (err) {
    console.error('❌ 0G CLI not found. Please install it:');
    console.error('   npm install -g @0glabs/0g-cli');
    console.error('   or use: npx @0glabs/0g-cli\n');
    process.exit(1);
  }

  // Create temporary JavaScript file for deployment
  const tempChatbotPath = path.join(__dirname, 'chatbot-temp.js');
  
  // Convert TypeScript to JavaScript-compatible code
  let jsCode = chatbotCode
    .replace(/import.*from.*['"]/g, '// ')
    .replace(/export const/g, 'const')
    .replace(/export async function/g, 'async function')
    .replace(/export default/g, 'module.exports =');

  // Add required Node.js modules
  jsCode = `
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

${jsCode}

// Export handler
module.exports = async function handler(req, res) {
  try {
    const result = await POST(req);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
`;

  fs.writeFileSync(tempChatbotPath, jsCode);
  console.log('📝 Created temporary deployment file:', tempChatbotPath);

  // Deploy using 0G CLI
  try {
    console.log('\n🚀 Deploying to 0G Compute Testnet...');
    const output = execSync(`npx 0g deploy ${tempChatbotPath} --name chatbot --network testnet`, {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    console.log('\n✅ Chatbot deployed successfully!');
    console.log('📋 Deployment output:', output);
  } catch (err) {
    console.error('\n❌ Deployment failed:', err.message);
    console.log('\n💡 Manual deployment steps:');
    console.log('1. Ensure you have 0G CLI installed: npm install -g @0glabs/0g-cli');
    console.log('2. Set your private key: export PRIVATE_KEY=your_key');
    console.log('3. Run: npx 0g deploy chatbot.js --name chatbot --network testnet');
    process.exit(1);
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempChatbotPath)) {
      fs.unlinkSync(tempChatbotPath);
    }
  }
}

deployChatbot().catch(console.error);

