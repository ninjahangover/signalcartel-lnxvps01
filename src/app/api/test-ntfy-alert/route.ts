import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Import the NTFY service
    const { ntfyAlerts } = await import('@/lib/ntfy-alerts');
    
    // Send a test alert
    const success = await ntfyAlerts.sendAlert({
      title: '🧪 Dashboard Test Alert',
      message: `✅ Dashboard connection working!

📱 This alert was triggered from the SignalCartel dashboard
🚀 All systems operational
⏰ Time: ${new Date().toLocaleString()}

If you see this, your unified dashboard is properly connected to the NTFY system! 🎉`,
      priority: 'default',
      tags: ['white_check_mark', 'desktop_computer', 'chart_with_upwards_trend'],
      emoji: '🧪'
    });
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test alert sent successfully! Check your phone 📱' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send test alert' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error sending test alert:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to send test alert: ' + error.message 
    }, { status: 500 });
  }
}