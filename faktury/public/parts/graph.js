function GraphCtrl($scope, analysisService) {

    $scope.stations = [];
    $scope.stationVars = [];
    $scope.selectedVars = [];

    $scope.stations = analysisService.stations();
    $scope.stationVars = analysisService.vars();

    $scope.dateChanged = function() {
        console.log($scope);
    }

    var graphSelected = function (ev) {
        if (ev.xAxis) {
            $scope.tsFrom = ev.xAxis[0].min;
            $scope.tsTo = ev.xAxis[0].max;
        }
    };

    var createGraph = function () {
        return new Highcharts.Chart({
            chart:{
                renderTo:'graph',
                type:'spline',
                zoomType:'x',
                events:{
                    selection:graphSelected
                }
            },

            title:{
                text:'Storage pressure'
            },

            subtitle:{
                text:'Shows data from station'
            },

            xAxis:{
                type:'datetime',
                dateTimeLabelFormats:{ // don't display the dummy year
                    month:'%e. %b',
                    year:'%b'
                }
            },

            yAxis:{
                title:{
                    text:'Pressure (bar)'
                }
            },

            series:[],

            tooltip:{
                formatter:function () {
                    return '<b>' + this.series.name + '</b><br/>' +
                        Highcharts.dateFormat('%e. %b', this.x) + ': ' + this.y;
                }

            }
        });
    };

    var chart = createGraph();

    $scope.changeStation = function () {
        $scope.graphRefresh();
    };

    function setTs(time,dt) {
        time = "" + time;
        var nums = time.split(":");
        while (nums.length < 3) {
            nums.push("0");
        }
        dt.setHours(Number(nums[0]));
        dt.setMinutes(Number(nums[1]));
        dt.setSeconds(Number(nums[2]));
    }

    $scope.selectStationVar = function() {
        var svar = $scope.selectedStationVar;
        $scope.selectedVars.push(svar);
        $scope.graphAddVar(svar);
    }

    $scope.graphAddVar = function (svar) {
        if ($scope.selectedStation && svar) {
            var station = $scope.selectedStation;
            var tsFrom = new Date(), tsTo = new Date();
            tsFrom.setTime(tsFrom.getTime()-5*60*60*1000);

            if ($scope.fromDate) {
                tsFrom = $scope.fromDate;
            }

            if ($scope.untilDate) {
                tsTo = $scope.untilDate;
            }

            if ($scope.fromTime) {
                setTs($scope.fromTime,tsFrom);
            }

            if ($scope.untilTime) {
                setTs($scope.untilTime,tsTo);
            }

            var pars = {sid:station.id, code:svar.id, tsFrom:tsFrom, tsTo:tsTo};
            console.log(pars);
            var vardata = analysisService.vardata(pars, function() {
                var grdata = vardata.data.map(function (a) {
                    return [Date.parse(a.ts), a.val];
                });

                var type = "spline";
//                if (svar.code.split(".")[0]=="ai")
//                    type = "spline";
//                if (svar.code.split(".")[0]=="do")
//                    type = "bar";

                chart.addSeries({
                    name:svar.code,
                    data:grdata,
                    type:type
                });
            });
        }
    };

    $scope.resetGraph = function() {
        $scope.selectedVars = [];
        $scope.graphRefresh();
    }

    $scope.graphRefresh = function () {
        chart = createGraph();
        for (var i in $scope.selectedVars) {
            $scope.graphAddVar($scope.selectedVars[i]);
        }
    };
}
