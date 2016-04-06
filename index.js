/**
 * Created by paulosimao on 12/03/16.
 */
var http        = require('http');
var path        = require('path');
var fs          = require('fs');
var Busboy      = require('busboy');
var os          = require('os');
var uuid        = require('uuid');
var PdfReader   = require('./pdfreader');
var inspect     = require('util').inspect;
var chilprocess = require('child_process');

var express = require('express');
var app     = express();

var progressHandler = {};
var processes       = {};


app.post('/dopost', (req, res) => {
	var busboy = new Busboy({headers: req.headers});

	var pre   = uuid();
	var lpath = path.join(os.tmpDir(), pre + '.pdf');

	var params = {};

	busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
		params[fieldname] = val;
	});

	busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
		file.pipe(fs.createWriteStream(lpath));
	});

	busboy.on('finish', function () {
		handleFile(pre, lpath, params, req, res);
		res.json({pre: pre});
		res.end();
	});
	return req.pipe(busboy);
});


app.get('/getprogress/:pre', (req, res)=> {
	res.json(progressHandler[req.params['pre']]);
	res.end();
})

app.get('/cancel/:pre', (req, res)=> {
	console.log('Cancelling:' + req.params['pre']);
	if (processes[req.params['pre']]) {
		processes[req.params['pre']].send({m: 'cancel'});
		delete processes[req.params['pre']];
	}
	res.json({msg: 'ok'});
	res.end();
})

app.use(express.static('webroot'));

app.listen(8080, function () {
	console.log('Example app listening on port 3000!');
});


function handleFile(pre, lpath, params, req, res) {
	var p = chilprocess.fork(__dirname + '/fork.js');
	p.send({m: 'init', lpath: lpath, params: params, pre: pre});
	progressHandler[pre] = {status: 'start', items: [], startedat: new Date()}
	;
	p.on('message', (o) => {
		if (o.m === 'progress') {
			progressHandler[pre].items.push(o);
			progressHandler[pre].status = o.event;
			//console.log(JSON.stringify(o, null, 4));
		}
	});

}

function cleanupmem() {
	for (d in progressHandler) {
		if (new Date().getTime() - progressHandler[d].startedat.getTime() > 30 * 1000) {
			console.log('Cleaning up:' + d);
			delete progressHandler[d];
		}
	}
	setTimeout(cleanupmem, 60 * 1000);
}
