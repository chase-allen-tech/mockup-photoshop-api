const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const engine = require('../engine/index');

exports.home = async (req, res) => {
    res.render('pages/home');
}

const localUpload = async (req, fileName) => {
    return new Promise((resolve, reject) => {
        if(Object.keys(req.files).length == 0) {
            reject(null);
        }
        let uploadFile = req.files.cashbackfiles;

        uploadFile.mv('./uploads/' + fileName, err => {
            if(err) reject(null);
            resolve(true);
        })
    })
}

exports.uploadFile = async (req, res) => {
    try {
        let fileName = req.files.cashbackfiles.name;

        console.log('[LOCAL FILE UPLOADING]', fileName);
        await localUpload(req, fileName);

        console.log('[PROCESSING ENGINE]');
        req.session.context = await engine(fileName);

        res.statusCode = 200;
        res.redirect('/display');
        res.end();

    } catch (err) {
        console.log(err);
        res.statusCode = 200;
        res.redirect('/');
        res.end();
    }

}