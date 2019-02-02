const fs=require('fs');
const Path=require('path');
const contextStr='${context}';
const chatSessionIdStr='${chatSessionId}';
const unameStr='${uname}';
const messageStr='${message}';
const avatarStr='${avatar}';
const welcomeTextStr='${welcomeText}';

const destPath="E:\\AI\\trunk\\0.1\\platform1\\web\\src\\main\\webapp\\static";
 const destPath1="E:\\AI\\trunk\\0.1\\platform1\\web\\src\\main\\webapp";
//要插入html的注入内容
const insertStr=`  
   <script th:inline="JavaScript" charset="utf-8">  
    /*<![CDATA[*/  
        var context = [[${contextStr}]];
        window.chatSessionId = [[${chatSessionIdStr}]];
        var uname = [[${unameStr}]];
        var message=[[${messageStr}]];
        var avatar=[[${avatarStr}]];
        var welcomeText=[[${welcomeTextStr}]];
    /*]]>*/  
    </script>
    `
const templatePath="";//html文件路径
const staticPath="";//静态文件的路径
fs.readFile('../dist/template/index.html','utf8',(err,data)=>{
    data=dealLinkTag(data);
    data=insertScript(data);
})

//处理<link>问题 应该加s闭合 /
function dealLinkTag(data){
    const linkReg=/(<link\s+href=([^\s]+)\s+rel=([^\s]+))(>\s*<\/head>)/im;
    const result= linkReg.test(data);
    if(result){
    	data=data.replace(linkReg,"$1 /$4")
    }
    return data;
}

function insertScript(data){
    if(data.indexOf('<script')>-1){
     	const index=data.indexOf('<script');
     	const beforeData=data.substring(0,index);
     	const afterData=data.substring(index);
     	const newStr=`${beforeData}
     	              ${insertStr}
     	              ${afterData}`;
      const indexPath='../dist/template/index.html';
      const destIndexPath=Path.join(destPath1,'templates/chatbot/index.html');
      fs.writeFile(indexPath,newStr,'utf8',(err)=>{
          if(err){
             console.log("insertScript haved error is "+err);
             return;
          }     
          readFileStream(indexPath,destIndexPath);
      })
    }
}
//拷贝静态文件到指定路径
function copyFile(path){
   if(isDirectory(path)){
   	  fs.readdir(path,(err,files)=>{
   	  	  for(const file of files){
             const pathName=Path.join(path,file);
             if(isDirectory(pathName)){
                readDir(pathName,file);
             }
   	  	  }
   	  })
   }
}

function readDir(dirName,lastDirName,callBack){
  if(lastDirName!='media'){
    fs.readdir(dirName,(err,files)=>{
       for(const file of files){
         const destFilePath=Path.join(destPath,lastDirName,file);
         readFileStream(Path.join(dirName,file),destFilePath)
       }
    });
  }
}
function isDirectory(path){
  const stats=fs.statSync(path);
  return stats.isDirectory();
}
//读文件流
function readFileStream(filePath,destFilePath){
  let file=fs.createReadStream(filePath,{encoding:'utf8'});
  let out=fs.createWriteStream(destFilePath,{encoding:'utf8'});
  file.on('open',function(fd){
      console.log(`开始读取文件${filePath}...`);
  })
  file.on('data',function(data){
     out.write(data);
  })
  file.on('end',function(fd){
     console.log(`文件${filePath}读取完毕`);
  })
  file.on('close',function(fd){

  })
  file.on('error',function(){

  })
}
copyFile('../dist/static');