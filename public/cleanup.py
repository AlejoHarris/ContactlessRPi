import RPi.GPIO as GPIO  
import pigpio

# the rest of your code would go here  
  
# when your code ends, the last line before the program exits would be... 
pi = pigpio.pi()
pi.stop()
GPIO.cleanup()  