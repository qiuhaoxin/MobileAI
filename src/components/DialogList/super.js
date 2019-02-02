/*
*  对话列表基类
*  haoxin_qiu
*/

import React,{Component} from 'react';
import {connect} from 'react-redux';
import {TypeIn,ExpandList,NumberCard,Tip,Frame,Input,URL,Comment,WaitingLoading3,SingleRecommendCard,RecommendCard,Answer,SlideList} from 'aicomponents';
import imgPath from '../../images/bus.png';
import Styles from './index.less';
import {UITYPE} from '../../const/UIType';
import * as ActionType from '../../action/actionType';
import {getInLocalStorage, delInLocalStorage} from '../../utils/utils';

import travelImage from '../../images/image_travel.png'
import financeImage from '../../images/image_finance.png'
import ReactDOM from 'react-dom';

const RECOMMENDCARD_DESC="请问有什么可以帮到您?";
const DIALOG_TITLE="请填写出差事由";
class SuperClass extends Component{
	constructor(props){
       super(props);
       this.dialogEndTimeout=-1;
       this.appListItem=null;
       this.curPage=1;//分页列表，页数默认为第一页
	}
	//获取播报的语音
    getPlayText=(message,kdIntention)=>{
       const type=message.type;
       let text="";
       switch(type){
          case UITYPE.UI_TEXT:
          case UITYPE.UI_SELECTS:
            text=message.text;
          break;
          case UITYPE.UI_URL:
            text=message.url && message.url.content;
            if(message.close && kdIntention.intention=='BUS_TRIP'){
              text='已成功提交单据';
            }
          break;
          case UITYPE.UI_NUMBER_CARD:
             text=message.numberCard && message.numberCard.desc;
          break;
       }
       return text;
    }
    dealDialogEnd=()=>{
       const _this=this;
       const {dispatch}=this.props;
       this.dialogEndTimeout=setTimeout(function(){
       	  if(_this.dialogEndTimeout!=-1){
       	  	clearTimeout(_this.dialogEndTimeout);
       	  	_this.dialogEndTimeout=-1;
       	  }
          dispatch({
          	type:ActionType.EXCEPTION,
          	payload:'好久没消息了，还需要我做什么吗？',
          })
       },25000);
    }
    handleSelectItemClick=(item)=>{
      //如果有播报停止播报
       this.stopVoice();
       //let tempArr=this.state.dialogList;
       const {sessionId,dispatch}=this.props;
       this.chat(item.id,item.desc);
    }
    handleSLItemClick=(text,itemId)=>{
       this.stopVoice();
       this.chat(itemId,text,{pageIndex:this.curPage});
    }
    handleSLPageChange=(curPage)=>{
      curPage+=1;
      this.curPage=curPage
      this.dispatchMethod(ActionType.CHANGE_PAGE,curPage);
    }
    //列表
    renderSelect=(item)=>{
       const {message:{selects,text,pageSelects},kdIntention}=item;
       this.dispatchMethod(ActionType.CHANGE_PAGE,1);
       this.curPage=1;
       this.data={
           desc:text,
           list:selects,
       }
       if(pageSelects && pageSelects.length > 0){
         return <SlideList text={text} data={pageSelects} onItemClick={this.handleSLItemClick} onPageChange={this.handleSLPageChange}></SlideList>
       }
       return <ExpandList data={this.data} title={text} itemKey='id' onItemClick={this.handleSelectItemClick}></ExpandList>
    }
    //渲染对话框
    renderDialog=(item)=>{
        const {kdIntention,type,message:{text,showGuideCard}}=item;
        const _this=this;
        const {say}=kdIntention;
        let status='';
        if(kdIntention!=null && kdIntention['intention'] && kdIntention['intention'].toUpperCase()=='BUS_TRIP'){
           const wordslot=kdIntention.kdWordslots;
           let reason=wordslot.filter(item=>item.number=='user_reason')[0];
           reason=reason && reason['originalWord'];
           const errorArr=wordslot.filter(item=>item.correct==false);
           if(errorArr && errorArr.length > 0){
              status='error';
           }
           const sayStyle={};
           sayStyle['lineHeight']=text.length > 17 ? '23px' : '15px';
           sayStyle['padding']=text.length > 17 ? '8px 12px 8px 16px' : '12px 12px 13px 16px';
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
                          status={status}
                          sayStyle={sayStyle}
                          >
                     {item.type=='URL' ? this[urlMapping[kdIntention['intention']]] : null}

                  </TypeIn>
        }else if(kdIntention!=null && kdIntention['intention'] && kdIntention['intention'].toLowerCase()=='enquire_financial_indicators'){
            return <div>
               <Answer str={text} style={{padding:'8px 12px 8px 16px',lineHeight:'23px',marginBottom:10,marginTop:10}}></Answer>
            </div> 
        }else{
          if(this.appListItem==null){
            this.appListItem={
              data:{
                appList:this.appList|| getInLocalStorage('appList'),
              },
            }
          }
          return <div>
               <Answer str={text} style={{padding:'8px 12px 8px 16px',lineHeight:'23px',marginBottom:10,marginTop:10}}></Answer>
              {
                 showGuideCard ? this.decideIfDisplayRenderRecommend(item) : null
              }

          </div>
        }
    }
    decideIfDisplayRenderRecommend = (item) => {
        const {dialogList} = this.state;
        if (dialogList == undefined || dialogList == null || dialogList.length == 0) {
            return null
        }
        let dialogListElement = dialogList[dialogList.length - 1];
        if (item.id == dialogListElement.id) {
            return this.renderRecommend(this.appListItem)
        }
        return null;
    }

    chooseBgImg =(item)=>{
        if (item.ftitle == '出差申请'){
            return travelImage
        } else if(item.ftitle == '财务指标查询'){
            return financeImage
        }
    }

    handleChangeApp=()=>{
      console.log("handleChangeApp12");
    }
    renderRecommend = (item) => {
        const {appList}=item.data;
        if(appList && appList.length==0)return null;
        if(appList && appList.length<=2){
            const recommendCardStr=appList.map(item=>{
                let bgImg = this.chooseBgImg(item);

                return <SingleRecommendCard key={item.fid} bgImg={bgImg} className={Styles.singleRecommends} appTitle={item.ftitle} appMessage={item.ftips}/>
            })
            return <div>
               {recommendCardStr}
            </div>
        }else{
            return <RecommendCard data={appList} desc={RECOMMENDCARD_DESC} className={Styles['recommend-demo']}
                onBtnClick={this.handleChangeApp} onItemClick={this.handleItemClick} />
        }
    }
    renderGUI=(item)=> {  
        const type=item.message && item.message.type;
        switch(type){
          case UITYPE.UI_SELECTS:
            return this.renderSelect(item);
          break;
          case UITYPE.UI_TEXT:
            return this.renderDialog(item);
          break;
          case UITYPE.UI_URL:
            return this.renderURL(item);
          break;
          case UITYPE.UI_NUMBER_CARD:
            return this.renderNumberCard(item);
          break;
          case UITYPE.UI_RECOMMEND:
            return this.renderRecommend(item);
          break;
          case UITYPE.UI_LOADING:
             return this.renderLoading(item);
          break;
          case UITYPE.UI_EXCEPTION://异常处理
             return this.renderException(item);
          break;
        }  
    }
    handleAnswerClick=()=>{
        this.stopVoice();
        this.gotoFeedback();
    }
    renderLoading = () => {

        return <div style={{paddingBottom:'10px'}}>
            <WaitingLoading3/>
        </div>

    }
    renderException=(item)=>{
       const {message:{text}}=item;
       return <Answer onClick={this.handleAnswerClick} canClick={true} style={{lineHeight:'23px',padding:'8px 12px 8px 16px',marginTop:20}} str={text}></Answer>
    }
    //数字卡片
    renderNumberCard=(item)=>{
       const {message}=item;
       const {numberCard}=message;
       numberCard.desc=numberCard.desc.replace('您好','');
       if(numberCard && numberCard.numeralDetail){
          numberCard.numeralDetail.forEach(item=>{
             item.value=item.value.replace('人民币','');
          })
       }
       return <NumberCard data={numberCard} answerStyle={{padding:'8px 12px 8px 16px',lineHeight:'23px',marginBottom:8}}>
              <Comment onNegativeClick={this.handleNegativeClick} onPositiveClick={this.handlePositiveClick} 
              onGoodClick={this.handleGoodClick} onBadClick={this.handleBadClick} goodStr={'谢谢鼓励，还需要我做什么？'}
              badStr={'感谢批评,小K会继续努力的.还需要我做什么？'}></Comment>
       </NumberCard>
    }
    //链接
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
    translateList=(listHeight,time)=>{
	     if(this.wrapper){
	         this.wrapper.scrollTo(0,-listHeight,time,{});
	     }
    }
    transform=(dialogList,dialogRemove)=>{
        this.listHeight=this.DialogListWrapper && this.DialogListWrapper.clientHeight;
        let cardHeight=0;
        let lastChild=dialogList.slice(dialogList.length - 1);
        if(lastChild && lastChild.length > 0){
          lastChild=lastChild[0];
        }
        let _this = this;
        const className=lastChild && lastChild.className;
        if(className==='loading-dialog'||className=='user-dialog'){
            if (lastChild.message && lastChild.message.type == 'RECOMMEND') {     //

                // let moveHeight = 165;       //  要计算推荐卡片的个数来判断下滑高度
                //
                // let secondToLastEle = dialogList[dialogList.length - 2];
                // if (secondToLastEle && secondToLastEle.id == (lastChild.id - 1) && secondToLastEle.kdIntention.intention != 'chat') {  //
                //     moveHeight = 2;
                // } else if (lastChild && lastChild.data && lastChild.data.appList && lastChild.data.appList.length == 2) {
                //     moveHeight *= 2;
                // }
                // console.log("#### START ####   " )
                //
                // console.log("moveHeight is : " + JSON.stringify(moveHeight))
                // console.log("this.listHeight is : " + JSON.stringify(this.listHeight))
                //
                // console.log("#### END ####  " )
                //
                // this.translateList(this.listHeight - moveHeight, 500);


                console.log(_this.DialogListDOM);
                let domNode = ReactDOM.findDOMNode(_this.DialogListDOM);

                let list = domNode.children;
                _this.wrapper.scrollToElement(list[list.length - 1], 100)


            } else
                if (this.listHeight != 0) {
                console.log("listHeight1 is " + this.listHeight);
                this.translateList(this.listHeight, 500);
            }
        }else if(className=='chatbot-dialog'){
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
          if(this.listHeight!=0){
              if(this.typein){
                cardHeight =this.typein.getCardHeight() + 8;
              }
              this.listHeight=dialogRemove ? (this.listHeight - cardHeight - inputHeight -50) : (this.listHeight - inputHeight - 50); // -16 作为Input的padding-top值           
              if(lastChild && lastChild.showMasker){
                this.listHeight += 133;
              }
              if(lastChild && lastChild.kdIntention && lastChild.kdIntention.intention=='BUS_TRIP' && lastChild.kdIntention.status=='confirmed'){
                this.listHeight+=40;
              }
              if(dialogList.length>2){
                 this.translateList(this.listHeight,0);
              }
          }
        }
    }
	render(){
       return (
          <div>

          </div>
       )
	}
}

export default SuperClass;

/*
return <TypeIn say={text} showBody={false}></TypeIn>
 */