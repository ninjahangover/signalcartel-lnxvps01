/**
 * Get Telegram Chat ID for bot notifications
 */

const BOT_TOKEN = "7271136211:AAGE248w3_N7JwtHnLpWn9Cp-GpXx3hBEMM";

async function getTelegramChatId() {
  console.log('🔍 Getting your Telegram Chat ID...');
  console.log('💡 Make sure you\'ve sent a message to your bot first!');
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
    const data = await response.json();
    
    if (!data.ok) {
      console.error('❌ Failed to get updates:', data.description);
      return;
    }
    
    if (data.result.length === 0) {
      console.log('⚠️ No messages found!');
      console.log('💡 Please:');
      console.log('   1. Open Telegram');
      console.log('   2. Search for your bot');
      console.log('   3. Start a conversation by sending any message');
      console.log('   4. Run this script again');
      return;
    }
    
    console.log('✅ Found messages! Here are the chat IDs:');
    console.log('==========================================');
    
    const chatIds = new Set();
    
    data.result.forEach((update: any, index: number) => {
      const chatId = update.message?.chat?.id;
      const firstName = update.message?.chat?.first_name;
      const username = update.message?.chat?.username;
      const chatType = update.message?.chat?.type;
      
      if (chatId && !chatIds.has(chatId)) {
        chatIds.add(chatId);
        console.log(`Chat ${index + 1}:`);
        console.log(`  💬 Chat ID: ${chatId}`);
        console.log(`  👤 Name: ${firstName || 'Unknown'}`);
        console.log(`  📝 Username: @${username || 'none'}`);
        console.log(`  🔗 Type: ${chatType}`);
        console.log('');
      }
    });
    
    if (chatIds.size === 1) {
      const chatId = Array.from(chatIds)[0];
      console.log('🎉 Perfect! Use this Chat ID in your .env.local:');
      console.log('===============================================');
      console.log(`TELEGRAM_CHAT_ID="${chatId}"`);
      console.log(`NEXT_PUBLIC_TELEGRAM_CHAT_ID="${chatId}"`);
    } else {
      console.log('💡 Multiple chats found. Use the Chat ID for your personal chat.');
    }
    
  } catch (error) {
    console.error('❌ Error getting chat ID:', error);
  }
}

// Run the function
getTelegramChatId();