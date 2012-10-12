// http://165-3-13-46.tmcz.cz:8086/svc/data?tbl=invoice&id=1
var ImapConnection = require('imap').ImapConnection;
var util = require('util');
var objects = require('./hashMap.js');



var lastEvents = [];

function getInvoiceTypeCode(invoiceType){
	console.log("given invoice Type parameter is: " + invoiceType);
	switch(invoiceType){
		case "New":
			return 'N';
			break;
		case "Open":
			return 'O';
			break; 
		case "Approved":
			return 'A';
			break;
		case "Rejected":
			return 'R';
			break;
		case "Closed":
			return 'C';
			break;
	}
}

app.get('/svc/invoice/load', function(req, res) {
    res.contentType('json');
    var invoiceType = getInvoiceTypeCode(req.query.type);
    console.log(invoiceType);
    if(req.query.user!=="undefined"){
    	
    	 var sql = "select invoice.nr, invoice.total_amount, "+ 
        "invoice.creation_date, invoice.taxable_date, invoice.creation_date, " + 
        "invoice.due_date,states.name as statusName,event.note, operator.fullname, invoice.id, invoice.responsible,invoice.filesrc,invoice.status "+
   		"from invoice left join event On invoice.id = event.invoice " +
  		"left join operator on invoice.responsible = operator.id  " +
  		"left join states on invoice.status = states.code " +
  		"where invoice.status=$1 and invoice.responsible=$2 "+
   		"and (event.id=(select max(id) from event e where e.invoice=invoice.id " +
  		"and (e.event_code='Asign' or e.event_code='Change' or e.event_code='Create_invoice' or e.event_code is NULL)) or event.id is null)";
    	console.log(sql + " " + req.query.user );
    	
    	db.query(sql, [invoiceType,req.query.user], function(err,rs) {
			if (err) {
			    console.log(err);
			    res.json({success: false});
			} else {
			    res.json({success: true, data:rs.rows});
			}
		});
    	
    }else{
         var sql = "select invoice.nr, invoice.total_amount, "+ 
        "invoice.creation_date, invoice.taxable_date, invoice.creation_date, " + 
        "invoice.due_date,states.name as statusName,event.note, operator.fullname, invoice.id, invoice.responsible,invoice.filesrc,invoice.status "+
  		"from invoice left join event On invoice.id = event.invoice " +
  		"left join operator on invoice.responsible = operator.id  " +
  		"left join states on invoice.status = states.code " +
  		"where invoice.status=$1 "+
  		"and (event.id=(select max(id) from event e where e.invoice=invoice.id " +
  		"and (e.event_code='Asign' or e.event_code='Change' or e.event_code='Create_invoice' or e.event_code is NULL)) or event.id is null)";
     	console.log(sql);
         
         
		db.query(sql, [invoiceType], function(err,rs) {
			if (err) {
			    console.log(err);
			    res.json({success: false});
			} else {
			    res.json({success: true, data:rs.rows});
			}
		});
    }
    


});

app.get('/svc/invoice/getAllInvoices', function(req, res) {
    res.contentType('json');
    
    sql = "Select creation_date, id, nr from invoice";
    
    db.query(sql, [], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
            res.json({success: true, data:rs.rows});
        }
    });

});


//dodělat
app.get('/svc/invoice/getCustomers', function(req, res) {
    res.contentType('json');
    if(req.query.filter){
    
    }
    else{
    
    	    var sql =  "select * from customer";

    	    db.query(sql, [], function(err,rs) {
    	        if (err) {
    	            console.log(err);
    	            res.json({success: false});
    	        } else {
    	            res.json({success: true, data:rs.rows});
    	        }
    	    });
    }
 
});



app.post('/svc/invoice/save', function(req, res) {
    
	
    var q = prepareUpdate(req.body.table,req.body.data);
    console.log("sql query:"+q.sql);
    db.query(q.sql, q.params, function(err,rs) {
        if (err){
            console.log(err);
            res.json({success: false});
        }
        else {
      
            if(q.note){
            	db.query("select create_event($1,$2,$3,$4)",[req.body.data.id,'Change',q.note,req.body.responsible],function(err,rs) {
            		if (err){
                        console.log(err);
                    }
                    else {
                    	console.log("Creating event Change success");
                    	var lastEventId = rs.rows[0].create_event;
                        generateEventText(lastEventId);
                      
                       
                    }
            	});
            }
           // sendData(transformEvents(lastEvents));
      
            invoiceAmountCheck(req.body.data.id,req.body.responsible,res);
            
        }
        getlastEvents();
    });

  
});

app.post('/svc/invoice/addProject', function(req, res) {
	var projectName=req.body.projectName;
	
	var customerID=req.body.customer;
	var budget = req.body.budget;
	console.log(projectName);
    var sql = "Insert into project (name,customer_id,budget) values ($1,$2,$3)";
   
    db.query(sql, [projectName,customerID,budget], function(err,rs) {
        if (err){
            console.log(err);
            res.json({success: false});
        }
        else {
        	getlastEvents();
            res.json({success: true});
        }
    });

});

app.post('/svc/invoice/addCustomer', function(req, res) {
	var customerName=req.body.customerName;
	console.log("customer name is : "+customerName);
    var sql1 = "Select name from customer where name = $1";
    var sql2 = "Insert into customer (name) values ($1)";
    db.query(sql1, [customerName], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
            if(rs.rows.length>0 || customerName==="" ){
            	
            	console.log("customer already there or name is empty");
            }else{
            	db.query(sql2, [customerName], function(err,rs) {
            	  if (err) {
            	      console.log(err);
            	      res.json({success: false});
            	  } else {
            		 getlastEvents();
            		 res.json({success: true}); 
            	     console.log("added new customer");
            	}
            });
        }
       };
    });
});


app.post('/svc/invoice/asignInvoice', function(req, res) {
    res.contentType('json');
    var note;
    if(!req.body.note){
    	note='Nová faktura';
    }
    else{
    	note=req.body.note;
    }
  
    db.query("select asign_to_user($1,$2,$3,$4)",[req.body.userID,req.body.invoiceID,note,req.body.responsible], function(err,rs) {
    	if (err){
            console.log(err);
            res.json({success: false});
        }
        else {
        	var lastEventId = rs.rows[0].asign_to_user;
        	generateEventText(lastEventId);
        	getlastEvents();
            res.json({success: true});
            
       }
    });
});


app.get('/svc/invoice/getIvoiceItems', function(req, res) {
    res.contentType('json');
    var sql = "select * from invoice_item where invoice=$1";

    db.query(sql, [req.query.id], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {

            res.json({success: true, data:rs.rows});
        }
    });
});


//dodělat
app.get('/svc/invoice/getUsers', function(req, res) {
    res.contentType('json');
    if(!req.query.filter){
    	
    	 var sql = "select id,fullname,role_code from operator" ;
    	 db.query(sql, [], function(err,rs) {
 	        if (err) {
 	            console.log(err);
 	            res.json({success: false});
 	        } else {
 	
 	            res.json({success: true, data:rs.rows});
 	        }
 	    });
    	
    }
    else{
    	
    	console.log(req.query.filter);
	    var sql = "select id,fullname,role_code from operator";
	
	    db.query(sql, [req.query.filter], function(err,rs) {
	        if (err) {
	            console.log(err);
	            res.json({success: false});
	        } else {
	
	            res.json({success: true, data:rs.rows});
	        }
	    });
    	
    };
    	
});


app.post('/svc/invoice/rejectInvoice', function(req, res) {
	res.contentType('json');
	if(req.body.item){ 
		 var sql = "select reject_invoice($1,$2)";
		 
    	 db.query(sql, [req.body.item.id,req.body.responsible], function(err,rs) {
 	        if (err) {
 	            console.log(err);
 	            res.json({success: false});
 	        } else {
 	        	var lastEventId = rs.rows[0].reject_invoice;
 	        	generateEventText(lastEventId);
 	            res.json({success: true});
 	        }
 	    });
	}
	
});


app.post('/svc/invoice/closeInvoice', function(req, res) {
	var invoiceId = req.body.invoiceId;
	var responsible = req.body.responsible;
	
	var sql = "select close_invoice($1,$2)" ;
	 db.query(sql, [invoiceId,responsible], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	var lastEventId = rs.rows[0].close_invoice;
	        generateEventText(lastEventId);
            res.json({success: true});
        }
    });
	
});



app.get('/svc/invoice/getProjects', function(req, res) {
	console.log(typeof(req.query.filter));
    res.contentType('json');
    if(!req.query.filter){
    	
    	 var sql = "select * from project" ;
    	 db.query(sql, [], function(err,rs) {
 	        if (err) {
 	            console.log(err);
 	            res.json({success: false});
 	        } else {
 	
 	            res.json({success: true, data:rs.rows});
 	        }
 	    });
    	
    	
    }

    else{
    	
        console.log("projekt filter je: " +req.query.filter);
	    var sql = "select * from project";
	
	    db.query(sql, [req.query.filter], function(err,rs) {
	        if (err) {
	            console.log(err);
	            res.json({success: false});
	        } else {
	
	            res.json({success: true, data:rs.rows});
	        }
	    });
    };
});



app.get('/svc/invoice/getTableColumnsNames', function(req, res) {
    res.contentType('json');

    	
var sql = "select column_name from information_schema.columns " +
		  "where table_name = $1;" ;
	db.query(sql, [req.query.tableName], function(err,rs) {
	    if (err) {
	        console.log(err);
	        res.json({success: false});
	    } else {
	        res.json({success: true, data:rs.rows});
	    }
	});

});


var prepareUpdate = function(table,data) {
    var sql = "update " + table + " set ";
    var delim = "";
    var params = [];
    var ix=1;
    var note=null;
 
    for (var c in data) {
        console.log(c +": " + data[c]);
        if (c==="id") {
            continue;
        }
        if (c==="responsible") {
            continue;
        }
        if(c==="note"){
        	note = data[c];
        	continue;
        }
        if(c==="fullname"){
        	continue;
        }
        if(c==="statusname"){
        	continue;
        }
       
        var val = data[c];
        if (val !== null) {
            sql+=delim + c + "=$" + ix++;
            delim =",";
            params.push(val);
        };
    }
    sql+=" where id=$" + ix++;
    params.push(data.id);
    return {
    	note : note,
        sql : sql,
        params : params
    };
};


app.post('/svc/invoice/saveCreatedItem', function(req, res) {
	var item=req.body.item;
	console.log("new invoiceItem: "+item);
	
	
    var sql1 = "Select create_invoice_item($1,$2,$3,$4,$5,$6,$7)";
    db.query(sql1, [item.invoice,item.amount,item.item,item.project,item.status,
                    item.note,req.body.responsible], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	 var lastEventId = rs.rows[0].create_invoice_item;
	         generateEventText(lastEventId);
        	 getlastEvents();
        	 invoiceAmountCheck(item.invoice,req.body.responsible,res);
       };
    });
});


app.get('/svc/invoice/getInvoiceItems', function(req, res) {
	var invoiceId=req.query.invoiceId;
	var status = getInvoiceTypeCode(req.query.status);
	
	
    var sql = "select amount, invoice_item.item,project.name, states.name as statusName, customer.name as customer, note, invoice_item.invoice, project, event_code,responsible,event_date,invoice_item.id, invoice_item.status "+
    "from invoice_item left join event On invoice_item.invoice = event.invoice join project on project.id = invoice_item.project join customer on customer.id = project.customer_id  " +
    "left join states on invoice_item.status = states.code " +
    "where event.id = " +
    "(Select max(e.id) from event e left join invoice_item i on i.id = e.item " +
    "where e.invoice=$1 and e.item = invoice_item.id and (e.event_code != 'Asign' or e.event_code != 'Reject_invoice' or e.event_code = 'Create_invoice'))";
    console.log(sql + " : " + invoiceId +"," +status);
    db.query(sql, [invoiceId], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	 res.json({success: true, data:rs.rows});
       };
    });
});




app.post('/svc/invoice/saveEditedItem', function(req, res) {

	var item=req.body.item;
	var sql = "select edit_invoice_item($1,$2,$3,$4,$5,$6,$7,$8)";
	db.query(sql, [item.invoice,item.id,item.amount,item.item,item.project,item.status,
                   item.note,req.body.responsible], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	 var lastEventId = rs.rows[0].edit_invoice_item;
	         generateEventText(lastEventId);
        	 getlastEvents();
        	 invoiceAmountCheck(item.invoice,req.body.responsible,res);
       };
    });
	
});


app.post('/svc/invoice/rejectItem', function(req, res) {
	var item=req.body.item;
	
	var sql = "select reject_invoice_item($1,$2,$3)";
	db.query(sql, [item.invoice,item.id,req.body.responsible], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	 var lastEventId = rs.rows[0].reject_invoice_item;
	         generateEventText(lastEventId);
        	 getlastEvents();
        	 invoiceAmountCheck(item.invoice,req.body.responsible,res);
       };
    });
	
});

app.post('/svc/invoice/approveItem', function(req, res) {
	var item=req.body.item;
	
	var sql = "select approve_invoice_item($1,$2,$3)";
	db.query(sql, [item.invoice,item.id,req.body.responsible], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	 var lastEventId = rs.rows[0].approve_invoice_item;
	         generateEventText(lastEventId);
        	 getlastEvents();
          	 invoiceAmountCheck(item.invoice,req.body.responsible,res);
 
       };
    });
	
});

app.post('/svc/invoice/approveInvoice', function(req, res) {
	var item=req.body.item;
	
	var sql = "select approve_invoice($1,$2)";
	db.query(sql, [item.id,req.body.responsible], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	 var lastEventId = rs.rows[0].approve_invoice;
	         generateEventText(lastEventId);
        	 getlastEvents();
        	 res.json({success: true});
       };
    });
	
});






app.post('/svc/invoice/filterInvoices', function(req, res) {
	var filters = req.body.data;
	q=prepareFilterQuery(filters);
	
	db.query(q.sql, q.params, function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	 res.json({success: true, data:rs.rows});
       };
    });
	
});

app.post('/svc/invoice/saveEditedPrject', function(req, res) {
	
	var project = req.body.id;
	var budget = req.body.budget;
	
	var sql = "update project set budget =$1 where id = $2";
	
	db.query(sql, [budget,project], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	 res.json({success: true});
       };
    });
});


app.post('/svc/invoice/getcalculations', function(req, res) {
	var customer=null;
	var project = null;
	var user = null;
	res.contentType('json');
	if(typeof req.body.customer !=='undefined'){
		customer=req.body.customer;
	}
	if(typeof req.body.project !=='undefined'){
		project = req.body.project;
	}
	if(typeof req.body.user !=='undefined'){
		user =req.body.user;
	}
	
	var from = req.body.from;
	var until = req.body.until;
	var invoiceType = getInvoiceTypeCode(req.body.invoiceType);
	
	var param = null;
	var totalSum=0;
	
	var sqlTotal ="Select sum(amount) from invoice_item left join project on project = project.id " +  
				  "left join customer on customer_id = customer.id join invoice on invoice.id = invoice where invoice.status =$2 and creation_date >= $3  and creation_date <= $4   ";
	
    
	
	var sql ="Select total_amount as total, item, amount, customer.name as customer, project.name as project,project.id, budget " +
			"from invoice_item left join project on project = project.id " +
			"left join customer on customer_id = customer.id join invoice on invoice.id = invoice where invoice.status =$2 and creation_date >= $3  and creation_date <= $4  "; 
	
	
  
    
    if(customer!=null){
    	sql += "and customer.id =$1 GROUP BY invoice_item.item, invoice_item.amount,customer.name, project.name, project.id, invoice_item.status,invoice.status,invoice.total_amount,budget order by project.name";
    	sqlTotal += "and customer.id =$1";
    	param=customer;
    }
    else if(project!=null){
    
    	sql += "and project.id =$1";
    	sqlTotal +=  "and project.id =$1";
    	param = project;
    }
    else if(user!=null){
    	sql += "and responsible =$1";
    	sqlTotal += "and responsible =$1";
    	param = user;
    }
    
    console.log(sql);
    console.log(sqlTotal);
    console.log("params " + param + ", " + invoiceType + ", "+ from + "," + until);
    db.query(sqlTotal, [param,invoiceType,from,until], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	totalSum = rs.rows;
        }
    });
    

    db.query(sql, [param,invoiceType,from, until], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	
        	var projects = new Map();
        	var projectSum = new Map();
        	for ( var int = 0; int < rs.rows.length; int++) {
        		var data =rs.rows[int];
        		if(projects.findIt(data.project)==-1){
        			var field = [data];
        			projectSum.put(data.project,field.amount);
        			projects.put(data.project,{data:field,visible:0});
        			
        		}else{
        			var field = projects.get(data.project);
        			var fieldAmount = projectSum.get(data.project);
        			fieldAmount =+ data.amount;
        			field.data.push(data);
        			
        			projects.put(data.project,field);
        			projectSum.put(data.project,{data:fieldAmount,visible:0});
        		}
        		
			}
        	
        	
        	res.json({totalSum:totalSum,dataProjectsSum:projectSum,dataProjects:projects});
       };
    });
});


app.post('/svc/invoice/getFilteredEvents', function(req, res) {
	var invoiceId=null;
	var project = null;
	var user = null;
	
	var from = req.body.from;
	var until = req.body.until;
	
	if(typeof req.body.invoiceId !=='undefined'){
		invoiceId = req.body.invoiceId;
	}
	
	if(typeof req.body.project !=='undefined'){
		project = req.body.project;
	}
	
	if(typeof req.body.user !=='undefined'){
		user = req.body.user;
	}
	
    var sql = "Select event_text from event "+
			  "left join invoice on invoice.id = event.invoice " +
			  "left join invoice_item on invoice_item.id = event.item " +
			  "left join operator on operator.id = event.responsible  ";
    
   
    if(invoiceId!=null){
    	sql += "where invoice.id =$1 and event.event_date >= $2 and event.event_date <= $3  order by event_date";
    	param=invoiceId;
    }
    else if(project!=null){
    	sql += "left join project on project.id = invoice_item.project where invoice_item.project =$1 and event.event_date >= $2 and event.event_date <= $3 order by event_date";
    	param = project;
    }
    else if(user!=null){
    	sql += "where operator.id =$1 and event.event_date >= $2 and event.event_date <= $3 order by event_date";
    	param = user;
    }

    console.log(sql);
    db.query(sql, [param,from,until], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	var data = [];
        	for(var i = 0 ; i < rs.rows.length; i ++){
        		data.push(rs.rows[i].event_text);
        	}
        	 res.json({success: true, data:data});
        	//transformEvents(rs.rows,res);
       };
    });
});

var transformEvents = function(data,res){
	var transformedData=[];
	for (var i=0; i < data.length; i++){
		currentEvent = data[i];
		if(currentEvent.event_code === "Create_item"){
			var event = "Uživatel " + currentEvent.fullname + " vytvořil v čase " + eventDateFormat(currentEvent.event_date) +  " položku " + "'" + currentEvent.item + "'"+" faktury číslo " + currentEvent.nr +". " +
			"Položka má komentář " + "'" +currentEvent.note + "'" ;
			transformedData.push(event);
		}else if(currentEvent.event_code === "Approve_item"){
			var event = "Uživatel " + currentEvent.fullname + " schválil v čase " + eventDateFormat(currentEvent.event_date) +  " položku " +"'" + currentEvent.item + "'"+  " faktury číslo " + currentEvent.nr +". " +
			"Položka má komentář " + "'" +currentEvent.note+"'" ;
			transformedData.push(event);
		}else if(currentEvent.event_code === "Reject_item"){
			var event = "Uživatel " + currentEvent.fullname + " zamítnul v čase " + eventDateFormat(currentEvent.event_date) +  " položku " +"'"  + currentEvent.item + "'" +" faktury číslo " + currentEvent.nr +". " +
			"Položka má komentář " + "'"  + currentEvent.note+ "'" ;
			transformedData.push(event);
		}else if(currentEvent.event_code === "Edit_item"){
			var event = "Uživatel " + currentEvent.fullname + " upravil v čase " + eventDateFormat(currentEvent.event_date) + " položku " +"'" + currentEvent.item + "'"+ " faktury číslo " + currentEvent.nr +". " +
			"Položka má komentář "+ "'"  + currentEvent.note+ "'" ;
			transformedData.push(event);
		}else if(currentEvent.event_code === "Change"){
			var event = "Uživatel " + currentEvent.fullname + " upravil v čase " + eventDateFormat(currentEvent.event_date) +  " fakturu číslo "  + currentEvent.nr +". " +
			"Faktura má komentář " + "'" +currentEvent.note + "'";
			transformedData.push(event);
		}else if(currentEvent.event_code === "Reject_invoice"){
			var event = "Uživatel " + currentEvent.fullname + " zamítnul v čase " + eventDateFormat(currentEvent.event_date) +  " fakturu číslo "  + currentEvent.nr +". " ;
			transformedData.push(event);
		}else if(currentEvent.event_code === "Asign"){
			var event = "Uživatel " + currentEvent.fullname + " v čase " + eventDateFormat(currentEvent.event_date) +  " změnil přiřazení faktury číslo "  + currentEvent.nr +". " ;
			transformedData.push(event);
		}else if(currentEvent.event_code === "Asign"){
			var event = "Uživatel " + currentEvent.fullname + " v čase " + eventDateFormat(currentEvent.event_date) + " změnil přiřazení faktury číslo "  + currentEvent.nr +". " ;
			transformedData.push(event);
		}else if(currentEvent.event_code === "Close_invoice"){
			var event = "Uživatel " + currentEvent.fullname + " v čase " + eventDateFormat(currentEvent.event_date) +  " uzavřel fakturu číslo "  + currentEvent.nr +". " ;
			transformedData.push(event);
		}else if(currentEvent.event_code === "Approve_invoice"){
			var event = "Uživatel " + currentEvent.fullname + " v čase " + eventDateFormat(currentEvent.event_date) +  " schválil poslední položku a faktura číslo "  + currentEvent.nr + " byla schválena. " ;
			transformedData.push(event);
		}else if(currentEvent.event_code === "Create_invoice"){
			var event = "V čase " + eventDateFormat(currentEvent.event_date) +  " Vytvořena nová faktura";
			transformedData.push(event);
		};
		
	};
	
	if(typeof res ==='undefined'){
		return transformedData;
	}else{
	
	 res.json({success: true, data:transformedData});
	}
};

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

var getDateStamp=function(date){
	var d = new Date(date);
	return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate();
};

var prepareFilterQuery = function(filters) {
	var status =getInvoiceTypeCode(filters.status);
	var dateFrom = getDateStamp(filters.dateFromFilter);
	var dateUntil = getDateStamp(filters.dateUntilFilter);
	var params=[dateFrom,dateUntil, status];
	var x = 4;
	
	
	 var sql = "select invoice.nr, invoice.total_amount, "+ 
    "invoice.creation_date, invoice.taxable_date, invoice.creation_date, " + 
    "invoice.due_date, states.name as statusName ,event.note, operator.fullname, invoice.id, invoice.responsible,invoice.filesrc, invoice.status "+
    "from invoice left join event On invoice.id = event.invoice " +
  	"left join operator on invoice.responsible = operator.id " +
	"left join states on invoice.status = states.code ";
	
	
    var joinItem = false;
    var joinProject = false;
   	if(filters.projectFilter){
   		joinProject = true;
   	}
	if(filters.customerFilter){
		 joinItem = true;
	}
    
	if(joinItem || joinProject ){
		sql+= " left join invoice_item on invoice.id = invoice_item.invoice" +
		" left join project on invoice_item.project = project.id";  
	}

	sql+=" where invoice.creation_date >=$1 and invoice.creation_date <=$2 and invoice.status=$3 ";
	 
	   if (filters.userFilter){
	    	sql+= "and invoice.responsible=$" +x++ + " ";
	    	params.push(filters.userFilter);
	    };
	   if(filters.projectFilter){
	    	sql+= "and invoice_item.project=$" +x++ + " ";
	    	params.push(filters.projectFilter);
	    };
	   if(filters.customerFilter){;
	    	sql+= "and project.customer_id=$"+ x++ + " ";
	    	params.push(filters.customerFilter);
	    };
	    
	   
	    
	    sql+=  "and (event.id=(select max(id) from event e where e.invoice=invoice.id " +
  		"and (e.event_code='Asign' or e.event_code='Change' or e.event_code is NULL)) or event.id is null)";
	    
	    
	    
	    console.log(sql);
	    console.log(params);
	    return {
	        sql : sql,
	        params : params
	    };

};

function invoiceAmountCheck (invoiceId,responsible,res){
	
	var sql="select invoiceAmountCheck($1,$2)";
	
	db.query(sql, [invoiceId,responsible], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	
        	 res.json({result:rs.rows[0]});
        	// return rs.rows;
       };
    });
	
};

var generateEventText = function (eventId){
	
	var sql="Select EVENT.ID, invoice.nr, event_date, note, event_code, operator.fullname,invoice_item.item from event "+ 
	  "left join invoice on invoice.id = event.invoice "+ 
	  "left join invoice_item on invoice_item.id = event.item "+
	  "left join operator on operator.id = event.responsible where event.id = $1";

		db.query(sql,[eventId], function(err,rs) {
		if (err) {
		  console.log(err);
		  
		} else {
			
			var eventText = transformEvents(rs.rows);
			sql = "update event set event_text =$1 where id = $2";
			eventText = eventText[0];
			db.query(sql,[eventText,eventId], function(err,rs) {
				if (err) {
					  console.log(err);
					}
				else{
					console.log("event text written");
					getlastEvents();
				}
			});
		};
		});
};



////////////////////////////////////////////////////////////////////////////////////


var getlastEvents = function(){
	
	var sql= "WITH T AS (Select event.event_text, event.id from event order by event.id desc limit 4) SELECT * from t order by id asc";
	
	db.query(sql,[], function(err,rs) {
        if (err) {
            console.log(err);
            
        } else {
        	
        	lastEvents = rs.rows;
        	
        	var events = [];
        	 
        	for( var i = 0; i < lastEvents.length; i++ )
        	{
        		events.push(lastEvents[i].event_text);
        	}
        	
        	sendData(events);
       };
    });
	
};


io.sockets.on('connection', function (socket) {
	getlastEvents();
	
	socket.on('lastEvents', function () {
		getlastEvents();
	});
	
});


var sendData =function (events) {
	 io.sockets.emit("lastEvents",{data:events});
};

module.exports.getlastEvents=getlastEvents;
module.exports.sendData = sendData;
require('./mailChecker.js');























/////////////////////////////////////////////////////////////////////////////////////


function Map()
{
    // members
    this.keyArray = new Array(); // Keys
    this.valArray = new Array(); // Values
        
    // methods
    this.put = put;
    this.get = get;
    this.size = size;  
    this.clear = clear;
    this.keySet = keySet;
    this.valSet = valSet;
    this.showMe = showMe;   // returns a string with all keys and values in map.
    this.findIt = findIt;
    this.remove = remove;
}

function put( key, val )
{
    var elementIndex = this.findIt( key );
    
    if( elementIndex == (-1) )
    {
        this.keyArray.push( key );
        this.valArray.push( val );
    }
    else
    {
        this.valArray[ elementIndex ] = val;
    }
}

function get( key )
{
    var result = null;
    var elementIndex = this.findIt( key );

    if( elementIndex != (-1) )
    {   
        result = this.valArray[ elementIndex ];
    }  
    
    return result;
}

function remove( key )
{
    var result = null;
    var elementIndex = this.findIt( key );

    if( elementIndex != (-1) )
    {
        this.keyArray = this.keyArray.removeAt(elementIndex);
        this.valArray = this.valArray.removeAt(elementIndex);
    }  
    
    return ;
}

function size()
{
    return (this.keyArray.length);  
}

function clear()
{
    for( var i = 0; i < this.keyArray.length; i++ )
    {
        this.keyArray.pop(); this.valArray.pop();   
    }
}

function keySet()
{
    return (this.keyArray);
}

function valSet()
{
    return (this.valArray);   
}

function showMe()
{
    var result = "";
    
    for( var i = 0; i < this.keyArray.length; i++ )
    {
        result += "Key: " + this.keyArray[ i ] + "\tValues: " + this.valArray[ i ] + "\n";
    }
    return result;
}

function findIt( key )
{
    var result = (-1);

    for( var i = 0; i < this.keyArray.length; i++ )
    {
        if( this.keyArray[ i ] == key )
        {
            result = i;
            break;
        }
    }
    return result;
}

function removeAt( index )
{
  var part1 = this.slice( 0, index);
  var part2 = this.slice( index+1 );

  return( part1.concat( part2 ) );
}
Array.prototype.removeAt = removeAt;



///////////////////////////////////////////////

//setInterval(getlastEvents,5000);


