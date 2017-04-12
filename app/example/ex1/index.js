b.require('//cdn.jsdelivr.net/pouchdb/6.1.2/pouchdb.min.js');
class Index{
	push() {
		console.log("push");
		
		var elt = {name:"",comment:""};
		b.pullForm(elt);
		b.ajax('http://localhost:5984/test',JSON.stringify( elt),'POST',true);
		
	}
	list() {
		console.log("push");
		
		var query = {
//			"selector": {
//				"year": {"$gt": 2010}
//			},
			"fields": ["_id", "_rev", "name", "comment"],
			"sort": [{"name": "asc"}],
			"limit": 4,
			"skip": 0
			};
		b.ajax('http://localhost:5984/test/_find',JSON.stringify( query),'POST',true);
		
	}
	list2() {
		var db = new PouchDB('test');
		db.put({
		  _id: 'dave@gmail.com',
		  name: 'David',
		  age: 69
		});
		db.get('dave@gmail.com').then(console.log);
		db.replicate.to('http://localhost:5984/test');
		db.replicate.from('http://localhost:5984/test');
	}
}
b.baseUrl='../../';
window.index=new Index();
b.page('index.yaml');
