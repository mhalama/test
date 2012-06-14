// http://165-3-13-46.tmcz.cz:8086/svc/data?tbl=invoice&id=1

app.get('/svc/data', function(req, res) {
    res.contentType('json');
    var sql = "select * from " + req.query.tbl + " where id=$1";

    db.query(sql, [req.query.id], function(err,rs) {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
        	test(err);
            res.json({success: true, data:rs.rows});
        }
    });
});

function test(msg) {
	console.log(msg);
}

/*

function f(od) {
	var x=od;
	
	return { fn : function() { x++; console.log(x); }, reset : function() {x=0;}};
}

var obj = f(1);
obj.fn();
obj.reset();

*/
