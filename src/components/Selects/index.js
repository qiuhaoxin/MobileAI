import React,{Component} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Styles from './index.less';

class Select extends Component{
	constructor(props){
		super(props);
	}
	handleItemClick=(item,index)=>{
		const {onSelectItemClick,itemKey}=this.props;
        const key=item[itemKey] || index;
        if(onSelectItemClick)onSelectItemClick(item,key);
	}
	renderItem=()=>{
		const {dataSource,title,itemKey}=this.props;
		console.log("dataSource is "+JSON.stringify(dataSource));
		const itemArr=dataSource.map((item,index)=><li onClick={()=>this.handleItemClick(item,parseInt(index + 1))} className={Styles['select-item']} 
			key={`${item[itemKey] ? item[itemKey] : parseInt(index + 1)}`}>
			<span className={Styles.label}>{item[itemKey] ? item[itemKey] : parseInt(index + 1)}:  </span><span>{item.desc}</span></li>)
		return (
		   <ul className={Styles.list}>
               <li className={Styles.title}>{title}</li>
               {itemArr}
		   </ul>
		)	
	}
	render(){
		const {prefixCls,className,style}=this.props;
        const wrapperCls=classNames({
        	[`${prefixCls}wrapper`]:prefixCls,
        })
        console.log("Select ");
		return (
           <div className={Styles[wrapperCls]}>
               {this.renderItem()}
           </div>
		)
	}
}
Select.propTypes={
   prefixCls:PropTypes.string,
   style:PropTypes.object,
   title:PropTypes.string,
   dataSource:PropTypes.array,
   itemKey:PropTypes.oneOfType([PropTypes.number,PropTypes.string]),//数组的组件默认为id
   onSelectItemClick:PropTypes.func.isRequired,
}
Select.defaultProps={
   prefixCls:'ai-select-',
   style:{},
   title:'请选择:',
   dataSource:[],
   itemKey:'id',
   onSelectItemClick:null,
}

export default Select;