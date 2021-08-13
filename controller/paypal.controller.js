const paypal = require('paypal-rest-sdk');
const { getS3ReadUrlExport } = require('../engine/getReadUrl');

const PRICE_PER_MOCK = 2;
const TOTAL_MOCK_NUMBER = process.env.TOTAL_MODEL_NUMBER;

const sendPaymentRequest = async (payload) => {
    return new Promise((resolve, reject) => {
        paypal.payment.create(payload, function (error, payment) {
            if (error) {
                reject(error);
            } else {
                resolve(payment);
            }
        });
    })
}

const getPaymentDetail = (paymentId, payload) => {
    return new Promise((resolve, reject) => {
        paypal.payment.execute(paymentId, payload, function (error, payment) {
            if (error) {
                reject(error);
            } else {
                resolve(payment);
            }
        });
    })
}

exports.success = async (req, res) => {

    console.log('[controller.success]', req.query);

    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = { "payer_id": payerId, };

    try {
        let details = await getPaymentDetail(paymentId, execute_payment_json);
        let urls = [];

        if (req.query.imageId) { // If single download
            urls = [await getS3ReadUrlExport(process.env.S3_BUCKET_NAME, 'high/' + req.query.imageId + '.jpg')];
        } else { // If all download
            if (details.transactions[0].item_list.items[0].quantity == 43) { // In case of all paid
                for (let i = 0; i < TOTAL_MOCK_NUMBER; i++) {
                    let middleKey = 'high/' + (Number(process.env.S3_OUTPUT_JPG_START_KEY) + i) + '.jpg';
                    urls.push(await getS3ReadUrlExport(process.env.S3_BUCKET_NAME, middleKey));
                }
                res.locals.outputLargeUrls = urls;
            }
        }
        res.locals.outputLargeUrls = urls;
        res.render('pages/success');

    } catch (err) {
        console.log('[payment detail]', err);
        res.locals.outputLargeUrls = [];
        res.render('pages/success');
    }

}

exports.transfer = async (req, res) => {

    let quantity = 1;
    let returnUrl = "http://localhost:3000/paypal/success";
    const isAll = req.body.isAll == 'true';

    if (isAll) {
        quantity = TOTAL_MOCK_NUMBER;
    } else {
        returnUrl += "?imageId=" + req.body.id;
    }

    paypal.configure({
        'mode': "sandbox",
        'client_id': process.env.PAYPAL_CLIENT_ID,
        'client_secret': process.env.PAYPAL_SECRET
    });

    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": returnUrl,
            "cancel_url": "http://localhost:3000/display"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Logo Mockup",
                    "sku": "item",
                    "price": (PRICE_PER_MOCK.toFixed(2)).toString(),
                    "currency": "USD",
                    "quantity": quantity
                }]
            },
            "amount": {
                "currency": "USD",
                "total": ((PRICE_PER_MOCK * quantity).toFixed(2)).toString()
            },
            "description": "Logo Mockup payment"
        }]
    };

    let payResult = await sendPaymentRequest(create_payment_json);
    let link = payResult.links.find(item => item.method == 'REDIRECT');

    if (link) {
        res.send({ success: true, link: link.href });
    } else {
        res.send({ success: false, link: '' });
    }
}

