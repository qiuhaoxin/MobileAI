import {uploadLog}  from '../services/api';
/*
* 判断字符串是否为空
* @Param str 目标字符串
*/
export const isEmpty=(str)=>{
  const emptyReg=/^\s*$/;
  if(emptyReg.test(str)){
    return true;
  }
  return false;
}

/*
* 获取数组中的最大主键值 并+1
* @Param list 对象数组
* @Param columnName 主键key 如:id
*/
export const FilterMaxId=(list,columnName)=>{
    const temp=list && list[list.length-1];
    if(temp==undefined)return 1;
    if(columnName in temp)
      return parseInt(temp[columnName])+1;
    return 1;
}

/*
* localStorage 存储 
* @param key 
* @param value
*/
export const saveInLocalStorage=(key,value)=>{
   if(window.sessionStorage){
      //window.localStorage.setItem(key,JSON.stringify(value));
      window.sessionStorage.setItem(key,JSON.stringify(value));
   }else{
   	 alert("浏览器不支持localStorage存储!");
   }
}
/*
* 删除 localStorage 内容
* @Param key
*/
export const delInLocalStorage=(key)=>{
   if(window.sessionStorage){
     window.sessionStorage.removeItem(key);
   }
}

/*
* 获取localStorage的
* @Param key
*/
export const getInLocalStorage=(key)=>{
	let result="";
	if(window.sessionStorage){
        result=window.sessionStorage.getItem(key);
        try{
          result=JSON.parse(result);
        }catch(e){
          result=result;
        }
	}
	return result;
}


export const getValueFromUrl=(search,keys)=>{
    const isSearch=/\#|\:/.test(search) ? false :true;
    let result={},keyValueMappings=[];
    if(isSearch){
      //location.search  ?appid=500045674&openId=5ad04e76e4b05c4b7d6245ba&uname=邱浩新
      search=search.substring(1);
     // console.log("search is "+search);
      keyValueMappings=search && search.split('&');
      //console.log("keyValueMappings is "+keyValueMappings);
    }else{
      //location.href
      let index=search.indexOf('?');
      search=search.substring(index+1);
      index=search.indexOf('#');
      search=index > -1 ? search.split('#')[0] : search;
      keyValueMappings=search && search.split('&'); 
    }
    if(typeof keys=='string' || typeof keys=='number'){
        keys=Array(keys);
    }

    keys.forEach(key=>{
        const res=keyValueMappings.filter(keyValueMapping=>{
            const keyValue=keyValueMapping.split('=');
            return keyValue[0]==key;
        })[0];
        if(res) result[key]=res.split('=')[1];
    })
    return result;
}

//上传报错
export const uploadError=async (params)=>{
    const response=await uploadLog(params);
}

//过滤特殊字符
export const trimSpecial=(text)=>{
    if(isEmpty(test))return;
    text=text.replace(/[\ |\~|\，|\。|\`|\!|\！|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?|\？]/g,""); 
    return text;
}


