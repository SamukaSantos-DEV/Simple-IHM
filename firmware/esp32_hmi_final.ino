#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_ADXL345_U.h>
#include <Adafruit_NeoPixel.h>
// #include <Adafruit_ST7789.h> // Exemplo para display 180x180

// Configurações NeoPixel (LEDs RGB para a Logo)
#define LED_PIN 15
#define NUM_LEDS 8
Adafruit_NeoPixel pixels(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

// Sensor ADXL345
Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);

const char* ssid = "SUA_REDE";
const char* password = "SUA_SENHA";
const char* serverUrl = "http://192.168.1.XX:3001/update";

void setup() {
  Serial.begin(115200);
  pixels.begin();
  
  // Inicializa ADXL345
  if(!accel.begin()) {
    Serial.println("ADXL345 não encontrado!");
  }

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  
  // Aplica o gradiente da logo nos LEDs (Mock Visual)
  // Gradiente de #812FFF (R:129, G:47, B:255) para #5CE1E6 (R:92, G:225, B:230)
  for(int i=0; i<NUM_LEDS; i++) {
    int r = map(i, 0, NUM_LEDS-1, 129, 92);
    int g = map(i, 0, NUM_LEDS-1, 47, 225);
    int b = map(i, 0, NUM_LEDS-1, 255, 230);
    pixels.setPixelColor(i, pixels.Color(r, g, b));
  }
  pixels.show();
}

void loop() {
  sensors_event_t event; 
  accel.getEvent(&event);

  // Calcula vibração simples (Magnitude da aceleração)
  float vibration = sqrt(sq(event.acceleration.x) + sq(event.acceleration.y) + sq(event.acceleration.z));
  vibration = vibration / 9.81; // Normaliza em Gs

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["status"] = (vibration > 1.1); // Considera ligado se houver vibração mínima
    doc["vibration"] = vibration;
    doc["uptime"] = String(millis() / 1000) + "s";

    String requestBody;
    serializeJson(doc, requestBody);
    http.POST(requestBody);
    http.end();
  }
  
  delay(500); // Frequência de atualização
}
