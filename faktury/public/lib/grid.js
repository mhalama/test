angular.Array.skip = function (array, value) { return array.slice(value)}

angular.widget('@ng:grid', function(expression, template) {

    //HEADER
    var header = angular.element('<thead><tr></tr></thead>'),
        headerRow = header.children('tr'),
        count = 0,
        tr = template.children('tbody').children('tr')
    expa = tr.attr('ng:repeat');

    tr.attr('ng:repeat', expa + '.$orderBy(ngGridSortPagination.predicate, ngGridSortPagination.reverse).$skip(ngGridSortPagination.skipAt).$limitTo(ngGridSortPagination.limit)');

    angular.forEach(tr.children('td'), function(elm) {
        var column = angular.element(elm),
            exp = column.html(),
            exp = exp.replace(/[{}\s]/g, ""),
            name = exp.split(/\.(.+)?/)[1].split(/\|/)[0],
            filter = exp.split(/\.(.+)?/)[1].split(/\|/)[1],
            filterAttrib = (!filter) ? "" : ' filter="' + filter + '"' ,
            title = column.attr('title') || name;

        var headerCol = headerRow.append('<th class="ui-state-default" name="' + name +'"'+  filterAttrib + '" style="cursor: pointer;"><span style="display:inline-block">  </span>' + title + '</th>');
        column.addClass('ui-widget-content');
        column.attr('title', null);
        count += 1;
    });

    template.addClass('ui-widget');
    template.prepend(header);


    //PAGINATION
    var pager = angular.element('<tfoot class="ui-state-default"><tr><td align="center" colspan="' + count + '"></td></tr></tfoot>'),
        page = pager.children('tr').children('td');
    page.append('<span style="cursor: pointer; display:inline-block; margin-left:10px;; vertical-align:middle" class="ui-icon ui-icon-seek-first ui-state-disabled"></span>');
    page.append('<span style="cursor: pointer; display:inline-block; margin-left:10px;; vertical-align:middle" class="ui-icon ui-icon-seek-prev ui-state-disabled"></span>');
    page.append('<span style="display:inline-block; margin-left:10px;" class="ui-state-disabled">|</span>');
    page.append('<span >Page<input id="ui-pg-input" ng:model="ngGridSortPagination.page" class="ui-pg-input" type="text" size="2" maxlength="4" value="0"> of <span >{{ngGridSortPagination.lastPage}}</span> </span>');
    page.append('<span style="display:inline-block" class="ui-state-disabled" style="margin-left:5px;">|</span>');
    page.append('<span style="cursor: pointer; display:inline-block; vertical-align:middle; margin-left:10px;" class="ui-icon ui-icon-seek-next"></span>');
    page.append('<span style="cursor: pointer; display:inline-block; vertical-align:middle; margin-left:10px;" class="ui-icon ui-icon-seek-end"></span>');
    page.append('<span style="display:inline-block; margin-left:10px;" ><select ng:model="ngGridSortPagination.limit" class="ui-pg-selbox"></select></span>');
    page.children('span').children('select').append('<option  value="10" selected="selected">10</option><option  value="20">20</option><option  value="30">30</option>');

    page.children('span').children('.ui-pg-input').change(function() { alert('change')})  //

    template.append(pager);

    // tell compiler to compile children
    this.directives(true);
    this.descend(true);

    return  function (linkElement) {
        var scope = this;
        scope.ngGridSortPagination = {};
        var grid = scope.ngGridSortPagination;

        //PAGINATION
        var pager = linkElement.children('tfoot').children('tr').children('td'),
            count = angular.Array.count(scope.todos);
        grid.limit = 10;
        grid.lastPage = Math.round(count/grid.limit) + 1
        grid.page = 1;
        grid.skipAt = ((grid.page - 1) * grid.limit);

        pager.children('.ui-icon-seek-first').click(function() {
            grid.page = 1;
            grid.skipAt = 1;
            angular.element(this).addClass('ui-state-disabled');
            pager.children('.ui-icon-seek-prev').addClass('ui-state-disabled');
            pager.children('.ui-icon-seek-next, .ui-icon-seek-end').removeClass('ui-state-disabled');
            //pager.children('').removeClass('ui-state-disabled');
            grid.skipAt = ((grid.page - 1) * grid.limit);
            scope.$digest();
            console.log('fisrt')
        })
        pager.children('.ui-icon-seek-prev').click(function() {
            pager.children('.ui-icon-seek-next, .ui-icon-seek-end').removeClass('ui-state-disabled');
            if (grid.page > 1 ) {
                grid.page -= 1
                grid.skipAt = ((grid.page - 1) * grid.limit);
                scope.$digest();
            }
            if (grid.page === 1) {
                angular.element(this).addClass('ui-state-disabled');
                pager.children('.ui-icon-seek-first').addClass('ui-state-disabled');
            }
            console.log('prev')
        })
        pager.children('.ui-icon-seek-next').click(function() {
            pager.children('.ui-icon-seek-first, .ui-icon-seek-prev').removeClass('ui-state-disabled');
            //pager.children('').removeClass('ui-state-disabled');
            if (grid.page < grid.lastPage ) {
                grid.page += 1
                grid.skipAt = ((grid.page - 1) * grid.limit);
                scope.$digest();
            }
            if (grid.page === grid.lastPage ) {
                angular.element(this).addClass('ui-state-disabled');
                pager.children('.ui-icon-seek-end').addClass('ui-state-disabled');
            }
            console.log('next')
        })
        pager.children('.ui-icon-seek-end').click(function() {
            grid.page = grid.lastPage;
            pager.children('.ui-icon-seek-prev, .ui-icon-seek-first').removeClass('ui-state-disabled');
            //pager.children('').removeClass('ui-state-disabled');
            angular.element(this).addClass('ui-state-disabled');
            pager.children('.ui-icon-seek-next').addClass('ui-state-disabled');
            grid.skipAt = ((grid.page - 1) * grid.limit);
            scope.$digest();
            console.log('end')
        })

        pager.children('span').children('.ui-pg-selbox').change(function(ev) {
            grid.lastPage = Math.round(count/ev.target.value) + 1
            grid.page = 1;
            grid.skipAt = ((grid.page - 1) * ev.target.value);
            scope.$digest();
        })


        //ORDER
        var listenerOrder =  function(ev) {
            var sort = angular.element(this).children('span');
            grid.predicate = angular.element(this).attr('name');
            grid.reverse = false;
            if (!sort.hasClass('ui-icon-triangle-1-n') && !sort.hasClass('ui-icon-triangle-1-s')) {
                headerRow.children('th').children('span').removeClass('ui-icon ui-icon-triangle-1-n ui-icon-triangle-1-s');
                sort.addClass('ui-icon ui-icon-triangle-1-n');
                grid.reverse = false;
            } else {
                if (sort.hasClass('ui-icon-triangle-1-n')) {
                    grid.reverse = true;
                } else {
                    grid.reverse = false;
                }
                sort.toggleClass('ui-icon-triangle-1-n');
                sort.toggleClass('ui-icon-triangle-1-s');
            }
            console.log('orderBy :' + grid.predicate + '   order: ' + grid.reverse)  ;
            scope.$digest();
        };

        angular.forEach(template.children('thead').children('tr').children('th'), function(elm) {
            elm.addEventListener('click', listenerOrder);  //
        })
    }
});

angular.filter('checkmark', function(input) {
    return input ? '\u2713' : '';
});
