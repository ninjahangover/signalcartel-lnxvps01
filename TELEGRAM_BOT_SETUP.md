# Telegram Bot Setup for Trade Alerts

## Step 1: Add Bot Token to Environment

Add this to your `.env.local` file:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN="7271136211:AAGE248w3_N7JwtHnLpWn9Cp-GpXx3hBEMM"
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN="7271136211:AAGE248w3_N7JwtHnLpWn9Cp-GpXx3hBEMM"

# Your Chat ID (get this in Step 2)
TELEGRAM_CHAT_ID="YOUR_CHAT_ID_HERE"
NEXT_PUBLIC_TELEGRAM_CHAT_ID="YOUR_CHAT_ID_HERE"
```

## Step 2: Get Your Chat ID

To get your chat ID, you have a few options:

### Option A: Start a conversation with your bot
1. Open Telegram and search for your bot (the name you gave it when creating)
2. Start a conversation by sending `/start` or any message
3. Run this command to get your chat ID:
   ```bash
   npx tsx get-telegram-chat-id.ts
   ```

### Option B: Use @userinfobot
1. Search for `@userinfobot` in Telegram
2. Start a conversation and send any message
3. It will reply with your user info including your Chat ID

### Option C: Check bot updates manually
1. Visit this URL in your browser:
   ```
   https://api.telegram.org/bot7271136211:AAGE248w3_N7JwtHnLpWn9Cp-GpXx3hBEMM/getUpdates
   ```
2. If you've sent a message to your bot, you'll see your chat ID in the response

## Step 3: Test the Bot

Once you have both the token and chat ID configured, run:
```bash
npx tsx test-telegram-bot.ts
```

## What You'll Get

The bot will send you notifications for:

### 🟢 Trade Executions
```
🟢 TRADE EXECUTED

📊 Strategy: RSI MACD Scalper v3
💰 Action: BUY 1 BTCUSD
💵 Price: $118,474
💎 Value: $118,474
🎯 Confidence: 85%
⏰ Time: 12/14/2024, 3:45:23 PM
```

### 🚨 Strategy Alerts
```
🚨 STRATEGY ALERT

📊 Strategy: RSI MACD Scalper v3
🎯 Signal: BUY BTCUSD
💵 Price: $118,474
🎲 Confidence: 85%
⏰ Time: 12/14/2024, 3:45:23 PM
```

### 📊 Daily Summaries
```
📊 DAILY TRADING SUMMARY

📈 Win Rate: 75.0% (3/4)
💰 Total P&L: $1,247.83
🚀 Best Trade: $892.45
📉 Worst Trade: -$156.22
⚡ Active Strategies: 5
📅 Date: 12/14/2024
```

### 🚀 System Status
```
🚀 Signal Cartel Trading System

✅ Paper Trading Started
📊 Monitoring market conditions
🧠 AI optimization active
📱 Telegram alerts enabled

⏰ Started: 12/14/2024, 3:45:23 PM
```

## Troubleshooting

### Bot not responding
- Make sure you've started a conversation with your bot first
- Check that the bot token is correct
- Verify the bot has been activated by @BotFather

### Wrong chat ID
- Make sure you're using YOUR personal chat ID, not a group ID
- The chat ID should be a number, possibly negative for groups

### Messages not sending
- Check your internet connection
- Verify both TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set
- Look for error messages in the console logs

## Security Notes

✅ **Bot tokens are safe to store** - they're meant for server-side use
✅ **Chat IDs are not sensitive** - they're just identifiers
✅ **Bot can only send messages** - it can't read your other chats
✅ **You control the bot** - you can revoke access anytime via @BotFather