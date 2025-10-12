# lambda-create-drop-deaddropper (updated)
import os
import json
import time
import boto3
import string
import random
from botocore.exceptions import ClientError

# Configuration from environment
REGION = os.environ.get("REGION", "eu-north-1")
BUCKET = os.environ["BUCKET_NAME"]
DDB_TABLE = os.environ["DYNAMO_DROPS"]
TTL_DAYS = int(os.environ.get("TTL_DAYS", "30"))
SHORT_CODE_LENGTH = int(os.environ.get("SHORT_CODE_LENGTH", "6"))
MAX_SHORTCODE_TRIES = int(os.environ.get("MAX_SHORTCODE_TRIES", "8"))

# Optional envs
CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "https://deaddropper.web.app")

s3 = boto3.client("s3", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(DDB_TABLE)


def gen_short_code(length=6):
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(random.choice(alphabet) for _ in range(length))


def _cors_resp(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin": CORS_ORIGIN,
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,x-amz-server-side-encryption"
        },
        "body": json.dumps(body, default=str)
    }


def _head_manifest_exists(bucket, key):
    """
    Do a lightweight head_object to ensure manifest exists and meets SSE requirement.
    We DO NOT read or parse the manifest body.
    Returns True if present, False if not.
    """
    try:
        resp = s3.head_object(Bucket=bucket, Key=key)
        # Optionally, enforce server-side-encryption is present on the object:
        # if resp.get("ServerSideEncryption") is None:
        #     return False
        return True
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code in ("404", "NotFound", "NoSuchKey", "404 Not Found"):
            return False
        # for other errors, re-raise
        raise


def _update_ddb_ready_atomic(drop_id, manifest_key, manifest_index=None,
                             reader_token_hash=None, reader_token_salt=None,
                             writer_token_hash=None, writer_token_salt=None,
                             ttl_days=TTL_DAYS, max_tries=MAX_SHORTCODE_TRIES):
    """
    Atomically set short_code and other attributes on the existing drop item.
    Retries on ConditionalCheckFailedException to avoid collisions.
    Stores only the manifest_s3_key, manifest_index, and token hashes (if provided).
    Returns the chosen short_code and the UpdateItem response Attributes.
    """
    ttl_epoch = int(time.time()) + ttl_days * 86400

    for attempt in range(1, max_tries + 1):
        short_code = gen_short_code(SHORT_CODE_LENGTH)
        short_norm = short_code.lower()

        # Build update expression dynamically
        update_parts = [
            "#s = :ready",
            "manifest_s3_key = :mk",
            "short_code = :sc",
            "short_code_norm = :scn",
            "ttl_epoch = :ttl"
        ]
        expr_attr_names = {"#s": "status"}
        expr_attr_vals = {
            ":ready": "ready",
            ":mk": manifest_key,
            ":sc": short_code,
            ":scn": short_norm,
            ":ttl": ttl_epoch
        }

        if manifest_index is not None:
            update_parts.append("manifest_index = :mi")
            expr_attr_vals[":mi"] = manifest_index

        if reader_token_hash is not None:
            update_parts.append("reader_token_hash = :rth")
            expr_attr_vals[":rth"] = reader_token_hash
        if reader_token_salt is not None:
            update_parts.append("reader_token_salt = :rts")
            expr_attr_vals[":rts"] = reader_token_salt

        if writer_token_hash is not None:
            update_parts.append("writer_token_hash = :wth")
            expr_attr_vals[":wth"] = writer_token_hash
        if writer_token_salt is not None:
            update_parts.append("writer_token_salt = :wts")
            expr_attr_vals[":wts"] = writer_token_salt

        update_expr = "SET " + ", ".join(update_parts)

        try:
            resp = table.update_item(
                Key={"drop_id": drop_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_attr_names,
                ExpressionAttributeValues=expr_attr_vals,
                ConditionExpression="attribute_not_exists(short_code) OR short_code <> :sc",
                ReturnValues="ALL_NEW"
            )
            return short_code, resp.get("Attributes", {})
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code")
            if code == "ConditionalCheckFailedException":
                # collision, retry
                continue
            else:
                # unexpected error - rethrow
                raise

    # If we get here, we failed to allocate a unique short code
    raise RuntimeError("Failed to allocate unique short_code after retries")


def lambda_handler(event, context):
    print("DEBUG create event:", json.dumps(event))
    try:
        # Parse event body (API Gateway v2)
        if isinstance(event, dict) and event.get("body"):
            raw = event.get("body")
            payload = json.loads(raw) if isinstance(raw, str) else raw
        else:
            payload = event if isinstance(event, dict) else {}

        drop_id = payload.get("drop_id")
        # NEW: client uploads encrypted manifest to S3 first and passes the key here
        manifest_s3_key = payload.get("manifest_s3_key")
        # NEW: a small index with chunk keys & sizes (server-side indexing only)
        manifest_index = payload.get("manifest_index")  # expected: [{ "key": "...", "size": 123 }, ...]
        # Optional token hashes & salts (client computes salted hash and supplies hash+salt)
        reader_token_hash = payload.get("reader_token_hash")
        reader_token_salt = payload.get("reader_token_salt")
        writer_token_hash = payload.get("writer_token_hash")
        writer_token_salt = payload.get("writer_token_salt")

        if not drop_id or not manifest_s3_key:
            return _cors_resp(400, {"error": "drop_id and manifest_s3_key are required"})

        # Ensure drop item exists (created earlier by presign lambda)
        try:
            got = table.get_item(Key={"drop_id": drop_id})
            if "Item" not in got:
                return _cors_resp(404, {"error": "drop not found"})
        except ClientError as e:
            print("Dynamo get_item error:", str(e))
            return _cors_resp(500, {"error": str(e)})

        # Lightweight check: ensure the encrypted manifest exists in S3 (HEAD only; do NOT read)
        try:
            exists = _head_manifest_exists(BUCKET, manifest_s3_key)
            if not exists:
                return _cors_resp(400, {"error": "manifest_s3_key does not exist in bucket"})
        except ClientError as e:
            print("S3 head_object error:", str(e))
            return _cors_resp(500, {"error": "error checking manifest existence", "details": str(e)})

        # Atomically allocate short_code and update item with index + token hashes
        try:
            short_code, attributes = _update_ddb_ready_atomic(
                drop_id,
                manifest_s3_key,
                manifest_index=manifest_index,
                reader_token_hash=reader_token_hash,
                reader_token_salt=reader_token_salt,
                writer_token_hash=writer_token_hash,
                writer_token_salt=writer_token_salt,
                ttl_days=TTL_DAYS,
                max_tries=MAX_SHORTCODE_TRIES
            )
        except Exception as e:
            print("Short code allocation error:", str(e))
            return _cors_resp(500, {"error": "short code allocation failed", "details": str(e)})

        return _cors_resp(200, {
            "drop_id": drop_id,
            "short_code": short_code,
            "manifest_s3_key": manifest_s3_key,
            "ddb_update": attributes
        })

    except Exception as e:
        print("Error:", str(e))
        return _cors_resp(500, {"error": str(e)})
