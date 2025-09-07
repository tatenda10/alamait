const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setupReset() {
    console.log('🔧 Setting up System Reset Configuration\n');
    
    try {
        // Check if .env file exists
        const envPath = path.join(__dirname, '..', '.env');
        const envExists = fs.existsSync(envPath);
        
        console.log(`🔍 Looking for .env file at: ${envPath}`);
        
        if (envExists) {
            console.log('✅ Found existing .env file');
            const envContent = fs.readFileSync(envPath, 'utf8');
            
            // Check if database config exists
            if (envContent.includes('DB_HOST') && envContent.includes('DB_USER')) {
                console.log('✅ Database configuration found in .env');
                console.log('\n📋 Current configuration:');
                const lines = envContent.split('\n');
                lines.forEach(line => {
                    if (line.startsWith('DB_')) {
                        const [key, value] = line.split('=');
                        if (key === 'DB_PASSWORD') {
                            console.log(`   ${key}=${value ? '***' : '(none)'}`);
                        } else {
                            console.log(`   ${key}=${value}`);
                        }
                    }
                });
                
                const proceed = await question('\n❓ Do you want to proceed with the reset using this configuration? (y/n): ');
                if (proceed.toLowerCase() === 'y' || proceed.toLowerCase() === 'yes') {
                    console.log('\n🚀 Running system reset...');
                    require('./system_reset.js');
                    return;
                }
            }
        }
        
        // Create new .env file
        console.log('\n📝 Creating new .env file...');
        
        const dbHost = await question('Enter database host (default: localhost): ') || 'localhost';
        const dbUser = await question('Enter database username (default: root): ') || 'root';
        const dbPassword = await question('Enter database password: ');
        const dbName = await question('Enter database name (default: alamait): ') || 'alamait';
        
        const envContent = `# Database Configuration
DB_HOST=${dbHost}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Other Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:3002
`;
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file created successfully');
        
        const proceed = await question('\n❓ Do you want to run the system reset now? (y/n): ');
        if (proceed.toLowerCase() === 'y' || proceed.toLowerCase() === 'yes') {
            console.log('\n🚀 Running system reset...');
            require('./system_reset.js');
        } else {
            console.log('\n📋 Setup complete! You can run the reset later with:');
            console.log('   node system_reset.js');
        }
        
    } catch (error) {
        console.error('❌ Error during setup:', error.message);
    } finally {
        rl.close();
    }
}

// Run setup if this script is executed directly
if (require.main === module) {
    setupReset();
}

module.exports = { setupReset };
