const path=require('path');
const webpack=require('webpack');


module.exports={
	entry:{
		vendor:['react','react-dom','react-router-dom','redux','prop-types','react-redux','redux-saga','classnames','aicomponents'],
	},
	output:{
		path:path.join(__dirname,'dll'),
		filename:'dll.[name].js',
		library:'[name]_library',
	},
	plugins:[
       new webpack.DllPlugin({
       	  name:'[name]_library',
       	  path:path.join(__dirname,'dll','[name]-manifest.json'),
          context:__dirname,
       })
	]
}