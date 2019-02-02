import React,{Component} from 'react';
import PropTypes from 'prop-types';
import Styles from './index.less';

import Taxifee from '../../images/Taxifee.png';
import Waterfee from '../../images/waterfee.png';
import otherfee from '../../images/otherfee.png';
import Marketfees from '../../images/Marketfees.png';
import Callsfee from '../../images/Callsfee.png';

const images={Taxifee:Taxifee,Callsfee:Callsfee,Marketfees:Marketfees,Waterfee:Waterfee,otherfee:otherfee};
class LinkSelect extends Component{
	constructor(props){
		super(props);
	}
	componentDidMount(){
        
	}
	handleItemClick=()=>{

	}
	renderSelectList=()=>{
       const {data}=this.props;
       const selectList=data.map((item,index)=>{
       	  console.log("");
          return <li key={item.id ? item.id : index}>
              <div className={Styles.img}>
                  <img src={require(`../../images/${item.img}`)} />
              </div>
              <div className={Styles.content}>
                  {item.name}
              </div>
              <div className={Styles.rightArrow}></div>
          </li>
       })
       return (
          <ul className={Styles.list}>
             {selectList}
          </ul>
       )
	}
	render(){
		return (
            <div className={Styles.linkselectWrapper}>
                {this.renderSelectList()}
            </div>
		)
	}

}
LinkSelect.defaultProps={
    data:[],

}
LinkSelect.propTypes={
    data:PropTypes.array.isRequired,
}



export default LinkSelect;