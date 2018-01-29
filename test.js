// import { request } from 'https';

// import { setInterval } from 'timers';


var fs= require('fs');
var $h= require('superagent');
var cheerio=require('cheerio');
var iconv = require('iconv-lite');
var exec = require('child_process').exec;
var gm = require('gm');
var imageMagick = gm.subClass({ imageMagick: true });
var escapeStringRegexp = require('escape-string-regexp');
var colors=require("colors")
var http = require("http");

queryPages=1
checkStartTime=""
checkEndTime=""
querys=[]
runStatus=0

function patch(re,s){ //参数1正则式，参数2字符串
    re=escapeStringRegexp(re)
    re=eval("/"+re+"/ig"); //不区分大小写，如须则去掉i,改为 re=eval_r("/"+re+"/g")
    qq=s.match(re)
    var len = qq==null?0:qq.length;
    return len;
    }
function getHtmls(urls,timeouts,callF,qu,res){
    if(arguments[1]==undefined){
        timeouts
    }
    checkStartTime=Date.now()
    allHtmls=[]
    starTi=Date.now()
    // console.log(urls)
    for(i=0;i<urls.length;i++){
        getHtmlSample(urls[i],allHtmls,urls.length,callF,qu,res)
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

function getHtmlSample(url,alls,num,callF,qu,res){
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
            callF(alls,qu,res)
        }
    })
}


function search(querys,res){
    queryPages=1
    
    baidu="https://www.baidu.com/s?ie=utf-8&mod=1&isbd=1&isid=ed5c968900062cf9&ie=utf-8&f=8&rsv_bp=1&tn=baidu&wd="
    queryUrls=[]
    answer=["好友","仇人","同事"]
    for(i=0;i<queryPages;i++){
        queryUrls.push(baidu+encodeURIComponent(querys[0]))
        for(n=0;n<querys[1].length;n++){
            queryUrls.push(baidu+encodeURIComponent(querys[0]+" "+querys[1][n]))
        }
        
    }
    getHtmls(queryUrls,1,choiBaidu,querys,res)
}

function choiBaidu(allHtml,querys,res){
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
            allAnswerHtml.push(sample["titleHtml"])
            allAnswer.push(sample["desc"])
            allAnswerHtml.push(sample["descHtml"])
            // getHtmls([sample["cache"]],2,text1)
           
            //计算rank
        }


        // console.log(every.eq(0).find(".t a").attr("href"))
    }
    console.log("一共抓取到:"+allAnswer.length)
    rank=[]
    ansRank={}
    // console.log(allAnswer)
    keywordExp=/(<em>[\s|\S]*?<\/em>)/
    for(i=0;i<querys[1].length;i++){
        rank.push(0)
        for(n=0;n<allAnswer.length;n++){
                
                rankNu=patch(querys[1][i],allAnswer[n])
                keywords=keywordExp.exec(allAnswerHtml[n])
                keyRank=0
                if(keywords!=null){
                    for(z=0;z<keywords.length;z++){
                        keySample=keywords[z]
                        keylen=keySample.length-9
                        keyRank+=keylen
                    }
                }
                // console.log(allAnswerHtml[n])
                // console.log(keywords.length)
                // console.log(keywords!=null)
                // console.log(keyRank)
                rank[i]+=rankNu
                if(rankNu>0){
                    rank[i]+=keyRank
                    ansRank[allAnswer[n]]=rankNu
                }
                // return
        }
    }

    seachInfo={"all":[],"find":[],"end":[],"ans":""}
    kkeys=Object.keys(ansRank)
    if(kkeys.length>0){
        // console.log("\r\n")
        // console.log("找到绝对精准关联词句----------------------------------->")
        // console.log("\r\n")
        if(kkeys.length>=3){
            kkeysLen=3
        }else{
            kkeysLen=kkeys.length
        }
        for(i=0;i<kkeysLen;i++){
            textP=kkeys[i]
            seachInfo["find"].push(textP)
            // for(n=0;n<querys[1].length;n++){
                // textA=textP.split(querys[1][n])
                
                // console.log(textA)
                // textP=""
                // for(x=0;x<textA.length;x++){
                    
                //     // if(x==0){
                //     //     textP+=textA[x]
                //     // }else{
                //     //     switch(n){
                //     //         case 0:
                //     //             textP+=querys[1][n].red+textA[x]
                //     //             break
                //     //         case 1:
                //     //             textP+=querys[1][n].green+textA[x]
                //     //             break
                //     //         case 2:
                //     //             textP+=querys[1][n].blue+textA[x]
                //     //             break
                //     //         case 3:
                //     //             textP+=querys[1][n].yellow+textA[x]
                //     //             break
                //     //         default:
                //     //             textP+=querys[1][n].magenta+textA[x]
                //     //             break
                //     //     }
                //     //     // textP+=querys[1][n].red+textA[x]
                //     // }
                // }
            // }
            // console.log(textP)
        }
    }else{
        // console.log("\r\n")
        // console.log("找到相关词句------------------------------------------>")
        // console.log("\r\n")
        // if(kkeys.length>=3){
        //     kkeysLen=3
        // }else{
        //     kkeysLen=kkeys.length
        // }
        for(i=0;i<allAnswer.length;i++){
            seachInfo["all"].push(allAnswer[i])
            // console.log(allAnswer[i].green)
        }
    }
    console.log("\r\n")
    max=0
    rankAll=0
    for(i=0;i<rank.length;i++){
        rankAll+=rank[i]
        // console.log(querys[1][i]+"##权重##"+rank[i])
    }
    for(i=0;i<rank.length;i++){
        if(rank[i]>=rank[max]){
            max=i
        }
        seachInfo["end"].push([querys[1][i],rank[i]/rankAll*100])
        // console.log(querys[1][i]+"##权重##"+rank[i])
    }

    seachInfo["quest"]=querys[0]
    seachInfo["ans"]=querys[1][max]
    // console.log("\r\n")
    // console.log("问题："+querys[0])

    // console.log("推荐答案##"+querys[1][max].underline.red)

    // console.log("\r\n")
    // console.log("\r\n")

    runStatus=0
    res.end(JSON.stringify(seachInfo) )
    // console.log("开始抓取具体数据")
    
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
    // console.log("进入答题流程")
    // return
    startTimeTu=Date.now()
    var cli = 'adb shell /system/bin/screencap -p >/Users/wukui/zhishi/screen.png'
    exec(cli,function (err,stdout,stderr){
        if (err){
            console.log(err);
            return;
        }
        // console.log('截图完毕'+(Date.now()-startTimeTu)/1000);
                imageMagick("/Users/wukui/zhishi/screen.png")
                .setFormat('JPEG')
                .resize(500)
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
            // console.log(res.text)
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
    // console.log("进入问题拼合")
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
                    // console.log(quers)
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
        // console.log("数据多")
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
        // console.log(i)
        // console.log(data["words_result"][i]["words"])
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

function readFShell(callback) {
    if(runStatus==1){
        return
    }
    runStatus=1
    dataNum=0
    process.stdout.write('输入回车进行答题:');
    process.stdin.resume();
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', function(chunk) {
        // console.log(1)
        process.stdin.pause();
        if(dataNum==0){
            callback(chunk);
        }
        dataNum+=1
        
    });
}



http.createServer(function (request, response) {

    // 发送 HTTP 头部 
    // HTTP 状态值: 200 : OK
    // 内容类型: text/plain
    console.log("收到请求数据")
    response.writeHead(200, {'Content-Type': 'application/json;charset=utf-8','access-control-allow-origin':'*'});
    angu=decodeURI(request.url)
    angu=angu.split("/")
    if(angu.length>2){
        quest=angu[1]
        ans1=[]
        for(i=2;i<angu.length;i++){
            if(angu[i]!=""){
                ans1.push(angu[i])
            }
        }
        console.log([quest,ans1])
        // querys=[quest,ans1]
        search([quest,ans1],response)
    }else{
        response.end('{"code":400}');
    }
    
    // 发送响应数据 "Hello World"
    
}).listen(8080);

// setInterval(function(){
    
//         readFShell(start)
    
// },100)


// start()


