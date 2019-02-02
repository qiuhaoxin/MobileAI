import React,{Component} from 'react';
import PropTypes from 'prop-types';
import Styles from './index.less';
import {isYZJ,speak,getYZJLang,getOS,playVoice,stopPlayVoice,startSpeech,stopSpeech} from '../../utils/yzj';
import SiriWave from '../../lib/SiriWave';
import xiaok from '../../images/xiaok.png';
import * as ActionType from '../../action/actionType';
import {isEmpty,FilterMaxId,saveInLocalStorage,getInLocalStorage,delInLocalStorage,getValueFromUrl} from '../../utils/utils';
import {connect} from 'react-redux';
let isSupportYZJApi=true;
let talk=startSpeech;
let stopTalk=stopSpeech;
import {VoiceLoading} from 'aicomponents';
import circle from '../../images/circle2.png';

const RECORDING_TIPS="你说,我在听...";
const START_RECORD="点我，对我说...";
class Footer extends Component{
	constructor(props){
		super(props);
    this.xkStatus='start'; // 记录小K的状态:start  or  stop 
    this.localId=-1;
    this.curPage=1;
    this.startTime=0;
    this.endTime=0;
  };
  state={
    inputStr:'',
    rand:'',
    //test:'',
  }
  componentDidMount(){
    try{
        this.checkyyAP();//检测云之家当前版本是否支持最新的语音接口
      }catch(e){

      }
    }
    state={
      showWave:false,
    }
    componentWillReceiveProps(nextProps){
      if(nextProps.startRecord==true && !this.state.showWave){
         //开启录音
         this.handleClickBall();
       }
       if(nextProps.startRecord==false && this.state.showWave && this.props.startRecord!=nextProps.startRecord){
         //console.log("start Record is false 关闭录音");
          this.setState({
            showWave:false,
          },()=>{
           stopSpeech();
          })
       }
       if(nextProps.localId && nextProps.localId!=-1){
         this.localId=nextProps.localId;
       }
       //if(nextProps.dialogList.length!=this.props.dialogList.length){
          //this.stopLoading(nextProps.dialogList)
       //}
       this.curPage=nextProps.curPage;
   }
   stopLoading=(dialogList)=>{
       const last=dialogList[dialogList.length - 1];
       if(last && last.className=='chatbot-dialog'){
          //alert("showWatint")
          this.VoiceLoadingEl && this.VoiceLoadingEl.showWaiting();
       }
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
  handleSpeak=(result)=>{
   let text="";
   if(result && String(result['success'])=='true'){
    text=result.data && result.data.text;
    if(isEmpty(text)||text==undefined){
      return ;
   }
   //this.VoiceLoadingEl.showLoading();
   text=text.replace(/[\ |\~|\，|\。|\`|\!|\！|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?|\？]/g,""); 
   this.dealSpeak(text);
 }
}
dealSpeak=(text)=>{
  const _this=this;
  const {sessionId,onEnterClick}=this.props;
  if(this.ContentTip && this.ContentTip.style.display!='none'){
    this.hideMainPage();
    this.showDialogList();
  }
  onEnterClick && onEnterClick(text,{pageIndex:this.curPage});
}
stopVoice=()=>{
  const _this=this;
  const {localId,dispatch}=this.props;
  if(this.localId!=-1||localId!=-1){
    try{
      stopPlayVoice(this.localId,()=>{
       _this.localId=-1;
       dispatch({
        type:ActionType.LOCAL_ID,
        payload:{
          localId:-1,
        }
      })
     })
    }catch(e){
     alert("e is "+e);
   }
 }
}  
stopSpeaking=(cb)=>{
  const {dispatch}=this.props;
  this.setState({
    showWave:false,
  },()=>{
    console.log("stopSpeech2");
    stopSpeech();
    dispatch({
      type:ActionType.START_RECORD,
      payload:{
        startRecord:false,
      }
    })
    cb && cb();
  })
}
dealSpeakCB=(result)=>{  
   const _this=this;
   const {dispatch}=this.props;
   const data=result.data;
            //隐藏图片按钮，显示声波图
           //isSupportYZJApi && this.changeSpeakStyle('none','block');
           try{
             if(isSupportYZJApi){
               const status=data.status;
               switch(status){
                    case 1://录音开始

                    break;
                    case 2://录音结束
                      console.log("录音结束");
                      const date=new Date();
                      _this.endTime=date.getTime();
                       _this.stopSpeaking();
                       break;
                    case 3://音量变化 
                      let percent=data.percent;
                      if(_this.siriWave){
                          _this.timeoutId=setTimeout(function(){ 
                           if(_this.timeoutId){
                            clearTimeout(_this.timeoutId);
                            _this.timeoutId=0;
                          }
                          //_this.testInput.value=percent;
                          if(percent<0.01){
                            percent=0.01;
                          }
                          let rand=percent * 0.6;
                          _this.siriWave.setSpeed(rand);
                        },200)
                       }
                    break;
                    case 4://识别出错
                        const errorCode=data.errorCode; //只能是1
                        const errorMessage=data.errorMessage;
                        _this.stopSpeaking();
                        break;
                    case 5://识别结果
                        const result=data.result;
                        const isLast=data.isLast;//语音识别是否结束
                          _this.stopSpeaking(function(){
                             const tempResult={success:'true',data:{text:result}};
                             _this.handleSpeak(tempResult);
                          });
                        break;
                      }
                    }else{
                //兼容旧版的API
                _this.handleSpeak(result);
              }
            }catch(e){
              alert("exception is "+e);
            }
        }
        handleClickBall=()=>{
          const _this=this;
          const {showWave}=this.state;
          const {dispatch}=this.props;
          this.stopVoice();
          //startSpeech(this.dealSpeakCB);
          this.changeSpeakStyle();

          // if(_this.VoiceLoadingEl){
          //     if(_this.timeoutId){
          //         clearTimeout(_this.timeoutId);
          //         _this.timeoutId=0;
          //     }
          //     _this.timeoutId=setInterval(function(){
          //       const random=Math.random();
          //       //console.log("random is "+random);
          //        _this.testInput.value=random;
          //        _this.VoiceLoadingEl.setVoice(random);//setVoice
          //     },100)
          // }
          console.log("点击开始录音!");
          const date=new Date();
          this.startTime=date.getTime();
          this.setState({
            showWave:true //!showWave ? :false,
          },()=>{
            startSpeech(this.dealSpeakCB);
          })
        }
        //SpeakIconStyle 图标样式,WaveStyle 声波图样式   
        changeSpeakStyle=()=>{
          const {dispatch}=this.props;
          const _this=this;
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
                console.log("点击声波图!");
                _this.stopSpeaking();
              }
            });
          }
          if(!this.VoiceLoading && isSupportYZJApi){

          }
        }
        handleKeyup=(e)=>{
          const _this=this;
          const {sessionId,dispatch,onEnterClick}=this.props;
          const key=e.keyCode;
          if(key==13){
            const value=e.target.value;
            if(isEmpty(value))return;
            e.target.value="";
            onEnterClick && onEnterClick(value,{pageIndex:this.curPage});
          }
        }
        handleTouchStart=(e)=>{
         const pointer=e.touches ? e.touches[0] : e;
         this.startX=pointer.pageX;
         this.startY=pointer.pageY;
       }
       handleTouchEnd=(e)=>{
        const point = e.changedTouches ? e.changedTouches[0] : e;
        const pageEndX=point.pageX;
        const pageEndY=point.pageY;
        const distanceX=pageEndX - this.startX,
        distanceY=pageEndY - this.startY;
        if(Math.abs(distanceX) < 6 && Math.abs(distanceY) < 6){
         this.handleClickBall();
       }
     }
     render(){
      const {showWave}=this.state;
      return (
        <div className={Styles.wrapper}>
            <div className={Styles.tips}>
              {
                  showWave ? RECORDING_TIPS : START_RECORD
              }
            </div>
            <div ref={el=>this.SpeakIcon=el} style={{display:showWave ? 'none' : 'block'}}>
              { 
                 isYZJ() ? 
                 <div className={Styles.ball} 
                 onTouchStart={this.handleTouchStart}
                 onTouchEnd={this.handleTouchEnd}>
                 <img src={xiaok}/>
                 </div>  :  <input placeholder="输入" onKeyUp={this.handleKeyup} />  
              }
            </div>
            <div ref={el=>this.Wave=el} style={{display:showWave ? 'block' : 'none'}}>
           
            </div> 
        </div>
     )
   }
 }
 Footer.defaultProps={

 }
 Footer.propTypes={
   onEnterClick:PropTypes.func.isRequired,
 }

 export default connect(state=>({
  localId:state.mainpage.localId,
  startRecord:state.mainpage.startRecord,
  curPage:state.mainpage.curPage,
  dialogList:state.mainpage.dialogList,
}))(Footer);

/**
 *         
            <div className={Styles.tips}>
              {
                  showWave ? RECORDING_TIPS : START_RECORD
              }
            </div>
            <div ref={el=>this.SpeakIcon=el} style={{display:showWave ? 'none' : 'block'}}>
              { 
                  isYZJ() ? 
                 <div className={Styles.ball} 
                 onTouchStart={this.handleTouchStart}
                 onTouchEnd={this.handleTouchEnd}>
                 <img src={xiaok}/>
                 </div>  :  <input placeholder="输入" onKeyUp={this.handleKeyup} />  
              }
            </div>
           <div ref={el=>this.Wave=el} style={{display:showWave ? 'block' : 'none'}}>
           
           </div> 
                      <input ref={el=>this.testInput=el}/>

            {
              isYZJ() ? 
              <VoiceLoading onCircleClick={this.handleClickBall} height={117} changeL={1.2} onWaveClick={this.stopSpeaking} ref={el=>this.VoiceLoadingEl=el}>
              </VoiceLoading> : 
              <input placeholder="输入" onKeyUp={this.handleKeyup} /> 
            }

 */
