/**
 b2.js bjs binding layer
 Licence LGPLv3 2015
 * 
 * dataBind
 * pushForm
 * pullForm
 * 
 * Use databind with bval directive

 */

b.extend=function(me,o){
	for(k in o){
		me[k]=o[k];
	}
};
var me=this;
b.extend(b,{
	/**
	 * push to all input of document the attribute by input name
	 * 
	 */ 
	pushForm: function(o){
		for(var key in o){
			var elts = document.getElementsByName(key);
			for(var i=0;i<elts.length;i++){
				elts[i].value=o[key];
			}
		}
	},
	/**
	 * pull to input values of document by input name using parametered object keys.
	 */
	pullForm: function(o){
		for(var key in o){
			var elts = document.getElementsByName(key);
			for(var i=0;i<elts.length;i++){
				o[key]=elts[i].value;
			}
		}
	},
	insertTag: true,
	prettyPrint: true,

	/**
	 * 
	 */
	InputBinding: function InputBinding(scope,key,input){
		
		scope.dwatchers[key]=scope.dwatchers[key]||[];
		this.change=function(){
			var old=scope[key];
			scope[key]=input[0].value;
			scope.dwatchers[k].each(function(elt){
				elt(scope[key],old);
			});
		}
	},
	/**
		databind angular (free) style
		obj: your scope
		elt: your DOM part optional, document is default.
		* 
		* Algo: nChange: updates scope
		* 		$apply: update input
		* 
	*/
	dataBind: function(obj, elt){
		elt=elt||document;
		obj.dwatchers={};
		for( key in obj){
			var input = elt.getElementsByName(key);
			if (input.length){
				input[0].onchange=new d.InputBinding(obj,key,input).change;
			}
		}
		obj.$apply=function(){me.apply(obj,elt)};
		obj.$apply();
		
	},
	
	_processElement: function(elt){
		if(elt.dProcessed) return;
		elt.dattributes={};
		for(var i=0;i< elt.attributes.length;i++){
			elt.dattributes[elt.attributes[i].name]=elt.attributes[i].value;
		}
		elt.dProcessed=true;
	},
	
	apply: function(obj,elt){
		for( key in obj){
			var input = elt.getElementsByName(key);
			for(var i=0;i< input.length;i++){
				me._processElement(input[i]);
				if(input[i].tagName==="BVAL" || util.defined(input[i].dattributes.bval)){
					input[i].innerHTML=obj[key];
				}else{
					input[i].value=obj[key];
				}
			}
		}
	}

}

);//eof extends
}//eof functiond

var util={
	defined:function(obj){
		return obj != undefined;
	},
	each:function(fun){
		for(var i=0;i<this.length;i++){
			fun(this[i]);
		}
	},
	_init:function(){
		Array.prototype.each=util.each;
	}
};
util._init();
