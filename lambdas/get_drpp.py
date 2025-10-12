# lambda-get-drop-deaddropper (complete, case-insensitive short_code lookup)
import os, json, time, boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

REGION = os.environ.get("REGION", "eu-north-1")
BUCKET = os.environ.get("BUCKET_NAME")
DDB_TABLE = os.environ.get("DYNAMO_DROPS")
PRESIGN_EXPIRES = int(os.environ.get("PRESIGN_EXPIRES", "600"))
SHORTCODE_GSI = os.environ.get("SHORTCODE_GSI", "short_code_norm-index")
CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "https://deaddropper.web.app")

s3 = boto3.client("s3", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(DDB_TABLE)

def generate_get_presign(bucket, key, expires):
    return s3.generate_presigned_url('get_object', Params={'Bucket': bucket, 'Key': key}, ExpiresIn=expires)

def _cors_resp(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin": CORS_ORIGIN,
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,x-amz-server-side-encryption"
        },
        "body": json.dumps(body, default=str)
    }

def _resolve_drop_id_from_shortcode(short_code_raw):
    """
    Robust resolver:
     1) Normalize to lowercase and try fast Query on the GSI (SHORTCODE_GSI).
     2) If no result or Query fails, fall back to a deterministic Scan that checks
        short_code_norm (lowercase) OR short_code (raw, to handle legacy items).
    Returns (drop_id, status, short_code) or None.
    """
    if not short_code_raw:
        return None

    short_norm = short_code_raw.strip().lower()

    # 1) Try fast Query on GSI
    try:
        resp = table.query(
            IndexName=SHORTCODE_GSI,
            KeyConditionExpression=Key("short_code_norm").eq(short_norm),
            Limit=1
        )
        items = resp.get("Items", [])
        if items:
            it = items[0]
            return it.get("drop_id"), it.get("status"), it.get("short_code")
    except Exception as e:
        # Log and continue to fallback
        print("GSI query failed or returned empty:", str(e))

    # 2) Deterministic fallback: scan for either normalized or original short_code
    try:
        # Use a filter that matches either the normalized column or the raw short_code
        # This is safe for small tables and guaranteed to find the backfilled item.
        filter_expr = Attr("short_code_norm").eq(short_norm) | Attr("short_code").eq(short_code_raw.strip())
        resp = table.scan(
            FilterExpression=filter_expr,
            ProjectionExpression="drop_id,short_code,#s,short_code_norm",
            ExpressionAttributeNames={"#s": "status"},
            Limit=1
        )
        items = resp.get("Items", [])
        if items:
            it = items[0]
            return it.get("drop_id"), it.get("status"), it.get("short_code")
    except Exception as e:
        print("Scan fallback failed:", str(e))

    return None

def lambda_handler(event, context):
    print("DEBUG event:", json.dumps(event))
    try:
        drop_id = None
        short_code = None
        source = "unknown"

        # Prefer pathParameters (API Gateway v2)
        if isinstance(event, dict) and event.get("pathParameters"):
            params = event["pathParameters"] or {}
            if params.get("drop_id"):
                drop_id = params.get("drop_id")
                source = "path_drop_id"
            elif params.get("short_code"):
                short_code = params.get("short_code")
                source = "path_short_code"

        # If not found, try direct event/body (rare for GET)
        if not drop_id and isinstance(event, dict) and event.get("body"):
            try:
                body = json.loads(event.get("body")) if isinstance(event.get("body"), str) else event.get("body")
            except Exception:
                body = {}
            drop_id = drop_id or body.get("drop_id")
            short_code = short_code or body.get("short_code")
            if drop_id:
                source = "body_drop_id"
            elif short_code:
                source = "body_short_code"

        # final fallback: top-level event key
        if not drop_id and isinstance(event, dict):
            drop_id = drop_id or event.get("drop_id")
            short_code = short_code or event.get("short_code")

        # If short_code present and drop_id not given -> resolve mapping and return minimal info
        if short_code and not drop_id:
            resolved = _resolve_drop_id_from_shortcode(short_code)
            if not resolved:
                return _cors_resp(404, {"error":"short_code not found"})
            resolved_drop_id, status, sc = resolved
            # Return mapping only (fast). Frontend will then call /api/drops/{drop_id}
            return _cors_resp(200, {"drop_id": resolved_drop_id, "short_code": sc, "status": status})

        if not drop_id:
            return _cors_resp(400, {"error":"drop_id or short_code required"})

        print(f"DEBUG: resolved drop_id={drop_id} (source={source})")

        # Fetch drop item
        try:
            resp = table.get_item(Key={"drop_id": drop_id})
        except ClientError as e:
            print("Dynamo get_item error:", str(e))
            return _cors_resp(500, {"error": str(e)})

        item = resp.get("Item")
        if not item:
            return _cors_resp(404, {"error":"drop not found"})

        status = item.get("status")
        if status != "ready":
            return _cors_resp(409, {"error":"drop not ready","status":status})

        manifest = None
        manifest_key = item.get("manifest_s3_key")
        if manifest_key:
            try:
                obj = s3.get_object(Bucket=BUCKET, Key=manifest_key)
                manifest = json.loads(obj['Body'].read())
            except ClientError as e:
                print("S3 get_object error:", str(e))
                return _cors_resp(500, {"error": "failed to read manifest", "details": str(e)})

        presigned_chunks = []
        if manifest and isinstance(manifest.get("chunks"), list):
            for ch in manifest.get("chunks"):
                key = ch.get("key")
                url = generate_get_presign(BUCKET, key, PRESIGN_EXPIRES) if key else None
                presigned_chunks.append({
                    "key": key,
                    "url": url,
                    "size": ch.get("size"),
                    "hash": ch.get("hash"),
                    "iv": ch.get("iv")  # included if present in manifest
                })

        return _cors_resp(200, {
            "drop_id": drop_id,
            "status": status,
            "short_code": item.get("short_code"),
            "manifest": manifest,
            "chunks": presigned_chunks
        })

    except ClientError as e:
        print("ClientError:", str(e))
        return _cors_resp(500, {"error": str(e)})
    except Exception as e:
        print("Error:", str(e))
        return _cors_resp(500, {"error": str(e)})
