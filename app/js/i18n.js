
var I18N={
    lang:"fr",
    DEFAULT_LANG:'fr',
    
	i18n:{},
	/**
	 * Lazy load des traductions.
	 */
	getI18n:function(basepath){
		var res;
		if(res=this.arrayCaller(this.getI18n,basepath)) return res;
		if(this.i18n[basepath]) return this.i18n[basepath];
		this.i18n[basepath]=this.loadI18n(basepath);
		return this.i18n[basepath];
		// return {};
	},
	/**
	 * charge depuis le controller
	 */
	loadI18n:function(basepath){
		 var map;
		try{
			map = YAML.load('i18n/'+basepath+"_"+this.lang+".yaml");
		} catch(e){
			if(debug )console.log("ERROR:"+e.message+" "+e.parsedFile+e.parsedLine);
		}
		 this.setChild(I18N,basepath,map);
		 return map;
	},
	/**
	 * affecte une valeur à la feuille de l'arbre dans toute l'arborescence des traductions.
	 */
	setChild:function(Z,key,value){
		var keys=key.split('/');
		var z = Z;
		for  (var k=0;k<keys.length-1;k++) {
			if(! z[keys[k]]) z[keys[k]] = {};
			z = z[keys[k]];
		}
		z[keys[keys.length-1]]=value;
		return z;
	},
	arrayCaller:function(callback, paramList){
		 if(Array.isArray(paramList) ){
			 var i=0;
			 var res=[];
			 for(var i=0;i<paramList.length;i++){
				 res[i]=callback(paramList[i]);
			 }
			 return res;
		 }
		 return null;
	},
	error:function(msg){
		console.log('ERROR:'+msg);
	},
	insertIntoItems_old:function(items, fields, into){
		var res=false;
		if(_.isFunction(items)) return res;//patch
		for(var item in items){
			var value=items[item];
			if(value === items) return res; //anti recursion
			if(value){
				if(fields.indexOf(item)>=0){
					items[item]=this.getItem(value);
					res=true;
				}else{
					if(into.indexOf(item)>=0 || Array.isArray(items)){
						res=res || this.insertIntoItems(value,fields, into);
					}
				}
			}
		}
	},
	insertIntoItems:function(items, fields, intos){
		var res=false;
		if(_.isFunction(items)) return res;//patch
		for(var field in fields){
			var item=fields[field];
			var value=items[item];
			if(value ){
				trace('i18n ',item,'='+value);
				items[item]=this.getItem(value);
				res=false;
			}
		}
		for(var into in intos){
			var value=items[intos[into]];
			if(value ){
				trace('i18n into ',intos[into],'=',value);
				res=this.insertIntoItems(value,fields, intos) || res;
			}
		}
		if ( Array.isArray(items) ){
			trace('i18n array ');
			for (i in items){
				res= this.insertIntoItems(items[i],fields, intos) || res;
			}
		}
		return res;

	},
	getItem:function(value){
		
		try{
			if ( value.lastIndexOf('I18N.', 0) === 0 )
				var rslt= eval(value);
			if(rslt) return rslt;//trap if undefined
		}catch(e){
		}
		return value
	}
};

/**
 * redirection pour changer l'implem du parser YAML
 */
var YAML={
	load:function(s){
		var c= loadFile(s);
		return jsyaml.load(c);	
	}
}

loadFile= function(url) {
	if (typeof XMLHttpRequest != 'undefined') {
		xhr = new XMLHttpRequest();
	} else {
		xhr = new ActiveXObject('Microsoft.XMLHTTP');//IE6?
	}

	try {
		xhr.open('GET', url, false);
		xhr.send(null);
	} catch (e) {
		isCrossOriginRestricted = true;
	}

	status = (xhr.status === 1223) ? 204 :(xhr.status === 0 && (self.location || {}).protocol == 'file:') ? 200 : xhr.status;

	if ((status >= 200 && status < 300) || (status === 304) || (status === ''))
		return xhr.responseText;
	return null;
};
var _={};
_.isFunction = function(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};
