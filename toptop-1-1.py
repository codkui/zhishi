#-*-coding:utf-8-*_
import bs4
from bs4 import BeautifulSoup as bs
import urllib2 as url
import urllib
import json
import time
from termcolor import *
printColors=["blue","green","red"]

class BaiduSpider(object):
    def __init__(self,word,max_page):
        self._word = word
        self._max_page = max_page
        p = {"wd":word}
        self._start_url = "http://www.baidu.com/s?" + urllib.urlencode(p)
        # print self._start_url

    def _get_links(self):
        links = []
        # 从第一页开始获取其他几页的链接的结果不包括第一页的链接
        links.append(self._start_url)

        soup = bs(self._get_html(self._start_url),"lxml")

        links_tag = soup.select("#page")
        # print links_tag
        if 0 != len(links_tag):
            links_tag = links_tag[0]
        #
        # for child in links_tag.children:
        #     print child
        #     attr = child.attrs
        #     if attr:
        #         links.append("http://www.baidu.com" + attr["href"])

        end = self._max_page if self._max_page < len(links) else len(links)

        return links[:end]
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

    def _get_html(self,link):
        req=url.Request(link)
            # req.add_header('Referer', 'http://www.baidu.com/')
        req.add_header('User-Agent',"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36")
        res = url.urlopen(req)
        return res.read().decode("utf-8")

    def _get_content(self,content):
        # 先要把bs4.element.NavigableString类型转化为string类型
        return reduce(lambda x,y:x+y,map(lambda x:x.replace("<em>","").replace("</em>",""),
                                     map(lambda x:x.string,content)))

    def _spider(self,answer):

        total_links = self._get_links()
        print total_links
        allAnswer=[]
        for i,l in enumerate(total_links):
            print "Page {0}".format(i+1)
            soup = bs(self._get_html(l),"lxml")
            # 找到左边内容到的跟节点
            base_div = soup.select("#content_left")[0] # base_div_list是一个列表

  
            childs = base_div.children
            for child in childs:
                # isinstance(child,bs4.element.Tag) 用来过滤掉\n
                # 'c-container' in child['class'] 用来过滤掉广告
                # child.div 过滤掉其他的干扰
                if isinstance(child,bs4.element.Tag) and child.div and child.get('class',None) and 'c-container' in child['class']:
                    # 获取到title所在的tag
                    # title所在的class标签为class=t
                    title = child.select(".t")[0]

                    # print "链接:",title.a["href"]
                    htmlText=self._get_content(title.a.contents)
                    self.cprint(u"标题"+htmlText,answer)
                    allAnswer.append(self._get_content(title.a.contents))
                    # 查找abstract所在的tag
                    # abstract坐在的class标签是class=c-abstract
                    abstract = child.select(".c-abstract")
                    # 如果没有找到c-abstract标签，则试着找下.c-span18标签
                    if 0 == len(abstract):
                        abstract = child.select(".c-span18")

                    #
                    if 0 != len(abstract):
                        abstract_str = ""
                        for c in abstract[0].children:
                            if isinstance(c,bs4.element.NavigableString):
                                abstract_str += c.string
                            if isinstance(c,bs4.element.Tag):
                                for c1 in c.children:
                                    if isinstance(c1,bs4.element.NavigableString):
                                        abstract_str += c1.string
                        self.cprint(u"概要:"+abstract_str,answer)
                        print "\r\n"
                        allAnswer.append(abstract_str)
        aa=[]
        for i in range(len(answer)) :
            aa.append(0)
            for n in range(len(allAnswer)) :
                if allAnswer[n].find(answer[i])>-1:
                    aa[i]=aa[i]+1
        max=0
        for i in range(len(answer)) :
            print answer[i] +u"###"+str(aa[i])
            if aa[i]>aa[max]:
                max=i
        
        print u"推荐答案"+answer[max]



    def start(self,answer):
        self._spider(answer)



if '__main__' == __name__:
    baidu_spider = BaiduSpider("12.电影公司派拉蒙现在的标志中共有多少颗星星？",2)
    baidu_spider.start([u"20",u"22",u"24"])
    print "测试通过"
    lastQ=""
    while True:
        req=url.Request("http://htpmsg.jiecaojingxuan.com/msg/current?showTime="+str(int(round(time.time() * 1000))))
            # req.add_header('Referer', 'http://www.baidu.com/')
        req.add_header('User-Agent',"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36")
        res = url.urlopen(req)
        rs=res.read().decode("utf-8")
        rs=json.loads(rs)
        if rs[u"msg"]!=u"no data" and rs[u"data"][u"event"].has_key(u"desc"):
            # print rs
            ques=rs[u"data"][u"event"][u"desc"].encode("utf-8")
            if lastQ!=ques:
                
                lastQ=ques
                ans=rs[u"data"][u"event"][u"options"].encode("utf-8")
                
                baidu_spider = BaiduSpider(ques,2)
                baidu_spider.start(json.loads(ans))
                print ques
                print ans
        time.sleep(2)


