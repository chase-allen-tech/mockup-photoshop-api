/* import useful modules */
const AWS = require('aws-sdk')
const auth = require('@adobe/jwt-auth')

const axios = require('axios');
const { buildJWTConfig, uploadFileToS3, processImage, processImageResize } = require('../utils');

/********************************** CONST *****************************************/
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
// const OUTPUT_KEY = process.env.S3_OUTPUT_KEY;

/********************************** S3 *****************************************/
const s3 = new AWS.S3({
	accessKeyId: process.env.S3_ACCESS_KEY_ID,
	// endpoint: new AWS.Endpoint(process.env.S3_ENDPOINT),
	secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
	signatureVersion: 'v4',
});

/********************************** Obtain *****************************************/


const getS3ReadUrl = async (bucket, key) => {
	const options = {
		Bucket: bucket,
		Key: key,
		ResponseContentDisposition: 'attachment',
		Expires: 36000
	}
	return s3.getSignedUrl('getObject', options)
}
async function getS3WriteUrl(bucket, key) {
	const options = {
		Bucket: bucket,
		Key: key,
	}
	return await s3.getSignedUrl('putObject', options)
}


/********************************** Obtain *****************************************/
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const showError = (header, processUrl) => {
	axios.get(processUrl, { headers: header }).then(res => {
		console.log('[Result]', res.data.outputs[0].errors);
	}).catch(err => {
		console.log('[errors]', err);
	})
}

async function main(fileName) {
	const jwt_config = await buildJWTConfig();
	const authInfo = await auth(jwt_config);

	const header = {
		Authorization: `Bearer ${authInfo.access_token}`,
		'x-api-key': process.env.ADOBE_CLIENT_ID
	}

	console.log('[UPLOADING TO S3]')
	await uploadFileToS3(s3, fileName);
	await sleep(5000);

	let outSmallUrls = [];
	let outLargeUrls = [];

	const testJPGUrl = await getS3ReadUrl(BUCKET_NAME, '1.jpg');
	const sourceReadUrl = await getS3ReadUrl(BUCKET_NAME, process.env.S3_INPUT_PNG_KEY);
	const sourceSmallWriteUrl = await getS3WriteUrl(BUCKET_NAME, 'smallSource.jpg');
	const sourceSmallReadUrl = await getS3ReadUrl(BUCKET_NAME, 'smallSource.jpg');

	let processUrl = await processImageResize(header, sourceReadUrl, testJPGUrl, sourceSmallWriteUrl);
	// showError(header, processUrl);
	await sleep(5000)

	for (let i = 0; i < process.env.TOTAL_MODEL_NUMBER; i++) {
		let inputKey = 'mockup' + (Number(process.env.S3_INPUT_PSD_START_KEY) + i) + '.psd';
		let middleKey = 'high/' + (Number(process.env.S3_OUTPUT_JPG_START_KEY) + i) + '.jpg';
		let targetKey = 'low/' + (Number(process.env.S3_OUTPUT_JPG_START_KEY) + i) + '.jpg';

		let refUrl = await getS3ReadUrl(BUCKET_NAME, inputKey)
		let middleWriteUrl = await getS3WriteUrl(BUCKET_NAME, middleKey);
		let targetWriteUrl = await getS3WriteUrl(BUCKET_NAME, targetKey);

		// Process Image
		let processUrl = await processImage(header, refUrl, sourceReadUrl, middleWriteUrl);
		showError(header, processUrl);
		await sleep(25000)

		// Resize the image
		let middleReadUrl = await getS3ReadUrl(BUCKET_NAME, middleKey)
		processUrl = await processImageResize(header, middleReadUrl, testJPGUrl, targetWriteUrl);
		showError(header, processUrl);
		let targetReadUrl = await getS3ReadUrl(BUCKET_NAME, targetKey);

		outSmallUrls.push(targetReadUrl);
		outLargeUrls.push(middleReadUrl);
	}

	const payload = {
		sourceUrl: sourceSmallReadUrl,
		outputUrls: outSmallUrls,
		outputLargeUrls: outLargeUrls,
		fileName: fileName,
		downloadAll: false
		// processId: processUrl,
		// errors: processResult.data.outputs[0].errors
	}

	return payload
}

module.exports = main;
