#include <Servo.h>

#define NUM_SERVOS 6

Servo servos[NUM_SERVOS];  // create servo object to control a servo

void setup() {
  for(int i = 0; i < 5; i++) {
    servos[i].attach(i+2);
    servos[i].write(90);
  }
  Serial.begin(115200);
}

void loop() {
  byte degrees[NUM_SERVOS];
  Serial.readBytesUntil('\n', degrees, NUM_SERVOS);
  for(int i = 0; i < NUM_SERVOS; i++)
    servos[i].write(degrees[i]);
  
    
}

