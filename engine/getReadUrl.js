const AWS = require('aws-sdk')

exports.getS3ReadUrlExport = async (bucket, key) => {
	let s3 = new AWS.S3({
		accessKeyId: process.env.S3_ACCESS_KEY_ID,
		// endpoint: new AWS.Endpoint(process.env.S3_ENDPOINT),
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
		signatureVersion: 'v4',
	});
	const options = {
		Bucket: bucket,
		Key: key,
		ResponseContentDisposition: 'attachment',
		Expires: 3600
	}
	return s3.getSignedUrl('getObject', options)
}