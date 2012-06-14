function DevTestCtrl($scope, $resource, wrhsService, $log) {



    $scope.test1 = function() {
        $log.info("Test 1");
        $("#in1").focus();
    }

    $scope.test2 = function() {
        $log.info("Test 2");
        $("#in2").focus();
    }

}
