import React,{Component} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import className from 'classnames';
import Styles from './index.less';
import {RecommendCard,BackIcon,Loading,SingleRecommendCard,Answer} from 'aicomponents';
import {connect} from 'react-redux';
import * as ActionType from '../../action/actionType';
import {isYZJ,getLocation,speak,backYZJ,playVoice,stopPlayVoice,startSpeech,stopSpeech,setMenu} from '../../utils/yzj';
import {isEmpty,FilterMaxId,saveInLocalStorage,getInLocalStorage,delInLocalStorage,getValueFromUrl} from '../../utils/utils';
import Footer from '../../components/Footer';
import AppTips from '../../components/AppTips';
import DialogList from '../../components/DialogList';
import Iscroll from '../../components/Iscroll';
import { browserHistory } from 'react-router'

import travelImage from '../../images/image_travel.png'
import financeImage from '../../images/image_finance.png'

const RECOMMENDCARD_DESC="Hi~我是小K,下面是我学会的技能,快让我表演给你看吧";
const TIME_TO_HIDE=150;
class MainPage extends Component{
    constructor(props){
      super(props);
      //应用推荐Pagination
      this.RAPagination={
         pageSize:4,
         current:1,
         total:0,
      }
    }
    state={
       canSayArr:[],
       appTipsVisible:false,
       appTitle:'',
       dialog:null,
       showDialogList:false,
       showRecommend:true,
       showLoading:false,
    }
    componentWillReceiveProps(nextProps){
        if(nextProps.localId!=-1){
          this.localId=nextProps.localId;
        }
        if(nextProps.text){
           this.setState({
              dialog:nextProps.text,
              showDialogList:true,
           })
        }
        if(nextProps.loadingVisible!=this.props.loadingVisible){
           this.setState({
             showLoading:nextProps.loadingVisible,
           })
        }
    }
    componentWillUnmount(){
      this.stopVoice();
    }
    componentDidMount(){
      const {dispatch}=this.props;
      const dialogList=getInLocalStorage('dialog');
      const sessionId=getInLocalStorage('sessionId');
      const result=this.sceneSource();

      const _this=this;
      if(dialogList){
          if(sessionId){
            dispatch({
               type:ActionType.DEAL_SESSION_ID,
               payload:sessionId,
            })
            dispatch({
               type:ActionType.SYNC_DIALOG_LIST,
               payload:dialogList,
            })
          }
          this.setState({
             showDialogList:true,
          },()=>{
             delInLocalStorage('dialog');
             delInLocalStorage('sessionId');
             delInLocalStorage('dialogList');   
          })
      }else{
          this.getSessionIdFirst();
          if(result){
             this.showAppTipDirect(result,dialogList);
          }else{
            //获取推荐卡片的推荐应用
            this.fetchMainPageData();
          }
          if(isYZJ()){
            getLocation((result)=>this.uploadLocation(result));
          }
      }
    }

    jumpToFeedbackFun = () => {
        this.props.history.push('/feedback');
    }

    showAppTipDirect=(result,dialogList)=>{
        const {dispatch}=this.props;
        if(result=='BUS_TRIP'){
            dispatch({
               type:ActionType.FETCH_INTENTION_SAMPLES,
               payload:{
                  systemID:0,
                  intentionID:0,
                  intentionName:result,
               }
            })
        }
        this.setState({
           showRecommend:false,
           appTipsVisible:dialogList ? false : true,
        })
    }
    fetchMainPageData=()=>{
        const _this=this;
        const {dispatch}=this.props;
        // if(this.RAPagination.current * this.RAPagination.pageSize > this.RAPagination.total){
        //   this.RAPagination.current=1;
        // }
        //有会话记录就恢复记录，没有请求主页数据
        const result= getValueFromUrl(!isEmpty(location.search) ? location.search : location.href,['appid','openId']);
        dispatch({type:ActionType.FETCH_MAINPAGE_DATA,payload:{sessionId:window.chatSessionId,appid:result && result['appid'] || '',pagination:this.RAPagination},
            callback:function(response){
               const pagination=response['pagination'];
              // if(pagination.current * pagination.pageSize < pagination.total){
                 _this.RAPagination={
                    ..._this.pagination,
                    ...pagination,
                    current:pagination.current * pagination.pageSize < pagination.total ? (pagination.current + 1) : 1,
                 }
               //}
        }});
    }
    //判断页面的入口来源 urlParams:{scene:next}从下一代的应用进来
    sceneSource=()=>{
       const result= getValueFromUrl(!isEmpty(location.search) ? location.search : location.href,'scene');
       return result['scene'];
    }
    uploadLocation=(result)=>{
       const {uploadLocAPI,sessionId,dispatch}=this.props;
       if(result && String(result['success'])=='true'){
          const loc=result['data']['city'];
         dispatch({
           type:ActionType.UPLOAD_LOC,
           payload:{
              sessionId,
              locStr:loc
           }
         })
       }
    }
    getSessionIdFirst=()=>{
       const {dispatch}=this.props;
       const sessionId=getInLocalStorage('sessionId') || window.chatSessionId || '';
       if(sessionId){
          dispatch({
             type:ActionType.DEAL_SESSION_ID,
             payload:sessionId,
          })
       }else{
        const result= getValueFromUrl(!isEmpty(location.search) ? location.search : location.href,['appid','openId','uname']);
        dispatch({
          type:ActionType.FETCH_SESSION_ID,
          payload:{appid:result['appid'],openId:result['openId'],uname:result['uname']}
        })
       }

    }
    handleChangeApp=()=>{
        this.fetchMainPageData();
    }
    handleItemClick=(item)=>{
       const {dispatch}=this.props;
       dispatch({
          type:ActionType.FETCH_INTENTION_SAMPLES,
          payload:{
             systemID:item.fbizSysId,
             intentionID:item.fintentionId,
          }
       })
       this.hideMainPage();
       this.setState({
          appTipsVisible:true,
          appTitle:item.ftitle,
       })
    }
    //处理Footer的文字/语音输入
    handleInput=(value,extraParams)=>{
       const {dispatch,sessionId}=this.props;
       dispatch({type:ActionType.SAY,payload:{text:value,sessionId,type:'chat',extraParams}});
       //隐藏首页APPList
       if(this.state.appTipsVisible){
          this.hideAppTips();
       }else{
          this.hideMainPage();
       }
    }
    hideMainPage=()=>{
        const _this=this;
        if(this.ContentTip){
           const height=this.ContentTip.scrollHeight;
           this.ContentTip.style['transform']=`translate(0,${- height - 30 }px)`;
           this.ContentTip.style['transition']='transform .1s ease-in-out';
           setTimeout(function(){
              _this.ContentTip.style['display']="none";
           },TIME_TO_HIDE)
        }
    }
    hideAppTips=()=>{
      const _this=this;
      if(this.AppTip){
        const height=this.AppTip.scrollHeight;
        this.AppTip.style['transform']=`translate(0,${- height - 30 }px)`;
        this.AppTip.style['transition']='transform .1s ease-in-out';
        setTimeout(function(){
              _this.AppTip.style['display']="none";
        },TIME_TO_HIDE)
      }
    }
    stopVoice=()=>{
        const _this=this;
        const {dispatch}=this.props;
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
        dispatch({
            type:ActionType.START_RECORD,
            payload:{
              startRecord:false,
            },
        })
    }
    handleIconClick=(e)=>{
       const {dispatch,sessionId}=this.props;
       this.stopVoice();
       dispatch({
          type:ActionType.START_RECORD,
          payload:{
            startRecord:false,
          },
       })
       dispatch({
         type:ActionType.CLEAR_SESSION,
         payload:{
            sessionId
         },
         callback:function(){
            dispatch({
              type:ActionType.BACK_TO_RECOMMEND,
            })
         }
       })
    }

    chooseBgImg =(item)=>{
        if (item.ftitle == '出差申请'){
            return travelImage
        } else if(item.ftitle == '财务指标查询'){
            return financeImage
        }
    }

    renderRecommendCard = () => {
        const {appList,appListPagination} = this.props;
        const {showRecommend} = this.state;
        if(appList.length==0)return null;
        if(appListPagination && appListPagination.total<=2){
            const recommendCardStr=appList.map(item=>{
                let bgImg = this.chooseBgImg(item);

                return <SingleRecommendCard key={item.fid} bgImg={bgImg} className={Styles.singleRecommends} appTitle={item.ftitle} appMessage={item.ftips}/>
            })
            return <div>
               {recommendCardStr}
            </div>
        }else{
              return <RecommendCard style={{display: showRecommend ? 'block' : 'none'}} data={appList} desc={RECOMMENDCARD_DESC} className={Styles['recommend-demo']}
                onBtnClick={this.handleChangeApp} onItemClick={this.handleItemClick} />
        }
    }
    render(){
      const {title,appList,sessionId,dispatch,appMessage}=this.props;
      const {appTipsVisible,showDialogList,showRecommend,appTitle,showLoading}=this.state;
      return (
         <div className={Styles.wrapper}>
            <div className={Styles.header} ref={el=>this.Header=el}>
              <div className={Styles.contentTip} ref={el=>this.ContentTip=el} style={{display:!showDialogList ? 'block' : 'none'}}>
                 <div className={Styles.rowTitle}>
                    {
                      isEmpty(title) ? null 
                      :<Answer style={{lineHeight:'23px',padding:'8px 12px 8px 16px',marginBottom:10}} str={title}></Answer>
                    }
                 </div>
                  {
                      this.renderRecommendCard()
                  }
              </div>

              <div ref={el=>this.AppTip=el}>
                 <AppTips visible={appTipsVisible} appTips={appMessage} appTitle={appTitle}></AppTips>
              </div>

              <div>
                  <DialogList visible={this.state.showDialogList} jumpToFeedbackFun={this.jumpToFeedbackFun} sessionId={sessionId} dispatch={dispatch} appList={appList}>
                  </DialogList>
              </div>
            </div>
            <Footer sessionId={sessionId} dispatch={this.props.dispatch} onEnterClick={this.handleInput}></Footer>
            <BackIcon visible={showDialogList || appTipsVisible} onIconClick={this.handleIconClick}/>
            <Loading visible={showLoading} londingStr={'正在跳转...'}>

            </Loading>
         </div>
      )
    }
}
export default connect(state=>{
  return {
     title:state.mainpage.title,
     appList:state.mainpage.appList,
     appListPagination:state.mainpage.appListPagination,
     sessionId:state.mainpage.sessionId,
     text:state.mainpage.text,
     appMessage:state.mainpage.appMessage,
     status:state.mainpage.status,
     loadingVisible:state.mainpage.loadingVisible,
     localId:state.mainpage.localId,
  }
})(MainPage);



/*
                 <RecommendCard style={{display:showRecommend ? 'block' : 'none'}} data={appList} desc={RECOMMENDCARD_DESC} className={Styles['recommend-demo']} 
                     onBtnClick={this.handleChangeApp} onItemClick={this.handleItemClick}>
                 </RecommendCard>


*/
