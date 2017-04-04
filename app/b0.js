var w,t,r,tw,rw,docw,B;
/*
HTML standard writing
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">

DOC:
bootstrap phase:
	- lance le 'r':Require des autres script (yamljs, y18 et c)
	- lance "init()"" (contenu dans c.js)
File contains:
	b.js: tag writting, doc writting
	c.js: json to html conversion
	
*/

class Bjs{
	//var isCrossOriginRestricted;
	
	init(){
		//load page 1	
		//reload because of suicide of document.write
		header = r('js/js-yaml.js');
		//loads yaml as js
		//page('page');
		
	}
	require(src){
		let link=document.createElement('script');
		link.src=src;

		document.getElementsByTagName('head')[0].appendChild(link);
	}
	
	w(s){document.write(s);}
	t(tag, text, p){return "<"+tag+(p?' '+p:'')+">"+(text?text:'')+"</"+tag+">";	}
	r(src){
		//todo switch-case on extension
		return t('script','','src="'+src+'"');
	}
	
	rw(src){
		w(r(src));
	}
	tw(tag, text, p){w(t(tag,text,p))}
	docw(body,head,boot){
		w('<!DOCTYPE html>');
		if (!head) head='';
		var lt= t('html',t('head',t('meta','','charset="utf-8"')+t('script', boot?'init()':'var B={}')+head)+t('body',body),'lang=fr');
		//var lt= t('html',t('head',t('meta','','charset="utf-8"')+t('script', boot?'':'var B={}')+head)+t('body',body+t('script', boot?'init()':'')),'lang=fr');
		console.log (lt);
		this.w(lt);
		if (! boot) document.close();
	}

	
	
	loadFile(url) {
		var xhr = new XMLHttpRequest();
	
		try {
			xhr.open('GET', url, false);
			xhr.send(null);
		} catch (e) {
			this.isCrossOriginRestricted = true;
		}

		status = (xhr.status === 1223) ? 204 :(xhr.status === 0 && (self.location || {}).protocol == 'file:') ? 200 : xhr.status;

		if ((status >= 200 && status < 300) || (status === 304) || (status === ''))
			return xhr.responseText;
		return null;
	}
	



	/**
	 * best compiler ever: from js to html
	 * 
	 * TODO:
	 * keep reference of generated DOM for bjs directives
	 * if elem isa directive: call function(js)->js (js to js conversion)
	 */
	js2Html(elem, attributes){
		if (typeof (elem) === 'string') return elem;
		var res='';
		for(var i in elem){
			if(isNaN(i)){
				//hack for attributes
				if(attributes){
					if(i==='text')
						res += this.js2Html(elem[i]);
					else
						attributes.mutable += i+'="'+elem[i]+'" '
				}else{
					var innerAtt={mutable:''};
					var recur=this.js2Html(elem[i],innerAtt );
					//var recur=js2Html(elem[i]);
					res += t(i,recur,innerAtt.mutable)+'\n';
				}
			}else{
				res += this.js2Html(elem[i]);
			}
		}
		return res
	}
	
	page(no){
	//load page 2
		this.require('js/js-yaml.js');
		var header = r('js/js-yaml.js');
		let yml = this.loadFile('i18n/'+no+'_fr.yaml');
		let me = this;
		setTimeout(()=>{
			let obj = jsyaml.load(yml);
			this.docw(header,this.js2Html(obj));
		});
	
	}


}

var b=new Bjs();

(function(){
	//horrible shortcut part
	//w: write
	//t: tag write
	//r: require
	//o:Yomadr
	w=function(s){}
	t=function(tag, text, p){return "<"+tag+(p?' '+p:'')+">"+(text?text:'')+"</"+tag+">";	}
	r=function(src){
		//todo switch-case on extension
		return t('script','','src="'+src+'"');
	}
	
	rw=function(src){
		w(r(src));
	}
	tw=function(tag, text, p){w(t(tag,text,p))	}
	docw=function(body,head,boot){
		w('<!DOCTYPE html>');
		if (!head) head='';
		var lt= t('html',t('head',t('meta','','charset="utf-8"')+t('script', boot?'init()':'var B={}')+head)+t('body',body),'lang=fr');
		//var lt= t('html',t('head',t('meta','','charset="utf-8"')+t('script', boot?'':'var B={}')+head)+t('body',body+t('script', boot?'init()':'')),'lang=fr');
		console.log (lt);
		w(lt);
		if (! boot) document.close();
	}
	//bootstrap part
	
	//t('button','','onclick="doShow()"');
	//t('html',t('head')+t('body', t('h1', 'hello') ));
	
	
	//var head=r('js/js-yaml.js')+
	//r('js/i18n.js')+
	//r('c.js');
	//if(!B){
	//	docw(t('script', 'init()'),head);
		//docw('',head);
		//}
	//B={};
	//docw(t('h1', 'hello')+t('button','','onclick="doShow()"'),head);
}())