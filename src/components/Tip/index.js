import React,{Component} from 'react';
import Styles from './index.less';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class Tip extends Component{
   constructor(props){
      super(props);
   }
   state={

   }
   handleClick=()=>{
   	  const {onClick,data}=this.props;
   	  if(onClick)onClick(data);
   }
   render(){
      const {prefixCls,className,style,icon,tipStr,content,visible}=this.props;
      const visibleClass=visible ? `${prefixCls}show` : `${prefixCls}hide`;
   	  return (
        <div style={style} className={`${Styles['tip-Wrapper']} ${Styles[visibleClass]}`} onClick={this.handleClick}>
            <div className={Styles.contentRow}>
                {icon && typeof icon =='string' ? <img src={icon}/> : icon ? {icon} : null}
                <div className={Styles.content}>
                    {content}
                </div>
            </div>
            {
            	tipStr ? <div className={Styles.tipRow}>{tipStr}</div> :null
            }
        </div>
   	  )
   }
}
Tip.defaultProps={
   tipStr:'点击或说出"填写出差申请"即可继续',
   prefixCls:'tip-',
   visible:false,
   data:{},
}
Tip.propTypes={
   tipStr:PropTypes.string,
   prefixCls:PropTypes.string,
   visible:PropTypes.bool,
   data:PropTypes.object
}
export default Tip;