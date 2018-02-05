var gm = require('gm');
var imageMagick = gm.subClass({ imageMagick: true });
imageMagick("screen.png")
.resize(300)
.autoOrient() 
.re
.write("c.png", function(err){
if(!err)
{
/ 回调函数可执行删除oldimage /
}
});