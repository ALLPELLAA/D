import './style.css';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { BluetoothLe } from '@capacitor/bluetooth-le';
import { Network } from '@capacitor/network';

class ABLightLink {
  constructor() {
    this.isConnected = false;
    this.connectionType = null; // 'bluetooth' or 'wifi'
    this.currentDevice = null;
    this.esp32IP = null;
    
    this.init();
  }

  async init() {
    await this.setupCapacitor();
    this.setupUI();
    this.setupEventListeners();
    await this.checkPermissions();
  }

  async setupCapacitor() {
    // Set status bar style
    try {
      await StatusBar.setStyle({ style: 'DARK' });
      await StatusBar.setBackgroundColor({ color: '#667eea' });
    } catch (error) {
      console.log('StatusBar not available:', error);
    }

    // Initialize Bluetooth
    try {
      await BluetoothLe.initialize();
    } catch (error) {
      console.error('Bluetooth initialization failed:', error);
    }
  }

  setupUI() {
    document.getElementById('app').innerHTML = `
      <div class="app-container">
        <header class="app-header">
          <div class="logo-container">
            <img src="/logo.svg" alt="AB LightLink" class="logo">
            <h1>AB LightLink</h1>
          </div>
          <div class="connection-status ${this.isConnected ? 'connected' : 'disconnected'}">
            <span class="status-dot"></span>
            <span class="status-text">${this.isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </header>

        <main class="main-content">
          <div class="connection-section">
            <h2>Connection</h2>
            <div class="connection-buttons">
              <button id="bluetoothBtn" class="connection-btn bluetooth-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.71,7.71L12,2H11V9H9.41L7.71,7.29L6.29,8.71L10.59,13L6.29,17.29L7.71,18.71L9.41,17H11V24H12L17.71,18.29L14.41,15L17.71,11.71L14.41,8.5L17.71,7.71M13,5.83L15.17,8L13,10.17V5.83M13,15.83L15.17,18L13,20.17V15.83Z"/>
                </svg>
                Connect via Bluetooth
              </button>
              <button id="wifiBtn" class="connection-btn wifi-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,21L15.6,16.2C14.6,15.45 13.35,15 12,15C10.65,15 9.4,15.45 8.4,16.2L12,21M12,3C7.95,3 4.21,4.34 1.2,6.6L3,9C5.5,7.12 8.62,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C9.3,9 6.81,9.89 4.8,11.4L6.6,13.8C8.1,12.67 9.97,12 12,12C14.03,12 15.9,12.67 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z"/>
                </svg>
                Connect via WiFi
              </button>
            </div>
          </div>

          <div class="controls-section ${this.isConnected ? 'enabled' : 'disabled'}">
            <h2>LED Controls</h2>
            
            <div class="control-group">
              <label>Brightness</label>
              <div class="slider-container">
                <input type="range" id="brightnessSlider" min="0" max="255" value="128" class="slider">
                <span id="brightnessValue">128</span>
              </div>
            </div>

            <div class="control-group">
              <label>Color</label>
              <div class="color-controls">
                <input type="color" id="colorPicker" value="#ff0000" class="color-picker">
                <div class="rgb-controls">
                  <div class="rgb-slider">
                    <label>R</label>
                    <input type="range" id="redSlider" min="0" max="255" value="255" class="slider red">
                    <span id="redValue">255</span>
                  </div>
                  <div class="rgb-slider">
                    <label>G</label>
                    <input type="range" id="greenSlider" min="0" max="255" value="0" class="slider green">
                    <span id="greenValue">0</span>
                  </div>
                  <div class="rgb-slider">
                    <label>B</label>
                    <input type="range" id="blueSlider" min="0" max="255" value="0" class="slider blue">
                    <span id="blueValue">0</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="control-group">
              <label>Effects</label>
              <div class="effects-grid">
                <button class="effect-btn" data-effect="solid">Solid</button>
                <button class="effect-btn" data-effect="rainbow">Rainbow</button>
                <button class="effect-btn" data-effect="fade">Fade</button>
                <button class="effect-btn" data-effect="strobe">Strobe</button>
                <button class="effect-btn" data-effect="breathe">Breathe</button>
                <button class="effect-btn" data-effect="chase">Chase</button>
              </div>
            </div>

            <div class="control-group">
              <label>Speed</label>
              <div class="slider-container">
                <input type="range" id="speedSlider" min="1" max="10" value="5" class="slider">
                <span id="speedValue">5</span>
              </div>
            </div>

            <div class="power-controls">
              <button id="powerOn" class="power-btn on">Power ON</button>
              <button id="powerOff" class="power-btn off">Power OFF</button>
            </div>
          </div>
        </main>

        <div id="deviceModal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Select Device</h3>
              <button id="closeModal" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <div id="deviceList" class="device-list">
                <div class="scanning">Scanning for devices...</div>
              </div>
            </div>
          </div>
        </div>

        <div id="wifiModal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3>WiFi Connection</h3>
              <button id="closeWifiModal" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <div class="wifi-form">
                <label>ESP32 IP Address:</label>
                <input type="text" id="ipInput" placeholder="192.168.1.100" value="192.168.4.1">
                <button id="connectWifi" class="connect-btn">Connect</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Connection buttons
    document.getElementById('bluetoothBtn').addEventListener('click', () => this.connectBluetooth());
    document.getElementById('wifiBtn').addEventListener('click', () => this.showWifiModal());

    // Control sliders
    document.getElementById('brightnessSlider').addEventListener('input', (e) => this.updateBrightness(e.target.value));
    document.getElementById('colorPicker').addEventListener('input', (e) => this.updateColorFromPicker(e.target.value));
    
    // RGB sliders
    document.getElementById('redSlider').addEventListener('input', (e) => this.updateRGB());
    document.getElementById('greenSlider').addEventListener('input', (e) => this.updateRGB());
    document.getElementById('blueSlider').addEventListener('input', (e) => this.updateRGB());
    
    document.getElementById('speedSlider').addEventListener('input', (e) => this.updateSpeed(e.target.value));

    // Effect buttons
    document.querySelectorAll('.effect-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setEffect(e.target.dataset.effect));
    });

    // Power buttons
    document.getElementById('powerOn').addEventListener('click', () => this.setPower(true));
    document.getElementById('powerOff').addEventListener('click', () => this.setPower(false));

    // Modal controls
    document.getElementById('closeModal').addEventListener('click', () => this.hideDeviceModal());
    document.getElementById('closeWifiModal').addEventListener('click', () => this.hideWifiModal());
    document.getElementById('connectWifi').addEventListener('click', () => this.connectWifi());

    // Update display values
    this.updateSliderDisplays();
  }

  updateSliderDisplays() {
    const sliders = [
      { slider: 'brightnessSlider', display: 'brightnessValue' },
      { slider: 'redSlider', display: 'redValue' },
      { slider: 'greenSlider', display: 'greenValue' },
      { slider: 'blueSlider', display: 'blueValue' },
      { slider: 'speedSlider', display: 'speedValue' }
    ];

    sliders.forEach(({ slider, display }) => {
      const sliderEl = document.getElementById(slider);
      const displayEl = document.getElementById(display);
      sliderEl.addEventListener('input', () => {
        displayEl.textContent = sliderEl.value;
      });
    });
  }

  async checkPermissions() {
    try {
      // Check Bluetooth permissions
      const bluetoothEnabled = await BluetoothLe.isEnabled();
      if (!bluetoothEnabled.value) {
        await BluetoothLe.requestEnable();
      }
    } catch (error) {
      console.error('Permission check failed:', error);
    }
  }

  async connectBluetooth() {
    try {
      this.showDeviceModal();
      
      // Start scanning for devices
      await BluetoothLe.requestLEScan({
        services: [],
        name: 'AB_LightLink',
        namePrefix: 'ESP32'
      }, (result) => {
        this.addDeviceToList(result.device);
      });

      // Stop scanning after 10 seconds
      setTimeout(async () => {
        await BluetoothLe.stopLEScan();
      }, 10000);

    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      alert('Bluetooth connection failed: ' + error.message);
    }
  }

  showDeviceModal() {
    document.getElementById('deviceModal').style.display = 'flex';
    document.getElementById('deviceList').innerHTML = '<div class="scanning">Scanning for devices...</div>';
  }

  hideDeviceModal() {
    document.getElementById('deviceModal').style.display = 'none';
  }

  showWifiModal() {
    document.getElementById('wifiModal').style.display = 'flex';
  }

  hideWifiModal() {
    document.getElementById('wifiModal').style.display = 'none';
  }

  addDeviceToList(device) {
    const deviceList = document.getElementById('deviceList');
    
    // Remove scanning message
    const scanning = deviceList.querySelector('.scanning');
    if (scanning) scanning.remove();

    // Check if device already exists
    if (deviceList.querySelector(`[data-device-id="${device.deviceId}"]`)) return;

    const deviceElement = document.createElement('div');
    deviceElement.className = 'device-item';
    deviceElement.setAttribute('data-device-id', device.deviceId);
    deviceElement.innerHTML = `
      <div class="device-info">
        <div class="device-name">${device.name || 'Unknown Device'}</div>
        <div class="device-id">${device.deviceId}</div>
      </div>
      <button class="connect-device-btn">Connect</button>
    `;

    deviceElement.querySelector('.connect-device-btn').addEventListener('click', () => {
      this.connectToBluetoothDevice(device);
    });

    deviceList.appendChild(deviceElement);
  }

  async connectToBluetoothDevice(device) {
    try {
      await BluetoothLe.connect({ deviceId: device.deviceId });
      this.currentDevice = device;
      this.connectionType = 'bluetooth';
      this.isConnected = true;
      this.updateConnectionStatus();
      this.hideDeviceModal();
      
      // Discover services
      await BluetoothLe.discoverServices({ deviceId: device.deviceId });
      
    } catch (error) {
      console.error('Device connection failed:', error);
      alert('Device connection failed: ' + error.message);
    }
  }

  async connectWifi() {
    const ip = document.getElementById('ipInput').value.trim();
    if (!ip) {
      alert('Please enter ESP32 IP address');
      return;
    }

    try {
      // Test connection to ESP32
      const response = await fetch(`http://${ip}/status`, {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        this.esp32IP = ip;
        this.connectionType = 'wifi';
        this.isConnected = true;
        this.updateConnectionStatus();
        this.hideWifiModal();
      } else {
        throw new Error('ESP32 not responding');
      }
    } catch (error) {
      console.error('WiFi connection failed:', error);
      alert('WiFi connection failed. Please check IP address and ensure ESP32 is connected to the same network.');
    }
  }

  updateConnectionStatus() {
    const statusElement = document.querySelector('.connection-status');
    const statusText = document.querySelector('.status-text');
    const controlsSection = document.querySelector('.controls-section');

    if (this.isConnected) {
      statusElement.className = 'connection-status connected';
      statusText.textContent = `Connected via ${this.connectionType.toUpperCase()}`;
      controlsSection.className = 'controls-section enabled';
    } else {
      statusElement.className = 'connection-status disconnected';
      statusText.textContent = 'Disconnected';
      controlsSection.className = 'controls-section disabled';
    }
  }

  async sendCommand(command, data = {}) {
    if (!this.isConnected) return;

    const payload = { command, ...data };

    try {
      if (this.connectionType === 'wifi') {
        await fetch(`http://${this.esp32IP}/control`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (this.connectionType === 'bluetooth') {
        // Send via Bluetooth characteristic
        const message = JSON.stringify(payload);
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        
        await BluetoothLe.write({
          deviceId: this.currentDevice.deviceId,
          service: '12345678-1234-1234-1234-123456789abc',
          characteristic: '87654321-4321-4321-4321-cba987654321',
          value: Array.from(data)
        });
      }
    } catch (error) {
      console.error('Command send failed:', error);
    }
  }

  updateBrightness(value) {
    this.sendCommand('brightness', { value: parseInt(value) });
  }

  updateColorFromPicker(color) {
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    document.getElementById('redSlider').value = r;
    document.getElementById('greenSlider').value = g;
    document.getElementById('blueSlider').value = b;
    
    document.getElementById('redValue').textContent = r;
    document.getElementById('greenValue').textContent = g;
    document.getElementById('blueValue').textContent = b;
    
    this.sendCommand('color', { r, g, b });
  }

  updateRGB() {
    const r = parseInt(document.getElementById('redSlider').value);
    const g = parseInt(document.getElementById('greenSlider').value);
    const b = parseInt(document.getElementById('blueSlider').value);
    
    // Update color picker
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    document.getElementById('colorPicker').value = hex;
    
    this.sendCommand('color', { r, g, b });
  }

  setEffect(effect) {
    // Update active effect button
    document.querySelectorAll('.effect-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-effect="${effect}"]`).classList.add('active');
    
    this.sendCommand('effect', { type: effect });
  }

  updateSpeed(value) {
    this.sendCommand('speed', { value: parseInt(value) });
  }

  setPower(on) {
    this.sendCommand('power', { on });
    
    // Update button states
    document.getElementById('powerOn').classList.toggle('active', on);
    document.getElementById('powerOff').classList.toggle('active', !on);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ABLightLink();
});