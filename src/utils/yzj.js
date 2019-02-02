/*
* 云之家接口
*/
import {isEmpty,uploadError} from './utils';

function createParams(functionName,desc,duration=0){
  duration=parseFloat(duration).toFixed(2);
  return {
    FApp:'chatbot',
    FSessionId:window.chatSessionId,
    FTeminal:'Mobile',
    FFunction:"yzj api "+functionName,
    FDesc:desc,
    FDuration:duration,
  }
}
//是否运行在云之家
export const isYZJ=()=>{
	//alert(navigator.userAgent)
	return navigator.userAgent.match(/Qing\/.*;(iOS|iPhone|Android).*/)?true:false; 
}
//获取云之家语言， 
export const getYZJLang=()=>{
  const userAgent=navigator.userAgent;
  return (/lang\:en\-/g).test(userAgent)==true ? 'english':'chinese';
}

//获取操作系统平台，
export const getOS=()=>{
  return navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/) ? 'iOS' :
    navigator.userAgent.match(/Android/i) ? 'Android' : '' ; 
}

//获取当前用户的网络状态
export const getNetWorkType=(fn)=>{
	XuntongJSBridge.call('getNetworkType', {}, function(result){
      alert("用户网络状态："+JSON.stringify(result));
    });
}

/*
*获取当前定位
{
    success: true or false 是否成功(String)
    error: 错误信息(String)
    errorCode: 错误码(int)
    data:{'latitude'：22.2748379,                         //维度
          'longitude':133.2324334,                        //经度
          'province':'广东省',                            //省
          'city':'深圳市',                                //市
          'district':'南山区',                            //区
          'name':'金蝶软件园',                            //名称
          'address':'科技南十二道',                       //地址
          'addressdetail':广东省深圳市南山区科技南十二道'   //详细地址
    }
}
*/

export const getLocation=(fn)=>{
   XuntongJSBridge.call('getLocation',{},function(result){
   	  if(String(result.success)=='true'){
        if(fn)fn(result);
      }else{
        //alert("getLocation is "+result.error);
        uploadError(createParams('getLocation',result.error,0))
      }
   });
}

/*
* 选取周边地址
  options:{
	lan:'',
	lon:'',
	isLocation:'',
  }
result:
  {
    success: true or false 是否成功(String)
    error: 错误信息(String)
    errorCode: 错误码(int)
    data:{'latitude'：22.2748379,                         //维度
          'longitude':133.2324334,                        //经度
          'province':'广东省',                            //省
          'city':'深圳市',                                //市
          'district':'南山区',                            //区
          'name':'金蝶软件园',                            //名称
          'address':'科技南十二道',                       //地址
          'addressdetail':广东省深圳市南山区科技南十二道'   //详细地址
    }
}
*/
export const selectLocatoin=(options,fn)=>{
	if(isEmpty(options.lan)||isEmpty(options.lon)){
		return;
	}
	//0.9.6及以上支持
	XuntongJSBridge.call('selectLocation', {
	    'latitude':options.lan,
	    'longitude':options.lon,
	    'isLocation':options.isLocation, 
	}, function(result){
		fn && fn(result);
	});
}


/*
* 调用扫一扫
   @Param:needResult	int	否	是否需要处理，默认为0，扫描结果由云之家处理，1则直接返回扫描结果。
   result:
	{
	    success: true or false 是否成功(String)
	    error: 错误信息(String)
	    errorCode: 错误码(int)
	    data:{
	         "qrcode_str":"xxx"
	    }
	}
*/
export const scanQRCode=(fn)=>{
	XuntongJSBridge.call("scanQRCode",  {
       "needResult":0
       }, function(result) {
         if(String(result.success)=='true'){
            fn && fn(result);
         }else{
             uploadError(createParams('scanQRCode',result.error,0));
         }
    });
}


export const back=(fn)=>{
	XuntongJSBridge.call('defback', {}, function () {
		fn && fn();
        XuntongJSBridge.call('closeWebView');
    })
}

/*
* 旧的声音采集接口
*/
export const speak=(fn)=>{
	 XuntongJSBridge.call('voiceRecognize',{

     },function(result){
        if(String(result.success)=='true'){
          fn && fn(result); 
        }else{
          //alert("speak error is "+result.error);
          uploadError(createParams('speak error is ',result.error,0));
        }
    })
}

/*
*暂停播报
*/
export const stopPlayVoice=(localId,fn)=>{
   XuntongJSBridge.call('stopVoice', {localId:localId},
      function(result){
        if(String(result.success)=='true'){
          fn && fn(result);
        }else{
          //alert("stopPlayVoice"+result.error);
         // uploadError(createParams('stopPlayVoice',result.error,0));
        }
      }
  );
}


/*
* 语音播报接口
*/
export const playVoice=(msgContent,fn,afterFn)=>{
    XuntongJSBridge.call('voiceSynthesize',{
        'text':msgContent,
        'voiceName':'xiaoyan'
    },function(result){
      if (result.success == true || result.success == 'true') {
            //_this.localId = result.data.localId;
            const localId=result.data.localId;
            fn && fn(localId,result);
            const len = result.data.len;
            XuntongJSBridge.call('playVoice', { localId:localId},function(result){
                 //alert("result is "+JSON.stringify(result));
                 if(String(result['success'])=='true'){
                    if(result['data'] && result['data']['playStatus']==1){
                      afterFn && afterFn();
                    }
                 }else{
                    alert("playVoice error is "+result['error']);
                 }
            })
      }else{
        //alert("playVoice error is "+result.error);
         uploadError(createParams('playVoice',result.error,0));
      }
    })
}

/*
* 云之家 返回按钮
*/
export const backYZJ=(fn)=>{
    XuntongJSBridge.call('defback', {}, function () {
        fn && fn();
        //if (history.length <= 1) { //顶级页面，则关闭当前Web
        XuntongJSBridge.call('closeWebView');
                
    })
}

/*
* 新的开始录音接口
*/
export const startSpeech=(fn)=>{

    XuntongJSBridge.call('startSpeechRecognize',{},function(result){
     // alert("rsult is "+JSON.stringify(result))
      if(String(result.success)=='true'){
            fn && fn(result); 
        }else{
          // alert("errorMessage11 is "+result.error+" and error code is "+result.errorCode);
           //uploadError(createParams('startSpeech',result.error,0));
        }
    })
}

//停止录音接口
export const stopSpeech=(fn)=>{
   XuntongJSBridge.call('stopSpeechRecognize',{},function(result){
       if(String(result.success)=='true'){
           fn && fn(result);
       }else{
          //alert("stopSpeech error is "+result.error);
          fn && fn(result.errorCode,result.error);
          uploadError(createParams('stopSpeech',result.error,0));
       }
   })
}


export const setMenu=(popObj,itemArr,callBackObj)=>{
  XuntongJSBridge.call("createPop", {
    'popTitle': popObj && popObj.popTitle,
    'popTitleCallBackId': popObj && popObj.popTitleCallBackId,
     items: itemArr,
    //这里省略了系统menulist和shareData内容，如果需要请另行补充
    }, function (resp) {
      // alert("result is "+JSON.stringify(result));
      if (resp.success == true || resp.success == 'true') {
          var callBackId = resp.data ? resp.data.callBackId : '';
          try {
            if (callBackObj) {
                //必须为函数
                  callBackObj[callBackId] && callBackObj[callBackId]();
            }
          } catch (ex) {
              alert("云之家分享接口 " + ex.message);
          }
      }
  });
}

/**
 * 设置云之家Title
 */

export const setTitle=(title)=>{
   XuntongJSBridge.call('setWebViewTitle',{
      title:title
   })
}



