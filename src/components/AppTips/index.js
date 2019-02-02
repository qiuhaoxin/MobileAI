import React,{Component} from 'react';
import Styles from './index.less';
import PropTypes from 'prop-types';

class AppTips extends Component{
	constructor(props){
		super(props);
	}
	componentWillReceiveProps(nextProps){

	}
	renderTipList=()=>{
		const {appTips}=this.props;
		const listStr=appTips.map((item,index)=><li key={index}>
            <div>{item}</div>
		</li>)
		return (
           <ul>
                {listStr}
           </ul>
		)
	}
	render(){
		const {desc,visible,appTitle}=this.props;
        const classNameStr=visible ? 'ai-at-show' : 'ai-at-hide';
		return (
			<div className={`${Styles.wrapper} ${Styles[classNameStr]}`}>
			    <div className={`${Styles.title}`}>
                    {appTitle}
			    </div>
                <div className={`${Styles.tipMsg}`}>
                    {desc}
                </div>
                {
                	this.renderTipList()
                }
			</div>
		)
	}
}
AppTips.defaultProps={
	desc:'你可以跟我这么说',
	visible:false,
}
AppTips.propTypes={
	desc:PropTypes.string,
	visible:PropTypes.bool,
}
export default AppTips;