function CrmCtrl($scope, $resource, dataService, $log) {

    var sublists = {};

    $scope.items = [];

    $scope.searchTerm = "";
    $scope.viewState = "list";

    $scope.setTable = function (schema, tbl) {
        $scope.viewState = "list";
        $scope.schema = schema;
        $scope.table = tbl;
        $scope.items = dataService.load({ns:schema, table:tbl}, function () {
            $log.info("loading done... ", $scope.items);
            switch (tbl) {
                default :
                    $scope.columns = [];
                    $scope.editcols = [];
                    if ($scope.items.data.length > 0) {
                        for (var prop in $scope.items.data[0]) {
                            switch (true) {
                                case prop == "id" : continue;
                                case prop == "filter_v" : continue;
                                case prop.length > 2 && prop.substring(prop.length - 2, prop.length) == "_x" :
                                    continue;
                                case prop.length > 2 && prop.substring(prop.length - 2, prop.length) == "_v" :
                                    $scope.columns.push({name:prop, label: prop, readonly: true, type: "string"});
                                    continue;
                                case prop.length > 3 && prop.substring(prop.length - 3, prop.length) == "_id" :
                                    var ft = prop.substring(0,prop.length - 3);
                                    $scope.editcols.push({name:prop, label: prop, readonly: false, f_table: ft, type: "combo"});
                                    continue;
                            }
                            var propdesc = {name:prop, label: prop, readonly: false, type: "string"};
                            $scope.editcols.push(propdesc);
                            $scope.columns.push(propdesc);
                        }
                    }
            }
        });
    }

    $scope.options = function(tbl) {
        $log.info("options", tbl);
        if (sublists[tbl]) {
            return sublists[tbl];
        } else {
            var options = dataService.load(tbl);
            sublists[tbl] = options;
            return options;
        }
    }

    $scope.create = function() {
        $scope.selectedItem = {};
        $scope.viewState = "edit";
    }

    $scope.save = function (tbl,data) {
        dataService.save({schema: $scope.schema, table: tbl, data:data}, function () {
            $log.info("save: ", tbl, data);
            $scope.search();
        });
        $scope.viewState = "list";
    }

    $scope.cancelEdit = function () {
        $scope.search();
        $scope.viewState = 'list';
    }

    $scope.edit = function (item) {
        $scope.selectedItem = item;
        $scope.viewState = "edit";
    }

    $scope.search = function () {
        $scope.items = dataService.load({ns: $scope.schema, table: $scope.table, search: $scope.searchTerm});
    }

    $scope.delete = function (i) {
        dataService.remove({schema: $scope.schema, table:$scope.table, id:i.id}, function () {
            $scope.search();
        });
    }

}
