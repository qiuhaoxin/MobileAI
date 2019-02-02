const webpack=require('webpack');
const path=require('path');
const HtmlWebpackPlugin=require('html-webpack-plugin');
const paths=require('./paths');
const OpenBrowser=require('open-browser-webpack-plugin');
/*
* postcss
*/
// const autoprefixer=require('autoprefixer');
// const postcssAspectRatioMini=require('postcss-aspect-ratio-mini');
// const postcssPxToViewport=require('postcss-px-to-viewport');
// const postcssWriteSvg=require('postcss-write-svg');
// const postcssCssNext=require('postcss-cssnext');//postcss-cssnext
// const postcssViewportUnits=require('postcss-viewport-units');
// const cssnano=require('cssnano');

module.exports={
  mode:'development',
	entry:[
      paths.appEntry,
  ],
	resolve:{
		extensions:['.js','.jsx','.less','.css','.jsx','.json'],
	},
  devtool:'cleap-module-eval-source-map',
	module:{
		rules:[
           {
           	  // test:/\.(png|jpe?g|gif|svg)$/,
              // exclude:[/node_modules/],
           	  // use:[
              //    {
              //    	loader:'url-loader',
              //    	options:{
              //          limit:8192,
              //          fallback:'file-loader',
              //    	}
              //    }
           	  // ]

              test:/\.(jpe?g|png|svg|gif)/,
              loader:'url-loader',
           },{
           	  test:/\.(js|jsx)$/,
           	  loader:require.resolve('babel-loader'),
           	  include:path.resolve(__dirname,'../src'),
           },{
              test:/\.(css)$/,
              use: [
                    require.resolve('style-loader'),
                    {
                      loader: require.resolve('css-loader'),
                      options: {
                        importLoaders: 1,
                        minimize: true,
                        sourceMap: false,
                        modules: true,
                        localIdentName: '[name]_[local]_[hash:base64:5]'
                      },
                    },
                   {
                       loader:require.resolve('postcss-loader'),
                     },
                  ],
           },{
              test:/\.less$/,
              include:path.resolve(__dirname,'../src'),
              use: [
                    require.resolve('style-loader'),
                    {
                      loader: require.resolve('css-loader'),
                      options: {
                        importLoaders: 1,
                        minimize: true,
                        sourceMap: false,
                        modules: true,
                        localIdentName: '[name]_[local]_[hash:base64:5]'
                      },
                    },
                    {
                       loader:require.resolve('postcss-loader'),
                    },
                    require.resolve('less-loader'),
                  ],
           },{
               test: /\.(eot|woff|svg|ttf|woff2|appcache)(\?|$)/,
               exclude: /^node_modules$/,
               loader: 'file-loader?name=[name].[ext]',
           }
		]
	},
  output:{
    path:path.resolve(__dirname,"../dist"),
    filename:'bundle.js',
    publicPath: "/"
  },
    plugins:[
       new webpack.DefinePlugin({
          REQUESTURL:JSON.stringify('test'),
       }),
       new HtmlWebpackPlugin({
          template:paths.appDevHtml,
          inject:true,
          title:'devServer',
       }),
       new OpenBrowser({url:'http://localhost:3008/?appid=500041792&openId=599cdf7de4b0607257117dc2&uname=许玉赢#/mainpage'}),
       new webpack.NamedModulesPlugin(),
       new webpack.HotModuleReplacementPlugin(),//HotModuleReplacementPlugin
  ]
}