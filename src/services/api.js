
require('isomorphic-fetch');
import request from './request.js';

const urlObj={
	// 'test':'http://localhost:8888/rest/chatbot',//172.20.70.42:8888
	'test':'http://172.20.70.42:8888/rest/chatbot',//172.20.70.42:8888
	// 'test':'http://172.20.158.40:8888/rest/chatbot',//172.20.70.42:8888
	'prod':'.',//'./',
}

//172.20.71.86
//const urlPath="http://192.168.206.72/LightApp/data/";
//const urlPath="./";
// let urlPath="http://localhost:8888/rest/chatbot";
let urlPath="";
//let urlPath="http://172.20.70.42:8888/rest/chatbot";
// let urlPath="http://172.20.158.40:8888/rest/chatbot";

if(REQUESTURL){
	console.log("REQUESTURL is "+REQUESTURL);
	urlPath=urlObj[REQUESTURL];
}
//获取chatbot配置信息
export function getMainPageData(params){
	return request(urlPath+"/getmainpagedata",{
		method:'POST',
		body:params,
	}) 
}

/*
* 上传当前的定位信息 
*/
export const uploadLoc=(params)=>{
	//console.log("params in api is "+JSON.stringify(params));
    return request(urlPath+"/receiveLoc",{
    	method:'POST',
    	body:params,
    })
}

/*
* 说话结果进行同音转换
*/
export const tongyinConvert=(params)=>{
	return request(urlPath+"/tongyinConvert",{
		method:'POST',
		body:params,
	})
}

/*
* 获取对话 chatSessionID
*/
export const getChatSessionId=(params)=>{
	return request(urlPath+"/fetchSessionId",{
		method:'POST',
		body:params,
	})
}

//对话接口
export const chat=(params)=>{
	return request(urlPath + "/chat",{
		method:'POST',
		body:params,
	})
}


//上传日志 埋点前端监控
export const uploadLog=(params)=>{
	console.log("params is "+JSON.stringify(params));
	return request(urlPath + "/uplodaMobileLog",{
		method:'POST',
		body:params,
	})
}


//获取意图样本---引导语
export const getSamples=(params)=>{
	return request(urlPath+"/fetchIntentionSample",{
		method:'POST',
		body:params,
	})
}

//更新词槽
export const updateWordslot=(params)=>{
    return request(urlPath+"/modifyWordslot",{
    	method:'POST',
    	body:params,
    })
}

//点击编辑按钮，先请求跳转url
export const getEditUrl=(params)=>{
	return request(urlPath+"/executeIntention",{
		method:'POST',
		body:params,
	})
}

//上传是否帮助
export const uploadHelpfulInfo=(params)=>{
	return request(urlPath+"/uploadHelpInfo",{
		method:'POST',
		body:params,
	})
}

//上传建议
export const uploadSuggestion=(params)=>{
	return request(urlPath+"/uploadSuggestionInfo",{
		method:'POST',
		body:params,
	})
}

//情况session
export const clearSession=(params)=>{
	return request(urlPath+"/clearSession?sessionId="+params['sessionId'],{
		method:'GET',
	})
}

//上传反馈
export const uploadFeedback = (params)=>{
    return request(urlPath+"/uploadFeedback",{
        method:'POST',
        body:params,
    })
}