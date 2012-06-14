

function GraphCtrl($scope, $resource) {
    var stations = $resource("svc/station").get({table: "instance"}, function () {
        console.log(stations);
        $scope.stations = stations.data;
    });

    var StationService = $resource("svc/station/:station/:code", {station:3, code:108, limit:100});

    $scope.gr = Raphael("graph");

    $scope.graphRefresh = function () {
        if ($scope.selectedStation) {
            var station = $scope.selectedStation;
            var limit = $scope.dataLimit || 100;
            var result = StationService.get({station:station.id, code:108, limit: limit}, function () {
                var tsdata = result.data.map(function (a) {
                    return Date.parse(a.ts);
                });
                var valdata = result.data.map(function (a) {
                    return a.val;
                });
                $scope.gr.clear();
                $scope.gr.linechart(10, 10, 600, 400, tsdata, [valdata], { symbol: "circle", smooth: true });
            });
        }
    };
}
