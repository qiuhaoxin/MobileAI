import {put,take,call,cancel,fork,takeEvery,takeLatest,all} from 'redux-saga/effects';
import {delay} from 'redux-saga';//高级API//takeLatest
import * as ActionType from '../action/actionType';
import {getMainPageData,uploadLoc,tongyinConvert,chat,getChatSessionId,EXCEPTION,getSamples,updateWordslot,
  getEditUrl,uploadHelpfulInfo,uploadSuggestion,uploadFeedback,clearSession,uploadLog} from '../services/api';

let logParams={
         FApp:'chatbot',
         FTeminal:'Mobile',
}
//处理异常
function* dealException(exceptionStr,params){
  console.log("exceptionStr is "+exceptionStr);
   exceptionStr='苍穹太大，我彻底迷路了，稍后再试吧,点我反馈问题';
      yield put({
        type:ActionType.EXCEPTION, 
        payload:exceptionStr,
      })
      console.log("dealException params is "+JSON.stringify(params));
     yield call(uploadLog,params);
}

//获取chatbot主页的应用列表
function* getMainPageDataAPI (payload){
	try{
	    const response=yield call(getMainPageData,payload.payload);
      if(response.code!=='00'){
          yield call(dealException,response.err);
          return;
      }
	    yield put({
	    	type:ActionType.DEAL_MAINPAGE_DATA,
	    	payload:{appList:response.data.appList,title:response.data.title,appListPagination:response.data.pagination},
	    })
      payload.callback && payload.callback(response.data);
	}catch(e){
        logParams.FDesc="exception:type"+e.name+" desc is "+e.message;
        logParams.FFunction="getMainPageDataAPI";
        logParams.FSessionId=payload.payload.sessionId;
        yield fork(dealException,`getChatSessionIdAPI:${e}`,logParams);
	}
}

function* tongyinConvertAPI (payload){
	try{
       const response=yield call(tongyinConvert,payload);
       if(response.code!=='00'){
            yield call(dealException,response.err);
            return;
       }
       return response;
	}catch(e){
       logParams.FDesc="exception:type"+e.name+" desc is "+e.message;;
       logParams.FFunction="tongyinConvertAPI";
       logParams.FSessionId=payload.payload.sessionId;
       yield fork(dealException,`tongyinConvertAPI:${e}`,logParams);
	}
}

function* getChatSessionIdAPI(payload){
	try{
       //setTimeout(function(){
         const response=yield call(getChatSessionId,payload.payload);
         if(response.code!=='00'){
            yield call(dealException,response.err);
            return;
         }
         yield put({
             type:ActionType.DEAL_SESSION_ID,
             payload:response.chatSessionID,
         })
       //},300)
	}catch(e){
       logParams.FDesc="exception:type"+e.name+" desc is "+e.message;;
       logParams.FFunction="getChatSessionIdAPI";
      // logParams.FSessionId=payload.payload.sessionId;
      yield fork(dealException,`getChatSessionIdAPI:${e}`,logParams);
	}
}

//清空session上下文
function* clearSessionAPI(payload){
  try{
    console.log("payloas is "+JSON.stringify(payload.payload));
    const response=yield call(clearSession,payload.payload);
    console.log("clearSession response is "+JSON.stringify(response));
    if(response.code=='00'){
      payload.callback && payload.callback();
    }else{
      yield call(dealException,response.err);
      return;
    }
    // logParams.FDesc="you click back";
    // logParams.FFunction="click";
    // logParams.FSessionId=payload.payload.sessionId;
    // yield fork(uploadLog,logParams);
  }catch(e){
    console.log("celasdfs");
    logParams.FDesc="exception:type"+e.name+" desc is "+e.message;
    logParams.FFunction="clearSessionAPI";
    logParams.FSessionId=payload.payload.sessionId;
    console.log("logParams is "+JSON.stringify(logParams));
   // yield fork(dealException,`getChatSessionIdAPI:${e}`,logParams);
  }
}

function* chatAPI(payload){
    if('payload' in payload){
      payload=payload.payload;
    }
    let response=null;
    try{
    	if(payload.message=='提交'){
    		yield delay(3000);
    	}else{
    	    yield delay(500);
    	}
        response=yield call(chat,payload);
        if(response.code!='00'){
          yield call(dealException,response.err);
          return;
        }
        yield put({
        	type:ActionType.DEAL_CHAT,
        	payload:{
        		message:JSON.parse(response['message']),
        		kdIntention:JSON.parse(response['kdIntention']),
            text:'',
        		lastUnfinishedIntention:response['lastUnfinishedIntention'] && JSON.parse(response['lastUnfinishedIntention']),
        	},
        })
    }catch(e){
      logParams.FDesc="you say :"+payload.payload.message+e;
      logParams.FFunction="chatAPI";
      logParams.FSessionId=payload.payload.sessionId;
      yield fork(dealException,`chatAPI:${e}`,logParams);
    }
}

function* modifyWordslot(payload){
   try{
      const response=yield call(updateWordslot,payload.payload);
      yield put({
        type:ActionType.DEAL_MODIFY_WORDSLOT,
        payload:{
            message:JSON.parse(response['message']),
            kdIntention:JSON.parse(response['kdIntention']),
            text:'',
            lastUnfinishedIntention:response['lastUnfinishedIntention'] && JSON.parse(response['lastUnfinishedIntention']),
        }
      })
   }catch(e){
      logParams.FDesc="exception:type"+e.name+" desc is "+e.message;;
      logParams.FFunction="modifyWordslot";
      logParams.FSessionId=payload.payload.sessionId;
      yield fork(dealException,`getChatSessionIdAPI:${e}`,logParams);
   }
}

function* getSamplesAPI(payload){
   try{
       const response=yield call(getSamples,payload.payload);

   }catch(e){
      logParams.FDesc="exception:type"+e.name+" desc is "+e.message;;
      logParams.FFunction="getSamplesAPI";
      logParams.FSessionId=payload.payload.sessionId;
      yield fork(dealException,`getSamplesAPI:${e}`,logParams);
   }
}

//首次上报位置
function* uploadLocationAPI(payload){
   try{
        const response=yield call(uploadLoc,payload.payload);
        //alert("response is "+JSON.stringify(response));

   }catch(e){
      logParams.FDesc="exception:type"+e.name+" desc is "+e.message;;
      logParams.FFunction="uploadLocationAPI";
      logParams.FSessionId=payload.payload.sessionId;
      yield fork(dealException,`updateLocationAPI:${e}`,logParams);
   }
}

//获取意图的样本
function* getIntentionSample(payload){
   try{
      const response=yield call(getSamples,payload.payload);
      if(response.result.result==1){
         let tempArr=[];
         const list=response.result.data;
         list.list.forEach(item=>tempArr.push(item.sentence));
         yield put({
           type:ActionType.DEAL_INTENTION_SAMPLES,
           payload:tempArr,
         })
      }

   }catch(e){
      logParams.FDesc="exception:type"+e.name+" desc is "+e.message;;
      logParams.FFunction="getIntentionSample";
      logParams.FSessionId=payload.payload.sessionId;
      yield fork(dealException,`getIntentionSampleAPI:${e}`,logParams);
   }
}

//获取编辑详情的url
function* getBUSEditUrl(payload){
  try{
     const response=yield call(getEditUrl,payload.payload);
     if(response.code!='00'){
          yield call(dealException,response.err);
          return;
     }
     if(payload.callback){
        payload.callback(response);
     }
  }catch(e){
      logParams.FDesc="exception:type"+e.name+" desc is "+e.message;;
      logParams.FFunction="getBUSEditUrl";
      logParams.FSessionId=payload.payload.sessionId;
      yield fork(dealException,`getBUSEditUrl:${e}`,logParams);
  }
}

function* uploadHelpfulInfoAPI(payload){
  try{
     const response=yield call(uploadHelpfulInfo,payload.payload);
  }catch(e){

  }
}

function* uploadSuggestionAPI(payload){
  try{
    yield fork(uploadSuggestion,payload.payload);
  }catch(e){
      logParams.FDesc="exception:type"+e.name+" desc is "+e.message;;
      logParams.FFunction="uploadSuggestionAPI";
      logParams.FSessionId=payload.payload.sessionId;
      yield fork(dealException,`uploadSuggestionAPI:${e}`,logParams);
  }
}

function* uploadFeedbackAPI(payload) {
    try{
        const response=yield call(uploadFeedback,payload.payload);
       
        const callback=payload.callback;
        callback && callback(response);

    }catch (e) {
      logParams.FDesc="exception:type"+e.name+" desc is "+e.message;
      logParams.FFunction="uploadFeedbackAPI";
      logParams.FSessionId=payload.payload.sessionId;
      yield fork(dealException,`uploadFeedbackAPI:${e}`,logParams);
    }
}

function* watchUploadHelpfulInfo(){
  yield takeLatest(ActionType.UPLOAD_HELPFUL_INFO,uploadHelpfulInfoAPI);
}

function* watchUploadSuggestion(){
  yield takeLatest(ActionType.UPLOAD_SUGGESTION_INFO,uploadSuggestionAPI);
}

function* watchUploadFeedback() {
    yield takeLatest(ActionType.UPLOAD_FEEDBACK_INFO,uploadFeedbackAPI);
}

function* watchGetMainPageData(){
	yield takeEvery(ActionType.FETCH_MAINPAGE_DATA,getMainPageDataAPI);
}
function* watchTongyinConvert(){
	yield takeEvery(ActionType.TONG_YIN_CONVERT,tongyinConvertAPI);
}
function* watchGetSessionID(){
	yield takeEvery(ActionType.FETCH_SESSION_ID,getChatSessionIdAPI)
}
function* watchChatAPI(){
	yield takeEvery(ActionType.CHAT,chatAPI);
}
function* watchUpdateLocAPI(){
  yield takeEvery(ActionType.UPLOAD_LOC,uploadLocationAPI);
}
function* watchClearSession(){
  yield takeLatest(ActionType.CLEAR_SESSION,clearSessionAPI);
}
function* watchSayAPI(){
	while(true){
       try{
		   const payload=yield take(ActionType.SAY);
		   const sessionId=payload.payload.sessionId;
       let response=null;
       if(payload.payload.type=='chat'){
          response=yield call(tongyinConvertAPI,payload.payload);
       }else{
         //页面非用户语音录入的文本不用调用同音转换接口
          response={text:payload.payload.textShow};
       }
       yield put({
          type:ActionType.DEAL_TONGYIN_CONVERT,
          payload:{
            text:response.text,
            kdIntention:null,
          }
       })
       yield delay(500);
       const message=payload.payload.type=='chat' ? response.text : payload.payload.textParams;
       let params={
          sessionId,message
       }
       if(payload.payload.extraParams){
          params={...params,...payload.payload.extraParams};
       }
       yield call(chatAPI,params);
      }catch(e){
            //alert("exception in watchSayAPI is "+e);
        //dealException(`watchSayAPI:${e}`);
        logParams.FDesc=e;
        logParams.FFunction="watchSayAPI";
        logParams.FSessionId=window.chatSessionID;
        yield fork(dealException,`watchSayAPI:${e}`,logParams);
      }
	}
}
function* watchModifWordslot(){
  yield takeEvery(ActionType.MODIFY_WORDSLOT,modifyWordslot);
}
function* watchGetEditUrl(){
  yield takeEvery(ActionType.REQUEST_EDIT_URL,getBUSEditUrl);
}
function* watchLocalID(){
  while(true){
    try{
      const payload=yield take(ActionType.LOCAL_ID);
      yield put({
         type:ActionType.SAVE_LOCAL_ID,
         payload:payload.payload.localId,
      })
    }catch(e){

    }
  }
}



function* watchSampleAPI(){
  yield takeEvery(ActionType.FETCH_INTENTION_SAMPLES,getIntentionSample);
}
export default function* rootSaga() {
   try{
	   yield fork(watchGetMainPageData);
	   yield fork(watchGetSessionID);
	   yield fork(watchChatAPI);
	   yield fork(watchSayAPI);
     yield fork(watchUpdateLocAPI);
     yield fork(watchSampleAPI);
     yield fork(watchModifWordslot);
     yield fork(watchGetEditUrl);
     yield fork(watchUploadSuggestion);
     yield fork(watchUploadHelpfulInfo);
     yield fork(watchClearSession);
     yield fork(watchUploadFeedback);

     //yield fork(watchLocalID);
   }catch(e){
      logParams.FDesc=e;
      logParams.FFunction="rootSaga";
      logParams.FSessionId=window.chatSessionID;
      console.log("rootSaga exception");
      yield fork(dealException,`rootSaga:${e}`,logParams);
   }

}