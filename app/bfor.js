/**
 BJS Templating JS Library
 Licence LGPLv3 2015 pdemanget@gmail.com
 * 
 * Just templating, not framework!
 * bfor : enable loop capacity, just hidenon repeated 1st line, clone the others (or hide them when size reduce)
 * todo: 
 *  - webcomponents
 *  - bclass: variables class values
 *  - recursive_names: allow dot in names! (apply with search or scan html for name ?)
 * 
 * 
 * Doc
 *  - apply: scan attributs of object to search  name
 *  - processElement: transpose attributes arrray to map for search.
 * 
 * 
 */
var me=b;
b.extend(b,{
	
	/*
	dataBind: function(obj, elt){
		var me = this;// one day JS will manage a real this
		elt=elt||document;
		obj.dwatchers={};
		for( key in obj){
			var input = elt.getElementsByName(key);
			if (input.length){
				input[0].onchange=new me.InputBinding(obj,key,input).change;
			}
		}
		obj.$apply=function(){me.apply(obj,elt)};
		obj.$apply();
		
	},
	*/
	
	_processElement: function(elt){
		if(elt.dProcessed) return;
		elt.dattributes={};
		for(var i=0;i< elt.attributes.length;i++){
			elt.dattributes[elt.attributes[i].name]=elt.attributes[i].value;
		}
		elt.dProcessed=true;
	},
	_for: function(elt,values){
		if(values.length==0)elt.style="display:none";
	}
	
	scanFor: function(obj,elt){
		for( key in obj){
			var input = elt.getElementsByName(key);
			for(var i=0;i< input.length;i++){
				me._processElement(input[i]);
				if(input[i].tagName==="BFOR" || util.defined(input[i].dattributes.bfor)){
					me._for(input[i],obj[key])
				}
			}
		}
	}

});//eof extends


