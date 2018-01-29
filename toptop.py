#-*-coding:utf-8-*_
import bs4
from bs4 import BeautifulSoup as bs
import urllib2 as url
import urllib
import json
import time
import requests
import re
from textrank4zh import TextRank4Keyword, TextRank4Sentence
from selenium import webdriver
from termcolor import *
import chardet
import thread
# from ghost import Ghost

# ghost=Ghost()
# driver = webdriver.PhantomJS()
printColors=["blue","green","red"]
countMax=0
countRun=0
allAnswer=[]
allDesc=[]
stTime=0
edTime=0
tr4s = TextRank4Sentence()
tr4w = TextRank4Keyword()
class BaiduSpider(object):
    def __init__(self,word,max_page):
        self._word = word
        self._max_page = max_page
        p = {"wd":word}
        self._start_url = "http://www.baidu.com/s?" + urllib.urlencode(p)
        # print self._start_url
    
    def cprint(self,str,keyword):
        a=[]
        for i in range(len(keyword)):
            if str.find(keyword[i])>-1:
                a.append([str.find(keyword[i]),len(keyword[i]),i])
        a=sorted(a,key=lambda inde:inde[0]) #reverse=True
        rs=[]
        last=0
        for i in range(len(a)):
            print str[last:a[i][0]],
            print colored(keyword[a[i][2]],printColors[a[i][2]]),
            last=a[i][0]+a[i][1]
        print str[last:]
        # print str
    def _get_links(self):
        links = []
        # 从第一页开始获取其他几页的链接的结果不包括第一页的链接
        links.append(self._start_url)
        try:
            soup = bs(self._get_html(self._start_url),"lxml")
        except Exception:
            return

        links_tag = soup.select("#page")
        # print links_tag
        if 0 != len(links_tag):
            links_tag = links_tag[0]
        #
        for child in links_tag.children:
            # print child
            # print child.name
            # print "11111"
            if child.name=="a":
                attr = child.attrs
                if attr:
                    links.append("http://www.baidu.com" + attr["href"])

        end = self._max_page if self._max_page < len(links) else len(links)

        return links[:end]

    def _get_html(self,link,flag=False):
        try:
            req=url.Request(link)
            # req.add_header('Referer', 'http://www.baidu.com/')
            req.add_header('User-Agent',"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36")
            if flag==True:
                req.add_header('Host', 'cache.baiducontent.com')
                req.add_header('Upgrade-Insecure-Requests', '1')
                # print link
                # Host:cache.baiducontent.com
            res = url.urlopen(req,timeout=4)
            strs=res.read()

        except Exception,e:
            # print repr(e)
            
            return ""
  
        types=chardet.detect(strs)
        # print types
        try:
            s=strs.decode(types["encoding"])
        except Exception,e2:
            if types["encoding"]=="GB2312":
                try:
                    s=strs.decode("GBK")
                except Exception:
                    s=""
            else:
                s=""
        return s

    def _get_content(self,content):
        # 先要把bs4.element.NavigableString类型转化为string类型
        return reduce(lambda x,y:x+y,map(lambda x:x.replace("<em>","").replace("</em>",""),
                                     map(lambda x:x.string,content)))

    def _spider(self,answer,questWork,questStr):
        stTime=time.time()
        total_links = self._get_links()
        # print total_links
        global allAnswer
        global allDesc
        allDesc=[]
        allAnswer=[]
        # tr4w = TextRank4Keyword()
        global countRun
        global countMax
        countMax=0
        countRun=0
        for i,l in enumerate(total_links):
            print "Page {0}".format(i+1)
            # soup = bs(self._get_html(l),"lxml")
            try:
                soup = bs(self._get_html(l),"lxml")
            except Exception:
                continue
            # 找到左边内容到的跟节点
            base_div = soup.select("#content_left")[0] # base_div_list是一个列表

  
            childs = base_div.children
            
            for child in childs:
                if isinstance(child,bs4.element.Tag) and child.div and child.get('class',None) and 'c-container' in child['class']:
                    countMax+=1
                    abstract = child.select(".c-abstract")
                    # 如果没有找到c-abstract标签，则试着找下.c-span18标签
                    if 0 == len(abstract):
                        abstract = child.select(".c-span18")

                    
                    if 0 != len(abstract):
                        abstract_str = ""
                        for c in abstract[0].children:
                            if isinstance(c,bs4.element.NavigableString) and c.string!="\n":
                                abstract_str += c.string
                            # if isinstance(c,bs4.element.Tag):
                            #     for c1 in c.children:
                            #         if isinstance(c1,bs4.element.NavigableString) and c.string!="\n":
                            #             abstract_str += c1.string
                        # print "概要:",abstract_str
                        # self.cprint(abstract_str,answer)
                        rank=1
                        for cc in range(len(questWork)):
                            if abstract_str.find(questWork[cc])>-1:
                                rank+=1
                        allAnswer.append([abstract_str,rank])
                        allDesc.append(abstract_str)
                    thread.start_new_thread(self.moreGet,(child,answer,questWork))
                
                
        bb=[]
        max=0
        for i in range(len(answer)) :
            
            bb.append(0)
            
            for n in range(len(allDesc)) :
                if allDesc[n].find(answer[i])>-1:
                    bb[i]=bb[i]+1
        for i in range(len(answer)) :
            print answer[i] +u"###"+str(bb[i])
            if bb[i]>bb[max]:
                max=i
        print u"问题："+questStr
        print u"推荐答案："+answer[max]
        while countRun < countMax:
            # print countRun
            # print countMax
            time.sleep(0.01)
        aa=[]
        
        for i in range(len(answer)) :
            aa.append(0)
            # bb.append(0)
            for n in range(len(allAnswer)) :
                if allAnswer[n][0].find(answer[i])>-1:
                    aa[i]=aa[i]+allAnswer[n][1]
            # for n in range(len(allDesc)) :
            #     if allDesc[n].find(answer[i])>-1:
            #         bb[i]=bb[i]+1
        max=0
        a=sorted(allAnswer,key=lambda inde:inde[1],reverse=True)
        lent=0
        if len(a)>20:
            lent=20
        else:
            lent=len(a)
        for i in range(lent):
            self.cprint(a[i][0],answer)
            # print a[i][1]
            # print i
        # for i in range(len(answer)) :
        #     print answer[i] +u"###"+str(bb[i])
        #     if bb[i]>bb[max]:
        #         max=i
        # print u"问题："+questStr
        # print u"推荐答案："+answer[max]
        edTime=time.time()
        print u"运行时间"+str(edTime-stTime)


    def moreGet(self,child,answer,quest):
        # time_started = time.time()
        global countRun
        global allDesc
        # print "开始下载"+str(countRun)
        if isinstance(child,bs4.element.Tag) and child.div and child.get('class',None) and 'c-container' in child['class']:
            # 获取到title所在的tag
            # title所在的class标签为class=t
            title = child.select(".t")[0]
            infos = child.select(".f13 .m")
            
            global allAnswer
            # print "链接:",title.a["href"]
            titles=self._get_content(title.a.contents)
            # print "标题",titles
            rank=1
            for cc in range(len(quest)):
                if titles.find(quest[cc])>-1:
                    rank+=1
            allAnswer.append([titles,rank])
            allDesc.append(titles)
            if len(infos)>0 and 1>2:#
                # print infos[0]["href"]
                htmls=self._get_html(infos[0]["href"],True)
                # print htmls
                # print "aaaaaaaa"
            else:
                r=requests.head(title.a["href"],stream=True)
                # print r.headers['Location']
                # html=
                htmls=self._get_html(r.headers['Location'].encode("utf-8"))
            # print htmls
            htmls=re.sub('<script[\s|\S]*?</script>',"",htmls)
            htmls=re.sub('<style[\s|\S]*?</style>',"",htmls)
            try:
                sampleInfo=bs(htmls,"lxml")
            except Exception:
                countRun+=1
                return
            text=sampleInfo.get_text()
            text=re.split('\n',text)
            allTexts=[]
            for c in range(len(text)):
                texts=text[c].split('。')
                for d in range(len(texts)):
                    allTexts.append(texts[d])
            
            # print texts
            for a in range(len(allTexts)):
                # print texts[a]
                for v in range(len(answer)):
                    if allTexts[a].find(answer[v])>-1:
                        # print colored(allTexts[a],printColors[v]),colored("测试","yellow")
                        # self.cprint(allTexts[a],answer)
                        rank=1
                        for cc in range(len(quest)):
                            if allTexts[a].find(quest[cc])>-1:
                                rank+=1
                        allAnswer.append([allTexts[a],rank])
                        break
         
        countRun+=1
        print str(countRun)+"搜索完毕"

    def start(self,answer,ques,quesStr):
        self._spider(answer,ques,quesStr)



if '__main__' == __name__:
    strs="12.最适合替代母乳的是?"
    ansss=[u"牛奶",u"羊奶",u"驴奶"]
    tr4w.analyze(text=strs, lower=True, window=2)
    print( '关键词：' )
    quest=""
    quesArray=[]
    for item in tr4w.get_keywords(20, word_min_len=1):
        print item.word.encode("utf-8"), item.weight
        quest+=item.word.encode("utf-8")+" "
        quesArray.append(item.word.encode("utf-8"))
    for i in range(len(ansss)):
                quest+=" "+ansss[i]
    baidu_spider = BaiduSpider(quest,1)
    baidu_spider.start(ansss,quesArray,strs)
    print "测试通过"
    lastQ=""
    while True:
        try:
            res = url.urlopen("http://htpmsg.jiecaojingxuan.com/msg/current?showTime="+str(int(round(time.time() * 1000))))
            rs=res.read().decode("utf-8")
            rs=json.loads(rs)
        
            # print rs
            ques=rs[u"data"][u"event"][u"desc"].encode("utf-8")
            tr4w.analyze(text=ques, lower=True, window=2)
            # print( '关键词：' )
            quest=""
            quesArray=[]
            for item in tr4w.get_keywords(20, word_min_len=1):
                # print item.word.encode("utf-8"), item.weight
                quest+=item.word.encode("utf-8")+" "
                quesArray.append(item.word.encode("utf-8"))
            quesc=quest
            ans=json.loads(rs[u"data"][u"event"][u"options"].encode("utf-8"))
            for i in range(len(ans)):
                quesc+=" "+ans[i]
            if lastQ!=quesc:
                print 
                lastQ=quesc
                baidu_spider = BaiduSpider(quesc,1)
                baidu_spider.start(ans,quesArray,ques)
                print ques
                print json.dumps(ans)
        except Exception,e:
            a=1
        time.sleep(1)


