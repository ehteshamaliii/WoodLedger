async function listModels() {
    // Try to load .env file if available
    try {
        require('dotenv').config();
    } catch (e) {}
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found in environment');
        return;
    }
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Error:', data);
            return;
        }
        
        console.log('Available Gemini Models:');
        console.log('========================\n');
        
        for (const model of data.models || []) {
            console.log(`Model: ${model.name}`);
            console.log(`  Display Name: ${model.displayName}`);
            console.log(`  Description: ${model.description || 'N/A'}`);
            console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
            console.log('');
        }
    } catch (error) {
        console.error('Error listing models:', error.message);
    }
}

listModels();
