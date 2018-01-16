// import { setInterval } from 'timers';


var fs= require('fs');
var $h= require('superagent');
var cheerio=require('cheerio');
var iconv = require('iconv-lite');
var exec = require('child_process').exec;
var gm = require('gm');
var imageMagick = gm.subClass({ imageMagick: true });
var escapeStringRegexp = require('escape-string-regexp');

queryPages=2
checkStartTime=""
checkEndTime=""
querys=[]

function patch(re,s){ //参数1正则式，参数2字符串
    re=escapeStringRegexp(re)
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
    $h("GET",url)
	.set("X-Requested-With","XMLHttpRequest")
	.set("User-Agent","Mozilla/5.0 (Windows NT 10.0; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0")
	.set("Content-Type","application/x-www-form-urlencoded; charset=UTF-8")
	.set("Accept","**")
	.set("Accept-Encoding","gzip, deflate, br")
	.set("Accept-Language","zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3")
	.end(function(err,data){
        if(err) {

            alls.push("")
            // console.log("遇到错误")
            return ""
        }

        if(data.status>300 && data.status<310){
            alls.push("")

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
        for(n=0;n<querys[1].length;n++){
            queryUrls.push(baidu+encodeURIComponent(querys[0]+" "+querys[1][n]))
        }
        
    }
    getHtmls(queryUrls,2,choiBaidu)
}

function choiBaidu(allHtml){
    allAnswer=[]
    allAnswerHtml=[]
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
            sample["titleHtml"]=tit.html()
            sample["descHtml"]=dsc.html()
            // allCache.push(every.eq(t).find(".f13 .m").eq(0).attr("href"))
            allCache.push(tit.attr("href"))
            // console.log(sample)
            allAnswer.push(sample["title"])
            allAnswerHtml.push(sample)
            allAnswer.push(sample["desc"])
            // getHtmls([sample["cache"]],2,text1)
           
            //计算rank
        }


        // console.log(every.eq(0).find(".t a").attr("href"))
    }
    console.log("一共抓取到:"+allAnswer.length)
    rank=[]
    ansRank={}
    // console.log(allAnswer)
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
    if(kkeys.length>0){
        console.log("找到绝对精准关联词句----------------------------------->")
        for(i=0;i<kkeys.length;i++){
            console.log(kkeys[i])
        }
    }else{
        console.log("找到相关词句------------------------------------------>")
        for(i=0;i<allAnswer.length;i++){
            console.log(allAnswer[i])
        }
    }
    
    max=0
    for(i=0;i<rank.length;i++){
        if(rank[i]>=rank[max]){
            max=i
        }
        console.log(querys[1][i]+"##权重##"+rank[i])
    }
    console.log("\r\n")
    console.log("问题："+querys[0])

    console.log("推荐答案"+querys[1][max]+"##")

    console.log("开始抓取具体数据")
    
    // getHtmls(allCache,2,pageInfo)
    
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

function testAns(que,i){
    setTimeout(function(){
        querys=que
        search(querys)
    },2*1000*i)
}

// aa=fs.readFile("ques.json",function(err,data){
//     if(err==null){
//         aa=JSON.parse(data)
//         console.log("打开测试题库"+aa.length)
//         for(i=0;i<aa.length;i++){
//             testAns(aa[i],i)
//         }
//     }
// })

// querys=["大象无法完成以下哪个动作？",["跳起","跪下","游泳"]]
// lastQuestion=""
// search(querys)

// var cli = 'adb shell screencap -p | sed \'s/\r$//\' > /Users/wukui/zhishi/screen.png';
// var cli = 'adb shell screencap -p > /Users/wukui/zhishi/screen.png';
// var options = { 
//     encoding: 'utf-8',
//     // timeout: 0,
//     maxBuffer: 1024 * 1024*10,
//     // killSignal: 'SIGTERM',
//     // setsid: false,
//     // cwd: null,
//     // env: null 
// }

// exec(cli,options,function (err,stdout,stderr){
//     if (err){
//         console.log(err);
//         return;
//     }


// })


function start(){
    startTimeTu=Date.now()
    var cli = 'adb shell /system/bin/screencap -p >/Users/wukui/zhishi/screen.png'
    exec(cli,function (err,stdout,stderr){
        if (err){
            console.log(err);
            return;
        }
        console.log('截图完毕'+(Date.now()-startTimeTu)/1000);
                imageMagick("/Users/wukui/zhishi/screen.png")
                .setFormat('JPEG')
                .resize(300)
                .quality(70)
                .strip()
                .autoOrient()
                // .autoOrient() 
                // .crop(300, 250, 0, 100)
                .write("/Users/wukui/zhishi/screenMin.jpg", function(err){
                if(!err)
                {
                / 回调函数可执行删除oldimage /
                shibie("/Users/wukui/zhishi/screenMin.jpg")
                console.log('截图成功,用时'+(Date.now()-startTimeTu)/1000);
                }
               
                
            })
        
    })
}

function start1(){
    startTimeTu=Date.now()
    var cli = 'adb shell /system/bin/screencap -p /sdcard/screenshot.png'
    exec(cli,function (err,stdout,stderr){
        if (err){
            console.log(err);
            return;
        }
        var cli = 'adb pull /sdcard/screenshot.png /Users/wukui/zhishi/screen.png'
            exec(cli,function (err,stdout,stderr){
                if (err){
                    console.log(err);
                    return;
                }
                console.log('截图完毕,用时'+(Date.now()-startTimeTu)/1000);
                imageMagick("/Users/wukui/zhishi/screen.png")
                .resize(300)
                .autoOrient() 
                // .crop(300, 250, 0, 100)
                .write("/Users/wukui/zhishi/screenMin.png", function(err){
                if(!err)
                {
                / 回调函数可执行删除oldimage /
                // shibie("/Users/wukui/zhishi/screenMin.png")
                console.log('截图成功,用时'+(Date.now()-startTimeTu)/1000);
                }
                });
                
            })
        // console.log('截图完毕');
    })
}


function shibie(file){
    fs.readFile(file,function(err,data){
        if(err!=null){
            console.log("读取文件失败")
        }
        aa=encodeURI(data.toString("base64"))
        // return
        strtime=Date.now()
        $h
        .post('https://aip.baidubce.com/rest/2.0/ocr/v1/general?access_token=24.2079a6ef9ed98a8c9acc75f0ac0dff20.2592000.1518588751.282335-10693201')
        .send({ 'image': aa })
        // .set('X-API-Key', 'foobar')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .end(function(err,res){
        if (err==null) {
            // alert('yay got ' + JSON.stringify(res.body));
            // console.log(res.body)
            
            console.log("单次识别完毕，用时"+(Date.now()-strtime)/1000+"秒")
            console.log(res.text)
            getQuerstion(JSON.parse(res.text))
        } else {
            alert('Oh no! error ' + res.text);
        }
        });
    })
    
}

function getQuerstion(data){
    if(data==undefined || data["words_result"].length==0){
        console.log("截图内未识别到文字，请查看手机是否黑屏")
        return
    }
    quers=""
    ans=[]
    console.log("进入问题拼合")
    Qcheck=false
    Qindex=0
    // console.log(data)
    for(i=0;i<data["words_result"].length;i++){
        // console.log(data["words_result"][i]["location"])
        whe=data["words_result"][i]["location"]
        sample=data["words_result"][i]
        if(Qcheck==false && (sample.words.length>1 || i>0 ) && (sample.words[sample.words.length-1]=="？" || sample.words[sample.words.length-1]=="?")){
            lastTop=whe.top
            for(n=i;n>-1;n--){
                
                if((data["words_result"][n]["location"]["top"]+whe.height*1.5)>lastTop){
                    quers=data["words_result"][n]["words"]+quers
                    console.log(quers)
                    lastTop=data["words_result"][n]["location"]["top"]
                }
            }
            Qcheck==true
            Qindex=i
            break
        }
 
    }
    //搜索答案字段
    lastLeft=0
    samNum=0
    ansIndex=Qindex
    if(data["words_result"].length-Qindex>=6){
        console.log("数据多")
        for(i=Qindex+1;i<data["words_result"].length;i++){
            lefs=data["words_result"][i]["location"]["left"]
            cha=lefs-lastLeft
            if(cha<2 && cha>-2){
                samNum+=1
            }else{
                if(samNum>=3){
                    break
                }else{
                    ansIndex=i
                    samNum=1
                    lastLeft=lefs
                }
            }
        }
    }else{
        samNum=data["words_result"].length-Qindex
    }
    

    ans=[]
    for(i=ansIndex+1;i<ansIndex+samNum;i++){
        ans.push(data["words_result"][i]["words"])
        console.log(i)
        console.log(data["words_result"][i]["words"])
    }

    //清理某些规范规则
    allCheck=true
    allcon=[{"A":1,"a":1,"1":1},{"B":1,"b":1,"2":1},{"C":1,"c":1,"3":1},{"D":1,"d":1,"4":1}]
    for(i=0;i<ans.length;i++){
        // console.log(ans[i][0])
        if(allcon[i][ans[i][0]]==1){
            allCheck=false
            ans[i]=ans[i].substring(1,ans[i].length+1)
            if(ans[i][0]==")"||ans[i][0]=="."){
                ans[i]=ans[i].substring(1,ans[i].length+1)
            }
            // break
        }
    }

    // if(allCheck==true){
    //     for(i=0;i<ans.length;i++){
    //         ans[i]=ans[i].substring(1,ans[i].length+1)
    //     }
    // }
    // console.log(quers)
    // console.log(ans)

           // if(a<200){
        //     continue
        // }
        // if(a<500){
        //     quers+=data["words_result"][i]["words"]
        //     continue
        // }
        // if(a<1000){
        //     ans.push(data["words_result"][i]["words"])
        //     continue
        // }
        // continue
        

        
    
    if(ans.length>4){
        anss=[]
        for(i=0;i<ans.length;i++){
            if(i%2==0){
                anss.push(ans[i])
            }
        }
    }else{
        anss=ans
    }
    querys=[quers,anss]
    console.log(querys)
    search(querys)
}


// setInterval(function(){
//     start()
// },2000)


start()

// getQuerstion(JSON.parse('{"log_id": 4711060008115555651, "words_result_num": 11, "words_result": [{"location": {"width": 43, "top": 12, "height": 10, "left": 27}, "words": "0Q浏器"}, {"location": {"width": 117, "top": 28, "height": 13, "left": 8}, "words": "店家远赴干里暴打女买家"}, {"location": {"width": 228, "top": 41, "height": 15, "left": 10}, "words": "苏州一位淘宝店主在买家付款后不发货,对方向客"}, {"location": {"width": 221, "top": 124, "height": 22, "left": 39}, "words": "10成语“白云苍狗”中的“苍"}, {"location": {"width": 96, "top": 152, "height": 20, "left": 97}, "words": "狗”本意指?"}, {"location": {"width": 64, "top": 218, "height": 16, "left": 39}, "words": "年老的狗"}, {"location": {"width": 37, "top": 221, "height": 10, "left": 215}, "words": "13800"}, {"location": {"width": 64, "top": 263, "height": 17, "left": 39}, "words": "受伤的狗"}, {"location": {"width": 79, "top": 308, "height": 18, "left": 39}, "words": "苍白色的狗"}, {"location": {"width": 33, "top": 311, "height": 12, "left": 221}, "words": "3323"}, {"location": {"width": 65, "top": 490, "height": 14, "left": 116}, "words": "左滑显示弹幕"}]}'))

// $h
// .post('https://aip.baidubce.com/rest/2.0/ocr/v1/general?access_token=24.2079a6ef9ed98a8c9acc75f0ac0dff20.2592000.1518588751.282335-10693201')
// .send({ 'url': 'http://upload-images.jianshu.io/upload_images/10068693-b5acc83a91dae8ff.png' })
// // .set('X-API-Key', 'foobar')
// .set('Content-Type', 'application/x-www-form-urlencoded')
// .end(function(err,res){
//   if (err==null) {
//     // alert('yay got ' + JSON.stringify(res.body));
//     console.log(res.body)
//     console.log(res.text)
//   } else {
//     alert('Oh no! error ' + res.text);
//   }
// });

