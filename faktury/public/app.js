angular.module('PumaApp', ['ngResource', 'ui'])
    .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/graph', {template:'parts/graph.html', controller:GraphCtrl}).
        when('/home', {template:'parts/home.html', controller:HomeCtrl}).
        when('/service', {template:'parts/service.html', controller:ServiceCtrl}).
        when('/wrhs', {template:'parts/wrhs.html', controller:WrhsCtrl}).
        when('/crm', {template:'parts/crm.html', controller:CrmCtrl}).
        when('/devtest', {template:'parts/devtest.html', controller:DevTestCtrl}).
        otherwise({redirectTo:'/home'});
}])
    .service('pumaService', function ($log) {
        var x = {};

        DNode.connect(function(remote) { x.remote = remote; });

        return x;
    })
    .service('wrhsService', function ($resource, $log) {
        var service = $resource("svc/wrhs", {});

        return {
            load:function (tbl, fn) {
                return service.get({table: tbl}, fn);
            },
            filter:function (tbl,st) {
                $log.info("filter!")
                return service.get({table: tbl, search:st})
            },
            save: function(tbl,data,callback) {
                service.save({table: tbl, data: data},callback);
            },
            remove: function(id,callback) {
                service.remove({id: id}, callback);
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
