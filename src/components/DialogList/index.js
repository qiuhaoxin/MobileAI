
import React,{Component} from 'react';
import ReactDOM from 'react-dom';
import Styles from './index.less';
import PropTypes from 'prop-types';
import {isEmpty, FilterMaxId, saveInLocalStorage, getInLocalStorage, delInLocalStorage} from '../../utils/utils';
import {isYZJ, speak, backYZJ, playVoice, stopPlayVoice, startSpeech, stopSpeech, setMenu} from '../../utils/yzj';
import * as ActionType from '../../action/actionType';
import {connect} from 'react-redux';
import {TypeIn,ExpandList,NumberCard,VoiceReceive,VoiceReceive2,Tip,Frame,Input,URL,Comment,WaitingLoading} from 'aicomponents';
import Iscroll from '../Iscroll';
// import imgPath from '../../images/bus.png';
import cloneDeep from 'lodash/cloneDeep';
import SuperComponent from './super';
const DIALOG_TITLE="请填写出差事由";
const GOOD_JOB="谢谢您的认可，来不及认识你，还好在心中留住了你!";
const GOOD_BYB="很遗憾没有帮到你，你有什么想对小K说的吗？小K会认真听取建议的";
const TIME_TO_SCROLL=150;
const TIME_TO_VOICE=4000;
const urlMapping={
  'BUS_TRIP':'renderExtendBus_tip'
}
const bus_trip=[
    {text:'出发地',number:'user_b_l'},
    {text:'目的地',number:'user_e_l'},
    {text:'出发时间',number:'user_b_t'},
    {text:'返回时间',number:'user_e_t'},
]
const SOURCE_ADDRESS="出发地",TARGET_ADDRESS='目的地',BEGIN_TIME="出发时间",BACK_TIME='返回时间';
class DialogList extends SuperComponent{
  constructor(props){
    super(props);
    this.timeoutId=-1;
    this.wrapperHeight=0;
    this.localId=-1;
    this.isChat=true;
  }
  state={
    dialogList:[],
    showTip:false,
    dialogRemove:false,
    heightInt:0,
  }
  componentWillReceiveProps(nextProps){
        const result=this.haveRemoveCard(this.props,nextProps);
        let _this = this;
        let dialogList=nextProps.dialogList;
        let lastChild=dialogList[dialogList.length - 1];
        if(lastChild && lastChild.kdIntention && lastChild.kdIntention.status=='confirmed'){
            this.dealDialogEnd();
        }else{
            clearTimeout(this.dialogEndTimeout);
            this.dialogEndTimeout=-1;
        }
        this.setState({
            dialogList:dialogList,//nextProps.dialogList,
            dialogRemove:result,
        },()=>{
            const list=nextProps.dialogList;
        })

        if(nextProps.appList!=this.props.appList){
           this.appList=nextProps.appList;
        }
  }
  shouldComponentUpdate(nextProps){
    if(nextProps.dialogList.length==this.props.dialogList.length){
      this.playVoice=false;
    }else{
      this.playVoice=true;
    }
    if(nextProps.visible!=this.props.visible)return true;

    if(nextProps.dialogList.length==this.props.dialogList.length){
    }
    return true;

  }
  componentDidMount(){
      const dialogList=getInLocalStorage('dialog');
      const sessionId=getInLocalStorage('sessionId');
      const defaultHeight = getInLocalStorage('dialogListDefaultHeight');
      const {appList}=this.props;
      const {dialogRemove}=this.state;

      this.appList=appList;
      let _this = this;
      //云之家右上角的菜单
      setMenu({
          "popTitle": "我要反馈", "popTitleCallBackId": "settings"
      }, [], {
          "settings": function () {
            _this.stopVoice();
            _this.gotoFeedback();
          }
      })
      if (dialogList) {
          this.setState({
              dialogList
          }, () => {

          })
      }
  }

    componentDidUpdate() {
        const {dialogList,} = this.state;
        let _this = this;
        let lastItem = dialogList[dialogList.length - 1];

        const fromFeedbackFlag = getInLocalStorage('fromFeedback');

        if (dialogList.length < 2) {   //刚初始化，不用滚动
            // this.transform(dialogList, dialogRemove)
        } else {
            let domNode = ReactDOM.findDOMNode(_this.DialogListDOM);
            let list = domNode.children;
            let listSize = list.length;
            if (fromFeedbackFlag == true) {
                // 从反馈返回，重新渲染所有列表，需要加一个延时分段滑动
                console.log('从反馈回来')
                _this.wrapper.scrollToElement(list[listSize - 2], 0)
                setTimeout(() => {
                    _this.wrapper.scrollToElement(list[listSize - 2], 500)
                }, 100)
                delInLocalStorage("fromFeedback")
            } else if (lastItem.message.type == 'RECOMMEND') {
                //推荐卡片滚动到倒数第一个元素
                _this.wrapper.scrollToElement(list[listSize - 1], 0)
            } else if (lastItem.message.type == 'EXCEPTION') {
                //15s之后的还需要我做什么滑动到倒数第三个卡片
                _this.wrapper.scrollToElement(list[listSize - 3], 500)
            } else if (lastItem.kdIntention && lastItem.kdIntention.intention && lastItem.kdIntention.intention == 'BUS_TRIP') {
                //出差申请的卡片因为去除body导致高度减少，导致页面整体往回滚动，直接将滚动时间设为0可以解决这个问题
                _this.wrapper.scrollToElement(list[listSize - 2], 0)
            } else {
                //正常滚动
                _this.wrapper.scrollToElement(list[listSize - 2], 500)
            }
        }
    }

    dispatchMethod=(type,payload,fn)=>{
      const {dispatch}=this.props;
      dispatch({
         type,
         payload,
         callback:fn,
      })
    }

    gotoFeedback = () => {
        const {jumpToFeedbackFun,sessionId}=this.props;
        const {dialogList}=this.state;
        if (dialogList.length != 0) {
            saveInLocalStorage('dialog', dialogList);
            saveInLocalStorage('sessionId', sessionId);
            saveInLocalStorage('dialogListDefaultHeight', this.listHeight);
            saveInLocalStorage('fromFeedback', true);

        }
        jumpToFeedbackFun && jumpToFeedbackFun()
    }
  haveRemoveCard=(props,nextProps)=>{
    const tempProps=cloneDeep(props.dialogList.filter(item=>item.className=='chatbot-dialog'));
    const tempNextProps=cloneDeep(nextProps.dialogList.filter(item=>item.className=='chatbot-dialog'));
    if(tempProps.length==tempNextProps.length)return false;
    let temp=tempNextProps.slice(tempNextProps.length - 2,tempNextProps.length - 1);
    if(temp[0] && temp[0].showBody==false){
        return true;
    }
    return false;
  }
  chat=(text,textShow,extraParams)=>{
    const {dispatch,sessionId}=this.props;
    dispatch({
      type:ActionType.SAY,
      payload:{sessionId,type:'click',textParams:text,textShow,extraParams},
    })
  }
  handleDialogContent=(wordslot)=>{
      return (
         <div className={`${Styles['dialogContent']}`}>
              <ul>
                 {
                  bus_trip.map(item=>{
                    let tempItem=wordslot.filter(item1=>item1.number==item.number);
                    return <li key={item.number}>
                        <div className={`${Styles['dialogCotnent-left']}`}>
                            {item.text}
                        </div>
                        <div className={`${Styles['dialogContent-right']}`}>
                            {tempItem && tempItem.length>0 ?
                            <div>{tempItem[0].correct ? <span>{tempItem[0].normalizedWord}</span> : <span className={`${Styles['dialog-error']}`}>{tempItem[0].originalWord}</span>}</div>
                            : ''}
                        </div>
                  </li>
                  })
                 }
              </ul>
         </div>
      )
  }
  handleDialogSubmit=(item)=>{
     const url=item && item['url'];
     const {dispatch,sessionId}=this.props;
     this.stopVoice();
     dispatch({
        type:ActionType.SAY,
        payload:{
           sessionId,textShow:'提交',type:'click',textParams:'提交',
        }
     })
  }
  handleCheckDetial=(item)=>{
     const {message:{url:{url}}}=item;
     const {dialogList}=this.state;
     const {sessionId,dispatch}=this.props;
     this.stopVoice();
     dispatch({
       type:ActionType.CHANGE_LOADING_VISIBLE,
       payload:true,
     })
      if(url){
          saveInLocalStorage('dialog',dialogList);
          saveInLocalStorage('sessionId',sessionId);
          location.href=url;
      }
  }
  handleBusTripDialogEdit = (item) => {
     const {dispatch,sessionId}=this.props;
     const {dialogList}=this.state;
     let _this = this;
     this.stopVoice();
     dispatch({
       type:ActionType.CHANGE_LOADING_VISIBLE,
       payload:true,
     })
     dispatch({
       type:ActionType.REQUEST_EDIT_URL,
       payload:{
          sessionId,
          intentionNumber: "BUS_TRIP",
          bizCommandName: "tripReqBillSave",//tripSave2
       },
       callback:function(response){
          let message=JSON.parse(response.message);
          let url='';
          if('url' in message){
             url=message['url'].url;
          }else{
             dispatch({
               type:ActionType.CHANGE_LOADING_VISIBLE,
               payload:false,
             })
             url="";
          }
          if(!isEmpty(url)){
              try{
                saveInLocalStorage('dialog',dialogList);
                saveInLocalStorage('sessionId',sessionId);
                saveInLocalStorage('dialogListDefaultHeight',_this.DialogListWrapper.clientHeight);
                location.href=url;
              }catch(e){
                console.log("err is "+err);
              }

          }
       }
     })
  }
    handleNegativeClick=()=>{
       this.stopVoice();
    }
    handlePositiveClick=()=>{
      //提建议
       const {dispatch}=this.props;
       this.stopVoice();
       dispatch({
          type:ActionType.START_RECORD,
          payload:{
            startRecord:true,
          },
       })
    }
    //上传赞或踩
    uploadHelpfulInfo=(ifHelpful)=>{
      const {dispatch,sessionId}=this.props;
      dispatch({
        type:ActionType.UPLOAD_HELPFUL_INFO,
        payload:{
          ifHelp:ifHelpful,
          sessionId,
        }
      })
    }
    handleGoodClick=()=>{
       this.uploadHelpfulInfo(true);
       if(this.dialogEndTimeout!=-1){
         clearTimeout(this.dialogEndTimeout);
         this.dialogEndTimeout=-1;
       }
    }
    handleBadClick=()=>{
       this.uploadHelpfulInfo(false);
       if(this.dialogEndTimeout!=-1){
         clearTimeout(this.dialogEndTimeout);
         this.dialogEndTimeout=-1;
       }
    }
    stopVoice=()=>{
        const _this=this;
        const {dispatch}=this.props;
        console.log("get it!");
        // dispatch({
        //   type:ActionType.START_RECORD,
        //     payload:{
        //       startRecord:false,
        //   },
        // })
        if(this.localId!=-1){
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
    handleUrlChange=(urlStr)=>{
      const {dialogList}=this.state;
      const {sessionId}=this.props;
      if(urlStr){
          saveInLocalStorage('dialog',dialogList);
          saveInLocalStorage('sessionId',sessionId);
          location.href=urlStr;
      }
    }
    playMessageVoice=(item)=>{
       const _this=this;
       const {dispatch}=this.props;
       const className=item.className;
       if(className=='user-dialog' || className=='loading-dialog')return;
       const {message,kdIntention}=item;
       let playText=this.getPlayText(message,kdIntention);
       //isYZJ() &&  && this.playVoice
       // console.log("playVoice is "+this.playVoice);
       if(isYZJ() && playText && !isEmpty(playText)){
          this.stopVoice();
          playVoice(playText,(localId)=>{
             _this.localId=localId;
             dispatch({
                type:ActionType.LOCAL_ID,
                payload:{
                    localId
                }
             })
          },()=>{
              //播报完后如果再同一个流程内则自动开启录音
              // if(kdIntention && !message.close){
              //   dispatch({
              //     type:ActionType.START_RECORD,
              //     payload:{
              //       startRecord:true,
              //     },
              //   })
              // }
          })
        }
    }
  handleAfterEnter=(inputValue,oldValue,item)=>{
    if(!item)return;
    const {sessionId,dispatch}=this.props;
    if(isEmpty(inputValue))return;
    const {dialogList}=this.state;
    const temp=dialogList.filter(itemData=>itemData.id==(item.id + 2));
    if(temp && temp[0]){
      const {kdIntention:{intention,kdWordslots}}=temp[0];
      const dataSet=kdWordslots.filter(dataItem=>dataItem.originalWord==oldValue);
      if(dataSet && dataSet[0]){
        dispatch({
          type:ActionType.MODIFY_WORDSLOT,
          payload:{sessionId,message:inputValue,wordslotNumber:dataSet[0].number,intentionNumber:intention}
        })
      }else{
        dispatch({
          type:ActionType.MODIFY_WORDSLOT,
          payload:{sessionId,message:inputValue,wordslotNumber:'',intentionNumber:''}
        })
      }
    }
  }
  handleFocus=()=>{
    this.stopVoice();
    this.playVoice=false;
  }
  startPlayVoice=()=>{
    const {dialogList}=this.state;
    let tempItem=dialogList.slice(dialogList.length - 1);
    if(tempItem && tempItem.length>0){
       tempItem=tempItem[0];
    }else{
      return;
    }
    if(tempItem.className=='chatbot-dialog'){
      this.playMessageVoice(tempItem);
    }
  }
  renderDialogList=()=>{
    const {dialogList,showTip,dialogRemove}=this.state;
    this.startPlayVoice();
    const dialogStr=dialogList.map(item=>{
      const classNameStr=item.className;
      const say=item.text;
      return <li key={item.id} className={`${Styles[classNameStr]} ${Styles['dialog-row']}`}>
          {
            item.message ? this.renderGUI(item) : item.className=='user-dialog' ? <Input ref={el=>this[`Input-${item.id}`]=el} text={say} canEdit={item.canEdit}
            afterEnter={(inputValue,oldValue)=>this.handleAfterEnter(inputValue,oldValue,item)} focusEvent={this.handleFocus}/> : <WaitingLoading></WaitingLoading>
          }
        </li>
    })
    return (
        <div className={`${Styles.scroller}`} ref={el=>this.DialogListWrapper=el}>
           <ul className={`${Styles.dialogList}`} ref={el=>this.DialogListDOM=el}>
              <li style={{height:'58px',display:showTip ? 'flex' : 'none'}}>

              </li>
              {
                dialogStr
              }
              {
                // this.transform(dialogList,dialogRemove)
              }
           </ul>
        </div>

    )
  }
  handleScrollStart=()=>{
     this.stopVoice();
     this.playVoice=false;
  }
  render(){
    const {visible}=this.props;
    const {showTip}=this.state;
    const classNameStr=visible ? 'ai-dl-show' : 'ai-dl-hide';
    return (
      <div className={`${Styles.wrapper} ${Styles[classNameStr]}`}>
              <Iscroll ref={el=>this.wrapper=el} onScrollStart={this.handleScrollStart}>
                {
                  this.renderDialogList()
                }
              </Iscroll>
          {
              isYZJ() ? null :
                  <div style={{position: 'fixed', bottom: '120px', right: '0',zIndex:'112'}}>
                      <button onClick={() => {
                          this.gotoFeedback()
                      }}>我要反馈
                      </button>
                  </div>
          }
      </div>
    )
  }
}
export default connect(state=>{
  return ({
      dialogList:state.mainpage.dialogList,
      appList:state.mainpage.appList,
      appListPagination:state.mainpage.appListPagination,
  })
})(DialogList);

/*
*              <div style={{position:'absolute',left:0,width:'100%',bottom:200,zIndex:1111}}>
                 <button style={{marginLeft:20}} onClick={this.testScroll}>click</button>
              </div>
              <div style={{position:'absolute',left:0,width:'100%',bottom:170,zIndex:1111}}>
                 <input ref={el=>this.INPUTEL=el} style={{width:'78%'}} placeholder={window.devicePixelRatio} onChange={this.testInputChagne}/>
                 <button style={{marginLeft:20}} onClick={this.testScroll1}>click</button>
              </div>
*/