#coding=utf-8

bookFile="天龙八部Y.txt"
keywordFile="金庸_p"

valueFile="天龙八部_people"

with open(keywordFile,encoding="utf-8") as f:
    keywordtxt=f.read()
with open(bookFile,encoding="utf-8") as f:
    booktxt=f.read()

keywordList=keywordtxt.split("\n")
print(keywordList)

bookList=booktxt.split("\n")
print("抓取到关键字行数："+str(len(keywordList)))
print("抓取到小说文本行数："+str(len(bookList)))
valuetxt=""
for i in range(len(bookList)):
    hadNum=0
    for n in range(len(keywordList)):
        if bookList[i].find(keywordList[n])!=-1:
            hadNum+=1
            valuetxt+=keywordList[n]+" "
    if hadNum>0:
        valuetxt=valuetxt[:-1]
    valuetxt+="\n"
valuetxt=valuetxt[:-1]

with open(valueFile,"w+",encoding="utf-8") as f:
    f.write(valuetxt)

print("分析完毕")
