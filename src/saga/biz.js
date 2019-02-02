import {put,call} from 'redux-saga/effects';
import {getMainPageData,uploadLoc,tongyinConvert,chat,getChatSessionId,EXCEPTION} from '../services/api';

export function* getMainPageDataAPI(payload){
	console.log("test in biz saga");
    const response=yield call(getMainPageData,payload);
    console.log("response is "+JSON.stringify(response));
}