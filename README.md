# AB LightLink - ESP32 ARGB LED Controller

A comprehensive mobile application for controlling ARGB LED strips connected to ESP32 microcontrollers via WiFi and Bluetooth connectivity.

## Features

### 🎨 LED Control
- **Brightness Control**: Adjust LED brightness from 0-255
- **Color Selection**: RGB color picker and individual RGB sliders
- **Multiple Effects**: 
  - Solid color
  - Rainbow cycle
  - Fade in/out
  - Strobe
  - Breathing effect
  - Chase pattern
- **Speed Control**: Adjust effect animation speed
- **Power Control**: Turn LEDs on/off

### 📡 Connectivity
- **WiFi Connection**: Connect to ESP32 via local network or AP mode
- **Bluetooth LE**: Direct Bluetooth connection to ESP32
- **Dual Mode Support**: Seamlessly switch between connection types

### 📱 Mobile App
- **Modern UI**: Clean, intuitive interface with gradient design
- **Real-time Control**: Instant response to user inputs
- **Connection Status**: Visual indicators for connection state
- **Device Discovery**: Automatic scanning for available ESP32 devices

## Hardware Requirements

### ESP32 Setup
- ESP32 development board
- WS2812B/WS2811 ARGB LED strip
- Power supply (5V for LED strip)
- Connecting wires

### Wiring Diagram
```
ESP32 Pin 2  →  LED Strip Data Pin
ESP32 GND    →  LED Strip GND
5V Supply    →  LED Strip VCC
ESP32 GND    →  Power Supply GND
```

## Software Setup

### ESP32 Code
1. Install required libraries in Arduino IDE:
   - FastLED
   - ArduinoJson
   - WiFi (built-in)
   - BluetoothSerial (built-in)

2. Upload the provided `esp32_code.ino` to your ESP32

3. The ESP32 will create a WiFi access point:
   - SSID: `AB_LightLink_AP`
   - Password: `12345678`
   - IP: `192.168.4.1`

### Mobile App Installation

#### For Development:
1. Install Node.js and npm
2. Install Capacitor CLI: `npm install -g @capacitor/cli`
3. Clone this repository
4. Run `npm install`
5. Build the app: `npm run build`
6. Add Android platform: `npx cap add android`
7. Open in Android Studio: `npx cap open android`
8. Build and run the APK

#### For Production:
The APK file will be generated after building the project and can be installed directly on Android devices or published to Google Play Store.

## Usage Instructions

### First Time Setup
1. Power on your ESP32 with connected LED strip
2. Install and open the AB LightLink app
3. Choose connection method:
   - **WiFi**: Connect to `AB_LightLink_AP` network, then tap "Connect via WiFi"
   - **Bluetooth**: Tap "Connect via Bluetooth" and select your ESP32 device

### Controlling LEDs
1. **Brightness**: Use the brightness slider to adjust LED intensity
2. **Color**: 
   - Use the color picker for quick color selection
   - Use RGB sliders for precise color control
3. **Effects**: Tap any effect button to change LED patterns
4. **Speed**: Adjust effect animation speed with the speed slider
5. **Power**: Use ON/OFF buttons to control LED power state

## Technical Specifications

### Communication Protocol
- **WiFi**: HTTP REST API on port 80
- **Bluetooth**: JSON commands over Bluetooth Serial
- **Data Format**: JSON messages for all commands

### Supported Commands
```json
{
  "command": "brightness",
  "value": 128
}

{
  "command": "color",
  "r": 255,
  "g": 0,
  "b": 0
}

{
  "command": "effect",
  "type": "rainbow"
}

{
  "command": "speed",
  "value": 5
}

{
  "command": "power",
  "on": true
}
```

## Customization

### LED Configuration
Modify these constants in the ESP32 code:
- `NUM_LEDS`: Number of LEDs in your strip
- `LED_PIN`: GPIO pin connected to LED data line
- `LED_TYPE`: Type of LED strip (WS2812B, WS2811, etc.)

### WiFi Settings
Change the access point credentials:
- `ssid`: Network name
- `password`: Network password

### App Branding
- Replace logo in `public/logo.svg`
- Modify colors in `src/style.css`
- Update app name in `capacitor.config.ts`

## Troubleshooting

### Connection Issues
- Ensure ESP32 is powered and LED strip is connected
- Check WiFi network name and password
- Verify Bluetooth is enabled on mobile device
- Try restarting both ESP32 and mobile app

### LED Issues
- Check power supply capacity (LEDs require significant current)
- Verify data pin connection
- Ensure correct LED type in code configuration

### App Issues
- Grant all required permissions (Bluetooth, Location)
- Ensure device compatibility (Android 6.0+)
- Check network connectivity for WiFi mode

## License

This project is open source and available under the MIT License.

## Support

For support and updates, visit our GitHub repository or contact the development team.

---

**AB LightLink** - Illuminate your world with smart LED control!