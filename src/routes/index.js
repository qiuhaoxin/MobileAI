import React,{Component} from 'react';
import {HashRouter,Route,Switch,Redirect} from 'react-router-dom';

import MainPage from '../pages/MainPage';
import Feedback from '../pages/FeedBack';

class Router extends Component{
	constructor(props){
		super(props);
	}
	render(){
		return (
	        <HashRouter>
	            <Switch>
	                <Route path="/mainpage" component={MainPage} />
					<Route path="/feedback" component={Feedback}/>
	                <Redirect to="/mainpage"/>
	            </Switch>
	        </HashRouter>
		)
	}
}
export default Router;
/*
*appid/:uname/:openId
*/