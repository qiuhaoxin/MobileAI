
import React,{Component} from 'react';
import ReactDOM from 'react-dom';
import Styles from './index.less';
import PropTypes from 'prop-types';
import {isEmpty, FilterMaxId, saveInLocalStorage, getInLocalStorage, delInLocalStorage} from '../../utils/utils';
import {isYZJ,speak,backYZJ,playVoice,stopPlayVoice,startSpeech,stopSpeech} from '../../utils/yzj';
import * as ActionType from '../../action/actionType';
import {connect} from 'react-redux';
import {TypeIn,ExpandList,NumberCard,VoiceReceive,VoiceReceive2,Tip,Frame,Input,URL,Comment} from 'aicomponents';
import Iscroll from '../Iscroll';
import imgPath from '../../images/bus.png';
import cloneDeep from 'lodash/cloneDeep';

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
class DialogList extends Component{
	constructor(props){
		super(props);
    this.timeoutId=-1;
    this.wrapperHeight=0;
    this.localId=-1;
	}
	state={
		dialogList:[],
    showTip:false,
    dialogRemove:false,
    heightStr:'test',
    heightInt:0,
	}
	componentWillReceiveProps(nextProps){
        const result=this.haveRemoveCard(this.props,nextProps);
        let _this = this;
        if(this.props.dialogList.length!=nextProps.dialogList.length){
          this.setState({
            dialogList:nextProps.dialogList,
            dialogRemove:result,
          },()=>{
            const list=nextProps.dialogList;
          })
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
        // return false;
    }
    return true;

  }
  componentDidMount(){
      const dialogList=getInLocalStorage('dialog');
      const sessionId=getInLocalStorage('sessionId');
      const defaultHeight = getInLocalStorage('dialogListDefaultHeight')
      let _this = this;
      if(dialogList){
        this.setState({
          dialogList
        },()=>{
            if (defaultHeight != undefined){
                _this.wrapper.scrollTo(0,-defaultHeight + 300,500)
                delInLocalStorage('dialogListDefaultHeight')
            }
        })
      }
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
	chat=(text)=>{
		const {dispatch,sessionId}=this.props;
		dispatch({
      type:ActionType.SAY,
			payload:{sessionId,text},
		})
	}
  transformDialog=()=>{
      const _this=this;
      if(this.DialogListDOM){
          const sro=parseInt(_this.DialogListDOM.scrollHeight) + parseInt(_this.DialogListDOM.offsetHeight) + 10000;
          setTimeout(function(){
            ReactDOM.findDOMNode(_this.DialogListDOM).scrollTop=sro;
          },TIME_TO_SCROLL)
      }
  }
  translateList=(listHeight,time)=>{
     if(this.wrapper){
         this.wrapper.scrollTo(0,-listHeight,time,{});
     }
  }
  handleTipClick=(data)=>{
      const _this=this;
      const {dispatch,sessionId}=this.props;
      const {intention,kdWordslots,say}=data;
      this.setState({
         showTip:false,
      },()=>{
        dispatch({type:ActionType.SAY,payload:{text:'填写出差申请',sessionId}});
      })
      
  }
  //用户反馈
  dealDialogEnd=(nextProps)=>{
      const _this = this;
      let lastItem = nextProps.dialogList[nextProps.dialogList.length - 1];

      // 闲聊意图不显示反馈
      if (lastItem && lastItem.kdIntention && lastItem.kdIntention.intention === 'chat') {
          return;
      }

      let status = lastItem && lastItem.kdIntention && lastItem.kdIntention.status;
      let {dialogList} = this.state;
      if (this.timeoutId != -1) {
          clearTimeout(this.timeoutId);
          this.timeoutId = -1;
      }
      if (status == 'satisfy' || status === 'confirmed') {
          this.timeoutId = setTimeout(function () {

              let obj = {
                  className: 'chatbot-dialog',
                  text: '要是没有问题了，小K就退下啦',
                  message: {
                      type: 'VOICERECEIVE'
                  },
                  type: 'VOICERECEIVE',
                  id: FilterMaxId(dialogList, 'id')
              }

              dialogList.push(obj);
              dialogList = dialogList.filter(item => item.id !== -1);
              _this.setState({
                  dialogList,
              })

          }, TIME_TO_VOICE);
      } else {
          clearTimeout(this.timeoutId);
          this.timeoutId = -1;
      }
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
  //处理出差申请的点击提交按钮效果
  dealBusSubmit=()=>{
     const {dialogList}=this.state;
     const id=FilterMaxId(dialogList,'id');
     let lastChild=cloneDeep(dialogList.slice(dialogList.length - 2,dialogList.length - 1)[0]);
     lastChild.id=id;
     lastChild.showMasker=true;
     lastChild.text="小K正在为您提交单据，请稍后...";
     dialogList.push(lastChild);
  }
  handleDialogSubmit=(item)=>{
     const url=item && item['url'];
     const {dispatch,sessionId}=this.props;
     dispatch({
        type:ActionType.SAY,
        payload:{
           sessionId,text:'提交'
        }
     })
  }
  handleCheckDetial=(item)=>{
     const {message:{url:{url}}}=item;
     const {dialogList}=this.state;
     const {sessionId,dispatch}=this.props;
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

     let _this = this
     dispatch({
       type:ActionType.CHANGE_LOADING_VISIBLE,
       payload:true,
     })
     dispatch({
       type:ActionType.REQUEST_EDIT_URL,
       payload:{
          sessionId, 
          intentionNumber: "BUS_TRIP",
          bizCommandName: "tripReqBillSave",//tripSave2  tripReqBillSave
       },
       callback:function(response){
          let message=JSON.parse(response.message);
          let url='';
          console.log("message is "+JSON.stringify(message));
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
    //渲染对话框
    renderDialog=(item)=>{
        const {kdIntention,type,message:{text}}=item;
        const _this=this;
        const {say}=kdIntention;
        const {dialogList}=this.props;
        let status='';
        if(kdIntention!=null && kdIntention['intention'] && kdIntention['intention'].toUpperCase()=='BUS_TRIP'){
           const wordslot=kdIntention.kdWordslots;
           let reason=wordslot.filter(item=>item.number=='user_reason')[0];
           reason=reason && reason['originalWord'];
           const errorArr=wordslot.filter(item=>item.correct==false);
           if(errorArr && errorArr.length > 0){
              status='error';
           }
           return <TypeIn ref={el=>this[`typein`]=el}
                          imgPath={imgPath}
                          title={reason ? reason : DIALOG_TITLE}
                          kdIntention={kdIntention}
                          className={Styles.dialog}
                          say={text}
                          content={()=>this.handleDialogContent(kdIntention['kdWordslots'])}
                          showBody={item.showBody}
                          showMasker={item.showMasker}
                          onSubmit={kdIntention.status=='confirm' ? ()=>_this.handleDialogSubmit(item) : null}

                          onEdit={kdIntention.status=='confirm' ? ()=>_this.handleBusTripDialogEdit(item) : null}
                          onEditStr={kdIntention.status=='confirm' ? '编辑详情' : null}

                          status={status}>
                     {item.type=='URL' ? this[urlMapping[kdIntention['intention']]] : null}

                  </TypeIn>
        }else if(kdIntention!=null && kdIntention['intention'] && kdIntention['intention'].toLowerCase()=='enquire_financial_indicators'){
           return <TypeIn say={text} showBody={false}></TypeIn>
        }else{
          return <TypeIn say={text} showBody={false}></TypeIn>
        }
    }
    handleSelectItemClick=(item)=>{
      //如果有播报停止播报
       this.stopVoice();
       let tempArr=this.state.dialogList;
       const {sessionId,dispatch}=this.props;
       this.chat(item.desc);
    }
    renderSelect=(item)=>{
       const {message:{selects,text},kdIntention}=item;
       this.data={
           desc:text,
           list:selects,
      }
      return <ExpandList data={this.data} title={text} itemKey='id' onItemClick={this.handleSelectItemClick}></ExpandList>
    }
    handleNegativeClick=()=>{
       
       this.stopVoice();

    }
    handlePositiveClick=()=>{
      //提建议
       const {dispatch}=this.props;
       console.log("you say good!");
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
      console.log("ifHelpful is "+ifHelpful);
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
    }
    handleBadClick=()=>{
       this.uploadHelpfulInfo(false);
    }
    renderNumberCard=(item)=>{
       const {message}=item;
       const {numberCard}=message;
       numberCard.desc=numberCard.desc.replace('您好','');
       if(numberCard && numberCard.numeralDetail){
          numberCard.numeralDetail.forEach(item=>{
             item.value=item.value.replace('人民币','');
          })
       }
       return <NumberCard data={numberCard}>
              <Comment onNegativeClick={this.handleNegativeClick} onPositiveClick={this.handlePositiveClick} 
              onGoodClick={this.handleGoodClick} onBadClick={this.handleBadClick}></Comment>
       </NumberCard>

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
               dispatch({
                  type:ActionType.START_RECORD,
                  payload:{
                    startRecord:false,
                  },
               })
            })
          }catch(e){
             alert("e is "+e);
          }
        }
    }
    hardToUpdate=(obj)=>{
       const tempArr=this.state.dialogList;
       const id=FilterMaxId(tempArr,'id');
       if(!obj.hasOwnProperty('id')){
          obj['id']=id;
       }
       tempArr.push(obj);
       this.setState({
          dialogList:tempArr,
       })
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
    renderURL=(item)=>{
       const {message:{url:{autoOpen,iframe,content,url}},kdIntention}=item;
       if(kdIntention.intention=='BUS_TRIP' && kdIntention.status=='confirmed'){
           this.stopVoice();
           this.playVoice=false;
           const wordslot=kdIntention.kdWordslots;
           let reason=wordslot.filter(item=>item.number=='user_reason')[0];
           reason=reason && reason['originalWord'];
           return (
              <div> 
                  <TypeIn say={`已成功提交单据`} content={()=>this.handleDialogContent(kdIntention['kdWordslots'])}
                    imgPath={imgPath} status={'success'} title={reason ? reason : DIALOG_TITLE}
                    onSubmit={()=>this.handleCheckDetial(item)}
                    onSubmitStr={'查看详情'}
                  >
                  </TypeIn>
              </div>
           )
       }
       return (
           <div>
               {
                  iframe ? <Frame src={url} className={Styles.frame}></Frame> : 
                  <URL style={{color:'#4598F0'}} onClick={()=>this.handleUrlChange(url)} urlStr={content}></URL>
               }
               
           </div>
       )
    }
    //获取播报的语音
    getPlayText=(message,kdIntention)=>{
       const type=message.type;
       let text="";
       switch(type){
          case 'TEXT':
          case 'SELECTS':
            text=message.text;
          break;
          case 'URL':
            text=message.url && message.url.content;
            if(message.close && kdIntention.intention=='BUS_TRIP'){
              text='已成功提交单据';
            }
          break;
          case 'NUMBER_CARD':
             text=message.numberCard && message.numberCard.desc;
          break;
       }
       console.log("text is "+text);
       return text;
    }
    playMessageVoice=(item)=>{
       const _this=this;
       const {dispatch}=this.props;
       const className=item.className;
       if(className=='user-dialog')return;
       const {message,kdIntention}=item;
       let playText=this.getPlayText(message,kdIntention);
       if(isYZJ() && playText && !isEmpty(playText) && this.playVoice){
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
              if(kdIntention && !message.close){
                dispatch({
                  type:ActionType.START_RECORD,
                  payload:{
                    startRecord:true,
                  },
                })
              }
          })
        }
    }
    transform=()=>{
        const {dialogList,dialogRemove}=this.state;
        let listHeight=this.DialogListWrapper && this.DialogListWrapper.clientHeight;
        let cardHeight=0;
        let lastChild=dialogList.slice(dialogList.length - 1);
        if(lastChild && lastChild.length > 0){
          lastChild=lastChild[0];
        }
        const className=lastChild && lastChild.className;
        if(className==='user-dialog'){
          if(listHeight!=0){
              this.translateList(listHeight,500);
          }
        }else{
          let lastTwoChild=dialogList.slice(dialogList.length - 2,dialogList.length - 1);
          let inputHeight=20;
          if(lastTwoChild && lastTwoChild[0]){
             const child=lastTwoChild[0];
             if(child.className=='user-dialog'){
                const id=child.id;
                if(this[`Input-${id}`]){
                  inputHeight= this[`Input-${id}`].getHeight();//+8
                }else{
                   inputHeight= 83;
                }
             }else{
                inputHeight=0;
             }
          }
          if(listHeight!=0){
              if(this.typein){
                cardHeight =this.typein.getCardHeight() + 8;
              }
              listHeight=dialogRemove ? (listHeight - cardHeight - inputHeight) : (listHeight - inputHeight); // -16 作为Input的padding-top值           
              if(lastChild && lastChild.showMasker){
                listHeight += 153;
              }
              if(lastChild && lastChild.kdIntention && lastChild.kdIntention.intention=='BUS_TRIP' && lastChild.kdIntention.status=='confirmed'){
                listHeight-=10;
              }
              if(dialogList.length>2){
                 //listHeight
                 this.translateList(listHeight,0);
              }
          }
        }
    }
    renderGUI=(item)=> {  
        const _this=this;
        const type=item.message && item.message.type;
        switch(type){
          case 'SELECTS':
            return _this.renderSelect(item);
          break;
          case 'TEXT':
            return _this.renderDialog(item);
          break;
          case 'URL':
            return _this.renderURL(item);
          break;
          case 'NUMBER_CARD':
            return _this.renderNumberCard(item);
          break;
        }  
    }
  handleAfterEnter=(inputValue,oldValue,item)=>{
    if(!item)return;
    const {sessionId,dispatch}=this.props;
    if(isEmpty(inputValue))return;
    const {dialogList}=this.state;
    const temp=dialogList.filter(itemData=>itemData.id==(item.id + 1));
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
		const {dialogList,showTip}=this.state; 
    this.startPlayVoice();
		const dialogStr=dialogList.map(item=>{
			const classNameStr=item.className;
      const say=item.text;
			return <li key={item.id} className={`${Styles[classNameStr]} ${Styles['dialog-row']}`}>
			    {
			    	item.kdIntention || item.type=='VOICERECEIVE' ? this.renderGUI(item) : <Input ref={el=>this[`Input-${item.id}`]=el} text={say} 
            afterEnter={(inputValue,oldValue)=>this.handleAfterEnter(inputValue,oldValue,item)} focusEvent={this.handleFocus}/>
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
                this.transform()
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
    const {showTip,heightStr}=this.state;
		const classNameStr=visible ? 'ai-dl-show' : 'ai-dl-hide'; 
		return (
			<div className={`${Styles.wrapper} ${Styles[classNameStr]}`}>
              <Iscroll ref={el=>this.wrapper=el} onScrollStart={this.handleScrollStart}>
                {
                  this.renderDialogList()
                }
              </Iscroll>
              <Tip visible={showTip} content={this.tipContent} icon={require('../../images/text.png')} onClick={this.handleTipClick}></Tip>
			</div>
		)
	}
}
export default connect(state=>{
	return ({
      dialogList:state.mainpage.dialogList,
      //editUrl:state.mainpage.editUrl,
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