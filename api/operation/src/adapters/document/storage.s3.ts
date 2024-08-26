import { S3 } from '@aws-sdk/client-s3'
import { Environment } from '../../environment'

export class S3Storage {
  constructor(private readonly client: S3, private readonly bucketName: string) {}

  static create(bucketName: string) {
    return new S3Storage(new S3({}), bucketName)
  }

  async uploadDocument(document: { binary: Buffer; name: string; type: string }, path: string) {
    await this.upload(document.binary, path, document.type)
    return { path, link: `https://${this.bucketName}.s3.${Environment.Region()}.amazonaws.com/${path}` }
  }

  private upload(buffer: Buffer, path: string, contentType: string) {
    return this.client.putObject({
      Bucket: this.bucketName,
      Key: path,
      Body: buffer,
    })
  }
}
