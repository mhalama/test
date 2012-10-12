// http://165-3-13-46.tmcz.cz:8086/svc/data?tbl=invoice&id=1
var ImapConnection = require('imap').ImapConnection;
var util = require('util');
var mailparser = require ("mailparser");
var fs = require ("fs");
var box, cmds, next = 0;
var moduleData   = require('./data.js');




var imap = new ImapConnection({
    username: 'faktury.brera@gmail.com',
    password: 'Oaml3eloaml3el',
    host: 'imap.gmail.com',
    port: 993,
    secure: true
  });

function die(err) {
	  console.log('Uh oh: ' + err);
	  process.exit(1);
	}

cb = function(err) {
	  if (err) {
	    die(err);
      }
	  else if (next < cmds.length){
	    cmds[next++].apply(this, Array.prototype.slice.call(arguments).slice(1));
	  }
	  else{
		  next=0;
	  }
	 
	};

	
	
cmds = [
	     function() { imap.connect(cb); },
	     function() { imap.openBox('INBOX', false, cb); },
	     function(result) { box = result; imap.search([ 'UNSEEN'], cb);  },  // here give markSeen :true
	     function(results) {
	    	 if(results.length===0){
	    		  imap.logout(cb);
	    	 }else{
	    	  var fetch = imap.fetch(results, { request: { body:"full", headers: false }, markSeen :true});
	          fetch.on('message', function(msg) {
	        	var messageIdPosition = 0;
	            var ids=new Array();
	            var parser = new mailparser.MailParser({
	            		streamAttachments: true
	            });
	            
	            parser.on("headers", function(headers){
	            	console.log(headers.subject);
	            	ids.push(headers.subject);
	            	
	                //console.log(headers.received);
	            });
	            
	            parser.on("attachment", function(attachment){
	            	var filetype=attachment.generatedFileName.substring(attachment.generatedFileName.length-4 ).toLowerCase();
	            	 console.log("filetype : "+filetype);
	            	if(filetype===".pdf" || filetype===".png" || filetype===".jpg" || filetype==="jpeg"){
	       
		            	console.log("Writing!!!" );
		            	filePath = "./public/invoices/"  +ids[messageIdPosition]+ "_"+attachment.generatedFileName;
		                var output = fs.createWriteStream(filePath);
		                var filesrc = "/invoices/"  +ids[messageIdPosition]+ "_"+attachment.generatedFileName;
		                messageIdPosition++;
		                attachment.stream.pipe(output);
		                createInvoice(filesrc);
	            	}
	                
	                
	            });
		            
	            parser.on("end", function(){
			        console.log("Writing completed" );
			            
			    });
	            
				               
			       msg.on('data', function(chunk) {
			    	   parser.write(chunk.toString());
			       });
			            
			       msg.on('end', function() {
			         parser.end;
			         //console.log('Finished message: ' + util.inspect(msg, false, 5));
			       });
	          });
	          fetch.on('end', function() {
	            console.log('Done fetching all messages!');
	            imap.logout(cb);
	          });
	    	 }
	        }
	      ];

 setInterval(cb,20000);
 

 
 
 

//cb();
 
 var eventDateFormat = function(dateString){
		var d = new Date(dateString);
		var day = d.getUTCDate().toString();
		var month = (d.getUTCMonth()+1).toString();
		var hours =  (d.getHours()-1).toString();
		var minutes = d.getMinutes().toString();
		
		

			

		if (minutes < 10){
			minutes = "0" + minutes;
		}
		if(day <10){
			day = "0"+day;
		}
		if(month <10){
			month = "0"+month;
		}
		if(hours < 10){
			hours = "0" + hours;
		}
		
		return  day + '/' + month + " " + hours + ":"+ minutes;
		
};

var createInvoice = function(inoiceLink){

	 var sql = "Select create_invoice($1,$2)";
	 var time = eventDateFormat(new Date());
	 
	 var text = 'V čase ' + time + ' vytvořena nová faktura';
	 console.log(text);
	 db.query(sql, [inoiceLink,text], function(err,rs) {
	        if (err) {
	        	console.log("Invoice saving failed");
	            console.log(err);
	         
	        } else {
	        	 moduleData.getlastEvents();
	        	 console.log("Invoice succesfully written into database");
	           
	        }
	    });
	 
};




