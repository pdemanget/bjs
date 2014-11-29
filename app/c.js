/**
 * Program part
 r: requires 
 w: write...
 ts: tag as string
 */

var TEST={toto:"toto"};
var header;

var log=function(msg){
	console.log(msg);
}

function init(){
//load page 1	
	//reload because of suicide of document.write
	header = r('js/js-yaml.js')+
	r('js/i18n.js')+
	r('b.js')+
	r('c.js');
	//loads yaml as js
	//page('page');
	
}

function page(no){
//load page 2
 docw(header,js2Html(I18N.getI18n(no)));
}


/**
 * best compiler ever: from js to html
 * 
 * TODO:
 * keep reference of generated DOM for bjs directives
 * if elem isa directive: call function(js)->js (js to js conversion)
 */
function js2Html(elem, attributes){
	if (typeof (elem) === 'string') return elem;
	var res='';
	for(var i in elem){
		if(isNaN(i)){
			//hack for attributes
			if(attributes){
			    if(i==='text')
					res += js2Html(elem[i]);
				else
					attributes.mutable += i+'="'+elem[i]+'" '
			}else{
				var innerAtt={mutable:''};
				var recur=js2Html(elem[i],innerAtt );
				//var recur=js2Html(elem[i]);
				res += t(i,recur,innerAtt.mutable)+'\n';
			}
		}else{
			res += js2Html(elem[i]);
		}
	}
	return res
}

