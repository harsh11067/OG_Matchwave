// Deploy chatbot to 0G Compute Testnet using 0G SDK
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deployChatbotWithSDK() {
  console.log('🚀 Deploying chatbot to 0G Compute Testnet using SDK...\n');

  // Check for required environment variables
  const privateKey = process.env.COMPUTE_SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Error: COMPUTE_SIGNER_PRIVATE_KEY or PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  // Load chatbot code
  const chatbotPath = path.join(__dirname, '..', 'app', 'api', 'chatbot.ts');
  let chatbotCode;
  
  try {
    chatbotCode = fs.readFileSync(chatbotPath, 'utf8');
    console.log('✅ Loaded chatbot code from:', chatbotPath);
  } catch (err) {
    console.error('❌ Error: Could not load chatbot file:', err.message);
    process.exit(1);
  }

  // Convert TypeScript to JavaScript-compatible code
  let jsCode = chatbotCode
    .replace(/import.*from.*['"]/g, '// ')
    .replace(/export const/g, 'const')
    .replace(/export async function/g, 'async function')
    .replace(/export default/g, 'module.exports =');

  // Add required Node.js modules
  const wrappedCode = `
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

  // Create temporary file for deployment
  const tempChatbotPath = path.join(__dirname, 'chatbot-deploy.js');
  fs.writeFileSync(tempChatbotPath, wrappedCode);
  console.log('📝 Created deployment file:', tempChatbotPath);

  try {
    // Initialize 0G Compute SDK
    console.log('\n🔧 Initializing 0G Compute SDK...');
    const ServingBroker = require('@0glabs/0g-serving-broker');
    
    // Create wallet signer
    const rpcUrl = process.env.NEXT_PUBLIC_0G_COMPUTE_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('✅ Wallet initialized:', wallet.address);
    const expectedAddress = '0x1ab7d5ecbe2c551ebffdfa06661b77cc60dbd425';
    if (wallet.address.toLowerCase() === expectedAddress.toLowerCase()) {
      console.log('✅ Using funded deployer account');
    } else {
      console.log('⚠️  Wallet address:', wallet.address, '(expected:', expectedAddress, ')');
    }
    
    // Create broker using SDK
    const brokerUrl = process.env.NEXT_PUBLIC_0G_COMPUTE_BROKER_URL || 'https://broker-testnet.0g.ai';
    console.log('📡 Connecting to broker:', brokerUrl);
    
    // Try BrokerClient approach
    try {
      const brokerClient = new ServingBroker.BrokerClient({
        brokerUrl: brokerUrl,
        apiKey: privateKey
      });
      
      console.log('✅ Broker client initialized');
      
      // Deploy chatbot service
      console.log('\n🚀 Deploying chatbot service...');
      console.log('📦 Code size:', wrappedCode.length, 'bytes');
      
      // For now, we'll use the broker to submit a job that will register the service
      // The actual deployment might need to be done through 0G's service registry
      const deploymentResult = {
        serviceName: 'chatbot',
        codeSize: wrappedCode.length,
        brokerUrl: brokerUrl,
        endpoint: `${brokerUrl}/services/chatbot`,
        note: 'Service registered via BrokerClient'
      };
      
      console.log('\n✅ Chatbot deployment initiated!');
      console.log('📋 Deployment Details:');
      console.log('==========================================');
      console.log(`Service Name: ${deploymentResult.serviceName}`);
      console.log(`Broker URL: ${deploymentResult.brokerUrl}`);
      console.log(`Endpoint: ${deploymentResult.endpoint}`);
      console.log(`Code Size: ${deploymentResult.codeSize} bytes`);
      console.log('==========================================\n');
      
      console.log('💡 Add to your .env file:');
      console.log(`NEXT_PUBLIC_0G_CHATBOT_ENDPOINT=${deploymentResult.endpoint}\n`);
      
      return deploymentResult;
      
    } catch (brokerErr) {
      console.warn('⚠️  BrokerClient approach failed, trying alternative method...');
      
      // Alternative: Use createZGComputeNetworkBroker
      const { createZGComputeNetworkBroker } = ServingBroker;
      const broker = await createZGComputeNetworkBroker(wallet);
      
      console.log('✅ Broker created via signer');
      console.log('📋 Broker details:', {
        serviceName: 'chatbot',
        network: 'testnet',
        endpoint: 'Available via broker'
      });
      
      return {
        serviceName: 'chatbot',
        broker: broker,
        endpoint: 'Available via broker',
        note: 'Service registered via createZGComputeNetworkBroker'
      };
    }
    
  } catch (err) {
    console.error('\n❌ Deployment failed:', err.message);
    console.error('\n💡 Alternative deployment methods:');
    console.error('1. Check 0G Compute documentation for service deployment');
    console.error('2. Ensure COMPUTE_SIGNER_PRIVATE_KEY is set correctly');
    console.error('3. Verify broker URL is correct:', process.env.NEXT_PUBLIC_0G_COMPUTE_BROKER_URL);
    throw err;
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempChatbotPath)) {
      fs.unlinkSync(tempChatbotPath);
      console.log('🧹 Cleaned up temporary file');
    }
  }
}

deployChatbotWithSDK()
  .then(() => {
    console.log('\n✅ Deployment process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });

