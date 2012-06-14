function EventsCtrl($scope, analysisService) {

    $scope.stations = [];
    $scope.wizards = [];
    $scope.filters = [];
    $scope.params = [];
    $scope.periods = [
        {
            id:"H",
            name:"Hodiny"
        },
        {
            id:"D",
            name:"Dny"
        },
        {
            id:"M",
            name:"Měsíce"
        }
    ];
    $scope.events = [];

    $scope.stations = analysisService.stations();

    $scope.wizards = analysisService.wizards();

    $scope.selectWizard = function (wz) {
        var wfs = analysisService.wizardFilters({wid:wz.id}, function () {
            $scope.filters = wfs;
            $scope.params = [];
            $scope.params[wfs.length - 1] = null;
        });
    };

    $scope.query = function () {
        var pars = [];
        pars[0] = $scope.station.id;
        pars[1] = $scope.fromDate;
        pars[2] = $scope.untilDate;
        pars = pars.concat($scope.params);
        console.log(pars);
        var rs = analysisService.wizardQuery({wid:$scope.wizard.id, params:pars}, function () {
            $scope.columns = [];
            $scope.items = statcalc(rs.data);
            if ($scope.items.length > 0) {
                for (var prop in $scope.items[0]) {
                    var propdesc = {name:prop, label:prop, readonly:false, type:"string"};
                    $scope.columns.push(propdesc);
                }

                createChart($scope.items);
            }
        });
    }

    function createChart(data) {
        var datacat = [];
        var datacnt = [];
        var datadiff = [];
        for (var i = 0; i < data.length; i++) {
            datacat.push(data[i].dt);
            datacnt.push(data[i].count);
            datadiff.push(data[i].timediff); // in hours
        }

        chart = new Highcharts.Chart({
            chart:{
                renderTo:'graph',
                type:'column'
            },

            title:{
                text:'Analýza událostí'
            },

            subtitle:{
                text:'Počet a celkový čas trvání'
            },
            xAxis:{
                categories:datacat
            },

            yAxis:{
                min:0,
                title:{
                    text:'Počet # a Trvání v hodinách'
                }
            },

            legend:{
                layout:'vertical',
                backgroundColor:'#FFFFFF',
                align:'left',
                verticalAlign:'top',
                x:100,
                y:70,
                floating:true,
                shadow:true
            },

            tooltip:{
                formatter:function () {
                    return '' +
                        this.x + ': ' + this.y;
                }
            },

            plotOptions:{
                column:{
                    pointPadding:0.2,
                    borderWidth:0
                }
            },

            series:[
                {
                    name:"Počet #",
                    data:datacnt
                },
                {
                    name:"Čas v hodinách",
                    data:datadiff
                }
            ]
        });
    }

    function statcalc(datalist) {
        var counter = {};
        var timediff = {};
        for (var i = 0; i < datalist.length; i++) {
            var data = datalist[i];
            var dt = new Date(data.from_date);
            var ldt = dt.getFullYear() + "-" + (dt.getMonth()+1);
            switch ($scope.period.id) {
                case "D" :
                    ldt += "-" + dt.getDate();
                    break;
                case "H" :
                    ldt += "-" + dt.getDate();
                    ldt += " " + dt.getHours();
                    break;
            }

            if (typeof(counter[ldt]) === "undefined") {
                counter[ldt] = 1;
                timediff[ldt] = datalist[i].timediff / 3600;
            } else {
                counter[ldt]++;
                timediff[ldt] += datalist[i].timediff / 3600;
            }
        }

        var arr = [];
        for (var dt in counter) {
            var vo = {dt:dt, count:counter[dt], timediff:timediff[dt]};
            arr.push(vo);
        }

        return arr;
    }
}