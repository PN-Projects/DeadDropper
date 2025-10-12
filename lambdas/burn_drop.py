# lambda-burn-drop-deaddropper
import os
import json
import boto3
from botocore.exceptions import ClientError

REGION = os.environ.get("REGION", "eu-north-1")
DDB_TABLE = os.environ["DYNAMO_DROPS"]

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(DDB_TABLE)

# Lambda client for invoking deletion worker
_lambda_client = boto3.client("lambda", region_name=REGION)
DELETION_WORKER_NAME = "lambda-deletion-worker-deaddropper"

def _invoke_deletion_worker_async(drop_id):
    """
    Fire-and-forget invoke of the deletion worker.
    Payload matches the worker's expected shape.
    This will not raise to caller; errors are logged and swallowed.
    """
    try:
        payload = {
            "Records": [
                { "body": json.dumps({"drop_id": drop_id}) }
            ]
        }
        # InvocationType='Event' => asynchronous
        _lambda_client.invoke(
            FunctionName=DELETION_WORKER_NAME,
            InvocationType='Event',
            Payload=json.dumps(payload).encode('utf-8')
        )
        print(f"Triggered deletion worker for drop_id={drop_id}")
    except Exception as exc:
        # Log but DO NOT fail the burn operation
        print(f"Warning: failed to invoke deletion worker for drop_id={drop_id}: {exc}")

def lambda_handler(event, context):
    print("DEBUG event:", json.dumps(event))
    try:
        payload = {}
        if isinstance(event, dict) and event.get("body"):
            body = event.get("body")
            payload = json.loads(body) if isinstance(body, str) else body
        elif isinstance(event, dict):
            payload = event

        # --- resolve drop_id from pathParameters or body ---
        drop_id = None
        if event.get("pathParameters"):
            drop_id = event["pathParameters"].get("drop_id")
        if not drop_id:
            drop_id = payload.get("drop_id")

        if not drop_id:
            return {"statusCode":400, "body": json.dumps({"error":"drop_id required"})}

        # Update status to 'burning'
        table.update_item(
            Key={"drop_id": drop_id},
            UpdateExpression="SET #s = :st",
            ExpressionAttributeNames={"#s":"status"},
            ExpressionAttributeValues={":st":"burning"}
        )

        # Asynchronously trigger deletion worker (safe, idempotent).
        # We do this after marking burning; errors are logged but ignored.
        _invoke_deletion_worker_async(drop_id)

        return {
            "statusCode":200,
            "body": json.dumps({
                "drop_id": drop_id,
                "status": "burning"
            })
        }
    except Exception as e:
        print("Error:", str(e))
        return {"statusCode":500, "body": json.dumps({"error": str(e)})}
