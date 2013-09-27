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


(function(){
	//horrible shortcut part
	//w: write
	//t: tag write
	//r: require
	//o:Yomadr
	w=function(s){document.write(s);}
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
	var head=r('js/js-yaml.js')+
	r('js/i18n.js')+
	r('c.js');
	if(!B){
		docw(t('script', 'init()'),head);
		//docw('',head);
		}
	B={};
	//docw(t('h1', 'hello')+t('button','','onclick="doShow()"'),head);
}())
