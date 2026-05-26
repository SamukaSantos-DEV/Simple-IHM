#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid     = "SUA_REDE_WIFI";
const char* password = "SUA_SENHA";

// IP do seu computador (rode 'ipconfig' no terminal para descobrir)
const char* serverUrl = "http://192.168.1.XX:3001/update";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Conectado!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Coleta de dados reais ou simulados
    float vibration = 0.5 + (random(0, 100) / 200.0); // Simula vibração RMS
    bool isRunning = true;
    
    float voltage = 220.0 + (random(-50, 50) / 10.0); // Simula 215.0 a 225.0 V
    float current = 5.0 + (random(-10, 10) / 10.0);   // Simula 4.0 a 6.0 A
    float power = voltage * current;                  // Simula Potência em Watts
    
    // Criando JSON
    StaticJsonDocument<200> doc;
    doc["status"] = isRunning;
    doc["vibration"] = vibration;
    doc["uptime"] = String(millis() / 1000) + "s"; // Tempo simples para exemplo
    doc["voltage"] = voltage;
    doc["current"] = current;
    doc["power"] = power;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    
    if (httpResponseCode > 0) {
      Serial.print("Resposta do Servidor: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Erro no envio: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  }

  delay(1000); // Envia a cada 1 segundo
}
