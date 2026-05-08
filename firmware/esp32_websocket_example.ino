#include <WiFi.h>
#include <WebSocketsClient.h> // Biblioteca: https://github.com/Links2004/arduinoWebSockets
#include <ArduinoJson.h>      // Biblioteca: https://arduinojson.org/

const char* ssid     = "SUA_REDE_WIFI";
const char* password = "SUA_SENHA";
const char* serverAddress = "192.168.1.XX"; // IP do seu computador rodando o dashboard
const int serverPort = 3000;

WebSocketsClient webSocket;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WSc] Desconectado!");
      break;
    case WStype_CONNECTED:
      Serial.println("[WSc] Conectado ao Dashboard!");
      break;
    case WStype_TEXT:
      Serial.printf("[WSc] Mensagem recebida: %s\n", payload);
      break;
  }
}

void setup() {
  Serial.begin(115200);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Conectado!");

  // Configuração WebSocket
  webSocket.begin(serverAddress, serverPort, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  webSocket.loop();

  static unsigned long lastMsg = 0;
  if (millis() - lastMsg > 1000) { // Envia dados a cada 1 segundo
    lastMsg = millis();

    // Simulação de leitura de sensores
    float temp = 20.0 + random(0, 100) / 10.0;
    float hum = 40.0 + random(0, 200) / 10.0;

    // Criando JSON
    StaticJsonDocument<200> doc;
    doc["sensor"] = "ESP32_MAIN";
    doc["temp"] = temp;
    doc["hum"] = hum;
    doc["uptime"] = millis() / 1000;

    String jsonStr;
    serializeJson(doc, jsonStr);

    // Enviando para o Dashboard
    webSocket.sendTXT(jsonStr);
    Serial.println("Dados enviados: " + jsonStr);
  }
}
