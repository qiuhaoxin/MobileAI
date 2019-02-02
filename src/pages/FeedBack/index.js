import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import * as ActionType from "../../action/actionType";
import {setMenu,setTitle,speak} from "../../utils/yzj";
import {getValueFromUrl, isEmpty} from "../../utils/utils";
import {StarRate1,Button} from 'aicomponents';
import Styles from './index.less';
import successImg from '../../images/image_success.png'
import microphone from "../../images/microphone.png"

const btnStyle={
    backgroundImage:'linear-gradient(39deg, #597CFC 0%, #4598F0 100%)',
    width:200,display:'inline-flex',justifyContent:'center',alignItems:'center',
    color:'#fff',fontSize:20,position:'fixed',left:0,width:'100%',borderRadius:0,bottom:0,height:33,
    paddingLeft:0,paddingRight:0
}
class FeedBack extends Component {
    constructor(props) {
        super(props);
        this.rate=0;
    }
    state={
        rate:0,
        hasSubmit:false,
        suggestion:this.props.exception,
        height:0,
        showMasker:false,
    }
    componentDidMount() {
        setMenu({}, [], {});
    }
    componentWillReceiveProps(nextProps){
        //console.log("nextProps is "+JSON.stringify(nextProps));
    }
    handleSubmit = () => {
        const _this = this;
        const {suggestion}=this.state;
        const {dispatch,sessionId} = this.props;
        try{
            if(isEmpty(suggestion) && this.rate==0){
                this.setState({
                    height:30,
                },()=>{
                    setTimeout(function(){
                        _this.setState({
                            height:0,
                        })
                    },3000)
                })
                return;
            }
            let urlParam = !isEmpty(location.search) ? location.search : location.href;
            const result = getValueFromUrl(urlParam, ['appid', 'openId', 'uname']);

            let param = {
                rate:this.rate,
                content:this.state.suggestion,
                appid: result['appid'],
                openId: result['openId'],
                uname: result['uname'],
                sessionId,
            }

            dispatch({
                type: ActionType.UPLOAD_FEEDBACK_INFO,
                payload: param,
                callback:function(response){
                   if(response.code==1){
                      _this.setState({
                         showMasker:true,
                      },()=>{
                         setTimeout(function(){
                            _this.props.history.goBack();
                         },1500)
                      })
                   }
                }
            })
        }catch(e){
           alert("exception is "+e);
        }
    }
    handleRateChange=(rate)=>{
        this.rate=rate;
    }
    handleInput=(key,e)=>{
        this.setState({
            [key]:e.target.value
        })
    }

    handleVoiceInputBackcall = (result) => {
         this.setState({
            suggestion:this.state.suggestion + result.data.text
        })
    }

    render() {
        const {hasSubmit,height,showMasker}=this.state;
        return (
            <div className={Styles.wrapper}>
                <div style={{height:height}} className={`${Styles.header}`}>
                    您还未进行任何评价哟～
                </div>
                <StarRate1
                    count={5}
                    onChange={(rate)=>this.handleRateChange(rate)}
                    style={{marginTop:2}}
                />
                <div className={Styles.area}>
                   <textarea placeholder="你的建议让我变的更聪明" value={this.state.suggestion} onChange={(e)=>this.handleInput('suggestion',e)}/>
                    <span onClick={() => speak(this.handleVoiceInputBackcall)}>
                        <img  alt={"microphone"} width={"13px"}  height={"20px"} src={microphone}/>
                    </span>
                </div>
                <Button btnStr="提交" style={btnStyle} onClick={this.handleSubmit}></Button>
                <div className={`${Styles.showMasker}`} style={{display:showMasker ? 'block' : 'none'}}>
                    <div className={`${Styles.layer}`}>
                         <img src={successImg}/>
                         <div>反馈成功</div>
                    </div>
                </div>
            </div>
        )
    }
}

export default connect(state => {
        return {
            sessionId: state.mainpage.sessionId,
            appList:state.mainpage.appList,
            exception:state.mainpage.exception,
        }
    }
)(FeedBack);


