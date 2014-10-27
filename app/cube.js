/**
light promise implementation inspired from Q.
cube.defer() returns a promise
promise.then(success,error): register success and error callback functions.
promise.resolve(result): call success when all promises chain are resolved
promise.reject(result): call error
promise.notify(): not implmeneted just for Q compatibility purpose.
*/
var cube={
	defer:function(){
		var me= {
			promises: [],
			resolve: function(arg){
				//if arg is promise add promise chain to it
				if (arg.promises){
					arg.promises.push(me);
				}else{
					me.success && me.success(arg);
					me.successData=arg;
					for(var i=0;i<me.promises.length;i++){
						me.promises[i].resolve(arg);
					}
				}
			},
			reject: function(arg){
				//should we reject with a promise?
				me.error && me.error(arg);
				me.errorData=arg;
				for(var i=0;i<me.promises.length;i++){
					me.promises[i].reject(arg);
				}

			},
			notify: function(){}, //not implemented
			promise: {
				then: function(success,error){
					me.success=success;
					me.error=error;
					
					me.successData && me.resolve(successData);
					me.errorData && me.reject(errorData);
				}
			}
		};
		return me;
	}
}

function requestOkText(url, method) {
    var request = new XMLHttpRequest();
    var deferred = Q.defer();

    request.open(method||"GET", url, true);
    request.onload = onload;
    request.onerror = onerror;
    request.onprogress = onprogress;
    request.send();

    function onload() {
        if (request.status === 200) {
            deferred.resolve(request.responseText);
        } else {
            deferred.reject(new Error("Status code was " + request.status));
        }
    }

    function onerror() {
        deferred.reject(new Error("Can't XHR " + JSON.stringify(url)));
    }

    function onprogress(event) {
        deferred.notify(event.loaded / event.total);
    }

    return deferred.promise;
}

cube.test= function(){
	var defered = cube.defer();
	defered.promise.then(function(a){
		alert('success '+a);
		});
	defered.resolve("TEST");

}

var Q=cube;