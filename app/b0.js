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
	
	
	constructor(){
		this.baseUrl='';
	}
	
	init(){
		//load page 1	
		//reload because of suicide of document.write
		header = script('js/js-yaml.js');
		//loads yaml as js
		//page('page');
		
	}
	
	_add(to,tag){
		let link=document.createElement(tag);
		return document.getElementsByTagName(to)[0].appendChild(link);

	}
	require(src){
		var me=this;
		return new Promise(function (resolve, reject) {
			
			//this._add('head','script').src=src;
			let tag='script';
			let to='head';
			let link=document.createElement(tag);
			link.src=me.baseUrl+src;
			let head = document.getElementsByTagName(to)[0];
			head.insertBefore(link,head.firstChild);
			link.onload=()=>{
				resolve(true);
			}
		});
	}	
	
	write(s){
		document.write(s);
	}
	addView(s){
		this._add('body','div').innerHTML=s;
	}
	replaceView(s){
		document.getElementsByTagName('body')[0].innerHTML=s;
	}
	
	
	/**
	 * tag tag name
	 * html innerHTML content
	 * attributes the attributes as a string
	 * 
	 * return generic tag as string
	 */
	tag(tag, html, attributes){
		return "<"+tag+(attributes?' '+attributes:'')+">"+(html?html:'')+"</"+tag+">";
	}
	
	/**
	 * return script tag as string
	 */
	script(src){
		//todo switch-case on extension
		return this.tag('script','','src="'+src+'"');
	}
	
	
	/**
	 * write raw html with old style document.write
	 */
	docw(body,head,boot){
		this.w('<!DOCTYPE html>');
		if (!head) head='';
		let t=this.tag;
		var lt= t('html',t('head',t('meta','','charset="utf-8"')+t('script', boot?'init()':'var B={}')+head)+t('body',body),'lang=fr');
		//var lt= t('html',t('head',t('meta','','charset="utf-8"')+t('script', boot?'':'var B={}')+head)+t('body',body+t('script', boot?'init()':'')),'lang=fr');
		console.log (lt);
		this.w(lt);
		if (! boot) document.close();
	}
	
	docAdd(head,body,isboot){
		this.replaceView(body);
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
	 * ajax('url').then(data=>{}).catch(err=>{});
	 * cf. fetch
	 */
	ajax(url,body,method) {
		return new Promise(function (resolve, reject) {
			var xhr = new XMLHttpRequest();
		
			try {
				xhr.open(method||body?'POST':'GET', url);
				//, false pour le mode syncrhone

			} catch (e) {
				this.isCrossOriginRestricted = true;
			}
			xhr.onerror=reject;
			xhr.onload= ()=>{
				status = (xhr.status === 1223) ? 204 :(xhr.status === 0 && (self.location || {}).protocol == 'file:') ? 200 : xhr.status;

				if ((status >= 200 && status < 300) || (status === 304) || (status === ''))
					resolve(xhr.responseText);
				else {
					reject(xhr.status);
				}
			};
			xhr.send(body);
		});
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
					res += this.tag(i,recur,innerAtt.mutable)+'\n';
				}
			}else{
				res += this.js2Html(elem[i]);
			}
		}
		return res
	}
	
	page(url){
	//load page 2
/*
 * 		Promise.all([
			this.require('b1.js'),
			this.require('b2.js'),
			this.require('b3.js'),
			this.require('b4.js'),
			this.require('js/js-yaml.js')
			]).catch(e=>{
				console.log(e);
			})
 * */

/*		this.require('b1.js')
		.then(()=>this.require('b2.js'))
*/
		Promise.all([
			this.require('b1.js'),
			this.require('b2.js'),
			this.require('b3.js'),
			this.require('js/js-yaml.js')
			]).catch(e=>{
				console.log(e);
			}).then(results=>{
			
			//this._add('head','meta').charset="utf-8";

			var header = this.script('js/js-yaml.js')
			+ this.script('b0.js');
			this.ajax(url).then( yml=>{
				try{
					let obj = jsyaml.load(yml);
					this.docAdd(header,this.js2Html(obj));
				}catch (e){
					console.log(e);
				}
			});
		});
	}


}

window.b=new Bjs();
