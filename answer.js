var fs= require('fs');
var $h= require('superagent');
var cheerio=require('cheerio');
var iconv = require('iconv-lite');
var exec = require('child_process').exec;
var http = require("http");

queryPages=2
checkStartTime=""
checkEndTime=""


function patch(re,s){ //参数1正则式，参数2字符串
    re=eval("/"+re+"/ig"); //不区分大小写，如须则去掉i,改为 re=eval_r("/"+re+"/g")
    qq=s.match(re)
    var len = qq==null?0:qq.length;
    return len;
    }
function getHtmls(urls,timeouts,callF){
    if(arguments[1]==undefined){
        timeouts
    }
    checkStartTime=Date.now()
    allHtmls=[]
    starTi=Date.now()
    // console.log(urls)
    for(i=0;i<urls.length;i++){
        getHtmlSample(urls[i],allHtmls,urls.length,callF)
    }
    // runTime=0
    // vv=setInterval(function(){
    //     runTime+=10
    //     if(allHtmls.length<urls.length && runTime>=timeouts*1000){
    //         endTi=Date.now()

    //         console.log("抓取完毕"+allHtmls.length+"页，用时"+parseFloat((endTi-starTi)/1000)+"秒")
    //         // console.log(allHtmls.length)
    //         // console.log(endTi-starTi)
            
    //         callF(allHtmls)
    //         clearInterval(vv)
    //         // console.log()
    //         // console.log(allHtmls)
            
    //     }else if(runTime>=timeouts*1000){
    //         clearInterval(vv)
    //     }
    // },10)
}

function getHtmlSample(url,alls,num,callF){
    // $h.get(url,function(err,data){
    //     if(err) return ""
    //     console.log(url)
    //     // console.log(data)
    //     if(data.status==302||data.status==301){
    //         console.log("抓取到跳转型")
    //         console.log(data.header)
    //         return ""
    //     }
    //     alls.push(data.text)
    // })
    $h("GET",url)
	.set("X-Requested-With","XMLHttpRequest")
	.set("User-Agent","Mozilla/5.0 (Windows NT 10.0; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0")
	.set("Content-Type","application/x-www-form-urlencoded; charset=UTF-8")
	.set("Accept","**")
	.set("Accept-Encoding","gzip, deflate, br")
	.set("Accept-Language","zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3")
	.end(function(err,data){
        if(err) {
            // num=num-1
            // console.log(num)
            alls.push("")
            // console.log("遇到错误")
            return ""
        }
        // console.log(url)
        // console.log(data.status)
        // console.log(data.text)
        if(data.status>300 && data.status<310){
            alls.push("")
            // console.log("抓取到跳转型")
            // console.log(data.headers)
            return ""
        }
        if(data.status!=200){
            console.log(data.status)
        }
        alls.push(data.text)
        // console.log("抓取完毕"+alls.length+"/"+num)
        if(alls.length>=num){
            // console.log("预计抓取"+num)
            checkEndTime=Date.now()
            console.log("本次下载用时"+(checkEndTime-checkStartTime)/1000)
            callF(alls)
        }
    })
}


function search(querys){
    baidu="https://www.baidu.com/s?ie=utf-8&mod=1&isbd=1&isid=ed5c968900062cf9&ie=utf-8&f=8&rsv_bp=1&tn=baidu&wd="
    queryUrls=[]
    answer=["好友","仇人","同事"]
    for(i=0;i<queryPages;i++){
        queryUrls.push(baidu+encodeURIComponent(querys[0]))
    }
    getHtmls(queryUrls,2,choiBaidu)
}

function choiBaidu(allHtml){
    allAnswer=[]
    allCache=[]
    for(i=0;i<allHtml.length;i++){
        $=cheerio.load(allHtml[i])
        // console.log($)
        
        every=$(".c-container")
        for(t=0;t<every.length;t++){
            tit=every.eq(t).find(".t a")
            dsc=every.eq(t).find(".c-abstract")
            sample={}
            // sample["url"]=tit.attr("href")
            sample["title"]=tit.text()
            sample["desc"]=dsc.text()
            // allCache.push(every.eq(t).find(".f13 .m").eq(0).attr("href"))
            allCache.push(tit.attr("href"))
            // console.log(sample)
            allAnswer.push(sample["title"])
            allAnswer.push(sample["desc"])
            // getHtmls([sample["cache"]],2,text1)
           
            //计算rank
        }


        // console.log(every.eq(0).find(".t a").attr("href"))
    }
    console.log("一共抓取到:"+allAnswer.length)
    rank=[]
    ansRank={}
    // console.log(querys)
    for(i=0;i<querys[1].length;i++){
        rank.push(0)
        for(n=0;n<allAnswer.length;n++){
                
                rankNu=patch(querys[1][i],allAnswer[n])
                rank[i]+=rankNu
                if(rankNu>0){
                    ansRank[allAnswer[n]]=rankNu
                }
        }
    }
    kkeys=Object.keys(ansRank)
    for(i=0;i<kkeys.length;i++){
        console.log(kkeys[i])
    }
    max=0
    for(i=0;i<rank.length;i++){
        if(rank[i]>=rank[max]){
            max=i
        }
    }
    console.log("\r\n")
    console.log("问题："+querys)
    console.log("推荐答案"+querys[1][max])

    console.log("开始抓取具体数据")
    
    getHtmls(allCache,2,pageInfo)
    
}

function pageInfo(htmls){
    // console.log(htmls[0])
    for(i=0;i<htmls.length;i++){
        $=cheerio.load(htmls[i])
        // console.log($.text())
        // console.log(iconv.decode($("title").text(), 'gb2312'))
        charset=$("head meta").attr("content")
        console.log(charset)
        switch(charset){
            case "text/html; charset=gb2312":
                console.log(iconv.decode(new Buffer($("title").text()), 'gb2312'))
                break
            case "text/html; charset=utf-8":
                console.log($("title").text())
                break
            default:
                console.log($("title").text())
                break
        }
        
        // console.log($("title").text())
    }
}

function text1(all){
    
    data=all[0]
    // console.log(data)
    data=JSON.parse(data)
    if(data.data!=undefined){
        console.log(data)
    }
    if(data.data!=undefined && data.data.event!=undefined && data.data.event.desc!=undefined && lastQuestion!=data.data.event.desc){
        console.log("抓取到新问题-------------------------------------->"+data.data.event.desc)
        // console.log(all)
        lastQuestion=data.data.event.desc
        querys=[data.data.event.desc,JSON.parse(data.data.event.options)]
    }
    return
}

function getChongDing(){
   // http://htpmsg.jiecaojingxuan.com/msg/current?showTime=
   url="http://htpmsg.jiecaojingxuan.com/msg/current?showTime="
   setInterval(function(){
       urls=[url+Date.now()]
       getHtmls(urls,2,text1)
   },1000)

   urls=[url+Date.now()]
   getHtmls(urls,2,text1)

}



querys=["中国无声影片的最高峰《神女》，是以下哪位演员的代表作 ",["胡蝶","周璇","阮玲玉"]]
lastQuestion=""
search(querys)
// setTimeout(function(){
//     getChongDing()
// },1000)


// def
// getHtmls(["http://www.baidu.com","http://www.zhihu.com","http://www.bilibili.com","http://www.baidu.com","http://www.zhihu.com","http://www.zhihu.com","http://www.zhihu.com"])