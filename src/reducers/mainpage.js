import * as ActionType from '../action/actionType';
import {FilterMaxId} from '../utils/utils';
import cloneDeep from 'lodash/cloneDeep';

import chailvImg from "../images/renrenchailv_48_48.png"
import zhibiaochaxun from "../images/zongzhang_48_48.png"
import gongzuoliu from "../images/gongzuoliu_48_48.png"
import qinfenxi from "../images/qingfenxi.png"
import {UITYPE} from "../const/UIType";

let initState={
   title:'',
   appList:[],
   appListPagination:null,//推荐应用个数
   sessionId:"-99",
   dialog:'',//用户输入
   exception:'',//异常
   appMessage:[],//意图样本
   localId:-1,//  语音播报的id
   startRecord:false,//录音开启
   dialogList:[],
   editUrl:'',
   loadingVisible:false,
   isChat:true,//true : 用户的话直接调用chat接口  false:调用其他接口 目前是采集意见 待清理
   curPage:0,//针对分页列表
   voiceshowLoading:false,//主要用在录音动效，当响应回来的时候 停止loading
}

const mainpage=(state=initState,action)=>{
     switch(action.type){
        case ActionType.DEAL_MAINPAGE_DATA:
            let data=action.payload;
            data.appList.forEach(item => {
                if (item.ftitle == '财务指标查询') {
                    item.ficonpath = zhibiaochaxun
                } else if (item.ftitle == '出差申请') {
                    item.ficonpath = chailvImg
                } else if (item.ftitle == '轻分析') {
                    item.ficonpath = qinfenxi
                } else {
                    item.ficonpath = gongzuoliu
                }

                 // item.ficonpath=REQUESTURL=='test' ? 'http://172.20.70.42:8888/rest/static/Icon/9/gongzuoliu.png' : '../static/Icon/9/gongzuoliu.png';//http://172.20.70.42:8888/rest
            })
            return {
            	...state,
              ...data,
              //appListTotal:
            }
        break;
        case ActionType.DEAL_TONGYIN_CONVERT:
            const dialogList=state.dialogList;
            let tempList2=cloneDeep(dialogList);
            const id=FilterMaxId(dialogList,'id');
            tempList2.push({text:action.payload.text,id,className:'user-dialog'});
            let tempObj=tempList2.slice(tempList2.length - 2,tempList2.length - 1);
            if(action.payload.text=='提交' && tempObj[0] && tempObj[0].kdIntention.status != 'canceled' && tempObj[0].kdIntention.status!='clarify'){

              tempObj[0].showBody=false;
              const listId=FilterMaxId(tempList2,'id');
              tempObj=cloneDeep(tempObj && tempObj[0]);
              tempObj.id=listId;
              tempObj.message.text="单据提交中，稍后哦";
              tempObj.showMasker=true;
              tempObj.showBody=true;
              tempList2.push(tempObj);
            }else{
               const maxLoadingId = FilterMaxId(tempList2, 'id')
                let loadingObj = {
                    id: maxLoadingId,
                    type:'waiting-loading',
                    className: "loading-dialog",
                    message: {
                        type:UITYPE.UI_LOADING
                    },
                }
                tempList2.push(loadingObj);
            }

            
            return {
              ...state,
              ...action.payload,
              dialogList:tempList2,
              //message:null,//置为null，避免主页在同音词转换和请求chat接口直接循环请求
            }
        break;
        case ActionType.DEAL_CHAT:
            const {kdIntention,message}=action.payload;
            let tempList=cloneDeep(state.dialogList);
            //tempList=tempList.slice(0,tempList.length - 1);
            let tempList3=cloneDeep(tempList);
            const maxId=FilterMaxId(tempList,'id');
            let temp={id:maxId,className:'chatbot-dialog'};

            if (tempList3[tempList3.length - 1].type == 'waiting-loading') {
                tempList3.pop()
            }

            temp={
              ...temp,
              ...action.payload,
            }
            tempList3.forEach(item=>{
              if(item.className=='chatbot-dialog' && item.message 
                && item.message.type=='TEXT' && item.kdIntention && item.kdIntention.status!='' && item.kdIntention.intention==kdIntention.intention){
                   item.showBody=false;
              }
            })
            tempList3.push(temp);

            let len = tempList3.length

            //  对当前已完成的意图禁止再对其进行提交
            if (tempList3[len - 1].kdIntention.status === 'confirmed') {
                for (let i = len - 1; i > 0; i--) {
                    if (tempList3[i].kdIntention && tempList3[i].kdIntention.intention) {
                        if (tempList3[i].kdIntention.intention === tempList3[len - 1].kdIntention.intention) {
                            if (tempList3[i - 1].className === 'user-dialog') {
                                tempList3[i - 1].canEdit = false
                            }
                        } else {
                            break
                        }
                    }
                }
            }

            return {
              ...state,
              ...action.payload,
              dialogList:tempList3,
              //text:'',//置为空，避免主页在同音词转换和请求chat接口直接循环请求
            }
        break;
        case ActionType.DEAL_SESSION_ID:
           return { 
              ...state,
              sessionId:action.payload,
           }
        break;
        case ActionType.SAY:
           return {
              ...state,
           }
        break;
        case ActionType.EXCEPTION://异常处理
           let tempDialogList=cloneDeep(state.dialogList);
           tempDialogList.push({id:FilterMaxId(tempDialogList,'id'),className:'other-dialog',message:{type:'EXCEPTION',text:action.payload}});
           return {
              ...state,
              dialogList:tempDialogList,
              exception:'执行服务异常',
           }
        break;
        case ActionType.DEAL_INTENTION_SAMPLES:
           return {
              ...state,
              appMessage:action.payload,
           }
        break;
        case ActionType.LOCAL_ID://保存播报语音的
            return {
                ...state,
                localId:action.payload.localId,
            }
        break;
        case ActionType.START_RECORD://开始录音
            return {
                ...state,
                startRecord:action.payload.startRecord,
            }
        break;
        //修改inputState 
        case ActionType.INPUT_STATE:
            return {
               ...state,
               inputState:action.payload.inputState,
            }
        break;
        case ActionType.DEAL_MODIFY_WORDSLOT:
        //修改词槽
            let tempList1=state.dialogList;
            let newDialogList=cloneDeep(tempList1);
            const maxId1=FilterMaxId(tempList1,'id');
            let temp1={id:maxId1,className:'chatbot-dialog'};
            temp1={
              ...temp1,
              ...action.payload,
            }
            const kdIntention1=action.payload.kdIntention;
            newDialogList.forEach(item=>{
              if(item.className=='chatbot-dialog' && item.message 
                && item.message.type=='TEXT' && item.kdIntention && item.kdIntention.status!='' && item.kdIntention.intention==kdIntention1.intention){
                   item.showBody=false;
              }
            })
            newDialogList.push(temp1);
            return {
              ...state,
              dialogList:newDialogList,
              //text:'',//置为空，避免主页在同音词转换和请求chat接口直接循环请求
            }
        break;
        case ActionType.DEAL_EDIT_URL:
            return {
               ...state,
               editUrl:action.payload,
            }
        break;
        case ActionType.SYNC_DIALOG_LIST:
            return {
              ...state,
              dialogList:action.payload,
            }
        break;
        case ActionType.CHANGE_LOADING_VISIBLE:
            return {
              ...state,
              loadingVisible:action.payload,
            }
        break;
        case ActionType.BACK_TO_RECOMMEND:
            console.log("back_to_recommend");

            let dialogListTemp=cloneDeep(state.dialogList);
            const maxId11=FilterMaxId(dialogListTemp,'id');
            let temp11={id:maxId11,className:'user-dialog',message:{type:'RECOMMEND'},data:{title:state.title,appList:state.appList}};


            // // 清除session之后不能再修改意图
            for (let item of dialogListTemp) {
                if (item.className === 'user-dialog') {
                    item.canEdit = false
                }
            }

            // // // 需要过滤
            // let newDialogListTemp = cloneDeep(dialogListTemp);
            let newDialogListTemp = [];
            // // // 每次点击backIcon，清除之前加入dialogList的item，
            for (let item of dialogListTemp) {
                if (item.className == 'user-dialog') {
                    if (item.message && item.message.type && item.message.type == 'RECOMMEND') {
                        // 是RECOMMEND 啥都不做
                    } else {    //加入正常user-dialog
                        newDialogListTemp.push(item)
                    }
                } else {    //  加入回复dialog
                    newDialogListTemp.push(item)
                }
            }


            newDialogListTemp.push(temp11);
            return {
               ...state,
               dialogList:newDialogListTemp,
            }

        break;
        case ActionType.CLEAR_SESSION:
           return {
              ...state,
           }
        break;
        case ActionType.CHANGE_PAGE:
           return {
              ...state,
              curPage:action.payload,
           }
        break;
        // case ActionType.UPLOAD_HELPFUL_INFO:
        //     return {

        //     }
        // break;
        // case ActionType.UPLOAD_SUGGESTION_INFO:
        //     return {
        //        ...state,

        //     }
        // break;
        default:
            return state;
        break;
     }
}

export default mainpage;