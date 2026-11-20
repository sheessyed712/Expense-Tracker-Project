import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

export const uploadToS3 = async (data, filename) => {
    const bucketName = process.env.AWS_BUCKET_NAME;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: data,
        ContentType: "text/csv"
    });

    await s3Client.send(command);

    // Return the public S3 URL of the uploaded file
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
};