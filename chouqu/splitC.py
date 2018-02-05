#coding=utf-8
import json
import jieba
import jieba.posseg as pseg
import time
import sys
import os
allC={}
def spilitC(text):
    global allC
    lens=len(text)
    for i in range(lens):
        for n in range(4):
            if lens-1-i-n>-1:
                
                keyword=text[i:i+n+1]
                if keyword in allC:
                    allC[keyword]=allC[keyword]+1
                else:
                    allC[keyword]=1

def jiebaS(text):
    # seg_list = jieba.cut(text)
    # print("Full Mode: " + "/ ".join(seg_list))  # 全模式
    words= pseg.cut(text)
    rs=[]
    for w in words:
        rs.append([w.word,w.flag])
    return rs

def lines(text):
    lineTs=[]
    lineTs=text.split("\n")
    return lineTs


def readText(filename,cod="utf-8"):
    with open(filename,encoding=cod) as f:
        return f.read()

def load():
    global allC
    if os.path.exists("save"):
        with open("save",encoding="utf-8") as f:
            dics=json.load(f)
        for i in range(len(dics)):
            allC[dics[i][0]]=dics[i][1]

def save():
    global allC
    allDic=[]
    for k in allC:
        allDic.append([k,allC[k]])
    
    allDic.sort(key=lambda x:x[1],reverse=True)
    with open("save","w+",encoding="utf-8") as f:
        json.dump(allDic,f,ensure_ascii=False)


if __name__=="__main__":
    load()
    if len(sys.argv)<2:
        print("参数不足，请输入文件名")
        exit()
    text=readText(sys.argv[1])
    lins=lines(text)
    allFlag=""
    for i in range(len(lins)):
        spilitC(lins[i])
        if i%100==0:
            sys.stdout.write(str(int(i/len(lins)*100))+'%\r') 
        flags=jiebaS(lins[i])
        allFlag+=json.dumps(flags,ensure_ascii=False)+"\n"
        # time.sleep(1)
    sys.stdout.write('100%\r')
    save()
    with open("flags","w+",encoding="utf-8") as f:
        f.write(allFlag)
