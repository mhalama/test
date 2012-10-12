
function mainInvoiceCtrl($scope, $resource, dataService, $log,socketio) {
	
	
	var socket = socketio;
	

	
	$scope.users = [];
	
	$scope.table = "invoice";
	$scope.viewState = "unasigned";
    $scope.previousViewState="";
    $scope.currentUser = 1;// momentálně přihlášený uživatel id
    $scope.currentUserSpecialRights = 1; // práva na zobrazení různých částí
    $scope.defaultUser =  {fullname:"-- zvolte uživatele --",type:1};//default selected user
    
    
    $scope.modalCreateProject = false; // okno kde se přidávají projekty 
    $scope.modalCreateCustomer = false; // okno kde se přidávají zákazníci
    $scope.modalAmountOver = false; //modal okno ktere se zobarzi, když je překročena čáskta faktury celkem
    $scope.modalAmountApproved = false; //modal okno ktere se zobarzi, když částka položek se rovná celkové částce
    
    $scope.customerName=null;
    $scope.projectName=null;
    $scope.budget="";
    
    $scope.rejectItemQuestionDialog=false;     //dialog který se zobrazí po odmítnutí položky faktury
    
    $scope.isNumber = function (n) {
    	  return !isNaN(parseFloat(n)) && isFinite(n);
    };
	
	
	$scope.columnDefs = [ { "mDataProp": "nr", "aTargets":[0]},{ "mDataProp": "total_amount", "aTargets":[1]},{ "mDataProp": "taxable_date", "aTargets":[2]},
		                     { "mDataProp": "creation_date", "aTargets":[3]},{ "mDataProp": "due_date", "aTargets":[4]},{ "mDataProp": "statusname", "aTargets":[5]},
		                     { "mDataProp": "note", "aTargets":[6]},{ "mDataProp": "fullname", "aTargets":[7]},{"mDataProp": "filesrc", "aTargets":[8]}];
	
	$scope.columnItemDefs = [ { "mDataProp": "amount", "aTargets":[0]},{ "mDataProp": "item", "aTargets":[1]},{ "mDataProp": "name", "aTargets":[2]},
	                          { "mDataProp": "customer", "aTargets":[3]},{ "mDataProp": "statusname", "aTargets":[4]}, { "mDataProp": "note", "aTargets":[5]}];
	
	
	
	$scope.editcols = [{name:"nr", label: "Číslo", readonly: false,type: "String",fx:" číslo faktury např: 2"},{name:"total_amount", label: "Faktura celkem", readonly: false,type: "String", fx:" částka celkem např: 2522"},
	                   {name:"taxable_date", label: "Zd. plnění", readonly: false,type: "date", fx:"datum zdanění např: 2012-08-25"},{name:"due_date", label: "Splatnost", readonly: false,type: "date", fx:"splatnost např: 2012-08-25"},
	                   {name:"note", label: "", readonly: false, type: "area", fx:"poznámka např: rozhodni"}];
	
	$scope.invoiceItemEditColumns = [{name:"amount", label: "Částka", readonly: false,type: "String", fx:"částka faktry např: 220"},{name:"item", label: "Položka", readonly: false,type: "String", fx:"položka např: balónky"},
	                                 {name:"note", label: "", readonly: false, type: "area"}];
	
	
	   $scope.overrideOptions = {
	            "bStateSave": true,
	            "iCookieDuration": 2419200, /* 1 month */
	            "bJQueryUI": true,
	            "bPaginate": true,
	            "bLengthChange": true,
	            "bFilter": true,
	            "bInfo": true,
	            "bDestroy": true,
	            "iDisplayLength": 4,
	            "oLanguage": {
	                "sProcessing": "Zpracovávají se data",
	                "sLoadingRecords": "Nahrávají se záznamy - prosím počkejte",
	                "sLengthMenu": "zobrazuje _MENU_ záznamů",
	                "sInfo": "_TOTAL_ záznamů (_START_ až _END_)",
	    	        "sSearch": "",
	    	        "sInfoEmpty": "Ukazuje 0 až 0 z 0 záznamů",
	    	        "sInfoFiltered": "(filtrováno z _MAX_ total záznamů)",
	    	        "sZeroRecords": "Nic nenalezeno"},
	        	"sDom": 'rt<"fg-toolbar ui-toolbar ui-widget-header ui-corner-bl ui-corner-br ui-helper-clearfix"ipf'
	    	      
	   };
	   
	   $scope.overrideOptionsDetails = {
	            "bStateSave": true,
	            "iCookieDuration": 2419200, /* 1 month */
	            "bJQueryUI": true,
	            "bPaginate": true,
	            "bLengthChange": true,
	            "bFilter": true,
	            "bInfo": true,
	            "bDestroy": true,
	            "iDisplayLength": 6,
	            "oLanguage": {
	                "sProcessing": "Zpracovávají se data",
	                "sLoadingRecords": "Nahrávají se záznamy - prosím počkejte",
	                "sLengthMenu": "zobrazuje _MENU_ záznamů",
	                "sInfo": "_TOTAL_ záznamů (_START_ až _END_)",
	    	        "sSearch": "",
	    	        "sInfoEmpty": "Ukazuje 0 až 0 z 0 záznamů",
	    	        "sInfoFiltered": "(filtrováno z _MAX_ total záznamů)",
	    	        "sZeroRecords": "Nic nenalezeno"},
	        	"sDom": 'rt<"fg-toolbar ui-toolbar ui-widget-header ui-corner-bl ui-corner-br ui-helper-clearfix"ipf'
	    	      
	   };
	
	   
	socket.on('lastEvents', function(data) {
		$scope.$apply(function() {
			$scope.lastEvents = data;
		});
	});
	   
	   
	$scope.createProject=function(){
		$scope.modalCreateProject=true;
	 };
	 
	$scope.createCustomer=function(){
		$scope.modalCreateCustomer=true;
	};
  
    $scope.getDateStamp=function(date){
    	var d = new Date(date);
    	return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate();
    };
 
    
	$scope.getUsers=function(project){
	    if(project===null){
	      	$scope.users= dataService.getUsers({},function(){
	      		console.log($scope.users.data);
	      	});
	     }
	     else{
	      	$scope.users= dataService.getUsers({filter:project},function(){
	      		$scope.users.data.push($scope.defaultUser);
	      	});
	     }
	 }; 
	 
	 $scope.getProjects=function(user){
    	if(user===null){
    		$scope.projects= dataService.getProjects({});
    	}
    	else{
    		$scope.projects= dataService.getProjects({filter:user});
    	}
	    	
	 };  
	    
	 $scope.getCustomers=function(customer){
    	if(customer===null){
    		$scope.customers= dataService.getCustomers({});
    	}else{
    		$scope.customers= dataService.getCustomers({filter:customer});
    	}
	    	
	 }; 
	 
	    
	 $scope.addCustomer=function(customer){

	   var result = null;
	       result = dataService.addCustomer({customerName:customer},function(){
		   $scope.getCustomers(null);
		   $scope.modalCreateCustomer = false;
		   console.log(result);
	   });
	    	
	 };  
	    
	 $scope.addProject=function(projectName,customerName){
		var result = null;
    	result = dataService.addProject({projectName:projectName,customer:$scope.customerName,budget:$scope.budget},function(){
    		 $scope.getProjects(null);
    		 $scope.modalCreateProject = false;
    		 $scope.customerName = null;
    		 $scope.budget="";
    		 console.log(result);
    	});
    
     }; 
    
     
     $scope.search = function (invoiceType,user) {
    	 $scope.items = dataService.load({type: invoiceType, user: user});
     };
     
     $scope.setState = function (state) {
    	 $scope.previousViewState= $scope.viewState;
         $scope.viewState = state;
     };
     
     
     $scope.setTable = function (invoiceType, tbl,state,user) {
    	 getLastEvents();
    	 $scope.setState(state);
         $scope.items = dataService.load({type:invoiceType,user:user}, function () {
             $log.info("loading done... ", $scope.items);
         });
     };
       
    $scope.invoiceAmountCheck=function(data){
    	var result = data.result;
     	if(result.invoiceamountcheck!== undefined){
    		if(result.invoiceamountcheck === 0){
    			$scope.modalAmountApproved = true;
    		}else if(result.invoiceamountcheck > 0){
    			console.log(result.invoiceAmountCheck);
    		}else{
    			$scope.modalAmountOver = true;
    		};
    	};
    }; 

    
    $scope.getDateStamp=function(date){
    	var d = new Date(date);
    	return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate();
    };

    $scope.createEmptyInvoiceItem = function(){
    	var item = {amount:"",item:"",invoice:"",project:"",status:"",note:""};
    	return item;
    };
    
    var getLastEvents = function(){
		socket.emit("lastEvents", {
		});
	};
    
       
	$scope.getUsers(null);
	$scope.getProjects(null);
	$scope.getCustomers(null);
	$scope.setTable('New', 'Invoice' ,'unasigned');
	
	
	
}

////////////////////////////////////////////////////////////////////////////////
//!!!!!!!!!!!!!!!!!!!!!
function unasignedInvoicesCtrl($scope, $resource, dataService, $log) {
	
	
	$scope.currentAsignedUser = null;
	$scope.selectedUser;
	$scope.lastSelectedInvoice=null;
	$scope.invoiceType='New';
	

	
    $scope.cancelEdit = function () {
    	$scope.editMode = false;
        $scope.search("New");
       
    };

    $scope.edit = function () {
    	if($scope.lastSelectedInvoice!=null){
        	$scope.editMode = true;
            $scope.selectedItem = $scope.lastSelectedInvoice;
    	}
    };	
    
    
    $scope.asignInvoice = function () {
    	 if($scope.currentAsignedUser!== undefined && $scope.currentAsignedUser!=null){;
    		 if($scope.currentAsignedUser !== $scope.lastSelectedInvoice.responsible){
    			 dataService.asignInvoice({userID:$scope.currentAsignedUser,invoiceID:$scope.lastSelectedInvoice.id,note:$scope.lastSelectedInvoice.note,responsible:$scope.currentUser}
    			 ,function(){
    				 $scope.lastSelectedInvoice=null;
    				 $scope.search($scope.invoiceType);
    			 }); 
    		 };
         
         };
    };	
    
    
    $scope.save = function (tbl,data) {
    
    	
        dataService.save({ table: tbl, data:data,responsible:$scope.currentUser}, function () {
            $log.info("save: ", tbl, data);
            $scope.search("New");
                  
        });
        $scope.editMode = false;
    };
    
    $scope.reject = function () {
    	if($scope.lastSelectedInvoice!=null){
	        dataService.rejectInvoice({ table: $scope.table ,item:$scope.lastSelectedInvoice,responsible: $scope.currentUser}, function () {
	            $log.info("reject: ", $scope.table, $scope.lastSelectedInvoice);
	            $scope.search("New");
	                  
	        });
    	};
    };
    
    
    
    // table
    
    $scope.message = '';            
    
    $scope.myCallback = function(nRow, aData, iDisplayIndex, iDisplayIndexFull) { 
    	
    	
    	
        if(nRow.parentElement!=null){
        	   angular.forEach(nRow.parentElement.children, function(value, key){
            		if (value.classList.length===2) {
            			nRow.classList.remove('DTTT_selected');
        
               }});
        }
        
        var imgTag = ' <img src="./images/invoice-icon.png"  width="20" height="20">';
        $('td:eq(8)', nRow).html(imgTag);
        	
        $('td', nRow).bind('click', function() {
        	if(this.cellIndex ===8){
             	popupWindow = window.open(
             	aData.filesrc,'popUpWindow','height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');
             	
            }
        	angular.forEach(nRow.parentElement.children, function(value, key){
        		$(value).removeClass('DTTT_selected');
	 	        });
        		
            $scope.$apply(function() {
                $scope.someClickHandler(aData);
            });
            $(nRow).addClass('DTTT_selected');
            return nRow;
        });
        
        if($scope.lastSelectedInvoice!=null){
        	if(aData.id===$scope.lastSelectedInvoice.id){
        		 $(nRow).addClass('DTTT_selected');
        	}
        	else{
        		 $(nRow).removeClass('DTTT_selected');
        	}
        }

        return nRow;
    };

    $scope.someClickHandler = function(aData) {
    	$scope.lastSelectedInvoice=aData;
    	var myIframe = document.getElementById("newInvoiceIframe");
    	myIframe.src = aData.filesrc;
    
    	
    };

    
 

     
  
};



///////////////////////////////////////////////////////////////////////////////////////////////////

function asignedInvoicesCtrl($scope, $resource, dataService, $log) {

	
    $scope.itemDetails = [];

    
    $scope.editItemMode = false;
    $scope.editMode = false;
    $scope.showFilters =false;
    $scope.showFiltersText="zobrazit filtry";
    $scope.currentAsignedUser = null;
    
    $scope.lastSelectedInvoice=null;
    $scope.lastSelectedInvoiceItem=null;
    $scope.invoiceType="Open";
    
    $scope.customerName="";
    $scope.projectName="";
    
///////////////////////////////////////////////////////////////////    
    $scope.edit = function () {
    	$scope.editMode = true;
    };
    
    $scope.close = function () {
    	 dataService.closeInvoice({ invoiceId: $scope.lastSelectedInvoice.id, responsible:$scope.currentUser}, function () {
             $log.info("close: ",   $scope.lastSelectedInvoice);
             $scope.itemDetails= [];
             $scope.search($scope.invoiceType);  
         });
    };
    
    $scope.cancelEdit = function () {
    	$scope.editMode = false;
        $scope.search($scope.invoiceType);
       
    };
    
    $scope.save = function (tbl,data) {
    	var result =null;
        result = dataService.save({ table: tbl, data:data,responsible:$scope.currentUser}, function () {
            $log.info("save: ", tbl, data);
            $scope.invoiceAmountCheck(result);
            if(result.result.invoiceamountcheck === 0){
            	$scope.search($scope.invoiceType);
            	$scope.lastSelectedInvoiceItem=null;
            	$scope.itemDetails=null;
            }else{
            	$scope.search($scope.invoiceType);
            	$scope.lastSelectedInvoiceItem=null;
            }
                  
        });
        $scope.editMode = false;
    };
    
    $scope.reject = function () {
        dataService.rejectInvoice({ table: $scope.table ,item: $scope.lastSelectedInvoice,responsible: $scope.currentUser}, function () {
            $log.info("reject: ", $scope.table,  $scope.lastSelectedInvoice);
            $scope.search($scope.invoiceType);
                  
        });
    };
    
    $scope.asignInvoice = function () {
   	 if($scope.currentAsignedUser!== undefined && $scope.currentAsignedUser!=null){;
   		 if($scope.currentAsignedUser !== $scope.lastSelectedInvoice.responsible){
   			 dataService.asignInvoice({userID:$scope.currentAsignedUser,invoiceID:$scope.lastSelectedInvoice.id,note:$scope.lastSelectedInvoice.note,responsible:$scope.currentUser},function(){
   				$scope.lastSelectedInvoice=null;
   			    $scope.lastSelectedInvoiceItem=null;
   				$scope.search($scope.invoiceType);
   				 
   			 }); 
   			 
   		 };
        
        };
   };
   

	   
   
    
/////////////////////////////////////////////////////////////////////
 


    $scope.getInvoiceItems=function(invoice){
    	$scope.lastSelectedInvoiceItem=null;
    	$scope.lastSelectedInvoice =invoice;
    	$scope.currentAsignedUser = invoice.responsible;
        $scope.itemDetailsTemp = dataService.getInvoiceItems({invoiceId:invoice.id,status:$scope.invoiceType},function () {	
        	$scope.itemDetails = $scope.itemDetailsTemp.data;
        	
        });	
    	
    };
	

    $scope.createInvoiceItem=function(invoiceItem){
    	
    	$scope.editItemMode = true;
    	$scope.item = $scope.createEmptyInvoiceItem();
    };
    
    $scope.editInvoiceItem = function(){
    	$scope.editItemMode = true;
    	$scope.item = $scope.lastSelectedInvoiceItem;
    };
    
    $scope.cancelItem = function(){
    	$scope.editItemMode = false;
    };
    
    $scope.saveItem = function(item){
    	item.invoice =$scope.lastSelectedInvoice.id;
    	item.status="O";
    	var result=null;
    	if(item.amount=="" || $scope.isNumber(item.amount)!=true){
    		alert("chyba v políčku částka");
    	}else if(item.item ==""){
    		alert("položka nebyla vyplněna");
    	}else if(item.project =="" || item.project ==null){
    		alert("nebyl vybrán project");
    	}else{
    		if(item.id){
       		 result = dataService.saveEditedItem({item:item,responsible:$scope.currentUser},function(){
       			$scope.invoiceAmountCheck(result);
       			  if(result.result.invoiceamountcheck === 0){
       	            	$scope.search($scope.invoiceType);
       	            	$scope.lastSelectedInvoiceItem=null;
       	            	$scope.lastSelectedInvoice=null;
       	            	$scope.itemDetails=null;
       	          }
       			  else{
       				  $scope.getInvoiceItems($scope.lastSelectedInvoice);
       				  $scope.lastSelectedInvoiceItem=null;
       			  }
       		});
       	}else{
       		result = dataService.saveCreatedItem({item:item,responsible:$scope.currentUser},function(){
           		$scope.invoiceAmountCheck(result);
           		  if(result.result.invoiceamountcheck === 0){
                     	$scope.search($scope.invoiceType);
                     	$scope.lastSelectedInvoiceItem=null;
                     	$scope.itemDetails=null;
                     	$scope.lastSelectedInvoice=null;
                     }else{
                   	  $scope.getInvoiceItems($scope.lastSelectedInvoice);
                   	  $scope.lastSelectedInvoiceItem=null;
                     }
       		});
       	}
       	$scope.editItemMode = false;
    		
    	}
    	
    };
    
    $scope.rejectItem=function(){
    	$scope.rejectItemQuestionDialog=false;
    	dataService.rejectItem({item:$scope.lastSelectedInvoiceItem,responsible:$scope.currentUser},function(){
    		$scope.reject();
    		$scope.lastSelectedInvoiceItem = null;
    		$scope.itemDetails = [];                      
    	});
    
    	
    	
    };
    
    $scope.approveItem=function(){
    	var result = null;
    	result = dataService.approveItem({item:$scope.lastSelectedInvoiceItem,responsible:$scope.currentUser},function(){
	    	console.log(result);
	    	$scope.invoiceAmountCheck(result);
	    	  if(result.result.invoiceamountcheck === 0){
	            	$scope.search($scope.invoiceType);
	            	$scope.lastSelectedInvoiceItem=null;
	            	$scope.itemDetails=null;
	            	$scope.lastSelectedInvoice=null;
	            }else{
	            	$scope.getInvoiceItems($scope.lastSelectedInvoice);
	            	$scope.lastSelectedInvoiceItem=null;
	            }
    	});
    };
    
    $scope.approveInvoice=function(){
    	dataService.approveInvoice({item: $scope.lastSelectedInvoice,responsible:$scope.currentUser},function(){
    		$scope.getInvoiceItems($scope.lastSelectedInvoice);
    	});
    };
    
 

    $scope.filterInvoices = function () {
 
    	var filterData = {userFilter:$scope.userFilter,
    				customerFilter:$scope.customerFilter,
    				projectFilter:$scope.projectFilter,
    				dateFromFilter:$scope.dateFromFilter,
    				dateUntilFilter:$scope.dateUntilFilter,
    				status:$scope.invoiceType};
    	var itemsTemp = null;
    	itemsTemp = dataService.filterInvoices({data:filterData,responsible:$scope.currentUser},function () {
    		$scope.items = itemsTemp;
            $log.info("loading done... ", $scope.items);
        });
    		
    	$scope.lastSelectedInvoice=null;
    	$scope.lastSelectedInvoiceItem=null;
    	$scope.itemDetails =null;
    };
    
    $scope.resetFilters=function(){
    	var twoMonth = 1 * 24 * 60 * 60 * 1000 *60;
    	$scope.userFilter=null;
    	$scope.customerFilter=null;
    	$scope.projectFilter=null; 
    	$scope.dateFromFilter=$scope.getDateStamp(new Date().getTime()-twoMonth);
    	$scope.dateUntilFilter=$scope.getDateStamp(new Date());
    };
      
    
    $scope.invoiceTypeFilterChange=function(){
        $scope.search($scope.invoiceType);
        $scope.lastSelectedInvoice=null;
    	$scope.lastSelectedInvoiceItem=null;
    	$scope.itemDetails =null;
    };
    
    $scope.showFilterFunction=function(){
    	if($scope.showFilters){
    		$scope.showFilters=false;
    		$scope.showFiltersText ="zobrazit filtry";
    	}else{
    		$scope.showFilters=true;
    		$scope.showFiltersText ="skrýt filtry";
    	}
    };
    
    $scope.selectInvoiceItem = function(aData){
    	$scope.lastSelectedInvoiceItem = aData;
    };
    
    
    
    $scope.myCallback = function(nRow, aData, iDisplayIndex, iDisplayIndexFull) { 
        if(nRow.parentElement!=null){
        	   angular.forEach(nRow.parentElement.children, function(value, key){
            		if (value.classList.length===2) {
            			nRow.classList.remove('DTTT_selected');
         }});
        }
        
        var imgTag = ' <img src="./images/invoice-icon.png"  width="20" height="20">';
        $('td:eq(8)', nRow).html(imgTag);
        
        	
        $('td', nRow).bind('click', function() {
        	if(this.cellIndex ===8){
             	popupWindow = window.open(
             	aData.filesrc,'popUpWindow','height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');
             	
            }
        	angular.forEach(nRow.parentElement.children, function(value, key){
        		$(value).removeClass('DTTT_selected');
	 	        });
        		
            $scope.$apply(function() {
                $scope.getInvoiceItems(aData);
                var myIframe = document.getElementById("assignedInvoiceIframe");
            	myIframe.src = aData.filesrc;
            });
            $(nRow).addClass('DTTT_selected');
            return nRow;
        });
        
        if($scope.lastSelectedInvoice!=null){
        	if(aData.id===$scope.lastSelectedInvoice.id){
        		 $(nRow).addClass('DTTT_selected');
        	}
        	else{
        		 $(nRow).removeClass('DTTT_selected');
        	}
        }
        return nRow;
    };
    
    $scope.myItemCallback = function(nRow, aData, iDisplayIndex, iDisplayIndexFull) { 
        if(nRow.parentElement!=null){
        	   angular.forEach(nRow.parentElement.children, function(value, key){
            		if (value.classList.length===2) {
            			nRow.classList.remove('DTTT_selected');
               }});
        }
        $('td', nRow).bind('click', function() {
        	
        	angular.forEach(nRow.parentElement.children, function(value, key){
        		$(value).removeClass('DTTT_selected'); });
        	
            $scope.$apply(function() {
                $scope.selectInvoiceItem(aData);
            });
            $(nRow).addClass('DTTT_selected');
            return nRow;
        });
        
        if($scope.lastSelectedInvoiceItem!=null){
        	if(aData.id===$scope.lastSelectedInvoiceItem.id){
        		 $(nRow).addClass('DTTT_selected');
        	}
        	else{
        		 $(nRow).removeClass('DTTT_selected');
        	}
        }
	        
        return nRow;
 };
    

    
	$scope.resetFilters();


    
};

///////////////////////////////////////////////////////////////////////////////////////////////////





function meAsignedInvoicesCtrl($scope, $resource, dataService, $log) {
	
    $scope.itemDetails = [];

    
    $scope.editItemMode = false;
    $scope.editMode = false;
    $scope.currentAsignedUser = null;
    
    $scope.lastSelectedInvoice=null;
    $scope.lastSelectedInvoiceItem=null;
    $scope.invoiceType="Open";
    
    $scope.selectInvoice = function(item){ 	
    	$scope.lastSelectedInvoice=item;
    };
    
    $scope.getInvoiceItems=function(invoice){
    	$scope.lastSelectedInvoice =invoice;
    	$scope.currentAsignedUser = invoice.responsible;
        $scope.itemDetails = dataService.getInvoiceItems({invoiceId:invoice.id,status:$scope.invoiceType},function () {	
        	$scope.itemDetails = $scope.itemDetails.data;
        	
        });	
    	
    };
    
   
    
    $scope.save = function (tbl,data) {
    	var result = null;
        result = dataService.save({ table: tbl, data:data}, function () {
            $log.info("save: ", tbl, data);
            $scope.editMode = false;
            $scope.invoiceAmountCheck(result);
            if(result.result.invoiceamountcheck === 0){
            	$scope.search($scope.invoiceType);
            	$scope.lastSelectedInvoiceItem=null;
            	$scope.itemDetails=null;
            	$scope.lastSelectedInvoice=null;
            }else{
            	$scope.search($scope.invoiceType,$scope.currentUser);
            }
                  
        });
     
    };
    
    
    $scope.reject = function () {
        dataService.rejectInvoice({ table: $scope.table ,item:$scope.lastSelectedInvoice,responsible: $scope.currentUser}, function () {
            $log.info("reject: ", $scope.table, $scope.lastSelectedInvoice);
            $scope.search($scope.invoiceType,$scope.currentUser);
                  
        });
    };
    
    
	

$scope.myCallback = function(nRow, aData, iDisplayIndex, iDisplayIndexFull) { 
        if(nRow.parentElement!=null){
        	   angular.forEach(nRow.parentElement.children, function(value, key){
            		if (value.classList.length===2) {
            			nRow.classList.remove('DTTT_selected');
         }});
        }
        
        var imgTag = ' <img src="./images/invoice-icon.png"  width="20" height="20">';
        $('td:eq(8)', nRow).html(imgTag);
        	
        $('td', nRow).bind('click', function() {
        	if(this.cellIndex ===8){
             	popupWindow = window.open(
             	aData.filesrc,'popUpWindow','height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');
             	
             	
            }
        	angular.forEach(nRow.parentElement.children, function(value, key){
        		$(value).removeClass('DTTT_selected');
	 	        });
        		
            $scope.$apply(function() {
                $scope.selectInvoice(aData);
                var myIframe = document.getElementById("meAssignedInvoiceIframe");
            	myIframe.src = aData.filesrc;
            	
            });
            $(nRow).addClass('DTTT_selected');
            return nRow;
        });
        
        if($scope.lastSelectedInvoice!=null){
        	if(aData.id===$scope.lastSelectedInvoice.id){
        		 $(nRow).addClass('DTTT_selected');
        	}
        	else{
        		 $(nRow).removeClass('DTTT_selected');
        	}
        }
        return nRow;
    };
    
    
    
$scope.myItemCallback = function(nRow, aData, iDisplayIndex, iDisplayIndexFull) { 
        if(nRow.parentElement!=null){
        	   angular.forEach(nRow.parentElement.children, function(value, key){
            		if (value.classList.length===2) {
            			nRow.classList.remove('DTTT_selected');
               }});
        }
  
        
        $('td', nRow).bind('click', function() {
        	
        	angular.forEach(nRow.parentElement.children, function(value, key){
        		$(value).removeClass('DTTT_selected'); });
        	
            $scope.$apply(function() {
                $scope.selectInvoiceItem(aData);

            });
            $(nRow).addClass('DTTT_selected');
            return nRow;
        });
        
        if($scope.lastSelectedInvoiceItem!=null){
        	if(aData.id===$scope.lastSelectedInvoiceItem.id){
        		 $(nRow).addClass('DTTT_selected');
        	}
        	else{
        		 $(nRow).removeClass('DTTT_selected');
        	}
        }
        return nRow;
 };
    

    
    $scope.selectInvoice = function(aData) {
    	//$scope.$apply(function() {
	    	$scope.lastSelectedInvoice=aData;
	    	$scope.getInvoiceItems(aData);
	    
    	
    };
    
    $scope.selectInvoiceItem = function(aData){
    	$scope.lastSelectedInvoiceItem = aData;
    };
    
    
    $scope.getInvoiceItems=function(invoice){
    	$scope.lastSelectedInvoice =invoice;
    	$scope.currentAsignedUser = invoice.responsible;
        $scope.itemDetailsTemp = dataService.getInvoiceItems({invoiceId:invoice.id,status:$scope.invoiceType},function () {	
        $scope.itemDetails = $scope.itemDetailsTemp.data;
        	
        });	
    	
    };
    
    $scope.rejectItem=function(){
    	$scope.rejectItemQuestionDialog=false;
    	dataService.rejectItem({item:$scope.lastSelectedInvoiceItem,responsible:$scope.currentUser},function(){
    		$scope.reject();
        	$scope.lastSelectedInvoiceItem = null;
        	$scope.itemDetails = [];
    	});
    
    };
    
    $scope.approveItem=function(){
    	var result = null;
    	result = dataService.approveItem({item:$scope.lastSelectedInvoiceItem,responsible:$scope.currentUser},function(){
    		$scope.invoiceAmountCheck(result);
    		  if(result.result.invoiceamountcheck === 0){
              	$scope.search($scope.invoiceType);
              	$scope.lastSelectedInvoiceItem=null;
              	$scope.itemDetails=[];;
              	$scope.lastSelectedInvoice=null;
              }else{
            	  $scope.getInvoiceItems($scope.lastSelectedInvoice);
            	  $scope.lastSelectedInvoiceItem=null;
              }
    	});
    };
    
    $scope.editInvoiceItem = function(itm){
    	$scope.editItemMode = true;
    	$scope.item = $scope.lastSelectedInvoiceItem;
    };
    
    $scope.cancelItem = function(){
    	$scope.editItemMode = false;
    };
    
    $scope.saveItem = function(item){
    	var result = null;
    	item.invoice =$scope.lastSelectedInvoice.id;
    	item.status="O";
    	if(item.amount=="" || $scope.isNumber(item.amount)!=true){
    		alert("chyba v políčku částka");
    	}else if(item.item ==""){
    		alert("položka nebyla vyplněna");
    	}else if(item.project =="" || item.project ==null){
    		alert("nebyl vybrán project");
    	}else{
	    	if(item.id){
	    		result = dataService.saveEditedItem({item:item,responsible:$scope.currentUser},function(){
	    			$scope.invoiceAmountCheck(result);
	    			  if(result.result.invoiceamountcheck === 0){
	    	            	$scope.search($scope.invoiceType);
	    	            	$scope.lastSelectedInvoiceItem=null;
	    	            	$scope.itemDetails= [];
	    	            	$scope.lastSelectedInvoice=null;
	    	          }
	    			  else{
	    				  $scope.getInvoiceItems($scope.lastSelectedInvoice);
	    				  $scope.lastSelectedInvoiceItem=null;
	    			  }
	    		});
	    	}
	    	else{
	        	result = dataService.saveCreatedItem({item:item,responsible:$scope.currentUser},function(){
	        		$scope.invoiceAmountCheck(result);
	        		if(result.result.invoiceamountcheck === 0){
		            	$scope.search($scope.invoiceType);
		            	$scope.lastSelectedInvoiceItem=null;
		            	$scope.itemDetails=null;
		            	$scope.lastSelectedInvoice=null;
		            }else{
		            	$scope.getInvoiceItems($scope.lastSelectedInvoice);
		            	$scope.lastSelectedInvoiceItem=null;
		            }
	    		});
	    	}
	    	$scope.editItemMode = false;
    	}
    };
    
    $scope.cancelEdit = function () {
    	$scope.editMode = false;
       
    };
    
    $scope.edit = function () {
    	$scope.editMode = true;
    };
    
    $scope.createInvoiceItem=function(invoiceItem){
    	
    	$scope.editItemMode = true;
    	$scope.item = $scope.createEmptyInvoiceItem();
    };
    
    $scope.asignInvoice = function () {
      	 if($scope.currentAsignedUser!== undefined && $scope.currentAsignedUser!=null){;
      		 if($scope.currentAsignedUser !== $scope.lastSelectedInvoice.responsible){
      			 dataService.asignInvoice({userID:$scope.currentAsignedUser,invoiceID:$scope.lastSelectedInvoice.id,note:$scope.lastSelectedInvoice.note,responsible:$scope.currentUser},function(){
      				$scope.lastSelectedInvoice=null;
      				$scope.lastSelectedInvoiceItem = createEmptyInvoiceItem();
      				$scope.lastSelectedInvoiceItem=null;
      			
      				 
      			 }); 
      			$scope.setTable('Open', 'Invoice','meAsigned',$scope.currentUser);
      		 };
           
           };
      };
   
};


  

    
    
    

    

 
