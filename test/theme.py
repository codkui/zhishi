#-*-coding:utf-8-*_
import urllib2 as url
import urllib
import time
import thread


maxCount=0
loadNum=20
def load(n):
    # print n,"开始下载"
    rs=url.urlopen("http://www.baidu.com/s?"+urllib.urlencode({"wd":n}))
    res=rs.read()
    # print n,"下载完毕",len(res)
    global maxCount
    maxCount+=1

if __name__=="__main__":
    starT=time.time()
    maxCount=0
    for i in range(loadNum):
        thread.start_new_thread(load,(i,))
    
    while(maxCount<loadNum):
        time.sleep(0.01)
    
    endT=time.time()

    print "运行用时",endT-starT
