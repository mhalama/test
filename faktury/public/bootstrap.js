head.js(
    { jquery:"lib/jquery.min.js"},
    { jquery_ui:"lib/jquery-ui.min.js"},
    { twitter_bootstrap:"bootstrap/js/bootstrap.min.js"},
    { angular:"lib/angular-1.0.0rc6.js"},
    { angular_resource:"lib/angular-resource-1.0.0rc6.js"},
    { select2:"lib/select2.js"},
    { angular_ui:"lib/angular-ui.js"},
//    { dnode:"lib/dnode.js"},
    { highcharts:"lib/highcharts.js"},
    { highcharts_exporting:"lib/exporting.js"},

    { listeditor:"parts/components/listeditor.js"},
    { part_graph:"parts/graph.js"},
    { part_events:"parts/events.js"},
    { part_home:"parts/home.js"},
    { part_service:"parts/service.js"},
    { part_wrhs:"parts/wrhs.js"},
    { part_crm:"parts/crm.js"},
    { part_devtest:"parts/devtest.js"}
);

head.ready(function () {
    init_cont = function () {
        angular.module('PumaApp', ['ngResource', 'ui'])
            .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.
                when('/graph', {template:'parts/graph.html', controller:GraphCtrl}).
                when('/events', {template:'parts/events.html', controller:EventsCtrl}).
                when('/home', {template:'parts/home.html', controller:HomeCtrl}).
                when('/service', {template:'parts/service.html', controller:ServiceCtrl}).
                when('/wrhs', {template:'parts/wrhs.html', controller:WrhsCtrl}).
                when('/crm', {template:'parts/crm.html', controller:CrmCtrl}).
                when('/devtest', {template:'parts/devtest.html', controller:DevTestCtrl}).
                otherwise({redirectTo:'/home'});
        }])
            .directive("datalist", function(dataService){
                return {
                    restrict: "E",
                    scope: {
                        schema : "bind",
                        table  : "bind"
                    },
                    templateUrl: "parts/components/datalist.html",
                    link: function(scope, element, attrs) {
                        console.log("------------------------");
                        console.log(dataService);
                        console.log("------------------------");
                        console.log("scope", scope);
                        console.log("------------------------");
                        console.log("element", element);
                        console.log("------------------------");
                        console.log("attrs", attrs);
                        console.log("------------------------");
                        scope.colums=[{name:"x", label:"x"}];
                        scope.items={date:[{x: "1"},{x: "2"}]};
                    }
                }
            })
            .factory('dataService', function ($resource) {
                return $resource("svc/data/:fn", {}, {
                    load: {method: "GET", params: {fn: "load"}},
                    save: {method: "POST", params: {fn: "save"}},
                    remove : {method: "DELETE", params: {fn: "delete"}}
                });
            })
            .factory('analysisService', function ($resource) {
                return $resource("svc/analysis/:fn", {}, {
                    vars: {method: "GET", params: {fn: "vars"}},
                    stations: {method: "GET", params: {fn: "stations"}},
                    vardata: {method: "GET", params: {fn: "vardata"}},
                    wizards : {method: "GET", params: {fn: "wizards"}},
                    wizardFilters : {method: "GET", params: {fn: "wizard_filters"}},
                    wizardQuery : {method: "POST", params: {fn: "wizard_query"}}
                });
            })
            .service('wrhsService', function ($resource, $log) {
                var service = $resource("svc/data/wrhs", {});

                return {
                    load:function (tbl, fn) {
                        return service.get({table:tbl}, fn);
                    },
                    filter:function (tbl, st) {
                        $log.info("filter!")
                        return service.get({table:tbl, search:st})
                    },
                    save:function (tbl, data, callback) {
                        service.save({table:tbl, data:data}, callback);
                    },
                    remove:function (tbl, id, callback) {
                        service.remove({table: tbl, id:id}, callback);
                    }
                }
            })
            .service('svcService', function ($resource, $log) {
                var issueSvc = $resource("svc/service.issue", {});
                var eventSvc = $resource("svc/service.event", {});
                var stationSvc = $resource("svc/station.instance", {}); //TODO: move it to different service
                var operatorSvc = $resource("svc/service.operator", {});

                return {
                    stations:function () {
                        return stationSvc.get({})
                    },
                    operators:function () {
                        return operatorSvc.get({})
                    }
                }
            });

        // Initialize AngularJS manually

        angular.bootstrap(angular.element('html'), ['PumaApp']);
    };

    init_cont();

    /*
    DNode.connect(function (remote) {
        init_cont(remote);
    });
    */


});
