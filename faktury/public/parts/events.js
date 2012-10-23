function eventCtrl($scope, $resource, dataService, $log, socketio) {
		
	 var socket = socketio;
	 var twoMonth = 1 * 24 * 60 * 60 * 1000 *60;
	 $scope.invoices=[];
	 $scope.invoiceFilter="";
	 $scope.projectFilter="";
	 $scope.userFilter="";
	 $scope.events;
	 
	 $scope.filterType="invoice";
	 
	 $scope.getDateStamp=function(date){
	    	var d = new Date(date);
	    	return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + (d.getUTCDate() +1) ;
	  };
	 
	 $scope.dateFromFilter = $scope.getDateStamp(new Date().getTime()-twoMonth);
	 $scope.dateUntilFilter = new Date();
	 
	 
	 
	 socket.on('lastEvents', function(data) {
			$scope.$apply(function() {
				$scope.lastEvents = data;
			});
	 });
	
	 $scope.getProjects=function(user){
	    	if(user===null){
	    		$scope.projects= dataService.getProjects({});
	    	}
	    	else{
	    		$scope.projects= dataService.getProjects({filter:user});
	    	}
		    	
		 };  
		    
	$scope.getInvoices=function(){
	    $scope.invoices= dataService.getAllInvoices({},function(){
	    	console.log($scope.invoices);
	    });   	
	}; 
	
	
var getLastEvents = function(){
	socket.emit("lastEvents", {
	});
};
	    
		 
	$scope.getProjects(null);
	$scope.getInvoices();
	
	
	$scope.getEvents=function(invoice,project,user){
		
		var from = $scope.getDateStamp($scope.dateFromFilter);
		var until = $scope.getDateStamp($scope.dateUntilFilter);
		
		if(invoice!=="" || project !=="" || user!==""){
		
			if(invoice!==""){
				$scope.events=dataService.getFilteredEvents({invoiceId:invoice,from:from, until:until},function () {
		             $log.info("loading done... ", $scope.events);
		             console.log("done-----");
		         });
			}
			else if(project!=""){
				$scope.events=dataService.getFilteredEvents({project:project,from:from, until:until});
			}
			else if(user!=""){
				$scope.events=dataService.getFilteredEvents({user:user,from:from, until:until});
			}
			
			 $scope.invoiceFilter="";
			 $scope.projectFilter="";
			 $scope.userFilter="";
		};
	};
	
	
	$scope.getUsers=function(){
		$scope.users= dataService.getUsers({},function(){
	      console.log($scope.users.data);
	     });

	}; 
	
	getLastEvents();
	$scope.getUsers();
}
