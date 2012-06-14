function ServiceCtrl($scope, $resource, svcService) {
    var IssuesService = $resource("svc/service.issue", {});

    var EventsService = $resource("svc/service.event", {});

    $scope.issues = IssuesService.get({});
    $scope.events = [];
    $scope.searchTerm = "";

    $scope.serviceState = "issues";

    $scope.stations = svcService.stations();
    $scope.operators = svcService.operators();

    $scope.createNewIssue = function() {
        $scope.selectedIssue = {summary: ""};
        $scope.serviceState = "events";
    }

    $scope.saveData = function(data) {
        console.log(data);
        IssuesService.save(data, function() {
            $scope.search();
        });
        $scope.serviceState = "issues";
    }

    $scope.cancelEdit = function() {
        $scope.search();
        $scope.serviceState = 'issues';
    }

    $scope.edit = function(issue) {
        $scope.selectedIssue = issue;
        $scope.serviceState = "events";
        var events = EventsService.get({issue:issue.id}, function () {
            $scope.events = events.data;
        });
    }

    $scope.search = function() {
        $scope.issues = IssuesService.get({search: $scope.searchTerm});
    }

    $scope.delete = function(i) {
        IssuesService.remove({id:i.id}, function(){
            $scope.search();
        });
    }

}
