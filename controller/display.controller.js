exports.display = async (req, res) => {
    // res.locals.outputUrl = req.query.outputUrl.toString();
    let session = req.session.context;

    console.log('[controller.display]')

    try {
        res.locals.sourceUrl = session.sourceUrl;
        res.locals.outputUrls = session.outputUrls;
        // if(session.downloadAll) {
        //     res.locals.outputLargeUrls = session.outputLargeUrls;
        // } else {
        //     if(session.downloadId) {
        //         res.locals.outputLargeUrls = [session.outputLargeUrls[session.downloadId]];
        //     } else {
        //         res.locals.outputLargeUrls = []
        //     }
        // }
    } catch(err) {
        res.locals.sourceUrl = null;
        res.locals.outputUrls = [];
        // res.locals.outputLargeUrls = ['http://local/1.png'];
    }

    console.log('[controller.display]', session, res.locals);
    res.render('pages/display');
}