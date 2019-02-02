import React,{Component} from 'react';
import Styles from './index.less';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const DIALOG_TITLE="这里是标题";
class Dialog extends Component{
	constructor(props){
		super(props);
	}
    renderFooter=()=>{
    	const {footer,onEdit,onSubmit,onEditStr,onSubmitStr}=this.props;
    	if(!footer){
    		if(onEdit && !onSubmit){
            return (<div className={Styles.footer}><div>{onEditStr}</div></div>)
    		}else if(onEdit && onSubmit){
    		   const style={width:'50%',boxSizing:'border-box'};
               return (<div className={Styles.footer}><div className={Styles.left} style={style} onClick={onEdit}>{onEditStr}</div><div className={Styles.right} onClick={onSubmit} style={style}>{onSubmitStr}</div></div>)
    		}else if(!onEdit && onSubmit){
    			return <div className={Styles.footer}><div>{onSubmitStr}</div></div>
    		}
    	}else if(footer){
            return <div className={Styles.footer}>{footer}</div>
    	}else{
    		return null;
    	}
    }
	render(){
		const {prefixCls,style,className,title,visible,content,children}=this.props;
		const wrapperCls=`${prefixCls}-dialog`;
		const wrapperStyle= style ? Object.assign(style,{
			display:visible ? 'flex' : 'none',
		}) : {
			display:visible ? 'flex' : 'none',
		}
		return (
          <div className={`${Styles[`${prefixCls}-dialog-wrapper`]}`}>
            <div className={`${Styles[wrapperCls]} ${className}`} style={wrapperStyle}>
                <div className={Styles.inner}>
                   <div className={`${Styles.header} ${title!=DIALOG_TITLE ? Styles['title_fill'] : ''}`}>
                        {title}
                   </div>
                   <div className={Styles.content}>
                        {typeof content=='function' ? content() : content}
                   </div>
                   {this.renderFooter()}
                </div>
            </div>
            {
                children ? children() : null
            }
          </div>
		)
	}
}
Dialog.propTypes={
   prefixCls:PropTypes.string,
   title:PropTypes.string,
   visible:PropTypes.bool,
   content:PropTypes.oneOfType([PropTypes.element,PropTypes.string,PropTypes.func]),
   onEditStr:PropTypes.string,
   onSubmitStr:PropTypes.string,
}
Dialog.defaultProps={
   prefixCls:'ai',
   title:'DialogHeader',
   footer:null,
   visible:true,
   onEditStr:'修改',
   onSubmitStr:'提交',
}

export default Dialog;


