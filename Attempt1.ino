#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// 1. Konfigurasi WiFi & Mosquitto
const char* ssid = "Galaxy A51 0736";
const char* password = "pookie12";
const char* mqtt_server = "10.130.199.240"; // Contoh: "192.168.1.15"
const int mqtt_port = 1883;

// 2. Konfigurasi Sensor DHT22
#define PIN_A 25

#define PIN_B 4
#define TIPE DHT22

DHT dhtA(PIN_A, TIPE);
DHT dhtB(PIN_B, TIPE);

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32-DHT22-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  dhtA.begin();
  dhtB.begin();
  
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  
  Serial.println("Uji sensor DHT22 A dan B dengan Mosquitto MQTT");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Membaca dan memublikasikan data setiap 3 detik tanpa mengganggu client.loop()
  unsigned long now = millis();
  if (now - lastMsg >= 3000) {
    lastMsg = now;

    float hA = dhtA.readHumidity();
    float tA = dhtA.readTemperature();
    float hB = dhtB.readHumidity();
    float tB = dhtB.readTemperature();

    // --- SENSOR A ---
    if (isnan(hA) || isnan(tA)) {
      Serial.println("A: GAGAL BACA");
      client.publish("sensor/dhtA/status", "ERROR");
    } else {
      Serial.print("A: ");
      Serial.print(tA, 1);
      Serial.print(" C, ");
      Serial.print(hA, 1);
      Serial.println(" %RH");

      // Publish data Sensor A ke Mosquitto
      client.publish("sensor/dhtA/suhu", String(tA, 1).c_str());
      client.publish("sensor/dhtA/kelembaban", String(hA, 1).c_str());
    }

    // --- SENSOR B ---
    if (isnan(hB) || isnan(tB)) {
      Serial.println("B: GAGAL BACA");
      client.publish("sensor/dhtB/status", "ERROR");
    } else {
      Serial.print("B: ");
      Serial.print(tB, 1);
      Serial.print(" C, ");
      Serial.print(hB, 1);
      Serial.println(" %RH");

      // Publish data Sensor B ke Mosquitto
      client.publish("sensor/dhtB/suhu", String(tB, 1).c_str());
      client.publish("sensor/dhtB/kelembaban", String(hB, 1).c_str());
    }
  }
}