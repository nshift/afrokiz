import { PutObjectCommand, S3 } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Readable } from 'stream'
import { Environment } from '../../environment'

export class S3Storage {
  private static ExpiresIn = 30 * 60

  constructor(private readonly client: S3, private readonly bucketName: string) {}

  static create(bucketName: string) {
    return new S3Storage(new S3({}), bucketName)
  }

  async uploadDocument(document: { binary: Buffer; name: string; type: string }, path: string) {
    await this.upload(document.binary, path, document.type)
    return { path, link: `https://${this.bucketName}.s3.${Environment.Region()}.amazonaws.com/${path}` }
  }

  async createUploadSignedUrl(path: string): Promise<{ path: string; url: URL }> {
    const command = new PutObjectCommand({ Bucket: this.bucketName, Key: path })
    const signedUrl = await getSignedUrl(this.client, command, { expiresIn: S3Storage.ExpiresIn })
    return { path, url: new URL(signedUrl) }
  }

  getDocument = (path: string): Promise<Buffer> => this.download(path)

  getFileUrl = async (path: string): Promise<string | null> => {
    try {
      await this.client.headObject({ Bucket: this.bucketName, Key: path })
      return `https://${this.bucketName}.s3.${Environment.Region()}.amazonaws.com/${path}`
    } catch {
      return null
    }
  }

  private upload(buffer: Buffer, path: string, contentType: string) {
    return this.client.putObject({
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
