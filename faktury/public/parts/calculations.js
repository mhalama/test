function calculationCtrl($scope, $resource, dataService, $log, socketio) {
	
	 var socket = socketio;
	
	 $scope.calculations;
	 $scope.customerFilter="";
	 $scope.projectFilter="";
	 $scope.userFilter="";
	 var twoMonth = 1 * 24 * 60 * 60 * 1000 *60;
	 $scope.editBudgetMode = false;
	 $scope.editedProject = null;
	 
	 $scope.getDateStamp=function(date){
	    	var d = new Date(date);
	    	return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + (d.getUTCDate()+1);
	  };
	 
	 
	 $scope.invoiceType ="Approved";
	 $scope.dateFromFilter = $scope.getDateStamp(new Date().getTime()-twoMonth);
	 $scope.dateUntilFilter = new Date();
	 
	 $scope.filterType="customer";
	 
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
		    
	$scope.getCustomers=function(customer){
	    	if(customer===null){
	    		$scope.customers= dataService.getCustomers({});
	    	}else{
	    		$scope.customers= dataService.getCustomers({filter:customer});
	    	}
		    	
		 }; 
	
		 
	$scope.getProjects(null);
	$scope.getCustomers(null);
	
	
	$scope.getCalculations=function(customer,project,user){
		$scope.calculations = null;
		var from = $scope.getDateStamp($scope.dateFromFilter);
		var until = $scope.getDateStamp($scope.dateUntilFilter);
			if(customer!=="" || project !=="" || user!==""){
			
				if(customer!=""){
					$scope.calculations=dataService.getcalculations({customer:customer,from:$scope.dateFromFilter, until:$scope.dateUntilFilter, invoiceType: $scope.invoiceType},function () {
			             $log.info("loading done... ", $scope.calculations);
			         });
				}
				else if(project!=""){
					$scope.calculations=dataService.getcalculations({project:project,from:from, until:until, invoiceType: $scope.invoiceType},function () {
			             $log.info("loading done... ", $scope.calculations);
			             console.log("done-----");
			         });
				}
				else if(user!=""){
					$scope.calculations=dataService.getcalculations({user:user,from:from, until:until, invoiceType: $scope.invoiceType},function () {
			             $log.info("loading done... ", $scope.calculations);
				});
			};
			
			 $scope.customerFilter="";
			 $scope.projectFilter="";
			 $scope.userFileter="";
		};
	};
	
	var getLastEvents = function(){
		socket.emit("lastEvents");
	};
	
	$scope.getUsers=function(){
		$scope.users= dataService.getUsers({},function(){
	      console.log($scope.users.data);
	     });

	}; 
	
	$scope.getProjectDetails=function(project){
		if(project.visible==1){
			project.visible = 0;
		}else{
			project.visible = 1;
		};
	};
	
	$scope.editBudget = function(project){
		$scope.editBudgetMode = true;
		$scope.editedProject = project;
	};
	
	$scope.saveEditedBudget = function(editedProject){
		dataService.saveEditedPrject(editedProject,function(){
			editedProject = null;
			$scope.editBudgetMode = false;
		});
	};

	$scope.getUsers();
	getLastEvents();

}

	

