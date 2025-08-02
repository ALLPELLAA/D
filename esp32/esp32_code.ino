#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <FastLED.h>
#include <BluetoothSerial.h>

// LED Configuration
#define LED_PIN 2
#define NUM_LEDS 60
#define LED_TYPE WS2812B
#define COLOR_ORDER GRB

CRGB leds[NUM_LEDS];

// WiFi Configuration
const char* ssid = "AB_LightLink_AP";
const char* password = "12345678";

// Web Server
WebServer server(80);

// Bluetooth
BluetoothSerial SerialBT;

// LED Control Variables
uint8_t brightness = 128;
CRGB currentColor = CRGB::Red;
String currentEffect = "solid";
uint8_t effectSpeed = 5;
bool powerOn = true;

// Effect Variables
uint8_t hue = 0;
uint8_t effectCounter = 0;
unsigned long lastUpdate = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize LEDs
  FastLED.addLeds<LED_TYPE, LED_PIN, COLOR_ORDER>(leds, NUM_LEDS);
  FastLED.setBrightness(brightness);
  FastLED.clear();
  FastLED.show();
  
  // Setup WiFi Access Point
  WiFi.softAP(ssid, password);
  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);
  
  // Setup Web Server Routes
  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.on("/control", HTTP_POST, handleControl);
  server.enableCORS(true);
  server.begin();
  
  // Setup Bluetooth
  SerialBT.begin("AB_LightLink");
  Serial.println("Bluetooth device is ready to pair");
  
  // Initial LED state
  setEffect("solid");
}

void loop() {
  server.handleClient();
  handleBluetooth();
  updateLEDs();
  delay(10);
}

void handleRoot() {
  String html = R"(
<!DOCTYPE html>
<html>
<head>
    <title>AB LightLink ESP32</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial; text-align: center; background: #f0f0f0; }
        .container { max-width: 400px; margin: 50px auto; padding: 20px; background: white; border-radius: 10px; }
        h1 { color: #333; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .connected { background: #d4edda; color: #155724; }
    </style>
</head>
<body>
    <div class="container">
        <h1>AB LightLink</h1>
        <div class="status connected">ESP32 Ready</div>
        <p>Connect using the AB LightLink mobile app</p>
        <p>WiFi: AB_LightLink_AP</p>
        <p>Bluetooth: AB_LightLink</p>
    </div>
</body>
</html>
  )";
  server.send(200, "text/html", html);
}

void handleStatus() {
  DynamicJsonDocument doc(200);
  doc["status"] = "connected";
  doc["brightness"] = brightness;
  doc["effect"] = currentEffect;
  doc["power"] = powerOn;
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handleControl() {
  if (server.hasArg("plain")) {
    DynamicJsonDocument doc(512);
    deserializeJson(doc, server.arg("plain"));
    
    String command = doc["command"];
    
    if (command == "brightness") {
      brightness = doc["value"];
      FastLED.setBrightness(brightness);
    }
    else if (command == "color") {
      currentColor = CRGB(doc["r"], doc["g"], doc["b"]);
    }
    else if (command == "effect") {
      currentEffect = doc["type"].as<String>();
      setEffect(currentEffect);
    }
    else if (command == "speed") {
      effectSpeed = doc["value"];
    }
    else if (command == "power") {
      powerOn = doc["on"];
      if (!powerOn) {
        FastLED.clear();
        FastLED.show();
      }
    }
    
    server.send(200, "application/json", "{\"status\":\"ok\"}");
  } else {
    server.send(400, "application/json", "{\"error\":\"No data\"}");
  }
}

void handleBluetooth() {
  if (SerialBT.available()) {
    String message = SerialBT.readString();
    message.trim();
    
    DynamicJsonDocument doc(512);
    DeserializationError error = deserializeJson(doc, message);
    
    if (!error) {
      String command = doc["command"];
      
      if (command == "brightness") {
        brightness = doc["value"];
        FastLED.setBrightness(brightness);
      }
      else if (command == "color") {
        currentColor = CRGB(doc["r"], doc["g"], doc["b"]);
      }
      else if (command == "effect") {
        currentEffect = doc["type"].as<String>();
        setEffect(currentEffect);
      }
      else if (command == "speed") {
        effectSpeed = doc["value"];
      }
      else if (command == "power") {
        powerOn = doc["on"];
        if (!powerOn) {
          FastLED.clear();
          FastLED.show();
        }
      }
      
      // Send acknowledgment
      SerialBT.println("{\"status\":\"ok\"}");
    }
  }
}

void setEffect(String effect) {
  currentEffect = effect;
  effectCounter = 0;
  hue = 0;
}

void updateLEDs() {
  if (!powerOn) return;
  
  unsigned long currentTime = millis();
  unsigned long interval = map(effectSpeed, 1, 10, 200, 20);
  
  if (currentTime - lastUpdate < interval) return;
  lastUpdate = currentTime;
  
  if (currentEffect == "solid") {
    fill_solid(leds, NUM_LEDS, currentColor);
  }
  else if (currentEffect == "rainbow") {
    fill_rainbow(leds, NUM_LEDS, hue, 7);
    hue += 2;
  }
  else if (currentEffect == "fade") {
    uint8_t brightness = beatsin8(effectSpeed * 2, 0, 255);
    fill_solid(leds, NUM_LEDS, currentColor);
    FastLED.setBrightness(brightness);
  }
  else if (currentEffect == "strobe") {
    if (effectCounter % 2 == 0) {
      fill_solid(leds, NUM_LEDS, currentColor);
    } else {
      FastLED.clear();
    }
    effectCounter++;
  }
  else if (currentEffect == "breathe") {
    uint8_t breath = beatsin8(effectSpeed, 0, 255);
    fill_solid(leds, NUM_LEDS, currentColor);
    FastLED.setBrightness(breath);
  }
  else if (currentEffect == "chase") {
    FastLED.clear();
    for (int i = 0; i < NUM_LEDS; i += 4) {
      int pos = (i + effectCounter) % NUM_LEDS;
      leds[pos] = currentColor;
    }
    effectCounter++;
    if (effectCounter >= NUM_LEDS) effectCounter = 0;
  }
  
  FastLED.show();
  
  // Reset brightness for effects that modify it
  if (currentEffect == "fade" || currentEffect == "breathe") {
    FastLED.setBrightness(brightness);
  }
}