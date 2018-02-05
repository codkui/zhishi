#coding=utf-8

from keras.layers import Dense,Input
from keras import Model
import numpy as np
import random

num_data=[]
num_labels=[]
for i in range(200000):
    num = random.randint(0,199)
    lis = np.zeros(200)
    lis[num]=1
    num_data.append(lis)
    num_labels.append(num)

input_data=np.array(num_data)
labels=np.array(num_labels)
# print(input_data[:5])
# print(labels[:5])

main_input=Input(shape=(200,))

x = Dense(200,activation="relu")(main_input)
# x = Dense(400,activation="relu")(x)
# x = Dense(300,activation="relu")(x)
main_output = Dense(1,activation="relu")(x)

model=Model(inputs=[main_input],outputs=[main_output])

model.compile(optimizer='rmsprop',loss='mean_squared_error')

model.fit([input_data],[labels],epochs=100,batch_size=256,validation_split=0.1,shuffle=True)

test_data=[]
test_labels=[]
for i in range(20):
    num = random.randint(0,199)
    lis = np.zeros(200)
    lis[num]=1
    test_data.append(lis)
    test_labels.append(num)
test_data=np.array(test_data)
test_labels=np.array(test_labels)

outs=model.predict(test_data)

print(outs)
print(test_labels)

