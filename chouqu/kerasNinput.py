#coding=utf-8

from keras.layers import LSTM,Dense,Input,Embedding,concatenate
from kears.models import Model
import keras
from numpy import shape


#初始化输入，100个输入单位，类型为int32,可以理解为初始向量层
main_input = Input(shape=(100,),dtype="int32",name='main_input')
#词向量转换
x = Embedding(output_dim=512,input_dim=10000,input_length=100)(main_input)

#主输入lstm层块
lstm_out = LSTM(32)(x)

#增加额外损失，保证主损失异常高时 lstm和embedding也可以平滑训练，这里就是文本处理的模块最后接入节点
auxiliary_output = Dense(1,activation='sigmoid',name='aux_output')(lstm_out)

#第二输入数据的初始化向量
auxiliary_input = Input(shape(5,),name='aux_input')

#输入整合，将lstm层和第二输入数据组合
x = keras.layers.concatenate([lstm_out,auxiliary_input])

#多全连接层内部处理结构
x = Dense(64,activation='relu')(x)
x = Dense(64,activation='relu')(x)
x = Dense(64,activation='relu')(x)

#输出
main_output = Dense(1,activation='sigmoid',name='main_output')

model=Model(inputs=[main_input,auxiliary_input],outputs=[main_output,auxiliary_output])

model.compile(optimizer='rmsprop',loss='binary_crossentropy',loss_weights=[1.,0.2])
model.fit([headline_data,additional_data],[labels,labels],epochs=50,batch_size=32)