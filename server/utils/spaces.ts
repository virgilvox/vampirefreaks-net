import { createHash, createHmac } from "node:crypto"

// Uploads bytes to DigitalOcean Spaces (S3-compatible) with a hand-rolled
// SigV4-signed PUT, so there is no AWS SDK dependency and no browser CORS to
// configure: the bytes go server to Spaces. Files are stored public-read and
// served through the CDN. The signing secret stays in the server environment.
//
// EXIF stripping and thumbnail generation need an image library and are left for
// a later pass; this stores the original.

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest()
}
function sha256hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex")
}

export type SpaceConfig = {
  key: string
  secret: string
  bucket: string
  region: string
  cdnBase: string
}

// Returns the config when storage is wired, or null so handlers can fail with a
// clear "not configured" message rather than a signing crash.
function spaceConfig(): SpaceConfig | null {
  const key = process.env.SPACES_KEY
  const secret = process.env.SPACES_SECRET
  if (!key || !secret) return null
  const region = process.env.SPACES_REGION ?? "sfo3"
  const bucket = process.env.SPACES_BUCKET ?? "vampirefreaks"
  const cdnBase = (
    process.env.SPACES_CDN_BASE ?? `https://${bucket}.${region}.cdn.digitaloceanspaces.com`
  ).replace(/\/$/, "")
  return { key, secret, bucket, region, cdnBase }
}

// PUTs body to the object key and returns its public CDN URL. Throws a 5xx on a
// signing-config or upstream failure.
export async function uploadToSpaces(
  key: string,
  contentType: string,
  body: Buffer,
): Promise<string> {
  const cfg = spaceConfig()
  if (!cfg) throw createError({ statusCode: 503, statusMessage: "Media storage is not configured" })

  const host = `${cfg.bucket}.${cfg.region}.digitaloceanspaces.com`
  const service = "s3"
  const stamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "") // 20260605T120000Z
  const amzDate = stamp
  const dateStamp = stamp.slice(0, 8)
  const payloadHash = sha256hex(body)

  const canonicalUri = `/${key.split("/").map(encodeURIComponent).join("/")}`
  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-acl:public-read\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`
  const signedHeaders = "host;x-amz-acl;x-amz-content-sha256;x-amz-date"
  const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  const scope = `${dateStamp}/${cfg.region}/${service}/aws4_request`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256hex(canonicalRequest)}`

  const kDate = hmac(`AWS4${cfg.secret}`, dateStamp)
  const kRegion = hmac(kDate, cfg.region)
  const kService = hmac(kRegion, service)
  const kSigning = hmac(kService, "aws4_request")
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex")

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${cfg.key}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(`https://${host}/${canonicalUri.slice(1)}`, {
    method: "PUT",
    headers: {
      "x-amz-acl": "public-read",
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      "content-type": contentType,
      authorization,
    },
    body: new Uint8Array(body),
  })
  if (!res.ok) {
    throw createError({ statusCode: 502, statusMessage: "Upload failed" })
  }
  return `${cfg.cdnBase}/${key}`
}
