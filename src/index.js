import '@babel/polyfill';
import React,{Component} from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import Router from './routes';
// import reducers  from './reducers';
import rootSaga from './saga';
import configStore from './configStore';
const store=configStore();
store.runSaga(rootSaga);

function render(MyCompnent){
	return ReactDOM.render(
        <Provider store={store}>
           <Router />
        </Provider>,
		document.getElementById('root')
	)
}
render(Router);

if(module.hot){
	module.hot.accept(()=>{
		render('./routes');
	})
}