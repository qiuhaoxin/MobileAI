import React,{Component} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import className from 'classnames';
import Styles from './index.less';
import {connect} from 'react-redux';
import {fetchMainPageData,uploadLocation,chatDialog,tongyinconvert,getSessionId} from '../../action/mainpage';
import {isYZJ,getNetWorkType,getLocation,speak,getYZJLang,getOS,backYZJ,playVoice,stopPlayVoice,startSpeech,stopSpeech} from '../../utils/yzj';
import {isEmpty,FilterMaxId,saveInLocalStorage,getInLocalStorage,delInLocalStorage,getValueFromUrl} from '../../utils/utils';

import {uploadLog} from '../../services/api';
import {FETCH_SESSION_ID} from  '../../action/actionType/';
 import Dialog from '../../components/Dialog'; 
import Tip from '../../components/Tip';
import Select from '../../components/Selects';
import SiriWave from '../../lib/SiriWave';
import LinkSelect from '../../components/LinkSelect';

import xiaok from '../../images/xiaok.png';

//import {Dialog} from 'aicomponents'

const HELP_TITLE='请问需要什么帮助？';
const HELP_TITLE_TWO='你可以这样问我';
const DIALOG_TITLE="这里是标题";
const TIME_TO_SCROLL=150;
const TIME_TO_HIDE=150;
const SOURCE_ADDRESS="出发地",TARGET_ADDRESS='目的地',BEGIN_TIME="出发时间",BACK_TIME='返回时间';
const urlMapping={
  'BUS_TRIP':'renderExtendBus_tip'
}

let talk=startSpeech;
let stopTalk=stopSpeech;
let isSupportYZJApi=true;
class MainPage extends Component{
  	constructor(props){
  		super(props);
      this.tipContent="";
      this.imgPath=REQUESTURL && REQUESTURL=='prod' ? '../static/Icon/' : 'http://172.20.70.42:8888/rest/static/Icon/';
      this.linkSelectData=[
           {img:'Taxifee.png',name:'交通费报销',id:0},
           {img:'Callsfee.png',name:'通讯费报销',id:1},
           {img:'Marketfees.png',name:'市场活动费报销',id:2},
           {img:'waterfee.png',name:'水费报销',id:3},
           {img:'otherfee.png',name:'其他',id:4},
      ]
  	}
    state={
      dialogList:[],
      showTip:false,//控制顶部Tip可见性
      percent:0,
    }
    componentWillMount(){
       if(isYZJ()){
        backYZJ(function(){
           delInLocalStorage('dialog');
           delInLocalStorage('sessionId');
        })
       }
    }
    componentWillReceiveProps(nextProps){
      //console.log("nextProps is "+JSON.stringify(nextProps));
      if(!isEmpty(nextProps.exception) && nextProps.exception!=null){
          alert(nextProps.exception);
         //console.log("exception in mainpage is "+nextProps.exception);
      }
      //接收消息
      if(nextProps.message!=null){
         // alert("nextProps is "+JSON.stringify(nextProps));
         //console.log("sdfsdfs");
          this.acceptMessage(nextProps);
          //this.transformDialog();
      }
      //同音转换发送消息
      if(!isEmpty(nextProps.text)){
          //alert("text is "+nextProps.text);
          this.sendMessage(nextProps.text);
      }
      if(!isEmpty(nextProps.sessionId) && nextProps.sessionId!=this.props.sessionId && nextProps.sessionId!='-99'){
          if(isYZJ()){
             getLocation((result)=>this.uploadLocation(nextProps.sessionId,result));
             //this.uploadLocation(nextProps.sessionId,{success:'true',data:{city:'深圳市'}})
          }
      }
    }

    componentDidMount(){
        const _this=this;
        this.checkyyAP();//检测云之家当前版本是否支持最新的语音接口
        const {getMainPageData,uploadLocAPI}=this.props;

        this.getSessionIdFirst();
        const result=getInLocalStorage('dialog');
        if(result){
           this.hideMainPage();
           this.showDialogList();
           //if(!isYZJ()){
            //在浏览器非云之家中刷新一次就清除
            delInLocalStorage('dialog');
            delInLocalStorage('sessionId');
           //}
           this.setState({
              dialogList:result,
           })
        }else{
          //有会话记录就恢复记录，没有请求主页数据
          const result= getValueFromUrl(!isEmpty(location.search) ? location.search : location.href,['appid','openId']);
          getMainPageData(true,{appid:result && result['appid'] || ''});
        }

        // this.siriWave = new SiriWave({
        //     container: this.Wave,
        //     width: 222,
        //     height: 30,
        //     speed: 0.01,//[0.01-0.03]
        //     amplitude: 1,
        //     autostart: true,
        //     style: 'ios9',
        //     clickCB:function(){
        //        console.log("stop talk!");
        //     }
        //     /*
        //     speed: 0.2,
        //     color: '#000',
        //     frequency: 2
        //     */
        // });
    }
    componentWillUnmount(){
        delInLocalStorage('dialog');
        delInLocalStorage('sessionId');
    }
    checkyyAP=()=>{
        stopSpeech((errorCode,error)=>{
           if(error){
               talk=speak;
               stopTalk=null;
               isSupportYZJApi=false;
           }
        })
    }
    //SpeakIconStyle 图标样式,WaveStyle 声波图样式   
    changeSpeakStyle=(SpeakIconStyle='block',WaveStyle='none')=>{
      const _this=this;
      if(SpeakIconStyle==WaveStyle){
        console.warn("两个的样式不能一致!");
        return;
      }
      if(this.SpeakIcon){
        this.SpeakIcon.style['display']=SpeakIconStyle;
      }
      if(this.Wave){
        this.Wave.style['display']=WaveStyle;
      }
      if(!this.siriWave && isSupportYZJApi){
        this.siriWave = new SiriWave({
            container: this.Wave,
            width: 222,
            height: 30,
            speed: 0.12,//[0.01-0.03]
            amplitude: 1,
            autostart: true,
            style: 'ios9',
            clickCB:function(){
              stopTalk && stopTalk(()=>_this.changeSpeakStyle('block','none'))
             
            }
            /*   
            speed: 0.2,
            color: '#000',
            frequency: 2
            */
        });
      }
    }
    getSessionIdFirst=()=>{
       const {getChatSessionIdAPI,dispatch}=this.props;
       //alert("sessionId is Localstorage is "+getInLocalStorage('sessionId')+" and window chatSessionId is "+window.chatSessionId);
       const sessionId=getInLocalStorage('sessionId') || window.chatSessionId || '';
       if(sessionId){
         dispatch({
            type:FETCH_SESSION_ID,
            payload:sessionId,
         })
       }else{
        const result= getValueFromUrl(!isEmpty(location.search) ? location.search : location.href,['appid','openId','uname']);
         getChatSessionIdAPI({appid:result['appid'],openId:result['openId'],uname:result['uname']})
       }

    }
    uploadLocation=(sessionId,result)=>{
       const {uploadLocAPI}=this.props;
       if(result && String(result['success'])=='true'){
          const loc=result['data']['city'];
          uploadLocAPI(true,{sessionId,locStr:loc});
       }
    }
    handleItemClick=(item)=>{
      console.log("item si "+JSON.stringify(item));
       const link=item.flink;
       if(link){
       	  location.href=link;
       }
    }
    handleClickBall=()=>{
        const _this=this;
        if(this.localId){
          stopPlayVoice(this.localId,()=>{
             _this.localId=0;
          })
        }
        //隐藏图片按钮，显示声波图
        isSupportYZJApi && this.changeSpeakStyle('none','block');
        //speak(this.handleSpeak);
       talk((result)=>{  
           const data=result.data;
           if(isSupportYZJApi){
               const status=data.status;
               switch(status){
                  case 1://录音开始

                  break;
                  case 2://录音结束
                     //alert("结束录音");
                     this.changeSpeakStyle('block','none');
                  break;
                  case 3://音量变化
                      const percent=data.percent;
                      if(_this.siriWave){
                        _this.timeoutId=setTimeout(function(){ 
                           if(_this.timeoutId){
                              clearTimeout(_this.timeoutId);
                              _this.timeoutId=0;
                           }
                           let rand=percent * 0.6;
                           _this.siriWave.setSpeed(rand);
                        },200)
                      }
                  break;
                  case 4://识别出错
                      const errorCode=data.errorCode; //只能是1
                      const errorMessage=data.errorMessage;
                      this.changeSpeakStyle('block','none');
                  break;
                  case 5://识别结果
                      const result=data.result;
                      const isLast=data.isLast;//语音识别是否结束
                      this.changeSpeakStyle('block','none');
                      const tempResult={success:'true',data:{text:result}};
                      this.handleSpeak(tempResult);
                  break;
               }
           }else{
              //兼容旧版的API
              this.handleSpeak(result);
           }
       });
    }
    //
    handleSpeak=(result)=>{
       let text="";
       if(result && String(result['success'])=='true'){
        text=result.data && result.data.text;
        if(isEmpty(text)||text==undefined){
             //alert("文本是"+text+"请从新采集");
             return ;
          }
         text=text.replace(/[\ |\~|\，|\。|\`|\!|\！|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?|\？]/g,""); 
         this.dealSpeak(text);
       }
    }
    dealSpeak=(text)=>{
      const _this=this;
      const {tongyinConvertAPI,sessionId}=this.props;
      if(this.ContentTip && this.ContentTip.style.display!='none'){
        this.hideMainPage();
        this.showDialogList();
      }
      tongyinConvertAPI({sessionId,text})
    }
    //
    renderExtendBus_tip=()=><div className={Styles.loan}>如果有需要<span className={Styles.color}>“借款”</span>请告诉我</div>
    renderAppList=()=>{
    	const {appList}=this.props;
    	return (
            <ul className={Styles.appList}>
                {
                	appList.map(item=><li key={item.fid} onClick={()=>this.handleItemClick(item)}>
                		<div className={Styles.iconPath}>
                        <img src={`${this.imgPath}${item.ficonpath}`} />
                    </div>
                		<div className={Styles.content}>
                		    <span className={Styles.title}>{item.ftitle}</span>
                		    <span className={Styles.tip}>{item.ftips}</span>
                		</div>
                		<div className={Styles.arrow}></div>
                		</li>)
                }
            </ul>
    	)
    }
    //渲染对话框
    renderDialog=(item)=>{
        const {kdIntention,type}=item;
        if(kdIntention!=null && kdIntention['intention'] && kdIntention['intention'].toUpperCase()=='BUS_TRIP'){
           const wordslot=kdIntention.kdWordslots;
           let reason=wordslot.filter(item=>item.number=='user_reason')[0];
           reason=reason && reason['originalWord'];
           return <Dialog title={reason ? reason : DIALOG_TITLE} className={Styles.dialog} content={()=>this.handleDialogContent(kdIntention['kdWordslots'])} 
           onSubmit={item.type=='URL' ? ()=>this.handleDialogSubmit(item) : null} onEdit={item.type=='URL' ? ()=>this.handleDialogEdit(item) : null}>
               {item.type=='URL' ? this[urlMapping[kdIntention['intention']]] : null}
           </Dialog>
        } 
    }
    handleSelectItemClick=(item,key)=>{
       const text=key+": "+item.desc;
       this.sendMessage(text);
    }
    renderSelect=(item)=>{
       const {data,text,title}=item;
       return <Select dataSource={data} title={title} itemKey='id' onSelectItemClick={this.handleSelectItemClick}></Select>
    }
    renderGUI=(item)=> {
        const type=item.type;
        switch(type){
          case 'SELECTS':
            return this.renderSelect(item);
          break;
          case 'TEXT':
          case 'URL':
            return this.renderDialog(item);
          break;
        }   
    }
    //对话列表
    renderDialogList=()=>{
         const {dialogList}=this.state;
         const dialogContent=dialogList.map((item,index)=>{
              const classNameStr=item.className;
              return <li className={`${Styles[classNameStr]} ${Styles['dialog-row']}`} key={item.id ? item.id : index}>
                  {this.renderGUI(item)}
                  {item.text ? <div>{item.text}</div> : null}
              </li>
         })
         return (
            <ul className={Styles.dialogList} style={{display:'none'}} ref={el=>this.DialogList=el}>
              <li style={{height:'58px',display:this.state.showTip ? 'flex' : 'none'}}>

              </li>
              {dialogContent}
            </ul>
         )
    }
    //用户有语音输入时，隐藏首页的应用提示信息
    hideMainPage=()=>{
        const _this=this;
        if(this.ContentTip){
           const height=this.ContentTip.scrollHeight;
           this.ContentTip.style['transform']=`translate(0,${-height}px)`;
           this.ContentTip.style['transition']='transform .1s ease-in-out';
           setTimeout(function(){
              _this.ContentTip.style['display']="none";
           },TIME_TO_HIDE)
        }

    }
    //发送消息 @params text:发送消息的文本string   showInList:是否显示在对话列表上bool
    sendMessage=(text,showInList=true)=>{
      let dialog=this.state.dialogList; 
      const {sessionId,chatAPI}=this.props;
      //录音结束 隐藏波纹
      stopTalk && stopTalk(()=>  this.changeSpeakStyle('block','none'));
      if(showInList){
        const id=FilterMaxId(dialog,'id');
        dialog.push({className:'user-dialog',text,id});
        this.setState({
              dialogList:dialog,
        },()=>{
          chatAPI({sessionId,message:text});
        })
      }else{
        //不显示发送文本
        chatAPI({sessionId,message:text});
      }
    }
    transformDialog=()=>{
      const _this=this;
      if(this.DialogList){
          const sro=parseInt(_this.DialogList.scrollHeight) + parseInt(_this.DialogList.offsetHeight) + 10000;
          setTimeout(function(){
            ReactDOM.findDOMNode(_this.DialogList).scrollTop=sro;
            console.log("scrollTop is "+_this.DialogList.scrollTop);
          },TIME_TO_SCROLL)
      }
    }
    getReason=(kdWordslots,key)=>{
       const result=kdWordslots.filter(kdWordslot=>kdWordslot['number']==key)[0];
       if(result){
           return result['originalWord'];
       }
    }
    //意图切换弹出提示框
    dealTip=(info)=>{
        const {intention,kdWordslots,intentionName}=info;
        //console.log("info is "+intention+" and kdWordslots is "+JSON.stringify(kdWordslots));

        if(intention=='BUS_TRIP'){
          const reason=this.getReason(kdWordslots,'user_reason');
          this.tipContent= (reason ? reason : '未完成的')+intentionName;
          //出差申请
          this.setState({
              showTip:true,
          })
        }else{
          this.setState({
            showTip:false,
          })
        }
    }
    //接收消息
    acceptMessage=(props=this.props)=>{
        const _this=this;
        const {kdIntention,message,lastUnfinishedIntention}=props;
        //console.log("message is "+JSON.stringify(message)+" and kdIntention is "+JSON.stringify(kdIntention));
        let type=message && message.type;
        type=type && type.toUpperCase();
        let dialog=this.state.dialogList;
        if(lastUnfinishedIntention){
            this.dealTip(lastUnfinishedIntention);
        }
        if(isYZJ() && message.text && !isEmpty(message.text)){
          playVoice(message.text,(localId)=>{
             _this.localId=localId;
          })
        }

        switch(type){
           case 'TEXT':
               let text=message.text;
               dialog.push({className:'chatbot-dialog',text:text,id:FilterMaxId(dialog,'id'),kdIntention,type});
               this.setState({
                  dialogList:dialog,
               })
           break;
           case 'SELECTS':
               dialog.push({className:'chatbot-dialog',text:'',id:FilterMaxId(dialog,'id'),kdIntention,type,data:message.selects,title:message.text})
           break;
           case 'URL':
               let text1='';
               dialog.push({className:'chatbot-dialog',text:text1,id:FilterMaxId(dialog,'id'),kdIntention,type,url:message.url});
               this.setState({
                  dialogList:dialog,
               })
           break;
           case 'COMFIRM':

           break;
           default:

           break;
        }
    }
    showDialogList=()=>{
       if(this.DialogList && this.DialogList.style['display']=='none'){
           this.DialogList.style['display']='block';
       }
    }
    handleKeyup=(e)=>{
        const _this=this;
        const {tongyinConvertAPI,sessionId,chatAPI}=this.props;
        const key=e.keyCode;
        let dialog=this.state.dialogList;
        if(key==13){
          const value=e.target.value;
          if(isEmpty(value))return;
          if(this.ContentTip && this.ContentTip.style.display!='none'){
              this.hideMainPage();
              this.showDialogList();
          }
          e.target.value="";
          tongyinConvertAPI({text:value,sessionId});
          //,()=>{_this.sendMessage(value);}
        }
    }
  handleDialogEdit=(item)=>{
     const url=item && item['url'];
     const urlStr=url && url['url'];
     const {dialogList}=this.state;
     const {sessionId}=this.props;
     if(urlStr){
        saveInLocalStorage('dialog',dialogList);//保存该次的会话记录
        saveInLocalStorage('sessionId',sessionId);
        location.href=urlStr;
     }
  }
  handleDialogSubmit=(item)=>{
     const url=item && item['url'];
     const urlStr=url && url['url'];
     const {dialogList}=this.state;
     if(urlStr){
        saveInLocalStorage('dialog',dialogList);
        location.href=urlStr;
     }
  }
  handleDialogContent=(wordslot)=>{
    let b_loc=SOURCE_ADDRESS,e_loc=TARGET_ADDRESS,b_t=BEGIN_TIME,e_t=BACK_TIME;
    wordslot.forEach(item=>{
       const number=item.number;
       switch(number){
         case 'user_e_l':
             e_loc=item['originalWord']+'  ('+TARGET_ADDRESS+')';
         break;
         case 'user_b_l':
             b_loc=item['originalWord']+'  ('+SOURCE_ADDRESS+')';
         break;
         case 'user_b_t':
             b_t=item['normalizedWord'];
         break;
         case 'user_e_t':
             e_t=item['normalizedWord'];
         break;
       }
    })
    return (
       <div className={Styles.dialogContent}>
           <div className={Styles['dialogContent-left']}>
               <div className={`${Styles.loc} ${b_loc!=SOURCE_ADDRESS ? Styles['loc_fill'] : ''}`}>{b_loc}</div>
               <div className={`${Styles.loc} ${e_loc!=TARGET_ADDRESS ? Styles['loc_fill'] : ''}`}>{e_loc}</div>
           </div>
           <div className={Styles['dialogContent-right']}>
               <div className={`${Styles.time} ${b_t!=BEGIN_TIME ? Styles['time_fill'] : ''}`}>{b_t}</div>
               <div className={`${Styles.time} ${e_t!=BACK_TIME ? Styles['time_fill'] : ''}`}>{e_t}</div>
           </div>
       </div>
    )
  }
  handleTipClick=(data)=>{
      const _this=this;
      const {intention,kdWordslots,say}=data;
      this.setState({
        showTip:false,
      })
      this.sendMessage('填写出差申请',false);
  }
	render(){
		const {title,sessionId,appList,lastUnfinishedIntention}=this.props;
    const {showTip}=this.state;
		return (
          <div className={Styles.wrapper}>
            <div className={Styles.header} ref={el=>this.Header=el}>
                 <div className={Styles.contentTip} ref={el=>this.ContentTip=el}>
                   <div className={Styles.rowTitle}>{title}</div>
                   <div className={Styles.row}>{HELP_TITLE}</div>
                    {this.renderAppList()}
                 </div>
                  <Tip className={Styles.Tip} content={this.tipContent} data={lastUnfinishedIntention} onClick={this.handleTipClick} 
                  icon={require('../../images/text.png')} visible={showTip}/>
                 {this.renderDialogList()}
                 {this.transformDialog()}
             </div>

             <div className={Styles.footer}>
                <div ref={el=>this.SpeakIcon=el} style={{display:'block'}}>
                 {
                     isYZJ() ? 
                     <div className={Styles.ball} onClick={this.handleClickBall}>
                        <img src={xiaok} />
                     </div> 
                     : <input placeholder="输入" onKeyUp={this.handleKeyup} />
                 }
                </div>
                <div ref={el=>this.Wave=el} style={{display:'none'}}>
  
                </div>
             </div>
          </div>
		)
	}
}
const mapStateToProps=state=>{
	return {
      title:state.mainpage.title,
      sessionId:state.mainpage.sessionId,
      appList:state.mainpage.appList,
      message:state.mainpage.message,
      kdIntention:state.mainpage.kdIntention,
      text:state.mainpage.text,
      lastUnfinishedIntention:state.mainpage.lastUnfinishedIntention,
      exception:state.mainpage.exception,
	}
}
const wrapperFunc=(payload,func,dispatch)=>{
   if(typeof func=='function'){
     return func(payload)(dispatch);
   }
}
const mapDispatchToProps=(dispatch)=>{
   return {
       getMainPageData:(showLoading,payload)=>wrapperFunc(payload,fetchMainPageData,dispatch),
       uploadLocAPI:(showLoading,payload)=>wrapperFunc(payload,uploadLocation,dispatch),
       chatAPI:(payload)=>wrapperFunc(payload,chatDialog,dispatch),
       tongyinConvertAPI:(payload)=>wrapperFunc(payload,tongyinconvert,dispatch),
       getChatSessionIdAPI:(payload)=>wrapperFunc(payload,getSessionId,dispatch),
       dispatch:dispatch,


   }
}
export default connect(mapStateToProps,mapDispatchToProps)(MainPage);

/*
*               <LinkSelect data={this.linkSelectData}></LinkSelect>
*/





