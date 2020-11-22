#!/usr/bin/env python
#TESTPI
import pigpio

class decoder:

   """Class to decode mechanical rotary encoder pulses."""

   def __init__(self, pi, gpioA, gpioB, callback):

      """
      Instantiate the class with the pi and gpios connected to
      rotary encoder contacts A and B.  The common contact
      should be connected to ground.  The callback is
      called when the rotary encoder is turned.  It takes
      one parameter which is +1 for clockwise and -1 for
      counterclockwise.

      EXAMPLE

      import time
      import pigpio

      import rotary_encoder

      pos = 0

      def callback(way):

         global pos

         pos += way

         print("pos={}".format(pos))

      pi = pigpio.pi()

      decoder = rotary_encoder.decoder(pi, 7, 8, callback)

      time.sleep(300)

      decoder.cancel()

      pi.stop()

      """

      self.pi = pi
      self.gpioA = gpioA
      self.gpioB = gpioB
      self.callback = callback

      self.levA = 0
      self.levB = 0

      self.lastGpio = None

      self.pi.set_mode(gpioA, pigpio.INPUT)
      self.pi.set_mode(gpioB, pigpio.INPUT)

      self.pi.set_pull_up_down(gpioA, pigpio.PUD_UP)
      self.pi.set_pull_up_down(gpioB, pigpio.PUD_UP)

      self.cbA = self.pi.callback(gpioA, pigpio.EITHER_EDGE, self._pulse)
      self.cbB = self.pi.callback(gpioB, pigpio.EITHER_EDGE, self._pulse)

   def _pulse(self, gpio, level, tick):

      """
      Decode the rotary encoder pulse.

                   +---------+         +---------+      0
                   |         |         |         |
         A         |         |         |         |
                   |         |         |         |
         +---------+         +---------+         +----- 1

             +---------+         +---------+            0
             |         |         |         |
         B   |         |         |         |
             |         |         |         |
         ----+         +---------+         +---------+  1
      """

      if gpio == self.gpioA:
         self.levA = level
      else:
         self.levB = level

      if gpio != self.lastGpio: # debounce
         self.lastGpio = gpio

         if   gpio == self.gpioA and level == 1:
            if self.levB == 1:
               self.callback(1)
         elif gpio == self.gpioB and level == 1:
            if self.levA == 1:
               self.callback(-1)

   def cancel(self):

      """
      Cancel the rotary encoder decoder.
      """

      self.cbA.cancel()
      self.cbB.cancel()
   

class motor:

   def __init__(self, pi, gpioA, gpioB, gpioE):

      self.pi = pi
      self.gpioA = gpioA
      self.gpioB = gpioB
      self.gpioE = gpioE

      self.levA = 0
      self.levB = 0

      self.lastGpio = None

      self.pi.set_mode(gpioA, pigpio.OUTPUT)
      self.pi.set_mode(gpioB, pigpio.OUTPUT)
      self.pi.set_mode(gpioE, pigpio.OUTPUT)

      self.pi.set_PWM_frequency(gpioE, 100)

   def move(self, state, pwm):
      if state == 0:
         self.pi.write(self.gpioA, 0)
         self.pi.write(self.gpioB, 0)
         self.pi.set_PWM_dutycycle(self.gpioE, 0)
      elif state == 1:
         self.pi.write(self.gpioA, 1)
         self.pi.write(self.gpioB, 0)
         self.pi.set_PWM_dutycycle(self.gpioE, pwm)
      elif state == 2:
         self.pi.write(self.gpioA, 0)
         self.pi.write(self.gpioB, 1)
         self.pi.set_PWM_dutycycle(self.gpioE, pwm)

   def cancel(self):

      self.pi.write(self.gpioA, 0)
      self.pi.write(self.gpioB, 0)
      self.pi.set_PWM_dutycycle(self.gpioE, 0)


if __name__ == "__main__":

   import time
   import pigpio
   import PID
   import contactless
   import json

   threesixty = 28300

   motor1 = [27, 4, 23]
   motor2 = [22, 17, 24]
   enable = [12, 16,  25]
   
   encoder1 = [6, 19, 20]
   encoder2 = [13, 26, 21]

   sign = [1,1,1]
   error = [0,0,0]
   pos = [0,0,0]

   with open('/home/pi/Contactless/public/cmy.json') as jsonFile:
      data = json.load(jsonFile)
      pos[0] = data['c']
      pos[1] = data['m']
      pos[2] = data['y']

   thres = 100
   speed = [0, 0, 0]
   TARGET = [pos[0], pos[1], pos[2]]
   KP = [0.08, 0.08, 0.1]
   KD = [0.03, 0.03, 0.04]
   KI = [0.01, 0.01, 0.015]
   pid = [0,0,0]

   for i in range (3):
      pid[i] = PID.PID(KP[i], KI[i], KD[i])
      pid[i].SetPoint = TARGET[i]*1000
      pid[i].setSampleTime(0.05)

   def callbackC(way):
      global pos
      pos[0] += way
      #print("posC={} ".format(pos[0]), speed[0], TARGET[0])

   def callbackM(way):
      global pos
      pos[1] += way
      #print("posM={} ".format(pos[1]), speed[1], TARGET[1])

   def callbackY(way):
      global pos
      pos[2] += way
      #print("posY={} ".format(pos[2]), speed[2], TARGET[2])

   pi = pigpio.pi()

   motorC = contactless.motor(pi, motor1[0], motor2[0], enable[0])
   decoderC = contactless.decoder(pi, encoder1[0], encoder2[0], callbackC)

   motorM = contactless.motor(pi, motor1[1], motor2[1], enable[1])
   decoderM = contactless.decoder(pi, encoder1[1], encoder2[1], callbackM)

   motorY = contactless.motor(pi, motor1[2], motor2[2], enable[2])
   decoderY = contactless.decoder(pi, encoder1[2], encoder2[2], callbackY)

   try:
      while True:
         try:
            with open('/home/pi/Contactless/public/cmy.json') as jsonFile:
               data = json.load(jsonFile)
               TARGET[0] = data['c']
               TARGET[1] = - data['m']
               TARGET[2] = data['y']
         except: 
            print("420")
         print ("C:", TARGET[0], error[0], speed[0], "M:", TARGET[1], error[1], speed[1], "Y:", TARGET[2], error[2], speed[2])
         
         time.sleep(0.1)

         pid[0].SetPoint = TARGET[0]
         speed[0] = pid[0].update(pos[0])
         speed[0] = max(min(255, abs(speed[0])), 50)
         error[0] = TARGET[0] - pos[0]
         if error[0] > thres:
            #print ("e")
            motorC.move(1, speed[0])
         elif error[0] < -thres:
            #print("a")
            motorC.move(2, speed[0])
         else:
            motorC.move(0,0)
            speed[0] = 0

         pid[1].SetPoint = TARGET[1]
         speed[1] = pid[1].update(pos[1])
         speed[1] = max(min(255, abs(speed[1])), 50)
         error[1] = TARGET[1] - pos[1]
         if error[1] > thres:
            #print ("e")
            motorM.move(1, speed[1])
         elif error[1] < -thres:
            #print("a")
            motorM.move(2, speed[1])
         else:
            motorM.move(0,0)
            speed[1] = 0
         
         pid[2].SetPoint = TARGET[2]
         speed[2] = pid[2].update(pos[2])
         speed[2] = max(min(255, abs(speed[2])), 50)
         error[2] = TARGET[2] - pos[2]
         if error[2] > thres:
            #print ("e")
            motorY.move(2, speed[2])
         elif error[2] < -thres:
            #print("a")
            motorY.move(1, speed[2])
         else:
            motorY.move(0,0)
            speed[2] = 0

         
   except KeyboardInterrupt:
      decoderC.cancel()
      motorC.cancel()
      decoderM.cancel()
      motorM.cancel()
      decoderY.cancel()
      motorY.cancel()
      pi.stop()

