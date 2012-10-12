head.js({
	jquery : "lib/jquery.min.js"}, 
	{jquery_ui : "lib/jquery-ui.min.js"},
	{datatables : "lib/jquery.dataTables.min.js"},
	{twitter_bootstrap : "bootstrap/js/bootstrap.min.js"},
	{angular : "lib/angular-1.0.0rc6.js"},
	{angular_resource : "lib/angular-resource-1.0.0rc6.js"}, 
	{select2 : "lib/select2.js"}, 
	{angular_ui : "lib/angular-ui.js"},
	{highcharts : "lib/highcharts.js"},
	{highcharts_exporting : "lib/exporting.js"},
	{socketio : "lib/socketio.min.js"},
	{progressbar : "lib/jquery.progressbar.min.js"},
	{listeditor : "parts/components/listeditor.js"},
	{part_home : "parts/home.js"},
	{part_invoices : "parts/invoices.js"},
	{part_calculations : "parts/calculations.js"},
	{part_events : "parts/events.js"},
	{ui_modal : "lib/angular-modal-ui.js"}
);

head.ready(function() {
	init_cont = function() {

		angular.module('InvoicesApp', [ 'ngResource', 'ui' ]).config(
				[ '$routeProvider', function($routeProvider) {
					$routeProvider.when('/home', {
						template : 'parts/home.html',
						controller : homeCtrl
					}).when('/invoices', {
						template : 'parts/invoices.html',
						controller : mainInvoiceCtrl
					}).when('/calculations', {
						template : 'parts/calculations.html',
						controller : calculationCtrl
					}).when('/events', {
						template : 'parts/events.html',
						controller : eventCtrl
					})
					 .otherwise({
						redirectTo : '/home'
					});
				} ]).directive("datalist", function(dataService) {
			return {
				restrict : "E",
				scope : {
					schema : "bind",
					table : "bind"
				},
				templateUrl : "parts/components/datalist.html",
				link : function(scope, element, attrs) {
					console.log("------------------------");
					console.log(dataService);
					console.log("------------------------");
					console.log("scope", scope);
					console.log("------------------------");
					console.log("element", element);
					console.log("------------------------");
					console.log("attrs", attrs);
					console.log("------------------------");
				}
			};
		})
				.directive(
						'myTable',
						function() {
							return function(scope, element, attrs) {

								// apply DataTable options, use defaults if none
								// specified by user
								var options = {};
								if (attrs.myTable.length > 0) {
									options = scope.$eval(attrs.myTable);
								} else {
									options = {
										"bStateSave" : true,
										"iCookieDuration" : 2419200, 
										"bJQueryUI" : true,
										"bPaginate" : true,
										"bLengthChange" : true,
										"bFilter" : true,
										"bInfo" : true,
										"bDestroy" : true
									};
								}

								// Tell the dataTables plugin what columns to
								// use
								// We can either derive them from the dom, or
								// use setup from the
								// controller
								var explicitColumns = [];
								element.find('th').each(function(index, elem) {
									explicitColumns.push($(elem).text());
								});
								if (explicitColumns.length > 0) {
									options["aoColumns"] = explicitColumns;
								} else if (attrs.aoColumns) {
									options["aoColumns"] = scope
											.$eval(attrs.aoColumns);
								}

								// aoColumnDefs is dataTables way of providing
								// fine control over
								// column config
								if (attrs.aoColumnDefs) {
									options["aoColumnDefs"] = scope
											.$eval(attrs.aoColumnDefs);
								}

								if (attrs.fnRowCallback) {
									options["fnRowCallback"] = scope
											.$eval(attrs.fnRowCallback);
								}

								// apply the plugin
								var dataTable = element.dataTable(options);

								// watch for any changes to our data, rebuild
								// the DataTable
								scope.$watch(attrs.aaData, function(value) {
									var val = value || null;
									if (val) {
										dataTable.fnClearTable();
										dataTable.fnAddData(scope
												.$eval(attrs.aaData));
									}
								});
							};
						}).directive('myAppend', function() {
					        return function(scope, element, attrs) {
					            console.log( 'directive for', element );
					            $(element)['append']( $(element).get().toString() );
					          };
					        })
						.factory('dataService', function($resource) {
					return $resource("svc/invoice/:fn", {}, {
						load : {method : "GET",params : {fn : "load"}},
						save : {method : "POST",params : {fn : "save"}},
						remove : {method : "DELETE",params : {fn : "delete"}},
						getUsers : {method : "GET",params : {fn : "getUsers"}},
						getProjects : {method : "GET",params : {fn : "getProjects"}},
						getInvoiceItems : {method : "GET",params : {fn : "getInvoiceItems"}},
						asignInvoice : {method : "POST",params : {fn : "asignInvoice"}},
						getCustomers : {method : "GET",params : {fn : "getCustomers"}},
						addCustomer : {method : "POST",params : {fn : "addCustomer"}},
						addProject : {method : "POST",params : {fn : "addProject"}},
						rejectInvoice : {method : "POST",params : {fn : "rejectInvoice"}},
						getTableColumnsNames : {method : "GET",params : {fn : "getTableColumnsNames"}},
						saveCreatedItem : {method : "POST",params : {fn : "saveCreatedItem"}},
						saveEditedItem : {method : "POST",params : {fn : "saveEditedItem"}},
						rejectItem : {method : "POST",params : {fn : "rejectItem"}},
						filterInvoices : {method : "POST",params : {fn : "filterInvoices"}},
						approveItem : {method : "POST",params : {fn : "approveItem"}},
						approveInvoice : {method : "POST",params : {fn : "approveInvoice"}},
						closeInvoice : {method : "POST",params : {fn : "closeInvoice"}},
						getcalculations: {method : "POST",params : {fn : "getcalculations"}},
						getAllInvoices: {method : "GET",params : {fn : "getAllInvoices"}},
						getFilteredEvents: {method : "POST",params : {fn : "getFilteredEvents"}},
						saveEditedPrject:{method: "POST",params:{fn : "saveEditedPrject" }}
					});
				}).service("socketio", function() {
					var socket = io.connect('http://165-3-13-46.tmcz.cz:8083');
					return socket;
				});

		// Initialize AngularJS manually

		angular.bootstrap(angular.element('html'), [ 'InvoicesApp' ]);
	

	};
	console.log("-----------init-------------");
	init_cont();
	

	/*
	 * DNode.connect(function (remote) { init_cont(remote); });
	 */

});
