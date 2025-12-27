# Fix "Connection error" with OpenAI Whisper API

## Problem
You're getting "Connection error" when trying to use Whisper API, even though:
- ✅ OpenAI status shows services are operational
- ✅ Chat API works fine
- ✅ Your API key is valid

This means **your local network/firewall is blocking the audio endpoint**.

## Quick Fixes (Try in order)

### 1. Add Node.js to Windows Firewall (Most Likely Fix)

**Method A: Using PowerShell (Run as Administrator)**
```powershell
# Allow Node.js through Windows Firewall for outbound connections
New-NetFirewallRule -DisplayName "Node.js OpenAI API" -Direction Outbound -Program (Get-Command node).Source -Action Allow
```

**Method B: Using Windows Settings**
1. Press `Windows + R`, type `wf.msc`, press Enter
2. Click "Outbound Rules" on the left
3. Click "New Rule..." on the right
4. Select "Program" → Next
5. Browse to Node.js location (usually `C:\Program Files\nodejs\node.exe`)
6. Select "Allow the connection" → Next
7. Check all profiles (Domain, Private, Public) → Next
8. Name it "Node.js OpenAI API" → Finish

### 2. Temporarily Disable Windows Firewall (For Testing)

1. Press `Windows + R`, type `firewall.cpl`, press Enter
2. Click "Turn Windows Defender Firewall on or off"
3. Turn OFF for both Private and Public networks
4. **Try your app again**
5. If it works, turn firewall back ON and use Method 1 above

### 3. Disable Antivirus Temporarily

Some antivirus software blocks API connections:
- **Windows Defender**: Settings → Virus & threat protection → Temporarily disable
- **Third-party antivirus**: Check its settings for network/firewall rules

### 4. Try Different Network

- Connect to mobile hotspot
- Try different Wi-Fi network
- Disable VPN if enabled

### 5. Check Corporate/ISP Firewall

If you're on:
- **Corporate network**: Contact IT to allow `api.openai.com` and `*.openai.com`
- **School network**: May block API endpoints - try mobile hotspot
- **Home network**: Check router firewall settings

## Test If Fix Worked

After making changes, restart the server and try recording again. The error should change or disappear.

## Still Not Working?

The issue is that your network can reach `api.openai.com` for chat but not for audio uploads. This is typically:
- Firewall blocking large file uploads
- Antivirus inspecting HTTPS connections
- Network proxy interfering

If none of the above works, you may need to:
- Contact your network administrator
- Use a VPN that allows OpenAI API
- Use a different network entirely


