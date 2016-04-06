/**
 * Created by paulosimao on 13/03/16.
 */

var PdfReader = require('paulosimao.pdfreader');
var fs        = require('fs');

function handleFile(lpath, params, pre) {

	//res.writeHead(200, {'Connection': 'close'});

	var r1 = new PdfReader();

	r1.emitter.on('job-start', (files)=> {
		process.send({m: 'progress', event: 'job-start', data: files});
	});

	r1.emitter.on('job-end', (err)=> {
		if (err)process.send({m: 'error', err: err});
		process.send({m: 'progress', event: 'job-end', data: 'ok', evtat: new Date()});
		process.exit(0);
	});

	r1.emitter.on('page-start', (f)=> {
		//res.write('\nStarting page' + JSON.stringify(f, null, 4));
		process.send({m: 'progress', event: 'page-start', data: f, evtat: new Date()})
	});
	r1.emitter.on('page-end', (f)=> {
		process.send({m: 'progress', event: 'page-end', data: f, evtat: new Date()});

	});

	r1.gettext(lpath, {
		lang    : params.lang,
		tessdata: '/usr/share/tesseract-ocr/tessdata/'
	}, (err, pages)=> {
		if (err) process.send({m: 'error', err: err, evtat: new Date()});
		fs.unlinkSync(lpath);
	});
}

process.on('message', (o)=> {
	var lp;
	if (o.m === 'init') {
		lp = o.lpath;
		handleFile(o.lpath, o.params, o.pre);
	} else if (o.m === 'cancel') {
		console.log('Cancelled by user.');
		process.exit(1);
	}


});