import { GetObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Readable } from 'stream'

export class S3Storage {
  private static ExpiresIn = 30 * 60

  constructor(private readonly client: S3, private readonly bucketName: string) {}

  static create(bucketName: string) {
    return new S3Storage(new S3({}), bucketName)
  }

  async uploadDocument(document: { binary: Buffer; name: string; type: string }, path: string) {
    await this.upload(document.binary, path, document.type)
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: path })
    const signedUrl = await getSignedUrl(this.client, command, { expiresIn: S3Storage.ExpiresIn })
    return { path, link: new URL(signedUrl) }
  }

  async createUploadSignedUrl(path: string): Promise<{ path: string; url: URL }> {
    const command = new PutObjectCommand({ Bucket: this.bucketName, Key: path })
    const signedUrl = await getSignedUrl(this.client, command, { expiresIn: S3Storage.ExpiresIn })
    return { path, url: new URL(signedUrl) }
  }

  getDocument = (path: string): Promise<Buffer> => this.download(path)

  private async upload(buffer: Buffer, path: string, contentType: string): Promise<void> {
    await this.client.putObject({
      Bucket: this.bucketName,
      Key: path,
      Body: buffer,
    })
  }

  private async download(path: string): Promise<Buffer> {
    const s3Response = await this.client.getObject({ Bucket: this.bucketName, Key: path })
    if (!s3Response.Body) {
      return Promise.reject(`Failed to get ${path} picture.`)
    }
    const stream = s3Response.Body as Readable
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = []
      stream.on('data', (chunk: any) => chunks.push(chunk))
      stream.once('error', reject)
      stream.once('end', () => resolve(Buffer.concat(chunks)))
    })
  }
}
