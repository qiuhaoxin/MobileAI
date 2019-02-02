import {getMainPageData,uploadLoc,tongyinConvert,chat,getChatSessionId,EXCEPTION} from '../services/api';
import * as ActionType from './actionType';
import {uploadError} from '../utils/utils';

const performance=window.performance;
export const changeLoading=flag=>{
	return {
		type:'changeLoading',
		showLoading:flag,
	}
}
//
function createParams(functionName,desc,duration){
  duration=parseFloat(duration).toFixed(2);
  return {
    FApp:'chatbot',
    FSessionId:window.chatSessionId,
    FTeminal:'Mobile',
    FFunction:functionName,
    FDesc:desc,
    FDuration:duration,
  }
}
//获取小K的配置信息
export const fetchMainPageData=(payload)=>{
	// console.log("payload is "+JSON.stringify(payload));
    let startTime=0,endTime=0;
    if(performance){
        startTime=performance.now();
    }
    return async dispatch=>{
    	//
    //	dispatch(changeLoading(showLoading));
    	try{
            const response=await getMainPageData(payload);
            endTime=performance.now();
            //console.log("startTime is "+startTime+" and endTime is "+endTime);
            if(response.code!='00'){
              err(dispatch,response['err']);
            }
            const params=createParams('getMainPage',JSON.stringify(response['data']),endTime - startTime);
            uploadError(params);
            dispatch({
            	type:ActionType.FETCH_MAINPAGE_DATA,
            	payload:response['data'],
            })
    	}catch(err){
          const params=createParams('getMainPage error',err,0);
          uploadError(params);
    	}
    }
}

/*
上传定位信息
@Param  payload:{
    sessionId:会话id
    locStr:位置信息 目前只是传市
}
*/
export const uploadLocation=(payload)=>{
    //console.log("payload in mainpage is "+JSON.stringify(payload));
   return async dispatch=>{
      try{
          const response=await uploadLoc(payload);
          //alert("response is "+JSON.stringify(response))
          if(response.code!='00'){
            err(dispatch,response['err']);
            return;
          }
          dispatch({
            type:ActionType.UPLOAD_LOC,
            payload:response['data'],
          })
      }catch(e){
          const params=createParams('uploadLocation error',err,0);
          uploadError(params);
      }
   }
}

function err(dispatch,err){
  dispatch({
     type:ActionType.EXCEPTION,
     payload:err,
  })
}
/*
* 同音词转换
*/
export const tongyinconvert=(payload)=>{
   return async dispatch=>{
      try{
        const response=await tongyinConvert(payload);
        //alert("tongyincovert response is "+JSON.stringify(response));
        if(response['code']!='00'){
           err(dispatch,response['err']);
           return;
        }
        dispatch({
          type:ActionType.TONG_YIN_CONVERT,
          payload:response['text'],
        })
      }catch(e){
          const params=createParams('tongyincovert error',err,0);
          uploadError(params);
      }
   }
}

export const getSessionId=(payload)=>{
   // console.log("getSessionId payload is "+JSON.stringify(payload));
    return async dispatch=>{
      try{
        const response=await getChatSessionId(payload);
        dispatch({
          type:ActionType.FETCH_SESSION_ID,
          payload:response['chatSessionID'],
        })
      }catch(e){
          const params=createParams('getSessionId error',err,0);
          uploadError(params);
      }
    }
}

/*
* 对话
  payload{
     sessionId:'',
     text:'',
  }
*/
export const chatDialog=(payload)=>{
   return async dispatch=>{
      try{
        const response=await chat(payload);
        //console.log("chat response is "+JSON.stringify(response));
        if(response && response.code!='00'){
            err(dispatch,response['err']);
            return;
        }
        dispatch({
          type:ActionType.CHAT,
          payload:{message:JSON.parse(response['message']),kdIntention:JSON.parse(response['kdIntention']),
          lastUnfinishedIntention:response['lastUnfinishedIntention'] && JSON.parse(response['lastUnfinishedIntention'])},
        })
      }catch(e){
          const params=createParams('chatDialog error',err,0);
          uploadError(params);
      }
   }
}




