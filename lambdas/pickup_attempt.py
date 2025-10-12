# lambda-pickup-attempt-deaddropper
import os, json, time, uuid, boto3
from botocore.exceptions import ClientError

REGION = os.environ.get("REGION","eu-north-1")
DROPS_TABLE = os.environ["DYNAMO_DROPS"]
ATTEMPTS_TABLE = os.environ["DYNAMO_ATTEMPTS"]

dynamodb = boto3.resource("dynamodb", region_name=REGION)
drops = dynamodb.Table(DROPS_TABLE)
attempts = dynamodb.Table(ATTEMPTS_TABLE)

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

        attempt_id = str(uuid.uuid4())
        result = payload.get("result","attempted")
        client_time = payload.get("client_time", int(time.time()))
        user_agent = payload.get("user_agent")

        # record attempt in Attempts table
        item = {
            "drop_id": drop_id,
            "attempt_id": attempt_id,
            "result": result,
            "client_time": client_time
        }
        if user_agent:
            item["user_agent_redacted"] = user_agent[:200]

        attempts.put_item(Item=item)

        # increment read_count on Drops
        drops.update_item(
            Key={"drop_id": drop_id},
            UpdateExpression="SET read_count = if_not_exists(read_count, :zero) + :inc",
            ExpressionAttributeValues={":inc":1, ":zero":0}
        )

        return {"statusCode":200, "body": json.dumps({"attempt_id": attempt_id}, default=str)}
    except Exception as e:
        print("Error:", str(e))
        return {"statusCode":500, "body": json.dumps({"error": str(e)})}
