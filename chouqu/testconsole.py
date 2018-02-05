#coding=utf-8

from time import sleep 
import sys 

for i in range(1000): 
    sys.stdout.write(str(1000-i)+'\r') 
    sleep(0.1)