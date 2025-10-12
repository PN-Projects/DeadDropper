# lambda-presign-upload-deaddropper (updated - includes manifest_presigned)
import os
import json
import time
import uuid
import boto3
from botocore.exceptions import ClientError

REGION = os.environ.get("REGION", "eu-north-1")
BUCKET = os.environ["BUCKET_NAME"]
DDB_TABLE = os.environ["DYNAMO_DROPS"]
EXPIRES = int(os.environ.get("PRESIGN_EXPIRES", "900"))

# what ACL and SSE we will sign with (canonical, explicit)
SIGNED_ACL = os.environ.get("SIGNED_ACL", "bucket-owner-full-control")
SIGNED_SSE = os.environ.get("SIGNED_SSE", "AES256")
# default content-type for chunk uploads (manifest will use application/json explicitly)
SIGNED_CONTENT_TYPE = os.environ.get("SIGNED_CONTENT_TYPE", "application/octet-stream")

s3 = boto3.client("s3", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(DDB_TABLE)

def generate_presign(bucket, key, expires, content_type=None):
    """
    Generate a presigned PUT URL that includes required signed headers.
    Accepts an optional content_type (e.g. 'application/json' for manifest).
    """
    try:
        params = {
            'Bucket': bucket,
            'Key': key,
            'ServerSideEncryption': SIGNED_SSE,
            'ACL': SIGNED_ACL,
        }
        # Only include ContentType param if present (it makes it part of the signed headers)
        if content_type:
            params['ContentType'] = content_type
        else:
            params['ContentType'] = SIGNED_CONTENT_TYPE

        url = s3.generate_presigned_url(
            ClientMethod='put_object',
            Params=params,
            ExpiresIn=expires
        )
        return url
    except ClientError as e:
        print("Presign error:", str(e))
        raise

def _prune_none_from_dict(d):
    return {k: v for k, v in d.items() if v is not None}

def _response(status_code, body_obj, origin=None):
    headers = {
        "Content-Type": "application/json"
    }
    # If we know frontend origin, add CORS header for browser
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "false"
    return {"statusCode": status_code, "headers": headers, "body": json.dumps(body_obj)}

def lambda_handler(event, context):
    print("DEBUG event:", json.dumps(event))
    try:
        # API Gateway HTTP API v2 => event['body'] is a string
        if isinstance(event, dict) and event.get("body"):
            body = event.get("body")
            payload = json.loads(body) if isinstance(body, str) else body
        else:
            payload = event if isinstance(event, dict) else {}

        chunks = payload.get("chunks", [])
        meta = payload.get("meta", {})
        creator_id = payload.get("creator_id")

        if not isinstance(chunks, list) or len(chunks) == 0:
            return _response(400, {"error": "chunks required"}, origin=os.environ.get("CORS_ORIGIN"))

        drop_id = str(uuid.uuid4())
        created_at = int(time.time())

        presigned = []
        for c in chunks:
            chunk_hash = c.get("hash")
            if not chunk_hash:
                chunk_hash = str(uuid.uuid4())
            key = f"drops/{drop_id}/chunks/{chunk_hash}"
            url = generate_presign(BUCKET, key, EXPIRES, content_type=SIGNED_CONTENT_TYPE)

            # IMPORTANT: return exact header names and values clients must send
            fields = {
                "Content-Type": SIGNED_CONTENT_TYPE,
                "x-amz-server-side-encryption": SIGNED_SSE,
                "x-amz-acl": SIGNED_ACL
            }

            presigned.append({
                "key": key,
                "url": url,
                "size": c.get("size", 0),
                "hash": chunk_hash,
                "fields": fields
            })

        # create a manifest presign so client can PUT manifest.json (Content-Type: application/json)
        manifest_key = f"manifests/{drop_id}/manifest.json"
        manifest_url = generate_presign(BUCKET, manifest_key, EXPIRES, content_type="application/json")
        manifest_fields = {
            "Content-Type": "application/json",
            "x-amz-server-side-encryption": SIGNED_SSE,
            "x-amz-acl": SIGNED_ACL
        }
        manifest_presigned = {
            "key": manifest_key,
            "url": manifest_url,
            "fields": manifest_fields
        }

        # write an initial DB entry so finalize can pick up
        item = {
            "drop_id": drop_id,
            "status": "uploading",
            "created_at": created_at,
            "size": meta.get("size"),
            "creator_id": creator_id,
            "chunks": [{"key": p["key"], "size": p["size"], "hash": p["hash"]} for p in presigned],
            "failure_count": 0,
            "read_count": 0
        }

        pruned = _prune_none_from_dict(item)
        table.put_item(Item=pruned)

        resp_body = {
            "drop_id": drop_id,
            "presigned": presigned,
            "manifest_presigned": manifest_presigned
        }
        return _response(200, resp_body, origin=os.environ.get("CORS_ORIGIN"))

    except Exception as e:
        print("Error:", str(e))
        return _response(500, {"error": str(e)}, origin=os.environ.get("CORS_ORIGIN"))
h